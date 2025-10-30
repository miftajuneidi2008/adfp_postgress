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
    
    const { productName, productDescription, productCode } = await req.json();

    // 3. Validate the incoming data (server-side validation is crucial)
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return NextResponse.json({ message: 'Product Name is required' }, { status: 400 });
    }

    // 4. Write the SQL INSERT statement with parameterized queries
    const queryText = `
      INSERT INTO products (name, description, product_code, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *; 
    `;
    // The values array corresponds to the $1, $2, $3, $4 placeholders
    const values = [
      productName.trim(),
      productDescription || null, // Handle optional fields
      productCode || null,
      true, // Set is_active to true for new products
    ];

    // 5. Execute the query
    const result = await pool.query<Product>(queryText, values);
    const newProduct = result.rows[0];

    // 6. Return the newly created product
    return NextResponse.json(newProduct, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Failed to create product:', error);
    // You might want to check for specific DB errors, like unique constraints
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


