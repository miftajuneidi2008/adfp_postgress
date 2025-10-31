// Example: app/api/applications/[id]/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/hooks"; // Assuming you have this
import { createApplication, loadDraftApplications } from "@/lib/data/Application";

export async function GET(request:NextResponse) {

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the application data from the request body
    const {editId, userId} = await request.json();
    const loadApplication = await loadDraftApplications(editId, userId);

    // Check if the update was successful
    if (!loadApplication) {
      return NextResponse.json(
        { message: "Application not found or is not a draft. No update was performed." },
        { status: 404 } // 404 Not Found is appropriate
      );
    }

    // Return the updated data, just like Supabase would
    return NextResponse.json(loadApplication, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  // Recommended: Add user authentication/authorization
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the application data from the request body
    const applicationData = await request.json();

    // You could add server-side validation here if needed
    // For example: if (!applicationData.customer_name) { ... }
    
    // Pass the validated data to your database function
    const newApplication = await createApplication(applicationData);

    // Return the newly created application with a 201 "Created" status
    return NextResponse.json(newApplication, { status: 201 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}