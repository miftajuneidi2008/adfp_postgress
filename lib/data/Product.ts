// in a data access file, e.g., lib/applications.ts

import pool from '@/lib/postgress/postgress'; // Your configured node-postgres connection pool

export async function getProduct() {
 const client = await pool.connect();
  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
    SELECT * 
    FROM products 
    ORDER BY name ASC;
  `;

  try {

    const result = await client.query(queryText);
    
    return result.rows;

  } catch (error) {
    console.error('Error fetching Products:', error);
    throw new Error('Could not fetch products.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

export async function getProductName() {
 const client = await pool.connect();
  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
     SELECT
          id,
          name
      FROM
          products
      WHERE
          is_active = TRUE 
      ORDER BY
          name ASC;
  `;

  try {

    const result = await client.query(queryText);
    
    return result.rows;

  } catch (error) {
    console.error('Error fetching Products:', error);
    throw new Error('Could not fetch products.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}