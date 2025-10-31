import { NextRequest, NextResponse } from "next/server";
import { getApplicationNumberById } from "@/lib/data/Application"; // Adjust the import path as needed

// Define the expected shape of the response from your DB function
interface ApplicationNumber {
  application_number: string;
}

export async function GET(
  request: NextRequest, // The first argument is the request object
  { params }: { params: { id: string } } // The second contains dynamic route params
) {
  // 1. Extract the Application ID from the URL
  const applicationId = params.id;

  // 2. Basic validation: Ensure an ID was provided in the URL
  if (!applicationId) {
    return NextResponse.json(
      { message: "Application ID is required." },
      { status: 400 } // 400 Bad Request
    );
  }

  try {
    // 3. Call your server-side database function
    const applicationData = await getApplicationNumberById(applicationId);

    // 4. Handle the "Not Found" case
    // If your function returns null, it means no record was found.
    if (!applicationData) {
      return NextResponse.json(
        { message: "Application not found." },
        { status: 404 } // 404 Not Found is the correct status code
      );
    }

    // 5. Handle the "Success" case
    // If data is found, return it with a 200 OK status.
    return NextResponse.json(applicationData, { status: 200 });

  } catch (error) {
    // 6. Handle unexpected server errors
    // This catches errors thrown by your getApplicationNumberById function.
    console.error("API Route Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}