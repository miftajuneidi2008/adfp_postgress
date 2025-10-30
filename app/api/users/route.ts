import { getCurrentUser } from "@/lib/auth/hooks";
import { NextResponse } from "next/server";
import pool from "@/lib/postgress/postgress"; // Adjust path as needed
import { Product } from "@/lib/auth/types";


export async function POST(req: Request, res: Response) {
  const session = await getCurrentUser();
 
  // Ensure the user is logged in and is a system admin
  if (!session || session.role !== 'system_admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

    try {
    // 2. Get the product data from the request body
        const client = await pool.connect();
    
    const { email, password, full_name,role,branch_id,is_active } = await req.json();
    
  

    // 3. Validate the incoming data (server-side validation is crucial)
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ message: 'Email Name is required' }, { status: 400 });
    }

       if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      return NextResponse.json({ message: 'full_name Name is required' }, { status: 400 });
    }

    // 4. Write the SQL INSERT statement with parameterized queries
    const queryText = `
      INSERT INTO users (email, full_name, password, role,branch_id,is_active)
      VALUES ($1, $2, $3, $4,$5,$6)
      RETURNING *; 
    `;
    // The values array corresponds to the $1, $2, $3, $4 placeholders
    const values = [
    email,full_name, password, role,branch_id,is_active
    ];

    // 5. Execute the query
    const result = await pool.query(queryText, values);
    const newProduct = result.rows[0];

    // 6. Return the newly created product
    return NextResponse.json(newProduct, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Failed to create User:', error);
    // You might want to check for specific DB errors, like unique constraints
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


