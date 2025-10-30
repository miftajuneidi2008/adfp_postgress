// in a data access file, e.g., lib/applications.ts

import pool from '@/lib/postgress/postgress'; // Your configured node-postgres connection pool

export async function getDistrict() {
 const client = await pool.connect();

  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
        SELECT *
      FROM districts
      ORDER BY name ASC;
  `;

  try {

    const result = await client.query(queryText);
    return result.rows;

  } catch (error) {
    console.error('Error fetching district:', error);
    throw new Error('Could not fetch district.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

export async function getDistctName() {
 const client = await pool.connect();

  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
        SELECT id,name
      FROM districts
      ORDER BY name ASC;
  `;

  try {

    const result = await client.query(queryText);
    return result.rows;

  } catch (error) {
    console.error('Error fetching district:', error);
    throw new Error('Could not fetch district.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}