// in a data access file, e.g., lib/applications.ts

import pool from "@/lib/postgress/postgress"; // Your configured node-postgres connection pool
export interface ApproverAssignment {
  id: string;
  approver_id: string;
  district_id: string | null;
  branch_id: string | null;
  product_id: string | null;
  approver?: { id: string; full_name: string; email: string; };
  district?: { id: string; name: string; };
  branch?: { id: string; name: string; };
  product?: { id: string; name: string; };
}

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

export async function fetchAssignments(): Promise<ApproverAssignment[]> {
  const client = await pool.connect();

  try {
    const queryText = `
      SELECT
          aa.id,
          aa.approver_id,
          aa.district_id,
          aa.branch_id,
          aa.product_id,
          aa.created_at,
          u.id AS approver_user_id,
          u.full_name AS approver_full_name,
          u.email AS approver_email,
          d.name AS district_name,
          b.name AS branch_name,
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

    const result = await pool.query(queryText);

    // *** TRANSFORMATION STEP ***
    // Map over the flat database rows and transform them into the nested structure.
    const formattedAssignments = result.rows.map(row => {
      return {
        id: row.id,
        approver_id: row.approver_id,
        district_id: row.district_id,
        branch_id: row.branch_id,
        product_id: row.product_id,

        // Conditionally create the nested 'approver' object
        approver: row.approver_user_id ? {
          id: row.approver_user_id,
          full_name: row.approver_full_name,
          email: row.approver_email,
        } : undefined,

        // Conditionally create the nested 'district' object
        district: row.district_id ? {
          id: row.district_id,
          name: row.district_name,
        } : undefined,

        // Conditionally create the nested 'branch' object
        branch: row.branch_id ? {
          id: row.branch_id,
          name: row.branch_name,
        } : undefined,

        // Conditionally create the nested 'product' object
        product: row.product_id ? {
          id: row.product_id,
          name: row.product_name,
        } : undefined,
      };
    });

    return formattedAssignments;

  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw new Error("Could not fetch assignments.");
  } finally {
    client.release();
  }
}