-- Update existing pending chalets to active status
UPDATE chalets 
SET status = 'active' 
WHERE status = 'pending';