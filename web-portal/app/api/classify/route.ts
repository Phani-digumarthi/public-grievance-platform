// web-portal/app/api/classify/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import { connectToDB } from '@/lib/db';     // Import DB connection
import Grievance from '@/models/Grievance'; // Import Model

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    // 1. Connect to Database
    await connectToDB();

    // 2. Get AI Prediction
    const aiResponse = await axios.get(`http://127.0.0.1:8000/predict-category`, {
      params: { text: description }
    });

    const { category, confidence } = aiResponse.data;

    // 3. Save to MongoDB
    const newGrievance = await Grievance.create({
      description,
      category,
      aiConfidence: confidence,
      status: "Pending"
    });

    // 4. Return the saved data (including the new ID)
    return NextResponse.json({
      success: true,
      data: newGrievance
    });
    
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Failed to process grievance" }, 
      { status: 500 }
    );
  }
}