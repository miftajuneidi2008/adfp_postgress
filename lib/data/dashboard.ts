// in a data access file, e.g., lib/applications.ts

import pool from '@/lib/postgress/postgress'; // Your configured node-postgres connection pool
import { SessionPayload } from '../auth/hooks';

export async function getFilteredApplications(role:string,id:string | undefined) {
 const client = await pool.connect();
  
  // 1. Start with the base query that performs the JOINs.
  // We use aliases (a, b, p) for clarity.
  let queryText = `
    SELECT
      a.*,
      b.name AS branch_name,
      p.name AS product_name
    FROM
      applications AS a
    LEFT JOIN
      branches AS b ON a.branch_id = b.id
    LEFT JOIN
      products AS p ON a.product_id = p.id
  `;

  // 2. Prepare an array to hold our parameters for the query.
  // This is crucial for preventing SQL injection.
  const params: any[] = [];
  
  // 3. Conditionally add the WHERE clause based on the user's role.
  if (role === 'branch_user') {
    // This is the equivalent of: .eq("submitted_by", user.id)
    params.push(id);
    // Use $1 as a placeholder for the first parameter in the 'params' array.
    queryText += ` WHERE a.submitted_by = $1`;
  }
  // If the user is not a 'branch_user', no WHERE clause is added,
  // so the query will select all applications.

  // 4. Add the final ordering clause.
  // This is the equivalent of: .order("submitted_at", { ascending: false })
  queryText += ` ORDER BY a.submitted_at DESC;`;


  // --- Query Execution ---
  try {

    const result = await client.query(queryText, params);
    
    return result.rows;

  } catch (error) {
    console.error('Error fetching filtered applications:', error);
    throw new Error('Could not fetch applications.');
  } finally {
    // 6. Always release the database client back to the pool.
    client.release();
  }
}