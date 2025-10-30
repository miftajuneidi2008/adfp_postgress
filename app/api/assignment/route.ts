import { getCurrentUser } from "@/lib/auth/hooks";
import { NextResponse } from "next/server";
import pool from "@/lib/postgress/postgress"; // Adjust path as needed

export async function POST(req: Request, res: Response) {
  const session = await getCurrentUser();

  // Ensure the user is logged in and is a system admin
  if (!session || session.role !== "system_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    // 2. Get the product data from the request body
    const client = await pool.connect();
    
    const assignment = await req.json();
    const firstItem = assignment['0'];
    const {approver_id, district_id, branch_id, product_id} = firstItem
  
    const queryText = `
      INSERT INTO approver_assignments (approver_id, district_id,branch_id,product_id)
      VALUES ($1, $2,$3,$4)
      RETURNING *; 
    `;
 
    const values = [approver_id, district_id, branch_id, product_id];

    // 5. Execute the query
    const result = await pool.query(queryText, values);
     const newProduct = result.rows[0];

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Failed to create Assignment:", error);
    // You might want to check for specific DB errors, like unique constraints
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
