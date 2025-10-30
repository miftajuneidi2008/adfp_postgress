-- Add 'draft' status to application_status enum
-- Ensure this runs only if 'draft' isn't already present.
--ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'draft';


-- Update RLS policies to allow branch users to update their own draft applications
--DROP POLICY IF EXISTS "Branch users can update their own draft applications" ON applications;

CREATE POLICY "Branch users can update their own draft applications"
ON applications
FOR UPDATE
-- Removed 'TO authenticated' as this role does not exist in plain PostgreSQL
USING (
  -- The application must be in 'draft' status for an update to be allowed by this policy
  applications.status = 'draft'
  AND
  -- Check if the current user (from session, via current_user_id()) is a branch user
  -- AND is the one who originally submitted this specific application.
  EXISTS (
    SELECT 1 FROM users
    WHERE id = current_user_id() -- Replaced auth.uid() with current_user_id()
      AND role = 'branch_user'
      AND id = applications.submitted_by
  )
)
WITH CHECK (
  -- When the update is performed, ensure the new status is either 'draft' or 'pending'.
  -- And that the current user is still the branch user who submitted it (using NEW.submitted_by).
  status IN ('draft', 'pending')
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = current_user_id() -- Replaced auth.uid() with current_user_id()
      AND role = 'branch_user'
      AND id = submitted_by
  )
);