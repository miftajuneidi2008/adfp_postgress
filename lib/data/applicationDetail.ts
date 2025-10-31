import pool from "@/lib/postgress/postgress";
import { createNotifications } from "./Application";

export interface Product {
  name: string;
}

export interface Branch {
  name: string;
}

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "returned"
  | "rejected"
  | "draft";

export interface ApplicationRecord {
  id: string;
  application_number: string;
  customer_name: string;
  customer_id: string | null;
  phone_number: string;
  product_id: string; // Foreign key
  branch_id: string; // Foreign key
  status: ApplicationStatus;
  remarks: string | null;
  submitted_at: Date; // Store as Date, handle conversion in/out of DB
  submitted_by: string;
  current_approver_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Enriched Application for UI (joins product and branch names)
export interface Application extends ApplicationRecord {
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

// export async function createNotifications(notifications: any) {
//   if (!Array.isArray(notifications) || notifications.length === 0) {
//     console.warn(
//       "createNotifications called with invalid or empty notifications array. Aborting."
//     );
//     return [];
//   }
//   if (typeof notifications[0] !== "object" || notifications[0] === null) {
//     throw new Error(
//       "Invalid data: First element in notifications array is not a valid object."
//     );
//   }

//   const client = await pool.connect();
//   try {
//     const columns = Object.keys(notifications[0])
//       .map((col) => `"${col}"`)
//       .join(", ");
//     const values = notifications.flatMap((n) => Object.values(n));

//     let paramIndex = 1;
//     const valuePlaceholders = notifications
//       .map(
//         (n) =>
//           `(${Object.keys(n)
//             .map(() => `$${paramIndex++}`)
//             .join(", ")})`
//       )
//       .join(", ");

//     const queryText = `
//       INSERT INTO notifications (${columns})
//       VALUES ${valuePlaceholders}
//       RETURNING *;
//     `;
//     const result = await client.query(queryText, values);
//     return result.rows;
//   } catch (error) {
//     console.error("Error creating notifications:", error);
//     throw new Error("Could not create notifications.");
//   } finally {
//     client.release();
//   }
// }

// --- Data Fetching Functions ---

export async function fetchApplicationById(
  applicationId: string
): Promise<Application | null> {
  if (!applicationId) return null;
  const client = await pool.connect();
  try {
    const queryText = `
      SELECT
        a.*,
        p.name as "product.name",
        b.name as "branch.name"
      FROM applications a
      JOIN products p ON a.product_id = p.id
      JOIN branches b ON a.branch_id = b.id
      WHERE a.id = $1;
    `;
    const result = await client.query(queryText, [applicationId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    // Manually reconstruct the nested objects
    const application: Application = {
      ...row,
      product: { name: row["product.name"] },
      branch: { name: row["branch.name"] },
      submitted_at: new Date(row.submitted_at), // Ensure dates are Date objects
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
    return application;
  } catch (error) {
    console.error("Error fetching application:", error);
    throw new Error("Failed to fetch application details.");
  } finally {
    client.release();
  }
}

export async function fetchApplicationHistory(
  applicationId: string
): Promise<StatusHistory[]> {
  if (!applicationId) return [];
  const client = await pool.connect();
  try {
    const queryText = `
      SELECT
        ash.*,
        u.full_name as "user.full_name"
      FROM application_status_history ash
      LEFT JOIN users u ON ash.action_by = u.id
      WHERE ash.application_id = $1
      ORDER BY ash.created_at DESC;
    `;
    const result = await client.query(queryText, [applicationId]);

    // Manually reconstruct the nested user object
    return result.rows.map((row) => ({
      ...row,
      user: row["user.full_name"] ? { full_name: row["user.full_name"] } : null,
      created_at: new Date(row.created_at),
    }));
  } catch (error) {
    console.error("Error fetching application history:", error);
    throw new Error("Failed to fetch application history.");
  } finally {
    client.release();
  }
}

interface UpdateApplicationStatusParams {
  applicationId: string;
  newStatus: ApplicationStatus;
  profileId: string;
  profileRole: string;
  fromStatus: ApplicationStatus;
  reason?: string | null;
  comments?: string | null;
  submittedBy: string; // Used for notification
  applicationNumber: string; // Used for notification
  customerName: string; // Used for notification
  productName: string; // Used for notification
}

export async function updateApplicationStatusAndNotify(
  params: UpdateApplicationStatusParams
): Promise<void> {
  const {
    applicationId,
    newStatus,
    profileId,
    profileRole,
    fromStatus,
    reason = null,
    comments = null,
    submittedBy,
    applicationNumber,
    customerName,
    productName,
  } = params;

  if (!profileId) {
    throw new Error("Unauthorized: User profile missing.");
  }

  const client = await pool.connect();
  console.log("inside function");
  try {
    await client.query("BEGIN"); // Start a transaction

    // 1. Update application status
    const updateAppQuery = `
      UPDATE applications
      SET status = $1, updated_at = NOW()
      WHERE id = $2;
    `;
    const updateResult = await client.query(updateAppQuery, [
      newStatus,
      applicationId,
    ]);

    if (updateResult.rowCount === 0) {
      throw new Error("Application not found or no update was performed.");
    }

    // 2. Insert status history
    const insertHistoryQuery = `
      INSERT INTO application_status_history (application_id, from_status, to_status, action_by, action_by_role, reason, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    
    await client.query(insertHistoryQuery, [
      applicationId,
      fromStatus,
      newStatus,
      profileId,
      profileRole,
      reason,
      comments,
    ]);
     
   
    // 3. Prepare and insert notification
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = "status_changed";
    console.log("inside heeer");
    switch (newStatus) {
      case "approved":
        notificationTitle = "Application Approved";
        notificationMessage = `Your application ${applicationNumber} for ${customerName} has been approved.`;
        break;
      case "rejected":
        notificationTitle = "Application Rejected";
        notificationMessage = `Your application ${applicationNumber} for ${customerName} has been rejected. Reason: ${reason}.`;
        break;
      case "returned":
        notificationTitle = "Application Returned";
        notificationMessage = `Your application ${applicationNumber} for ${customerName} has been returned. Please review and resubmit. Reason: ${reason}.`;
        notificationType = "returned";
        break;
      default:
        notificationTitle = "Application Status Updated";
        notificationMessage = `Your application ${applicationNumber} has changed status to ${newStatus}.`;
    }

    const notificationPayload = [
      {
        user_id: submittedBy,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        related_application_id: applicationId,
      },
    ];
    console.log(notificationPayload,"notification")
    await createNotifications(notificationPayload); // Use the batch create function

    await client.query("COMMIT"); // Commit the transaction
        console.log(notificationPayload,"updated")

  } catch (error) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error(`Error processing application ${newStatus}:`, error);
    throw new Error(`Failed to ${newStatus} application.`);
  } finally {
    client.release();
  }
}
