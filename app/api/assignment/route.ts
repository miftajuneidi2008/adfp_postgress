import { getCurrentUser } from "@/lib/auth/hooks";
import { NextResponse } from "next/server";
import pool from "@/lib/postgress/postgress";

// Define the shape of a single assignment object
interface Assignment {
  approver_id: string;
  district_id: string | null;
  branch_id: string | null;
  product_id: string | null;
}

export async function POST(req: Request) {
  const session = await getCurrentUser();

  if (!session || session.role !== "system_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const client = await pool.connect();

  try {
    // The body is now an array of assignment objects
    const assignments: Assignment[] = await req.json();

    // Ensure the request body is an array and not empty
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ message: "Bad Request: Expected an array of assignments." }, { status: 400 });
    }

    // Start a transaction
    await client.query('BEGIN');

    const insertedAssignments = [];

    // Loop through each assignment in the array
    for (const assignment of assignments) {
      const { approver_id, district_id, branch_id, product_id } = assignment;

      const queryText = `
        INSERT INTO approver_assignments (approver_id, district_id, branch_id, product_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      
      const values = [approver_id, district_id, branch_id, product_id];

      // Execute the query for the current assignment
      const result = await client.query(queryText, values);
      insertedAssignments.push(result.rows[0]);
    }

    // If all inserts were successful, commit the transaction
    await client.query('COMMIT');

    return NextResponse.json(insertedAssignments, { status: 201 });

  } catch (error) {
    // If any error occurred, roll back the transaction
    await client.query('ROLLBACK');
    console.error("Failed to create assignments:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // Release the client back to the pool
    client.release();
  }
}