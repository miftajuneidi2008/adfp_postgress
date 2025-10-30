// in a data access file, e.g., lib/applications.ts

import pool from '@/lib/postgress/postgress'; // Your configured node-postgres connection pool

export async function getBranch() {
 const client = await pool.connect();
  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
      SELECT
          b.*,          
          d.id AS district_id, 
          d.name AS district_name, 
          d.code AS district_code
      FROM
          branches b
      LEFT JOIN
          districts d ON b.district_id = d.id 
      ORDER BY
          b.name ASC;
  `;

  try {

    const result = await client.query(queryText);
    
    return result.rows;

  } catch (error) {
    console.error('Error fetching Branch:', error);
    throw new Error('Could not fetch Branch.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

export async function getBranchName() {
 const client = await pool.connect();
  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
       SELECT
          id,
          name
      FROM
          branches
      WHERE
          is_active = TRUE
      ORDER BY
          name ASC;
  `;

  try {

    const result = await client.query(queryText);
    
    return result.rows;

  } catch (error) {
    console.error('Error fetching Branch:', error);
    throw new Error('Could not fetch Branch.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

export async function getBranchDistrict() {
 const client = await pool.connect();
  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
       SELECT
          id,
          name,
          district_id
      FROM
          branches
      WHERE
          is_active = TRUE 
      ORDER BY
          name ASC;   
  `;

  try {

    const result = await client.query(queryText);
    
    return result.rows;

  } catch (error) {
    console.error('Error fetching Branch:', error);
    throw new Error('Could not fetch Branch.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

