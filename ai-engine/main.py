# ai-engine/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # <--- NEW IMPORT
from textblob import TextBlob
import speech_recognition as sr
import shutil
import os
from pydub import AudioSegment

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Recognizer
recognizer = sr.Recognizer()

# === 1. Define JSON Model (NEW) ===
class TextRequest(BaseModel):
    description: str

def analyze_priority(category: str, sentiment_score: float, keywords: list):
    # Logic for Explainable Prioritization Engine (X-PE)
    is_urgent_keyword = any(w in keywords for w in ["danger", "accident", "fire", "death", "blood", "broken", "blocked", "kill", "attack", "spark"])
    
    if is_urgent_keyword or category in ["Police", "Fire", "Medical"]:
        return "High"
    elif sentiment_score < -0.5:
        return "Medium"
    else:
        return "Low"

def classify_text(text: str):
    text_lower = text.lower()
    
    # Classification Logic
    category = "General"
    if any(w in text_lower for w in ["light", "pole", "dark", "electricity", "power", "voltage", "wire", "spark"]):
        category = "Electricity"
    elif any(w in text_lower for w in ["water", "drainage", "leak", "pipe", "sewage", "flood", "drink", "tap"]):
        category = "Water"
    elif any(w in text_lower for w in ["road", "pothole", "street", "asphalt", "traffic", "jam", "highway"]):
        category = "Roads"
    elif any(w in text_lower for w in ["garbage", "trash", "dustbin", "waste", "clean", "smell", "dump"]):
        category = "Sanitation"
    elif any(w in text_lower for w in ["theft", "stole", "lost", "missing", "crime", "fight", "police", "robbery", "danger"]):
        category = "Police"

    # Sentiment & Priority
    blob = TextBlob(text)
    sentiment_score = blob.sentiment.polarity
    sentiment_label = "Neutral"
    if sentiment_score < -0.1: sentiment_label = "Negative"
    if sentiment_score > 0.1: sentiment_label = "Positive"

    priority = analyze_priority(category, sentiment_score, text_lower)

    # === NEW: Time Prediction Logic ===
    if priority == "High":
        est_time = "Within 1 Hour"
    elif priority == "Medium":
        est_time = "Within 24 Hours"
    else:
        est_time = "Within 1 Week"

    return {
        "category": category,
        "sentiment": sentiment_label,
        "priority": priority,
        "estimated_time": est_time,
        "original_text": text
    }

@app.get("/")
def read_root():
    return {"status": "AI Multimodal Engine Active"}

# === UPDATED: Handle Text (Accepts JSON now) ===
@app.post("/predict-category")
def predict_category(request: TextRequest): 
    # Python now expects: {"description": "some text"}
    return classify_text(request.description)

# === Handle Audio Files ===
@app.post("/predict-audio")
async def predict_audio(file: UploadFile = File(...)):
    try:
        raw_filename = f"raw_{file.filename}"
        clean_filename = f"clean_{file.filename}"
        
        with open(raw_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"🎤 cleaning audio file: {raw_filename}")

        # Convert to WAV
        audio = AudioSegment.from_file(raw_filename)
        audio.export(clean_filename, format="wav")

        with sr.AudioFile(clean_filename) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
        
        print(f"✅ Text Found: {text}")

        os.remove(raw_filename)
        os.remove(clean_filename)

        result = classify_text(text)
        return result

    except Exception as e:
        print(f"❌ AUDIO ERROR: {e}") 
        return {
            "error": str(e), 
            "category": "General", 
            "priority": "Low", 
            "estimated_time": "Unknown",
            "original_text": "Audio Error"
        }