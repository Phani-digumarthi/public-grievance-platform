# ai-engine/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI()

# Allow frontend to communicate with this AI service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def classify_complaint(text: str):
    text = text.lower()
    
    # Keyword-based classification (Simple but effective for demos)
    if any(word in text for word in ["light", "pole", "dark", "electricity", "power", "voltage", "current"]):
        return "Electricity"
    elif any(word in text for word in ["water", "drainage", "leak", "pipe", "sewage", "flood", "drink"]):
        return "Water"
    elif any(word in text for word in ["road", "pothole", "street", "asphalt", "traffic", "jam"]):
        return "Roads"
    elif any(word in text for word in ["garbage", "trash", "dustbin", "waste", "clean", "smell"]):
        return "Sanitation"
    elif any(word in text for word in ["theft", "stole", "lost", "missing", "crime", "fight", "police"]):
        return "Police"
    else:
        return "General"

@app.get("/")
def read_root():
    return {"status": "AI Engine is active"}

@app.get("/predict-category")
def predict_category(text: str):
    category = classify_complaint(text)
    
    # Fake confidence score for demo purposes
    confidence = 0.95 if category != "General" else 0.50
    
    return {
        "category": category,
        "confidence": confidence,
        "original_text": text
    }