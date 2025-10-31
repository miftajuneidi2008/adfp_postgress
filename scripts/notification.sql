-- Create a function that takes the newly inserted row, converts it to JSON,
-- and sends it as a notification payload on the 'new_notification' channel.
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- pg_notify sends a notification. 'new_notification' is the channel name.
  -- row_to_json(NEW) converts the entire new row into a single JSON string.
  PERFORM pg_notify('new_notification', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists to ensure a clean setup
DROP TRIGGER IF EXISTS new_notification_trigger ON notifications;

-- Create a trigger that calls the function after every row is inserted.
CREATE TRIGGER new_notification_trigger
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION notify_new_notification();