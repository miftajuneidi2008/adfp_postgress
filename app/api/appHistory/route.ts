// Example usage inside an API route or Server Action

import { getCurrentUser } from "@/lib/auth/hooks";
import { createApplicationStatusHistory } from "@/lib/data/Application";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const profile = await getCurrentUser();

  if (!profile) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, try to update the main application status

    const {
      application_id,
      from_status,
      to_status,
      action_by,
      action_by_role,
    } = await request.json();

    // You can perform server-side validation here

    const newApplicationHistory = {
      application_id: application_id,
      from_status: from_status,
      to_status: to_status,
      action_by: action_by,
      action_by_role: action_by_role,
    };
    const submittedApplication = await createApplicationStatusHistory(
      newApplicationHistory
    );

    if (!submittedApplication) {
      return NextResponse.json(
        {
          message: "Application could not be submitted. It may not be a draft.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(submittedApplication, { status: 200 });
  } catch (error) {
    console.error("API Error during submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
