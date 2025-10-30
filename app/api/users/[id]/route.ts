import { getCurrentUser } from "@/lib/auth/hooks";
import { NextResponse } from "next/server";
import pool from "@/lib/postgress/postgress"; // Adjust path as needed
import { Product } from "@/lib/auth/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate and Authorize the user
  const session = await getCurrentUser();

  // Ensure the user is a system admin to allow this action
  if (!session || session.role !== 'system_admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const userId = await params.id; // Get the product ID from the URL



  try {
    // 2. Get the new status from the request body
    const { isActive } = await req.json();

    // 3. Validate the incoming data
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'Invalid "isActive" status provided' }, { status: 400 });
    }

    // 4. Write the SQL UPDATE statement
    const queryText = `
      UPDATE users
      SET is_active = $1
      WHERE id = $2
      RETURNING *; 
    `;
    
    // The values correspond to the $1 and $2 placeholders
    const values = [isActive, userId];

    // 5. Execute the query
    const result = await pool.query<Product>(queryText, values);
    
    // Check if a row was actually updated
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updatedProduct = result.rows[0];
    // 6. Return the updated product data
    return NextResponse.json(updatedProduct, { status: 200 }); // 200 OK

  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}