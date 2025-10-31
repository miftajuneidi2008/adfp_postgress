import { getProductName } from "@/lib/data/Product"; // Your existing server-side function
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // This code ONLY runs on the server
    const products = await getProductName();
    console.log(products)

    // Return the data to the client as JSON
    return NextResponse.json(products, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    // Send a generic error response
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}