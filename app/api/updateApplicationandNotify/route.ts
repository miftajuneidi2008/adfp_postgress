// Example: app/api/applications/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/hooks";
import { updateApplicationStatusAndNotify } from "@/lib/data/applicationDetail";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  console.log(profile, "profile")
  if (!profile) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
     const {
      applicationId,
      newStatus,
      fromStatus,
      reason,
      comments,
      submittedBy,
      applicationNumber,
      customerName,
      productName,
    } = await request.json();;

   const applicationUpdateData = {
      applicationId,
      newStatus,
      profileId: profile.id, // <-- Use the secure ID from the session
      profileRole: profile.role, // <-- Use the secure role from the session
      fromStatus,
      reason,
      comments,
      submittedBy,
      applicationNumber,
      customerName,
      productName,
    };
  
    // Call your new database function
    const newlyCreatedApplication = await updateApplicationStatusAndNotify(
      applicationUpdateData
    );

    // Return the newly created application with a 201 "Created" status
    return NextResponse.json({message:"processed"}, { status: 201 });
  } catch (error) {
    console.error("API Error creating application:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
