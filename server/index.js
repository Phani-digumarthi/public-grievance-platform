// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const FormData = require('form-data'); 
const fs = require('fs');
require('dotenv').config();

const Grievance = require('./models/Grievance');

const app = express();
app.use(express.json());
app.use(cors());

// Allow the frontend to view uploaded images/audio
app.use('/uploads', express.static('uploads'));

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });

// Connect DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

app.get('/', (req, res) => res.send('Backend Running'));

// === ROUTE 1: TEXT + IMAGE GRIEVANCES ===
app.post('/api/grievances', upload.single('image'), async (req, res) => {
  try {
    const { description, citizenName, area } = req.body; 
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";

    console.log(`📨 Text Report from ${citizenName}`);

    // Call Python AI
    const aiResponse = await axios.post('http://127.0.0.1:8000/predict-category', { description });
    
    const { category, priority, sentiment, estimated_time } = aiResponse.data;

    const newGrievance = await Grievance.create({
      citizenName, 
      area,        
      description,
      imageUrl,
      category,
      priority,
      sentiment,
      estimatedTime: estimated_time,
      status: "Pending"
    });

    res.json({ success: true, data: newGrievance });

  } catch (error) {
    console.error("❌ Text/Image Error:", error.message);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// === ROUTE 2: AUDIO + IMAGE GRIEVANCES (FIXED) ===
// We use upload.fields to accept BOTH audio and image
app.post('/api/grievances/audio', 
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]), 
  async (req, res) => {
  try {
    // Check if audio file exists
    if (!req.files || !req.files.audio) {
        return res.status(400).json({ error: "No audio file uploaded" });
    }

    const audioFile = req.files.audio[0];
    const imageFile = req.files.image ? req.files.image[0] : null; // Check for optional image

    const { citizenName, area } = req.body; 
    console.log(`🎤 Voice Report from ${citizenName}`);

    // 1. Prepare Audio to send to Python
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile.path));

    // 2. Call Python AI
    const aiResponse = await axios.post('http://127.0.0.1:8000/predict-audio', form, {
      headers: { ...form.getHeaders() }
    });

    console.log("🤖 Transcribed:", aiResponse.data.original_text);

    // 3. Construct URLs
    const audioUrl = `http://localhost:5000/uploads/${audioFile.filename}`;
    const imageUrl = imageFile ? `http://localhost:5000/uploads/${imageFile.filename}` : "";

    const { category, priority, sentiment, original_text, estimated_time } = aiResponse.data;

    const newGrievance = await Grievance.create({
      citizenName,
      area,
      description: original_text,
      category,
      priority,
      sentiment,
      estimatedTime: estimated_time,
      status: "Pending",
      imageUrl: imageUrl, // Now we save the image too!
      audioUrl: audioUrl
    });

    res.json({ success: true, data: newGrievance });

  } catch (error) {
    console.error("❌ Audio Processing Error:", error.message);
    res.status(500).json({ success: false, error: "Audio Error" });
  }
});

// === ROUTE 3: GET ALL GRIEVANCES ===
app.get('/api/grievances', async (req, res) => {
  try {
    const grievances = await Grievance.find().sort({ createdAt: -1 });
    res.json({ success: true, data: grievances });
  } catch (error) {
    res.status(500).json({ success: false, error: "Fetch Error" });
  }
});

// server/index.js (Add this before app.listen)

// === ROUTE 4: RESOLVE GRIEVANCE ===
app.patch('/api/grievances/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body; // Get the message from Admin

    const updatedGrievance = await Grievance.findByIdAndUpdate(
      id,
      { 
        status: "Resolved",
        adminReply: adminReply // Save the reply
      },
      { new: true }
    );

    res.json({ success: true, data: updatedGrievance });
  } catch (error) {
    res.status(500).json({ success: false, error: "Update Failed" });
  }
});
// server/index.js

// ... previous resolve route ...

// === ROUTE 5: REJECT / SPAM GRIEVANCE ===
app.patch('/api/grievances/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedGrievance = await Grievance.findByIdAndUpdate(
      id,
      { status: "Rejected" }, // Mark as Rejected
      { new: true }
    );

    res.json({ success: true, data: updatedGrievance });
  } catch (error) {
    res.status(500).json({ success: false, error: "Update Failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on Port ${PORT}`));