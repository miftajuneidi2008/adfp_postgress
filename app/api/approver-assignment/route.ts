import { getCurrentUser } from "@/lib/auth/hooks";
import { findRelevantApproverIds } from "@/lib/data/Application";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Extract parameters from the URL's query string.
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

     const user = await getCurrentUser()
     const branchId = user?.branch_id

    // 2. Validate that the required parameters were provided.
    if (!branchId || !productId) {
      return NextResponse.json(
        { message: "Missing required query parameters: 'branchId' and 'productId'" },
        { status: 400 } // 400 Bad Request
      );
    }

    // 3. Call your server-side database function with the validated parameters.
    const approverIds = await findRelevantApproverIds(branchId, productId);


    return NextResponse.json(approverIds, { status: 200 });

  } catch (error) {
    // 5. Handle any unexpected errors from the database function.
    console.error("API Route Error fetching approver assignments:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}