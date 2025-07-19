# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# Load Hugging Face summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Define input schema
class SummaryRequest(BaseModel):
    text: str
    max_length: int = 150
    min_length: int = 30
    do_sample: bool = False

# API endpoint
@app.post("/summarize")
def summarize(request: SummaryRequest):
    result = summarizer(
        request.text,
        max_length=request.max_length,
        min_length=request.min_length,
        do_sample=request.do_sample
    )
    return {"summary": result[0]["summary_text"]}
