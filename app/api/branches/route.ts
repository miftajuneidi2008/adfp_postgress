import { getCurrentUser } from "@/lib/auth/hooks";
import { NextResponse } from "next/server";
import pool from "@/lib/postgress/postgress"; // Adjust path as needed

export async function POST(req: Request, res: Response) {
  const session = await getCurrentUser();
  
 
  // Ensure the user is logged in and is a system admin
  if (!session || session.role !== 'system_admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

    try {
    // 2. Get the product data from the request body
        const client = await pool.connect();
    
    const { name,code,district_id} = await req.json();
    console.log(name,code)
       


    // 3. Validate the incoming data (server-side validation is crucial)
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Product Name is required' }, { status: 400 });
    }

    // 4. Write the SQL INSERT statement with parameterized queries
    const queryText = `
      INSERT INTO branches (name, code,district_id)
      VALUES ($1, $2,$3)
      RETURNING *; 
    `;
    // The values array corresponds to the $1, $2, $3, $4 placeholders
    const values = [
      name.trim(),
      code || null, // Handle optional fields
      district_id,

    ];

    // 5. Execute the query
    const result = await pool.query(queryText, values);
    const newProduct = result.rows[0];

   
    return NextResponse.json(newProduct, { status: 201 }); 

  } catch (error) {
    console.error('Failed to create branches:', error);
    // You might want to check for specific DB errors, like unique constraints
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}