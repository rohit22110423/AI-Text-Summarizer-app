# ✨ AI Text Summarizer Pro

A powerful, full-stack Artificial Intelligence application that transforms lengthy documents, web articles, and PDFs into clear, concise summaries. Built with React and FastAPI, it leverages advanced Natural Language Processing (NLP) running locally to process information securely and efficiently.

![UI Preview](https://via.placeholder.com/800x400.png?text=AI+Text+Summarizer+Pro+UI) ## 🚀 Features

### Core AI Capabilities
* **Advanced NLP Model:** Powered by Hugging Face's `facebook/bart-large-cnn` for highly accurate, human-like summarization.
* **Smart Text Chunking:** Intelligently splits massive documents to bypass standard AI token limits (1024 tokens) without crashing.
* **Intelligent Caching:** Implements an MD5 hashing cache system to return instantly on repeated requests.

### Multi-Format Input
* **Raw Text:** Paste essays, emails, or reports directly.
* **Document Parsing:** Upload `.txt` or `.pdf` files. The backend automatically extracts and reads the text.
* **Web Scraping:** Paste a URL (e.g., a news article), and the backend will visit the site, scrape the main content, and summarize it on the fly.

### Dynamic User Experience
* **Customizable Detail:** Choose between Short, Medium, or Detailed summaries.
* **Formatting Options:** Output summaries as standard paragraphs or readable bullet points.
* **Typewriter Effect:** ChatGPT-style real-time text streaming visualization.
* **Dark Mode:** System-aware dark mode with a manual toggle override.
* **Session History:** Automatically saves recent summaries to local storage with a quick-access sidebar.
* **Quick Export:** One-click "Copy to Clipboard" or "Download as .txt" functionality.

---

## 🛠️ Tech Stack

### Frontend (Client)
* **React + Vite:** For a lightning-fast, component-based UI.
* **Vanilla CSS3:** Custom, responsive styling with floating cards and CSS grid layouts.
* **react-hot-toast:** For elegant, non-blocking user notifications.

### Backend (Server)
* **FastAPI:** High-performance Python web framework.
* **PyTorch & Transformers:** For running the machine learning pipeline.
* **BeautifulSoup4 & Requests:** For HTML parsing and URL web scraping.
* **PyPDF:** For extracting raw text strings from uploaded PDF buffers.

---

## 💻 Getting Started (Local Development)

### Prerequisites
Make sure you have **Node.js** and **Python 3.8+** installed on your machine.

### 1. Backend Setup
Open a terminal and navigate to the backend directory:
```bash
cd backend
