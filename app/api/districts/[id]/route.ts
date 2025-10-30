import { getCurrentUser } from "@/lib/auth/hooks";
import { NextResponse } from "next/server";
import pool from "@/lib/postgress/postgress"; // Adjust path as needed
import { Product } from "@/lib/auth/types";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate and Authorize the user
  const session = await getCurrentUser();

  // Ensure the user is a system admin to allow this action
  if (!session || session.role !== "system_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const districtId = await params.id; // Get the product ID from the URL

  try {
    const queryText = `
    DELETE FROM districts
      WHERE id = $1
      RETURNING id; 
    `;

    const values = [districtId];
    const result = await pool.query(queryText, values);

    // Check if a row was actually updated
    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "District not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `District ${districtId} deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Failed to update product ${districtId}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
