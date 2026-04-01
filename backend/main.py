# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import hashlib
import io
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", framework="pt")
summary_cache = {}

class SummaryRequest(BaseModel):
    text: str
    length: str = "medium"
    format: str = "paragraph"

class URLRequest(BaseModel):
    url: str
    length: str = "medium"
    format: str = "paragraph"

def get_length_params(length_str):
    if length_str == "short": return 50, 20
    if length_str == "long": return 300, 100
    return 150, 40

def generate_summary(text: str, length: str, out_format: str):
    cache_key = hashlib.md5(f"{text}-{length}-{out_format}".encode()).hexdigest()
    if cache_key in summary_cache:
        return summary_cache[cache_key]

    max_len, min_len = get_length_params(length)
    max_chars = 3000 
    chunks = [text[i:i+max_chars] for i in range(0, len(text), max_chars)]
    
    combined_summary = []
    for chunk in chunks:
        if len(chunk) > 50:
            result = summarizer(chunk, max_length=max_len, min_length=min_len, do_sample=False)
            combined_summary.append(result[0]["summary_text"])
            
    final_text = " ".join(combined_summary)

    if out_format == "bullets":
        sentences = final_text.split(". ")
        final_text = "\n".join([f"• {s.strip()}." for s in sentences if len(s) > 5])

    summary_cache[cache_key] = final_text
    return final_text

@app.post("/summarize")
def summarize_text(request: SummaryRequest):
    try:
        return {"summary": generate_summary(request.text, request.length, request.format)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize-url")
def summarize_url(request: URLRequest):
    try:
        # Scrape the webpage
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(request.url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract text from paragraphs
        paragraphs = soup.find_all('p')
        extracted_text = " ".join([p.get_text() for p in paragraphs])
        
        if len(extracted_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Not enough readable text found on this URL.")
            
        summary = generate_summary(extracted_text, request.length, request.format)
        return {"summary": summary, "extracted_text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-and-summarize")
async def summarize_file(file: UploadFile = File(...), length: str = Form("medium"), format: str = Form("paragraph")):
    try:
        extracted_text = ""
        content = await file.read()
        
        if file.filename.endswith(".pdf"):
            pdf = PdfReader(io.BytesIO(content))
            for page in pdf.pages:
                extracted_text += page.extract_text() + " "
        elif file.filename.endswith(".txt"):
            extracted_text = content.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file.")
            
        summary = generate_summary(extracted_text, length, format)
        return {"summary": summary, "extracted_text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))