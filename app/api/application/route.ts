// Example: app/api/applications/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/hooks";
import { createNewApplication } from "@/lib/data/Application";

export async function POST(request: Request) {
    console.log("called")
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const {customer_name, customer_id, phone_number, product_id, branch_id, remarks ,submitted_by,status} = await request.json();

  

    const newApplicationData = {
      customer_name: customer_name,
      customer_id: customer_id || null,
      phone_number: phone_number,
      product_id: product_id,
      branch_id: branch_id, 
      remarks: remarks || null,
      status: "pending",            // Business logic
      submitted_by: submitted_by,     // Data from the user's session
    };
    console.log(newApplicationData)
    // Call your new database function
    const newlyCreatedApplication = await createNewApplication(newApplicationData);

    // Return the newly created application with a 201 "Created" status
    return NextResponse.json(newlyCreatedApplication, { status: 201 });

  } catch (error) {
    console.error("API Error creating application:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}