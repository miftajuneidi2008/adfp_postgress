import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/hooks";
import { createNotifications } from "@/lib/data/Application";
import pool from "@/lib/postgress/postgress"; // Your configured node-postgres connection pool

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const createNotification = await request.json();
   


    const newlyCreatedApplication = await createNotifications(createNotification.notifications);

    // Return the newly created application with a 201 "Created" status
    return NextResponse.json(newlyCreatedApplication, { status: 201 });

  } catch (error) {
    console.error("API Error creating Notification:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}



export async function GET(request: Request) {
  try {
    const profile = await getCurrentUser();
    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', 
      [profile.id]
    );
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("API Error fetching notifications:", error);
    return NextResponse.json({ message: "Failed to fetch notifications" }, { status: 500 });
  }
}