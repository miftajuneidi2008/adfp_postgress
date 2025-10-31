import { getCurrentUser } from "@/lib/auth/hooks";
import { updateDraftApplication } from "@/lib/data/Application";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const editId = params.id;
  
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the application data from the request body
    const applicationData = await request.json();

    // Call the function to update the database
    const updatedRowCount = await updateDraftApplication(editId, applicationData);

    // Check if the update was successful
    if (updatedRowCount === 0) {
      return NextResponse.json(
        { message: "Application not found or is not a draft. No update was performed." },
        { status: 404 } // 404 Not Found is appropriate here
      );
    }

    return NextResponse.json(
      { message: "Application updated successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}






