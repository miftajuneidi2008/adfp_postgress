import { getCurrentUser } from "../auth/hooks";
import pool from "@/lib/postgress/postgress"; // Your configured node-postgres connection pool

export interface ApplicationData {
  customer_name: string;
  customer_id: string | null;
  phone_number: string;
  product_id: string;
  branch_id: string | null | undefined;
  remarks: string | null;
  status: string;
  submitted_by: string;
}

interface Application {
  id: string;
  status: string;
}

interface ApplicationNumber {
  application_number: string | null;
}

interface Application extends ApplicationData {
  id: string;
  created_at: string;
}

interface ApplicationStatusHistoryData {
  application_id: string | null;
  from_status: string | null;
  to_status: string;
  action_by: string;
  action_by_role: string;
}

interface ApplicationStatusHistoryRecord extends ApplicationStatusHistoryData {
  id: number;
  created_at: string;
}

interface NotificationData {
  user_id: any;
  title: string;
  message: string;
  type: string;
  related_application_id: string | null;
}

// Define the full record type including DB-generated columns
interface NotificationRecord extends NotificationData {
  id: number; // or string if it's a UUID
  created_at: string;
  is_read: boolean;
}


export interface Product {
  name: string;
}

export interface Branch {
  name: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'returned' | 'rejected' | 'draft';

export interface ApplicationRecord {
  id: string;
  application_number: string;
  customer_name: string;
  customer_id: string | null;
  phone_number: string;
  product_id: string; // Foreign key
  branch_id: string;  // Foreign key
  status: ApplicationStatus;
  remarks: string | null;
  submitted_at: Date; // Store as Date, handle conversion in/out of DB
  submitted_by: string;
  current_approver_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Enriched Application for UI (joins product and branch names)
export interface Applications extends ApplicationRecord {
  product: Product;
  branch: Branch;
}

export interface StatusHistoryRecord {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  action_by: string;
  action_by_role: string;
  reason: string | null;
  comments: string | null;
  created_at: Date;
}

// Enriched StatusHistory for UI (joins user full_name)
export interface StatusHistory extends StatusHistoryRecord {
  user: {
    full_name: string;
  } | null; // user might be null if not found
}

export async function getApplications() {
  const profile = await getCurrentUser();

  if (!profile) {
    throw new Error("User profile is required to fetch applications.");
  }

  const client = await pool.connect();

  try {
    let queryText = `
      SELECT
        a.*,
        p.name AS product_name
      FROM
        applications a
      LEFT JOIN
        products p ON a.product_id = p.id
    `;

    const values: any[] = [];

    if (profile.role === "branch_user") {
      queryText += ` WHERE a.submitted_by = $1`;
      values.push(profile.id);
    }

    queryText += ` ORDER BY a.submitted_at DESC`;

    const result = await client.query(queryText, values);

    const formattedApplications = result.rows.map((row) => {
      const { product_name, ...applicationData } = row;

      return {
        ...applicationData,

        product: row.product_id ? { name: product_name } : null,
      };
    });

    return formattedApplications;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw new Error("Could not fetch applications.");
  } finally {
    client.release();
  }
}

export async function updateDraftApplication(
  editId: string,
  applicationData: Record<string, any>
): Promise<any | null> {
  const keys = Object.keys(applicationData);
  if (keys.length === 0) {
    console.warn("No data provided for update.");
    return null;
  }

  const client = await pool.connect();

  try {
    const setClause = keys
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(", ");

    const values = Object.values(applicationData);

    const idParamIndex = values.length + 1;
    const statusParamIndex = values.length + 2;

    const queryText = `
      UPDATE applications
      SET ${setClause}
      WHERE id = $${idParamIndex} AND status = $${statusParamIndex}
      RETURNING *;
    `;

    values.push(editId, "draft");

    const result = await client.query(queryText, values);

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error updating application:", error);
    throw new Error("Could not update the application.");
  } finally {
    client.release();
  }
}

export async function createApplication(
  applicationData: ApplicationData
): Promise<any> {
  const client = await pool.connect();

  try {
    const columns = Object.keys(applicationData);
    const values = Object.values(applicationData);

    const columnNames = columns.map((col) => `"${col}"`).join(", ");

    const valuePlaceholders = columns
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const queryText = `
      INSERT INTO applications (${columnNames})
      VALUES (${valuePlaceholders})
      RETURNING *;
    `;

    const result = await client.query(queryText, values);

    return result.rows[0];
  } catch (error) {
    console.error("Error creating application:", error);
    throw new Error("Could not create the application.");
  } finally {
    client.release();
  }
}

export async function submitDraftApplication(
  editId: string
): Promise<Application | null> {
  const client = await pool.connect();

  try {
    const queryText = `
      UPDATE applications
      SET status = $1
      WHERE id = $2 AND status = $3
      RETURNING *;
    `;

    // 2. The values array corresponds to the placeholders ($1, $2, $3) in order.
    const values = ["pending", editId, "draft"];

    const result = await client.query<Application>(queryText, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error submitting application:", error);
    throw new Error("Could not submit the application.");
  } finally {
    // 5. Always release the client back to the pool.
    client.release();
  }
}

export async function createNewApplication(
  applicationData: ApplicationData
): Promise<Application> {
  const client = await pool.connect();

  try {
    const columns = Object.keys(applicationData);
    const values = Object.values(applicationData);

    const columnNames = columns.map((col) => `"${col}"`).join(", ");

    const valuePlaceholders = columns
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const queryText = `
      INSERT INTO applications (${columnNames})
      VALUES (${valuePlaceholders})
      RETURNING *;
    `;

    const result = await client.query<Application>(queryText, values);

    if (result.rows.length === 0) {
      throw new Error("Application insertion failed, no record was returned.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error creating application:", error);
    throw new Error("Could not create the application in the database.");
  } finally {
    client.release();
  }
}

export async function getApplicationNumberById(
  applicationId: string
): Promise<ApplicationNumber | null> {
  // It's good practice to validate the input if possible
  if (!applicationId) {
    console.warn("getApplicationNumberById called with no ID.");
    return null;
  }

  const client = await pool.connect();

  try {
    const queryText = `
      SELECT application_number FROM applications WHERE id = $1;
    `;

    const values = [applicationId];

    const result = await client.query<ApplicationNumber>(queryText, values);

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching application number:", error);
    throw new Error("Could not fetch application number.");
  } finally {
    client.release();
  }
}

export async function createApplicationStatusHistory(
  historyData: ApplicationStatusHistoryData
): Promise<ApplicationStatusHistoryRecord> {
  const client = await pool.connect();

  try {
    const columns = Object.keys(historyData);
    const values = Object.values(historyData);

    const columnNames = columns.map((col) => `"${col}"`).join(", ");

    const valuePlaceholders = columns
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const queryText = `
      INSERT INTO application_status_history (${columnNames})
      VALUES (${valuePlaceholders})
      RETURNING *;
    `;

    const result = await client.query<ApplicationStatusHistoryRecord>(
      queryText,
      values
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating application status history:", error);
    throw new Error("Could not log application history.");
  } finally {
    client.release();
  }
}

export async function findRelevantApproverIds(
  branch_id: string,
  selectedProduct: string
) {
  const client = await pool.connect();
  try {
    // 2. The SQL Query
    // 'SELECT DISTINCT approver_id' ensures that each approver ID is returned only once,
    // even if they match multiple conditions in the WHERE clause.
    const queryText = `
      SELECT DISTINCT approver_id
      FROM approver_assignments
      WHERE district_id = $1 OR branch_id = $2 OR product_id = $3;
    `;

    // 3. Parameterized Values
    // This array provides the values for the placeholders ($1, $2, $3) in the query.
    // Using parameterized queries is CRUCIAL for preventing SQL injection vulnerabilities.
    const values = [
      branch_id, // Corresponds to $1 (for district_id)
      branch_id, // Corresponds to $2 (for branch_id)
      selectedProduct, // Corresponds to $3 (for product_id)
    ];

    // 4. Execute the query
    // The <{ approver_id: string }> type assertion helps TypeScript understand the shape of the rows.
    const result = await client.query<{ approver_id: string }>(
      queryText,
      values
    );

    const approverIds = result.rows;

    return approverIds;
  } catch (error) {
    console.error("Error finding approver assignments:", error);

    throw new Error("Could not find approver assignments.");
  } finally {
    client.release();
  }
}

export async function createNotifications(
  notifications: NotificationData[]
): Promise<NotificationRecord[]> {
  console.log(notifications);
  if (!Array.isArray(notifications) || notifications.length === 0) {
    console.warn(
      "createNotifications called with invalid or empty notifications array. Aborting."
    );
    return [];
  }

  if (typeof notifications[0] !== "object" || notifications[0] === null) {
    throw new Error(
      "Invalid data: First element in notifications array is not a valid object."
    );
  }

  const client = await pool.connect();

  try {
    // 3. Securely get column names from the FIRST valid object.
    const columns = Object.keys(notifications[0])
      .map((col) => `"${col}"`)
      .join(", ");

    const values = notifications.flatMap((n) => Object.values(n));

    let paramIndex = 1;
    const valuePlaceholders = notifications
      .map(
        (n) =>
          // Use the keys from the *current* object 'n' to ensure correct placeholder count
          `(${Object.keys(n)
            .map(() => `$${paramIndex++}`)
            .join(", ")})`
      )
      .join(", ");

    // 6. Construct the final, secure SQL query.
    const queryText = `
      INSERT INTO notifications (${columns})
      VALUES ${valuePlaceholders}
      RETURNING *;
    `;

    const result = await client.query<NotificationRecord>(queryText, values);

    return result.rows;
  } catch (error) {
    console.error("Error creating notifications:", error);
    // Throw a new, generic error to avoid leaking database details.
    throw new Error("Could not create notifications.");
  } finally {
    // 7. CRITICAL: Always release the client back to the pool.
    client.release();
  }
}

export async function loadDraftApplications(editId: string, userId: string) {
  const client = await pool.connect();

  try {

    const queryText = `
      SELECT *
      FROM applications
      WHERE id = $1 AND status = $2 AND submitted_by = $3;
    `;

    // 2. The values array corresponds to the placeholders in the query, in order.
    const values = [editId, "draft", userId];

    // 3. Execute the query.
    const result = await client.query<Application>(queryText, values);

   
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching editable draft application:", error);
    throw new Error("Could not fetch the application.");
  } finally {
    // 5. CRITICAL: Always release the client back to the connection pool.
    client.release();
  }
}




