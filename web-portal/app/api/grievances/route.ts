// web-portal/app/api/grievances/route.ts
import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Grievance from '@/models/Grievance';

export async function GET() {
  try {
    await connectToDB();
    
    // Fetch all grievances, newest first
    const grievances = await Grievance.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: grievances });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch grievances" }, 
      { status: 500 }
    );
  }
}