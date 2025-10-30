// lib/postgress/postgress.ts (or lib/db.ts)
import { Pool } from 'pg';

// Declare pool as potentially undefined initially, but ultimately a Pool instance.
// This is important because 'pool' is not initialized right away.
let pool: Pool | undefined;

// Use a function to get or create the pool, ensuring it's always returned as a Pool.
function getDbPool(): Pool {
  if (!pool) {
    // If the pool hasn't been created yet, create it.
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Optional: Add SSL configuration if your production database requires it
      // ssl: {
      //   rejectUnauthorized: false
      // }
    });
  }
  // At this point, 'pool' is guaranteed to be a Pool instance, not undefined.
  return pool;
}

// Export the function, not the raw pool variable.
// This way, every consumer calls getDbPool() and gets a properly typed Pool.
export default getDbPool();