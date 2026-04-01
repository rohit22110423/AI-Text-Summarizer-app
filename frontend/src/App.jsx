import { useState, useRef, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [displayedSummary, setDisplayedSummary] = useState('') // For Typewriter effect
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const [length, setLength] = useState('medium')
  const [format, setFormat] = useState('paragraph')
  
  // Load history from Local Storage
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('ai-summary-history')
    return saved ? JSON.parse(saved) : []
  })
  
  const fileInputRef = useRef(null)

  // Toggle Dark Mode globally
  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode')
    else document.body.classList.remove('dark-mode')
  }, [isDarkMode])

  // Typewriter Effect
  useEffect(() => {
    if (!summary) {
      setDisplayedSummary('');
      return;
    }
    let i = 0;
    setDisplayedSummary('');
    const interval = setInterval(() => {
      setDisplayedSummary(summary.slice(0, i));
      i++;
      if (i > summary.length) clearInterval(interval);
    }, 15); // Speed of the typing
    return () => clearInterval(interval);
  }, [summary]);

  // Save to History helper
  const saveToHistory = (newSummary, originalText) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      preview: originalText.substring(0, 60) + '...',
      fullSummary: newSummary
    }
    const updatedHistory = [newEntry, ...history].slice(0, 5); // Keep last 5
    setHistory(updatedHistory);
    localStorage.setItem('ai-summary-history', JSON.stringify(updatedHistory));
  }

  const getWordCount = (str) => str.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleClear = () => {
    setText(''); setUrl(''); setSummary('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success("Cleared!");
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast.success("Copied to clipboard!");
  }

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "AI_Summary.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Summary downloaded!");
  }

  const handleProcess = async (type) => {
    setLoading(true);
    setSummary('');
    const toastId = toast.loading("AI is thinking...");
    let endpoint = 'http://localhost:8000/summarize';
    let payload = { length, format };

    try {
      if (type === 'url') {
        if (!url) throw new Error("Please enter a URL.");
        endpoint = 'http://localhost:8000/summarize-url';
        payload.url = url;
      } else {
        if (text.length < 50) throw new Error("Please enter more text.");
        payload.text = text;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });
      
      if (!response.ok) throw new Error("Server error.");

      const data = await response.json();
      if (data.extracted_text) setText(data.extracted_text);
      setSummary(data.summary);
      saveToHistory(data.summary, data.extracted_text || text);
      toast.success("Success!", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Failed to process.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true); setSummary('');
    const toastId = toast.loading("Reading file...");

    const formData = new FormData();
    formData.append("file", file); formData.append("length", length); formData.append("format", format);

    try {
      const response = await fetch('http://localhost:8000/upload-and-summarize', {
        method: 'POST', body: formData,
      });
      if (!response.ok) throw new Error("File error");
      const data = await response.json();
      setText(data.extracted_text);
      setSummary(data.summary);
      saveToHistory(data.summary, data.extracted_text);
      toast.success("Success!", { id: toastId });
    } catch (error) {
      toast.error("Failed to process file.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <Toaster position="top-center" />
      
      <div className="top-bar">
        <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <header className="header">
        <h1>✨ AI Text Summarizer Pro</h1>
        <p>Advanced NLP for articles, URLs, and PDFs.</p>
      </header>
      
      <div className="layout-grid">
        <main className="main-card">
          <div className="controls-bar">
            <div className="control-group">
              <select value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="short">Short Summary</option>
                <option value="medium">Medium Summary</option>
                <option value="long">Detailed Summary</option>
              </select>
            </div>
            <div className="control-group">
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="paragraph">Paragraph</option>
                <option value="bullets">Bullet Points</option>
              </select>
            </div>
          </div>

          <div className="url-section">
            <input 
              type="text" 
              placeholder="Paste a Web URL (e.g., news article)" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
            />
            <button onClick={() => handleProcess('url')} disabled={loading || !url}>
              🔗 Fetch URL
            </button>
            <div className="divider">OR</div>
          </div>

          <div className="input-section">
            <div className="textarea-wrapper">
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Paste your text here..."
              />
              <div className="stats-count">{getWordCount(text)} words</div>
            </div>

            <div className="action-buttons">
              <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} ref={fileInputRef} id="file-upload" style={{ display: 'none' }}/>
              <label htmlFor="file-upload" className="upload-btn">📁 Upload</label>
              
              <button className="clear-btn" onClick={handleClear} disabled={!text && !url && !summary}>🗑️ Clear</button>
              
              <button className="summarize-btn" onClick={() => handleProcess('text')} disabled={loading || text.length < 50}>
                {loading ? <span className="loader"></span> : '🚀 Summarize'}
              </button>
            </div>
          </div>
          
          {summary && (
            <div className="summary-section">
              <div className="summary-header">
                <h2>📝 Output</h2>
                <div className="summary-actions">
                  <span className="summary-stats">{getWordCount(summary)} words</span>
                  <button className="icon-btn" onClick={handleCopy}>📋</button>
                  <button className="icon-btn" onClick={handleDownload}>💾</button>
                </div>
              </div>
              <div className="summary-box">
                {/* Typewriter text displayed here */}
                <p style={{ whiteSpace: "pre-line" }}>{displayedSummary}</p>
                {displayedSummary.length !== summary.length && <span className="cursor">|</span>}
              </div>
            </div>
          )}
        </main>

        <aside className="sidebar">
          <h3>History</h3>
          {history.length === 0 ? <p className="no-history">No recent summaries.</p> : null}
          {history.map((item) => (
            <div key={item.id} className="history-card" onClick={() => setSummary(item.fullSummary)}>
              <div className="history-date">{item.date}</div>
              <div className="history-preview">{item.preview}</div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

export default App