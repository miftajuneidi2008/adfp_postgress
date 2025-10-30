// in a data access file, e.g., lib/applications.ts

import pool from "@/lib/postgress/postgress"; // Your configured node-postgres connection pool

export async function getUsers() {
  const client = await pool.connect();

  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
        SELECT
    u.id AS user_id,          
    u.email,
    u.full_name,
    u.role,                    
    u.branch_id,
    u.is_active,
    u.last_login,
    b.name AS branch_name      
FROM
    users u
LEFT JOIN
    branches b ON u.branch_id = b.id
ORDER BY
    u.created_at DESC;
  `;

  try {
    const result = await client.query(queryText);
    return result.rows;
  } catch (error) {
    console.error("Error fetching Users:", error);
    throw new Error("Could not fetch Users.");
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

export async function fetchApprovers() {
  const client = await pool.connect();

  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
        SELECT
          id,
          full_name,
          email
      FROM
          users
      WHERE
          role = $1 AND   
          is_active = TRUE 
      ORDER BY
          full_name ASC; 
  `;

  try {
    const values = ["head_office_approver"];
    const result = await pool.query(queryText, values);
    return result.rows;
  } catch (error) {
    console.error("Error fetching Users:", error);
    throw new Error("Could not fetch Users.");
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}

export async function fetchAssignments() {
  const client = await pool.connect();

  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
         SELECT
          aa.*,

         
          u.id AS approver_user_id,
          u.full_name AS approver_full_name,
          u.email AS approver_email,

        
          d.id AS district_id,
          d.name AS district_name,

        
          b.id AS branch_id,
          b.name AS branch_name,

         
          p.id AS product_id,
          p.name AS product_name
      FROM
          approver_assignments aa
      LEFT JOIN
          users u ON aa.approver_id = u.id 
      LEFT JOIN
          districts d ON aa.district_id = d.id 
      LEFT JOIN
          branches b ON aa.branch_id = b.id   
      LEFT JOIN
          products p ON aa.product_id = p.id  
      ORDER BY
          aa.created_at DESC;    
  `;

  try {
   
    const result = await pool.query(queryText);
    return result.rows;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw new Error("Could not fetch assignments.");
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}
