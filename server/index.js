// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer'); // Import multer
const path = require('path');
require('dotenv').config();

const Grievance = require('./models/Grievance');

const app = express();
app.use(express.json());
app.use(cors());

// Allow the frontend to view uploaded images
app.use('/uploads', express.static('uploads'));

// Configure Image Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files here
  },
  filename: (req, file, cb) => {
    // Name file: timestamp-originalName.jpg
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });

// Connect DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

app.get('/', (req, res) => res.send('Backend Running'));

// === NEW ROUTE HANDLING TEXT + IMAGE ===
// upload.single('image') expects a form field named "image"
app.post('/api/grievances', upload.single('image'), async (req, res) => {
  try {
    // 1. Get Text Data
    const { description } = req.body;
    
    // 2. Get Image Data (if it exists)
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";

    console.log("📨 Data:", description);
    console.log("📸 Image:", imageUrl || "No image uploaded");

    // 3. Call Python AI (Text Analysis)
    const aiResponse = await axios.post('http://127.0.0.1:8000/predict-category', {
      description: description
    });

    const { category, confidence, priority, sentiment } = aiResponse.data;

    // 4. Save everything to MongoDB
    const newGrievance = await Grievance.create({
      description,
      imageUrl, // Saved!
      category,
      aiConfidence: confidence,
      priority,
      sentiment,
      status: "Pending"
    });

    res.json({ success: true, data: newGrievance });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Get Grievances
app.get('/api/grievances', async (req, res) => {
  try {
    const grievances = await Grievance.find().sort({ createdAt: -1 });
    res.json({ success: true, data: grievances });
  } catch (error) {
    res.status(500).json({ success: false, error: "Fetch Error" });
  }
});
// server/index.js

// ... (keep all your existing imports and setups)

// === NEW ROUTE FOR AUDIO GRIEVANCES ===
app.post('/api/grievances/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

    console.log("🎤 Audio received:", req.file.filename);

    // 1. Send Audio to Python for Transcription & Analysis
    // We must use 'FormData' logic in Node.js to forward the file
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path));

    const aiResponse = await axios.post('http://127.0.0.1:8000/predict-audio', form, {
      headers: { ...form.getHeaders() }
    });

    console.log("🤖 AI Transcribed:", aiResponse.data.original_text);
    const { category, priority, sentiment, original_text } = aiResponse.data;

    // 2. Save to MongoDB (We save the transcribed text as the description)
    const newGrievance = await Grievance.create({
      description: original_text, // The text converted from voice
      category,
      priority,
      sentiment,
      status: "Pending",
      imageUrl: "" // Audio complaints might not have images
    });

    res.json({ success: true, data: newGrievance });

  } catch (error) {
    console.error("❌ Audio Processing Error:", error.message);
    res.status(500).json({ success: false, error: "Audio Error" });
  }
});

// ... (app.listen is here)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on Port ${PORT}`));