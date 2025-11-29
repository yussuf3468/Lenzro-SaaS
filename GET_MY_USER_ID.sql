-- ============================================================================
-- GET YOUR USER ID TO BECOME SUPER ADMIN
-- ============================================================================
-- Run this query in Supabase SQL Editor to get your user_id
-- Then use the result in the INSERT statement below

SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'admin@lenzro.com';

-- ============================================================================
-- After getting your user_id, run this INSERT statement
-- Replace 'YOUR-USER-ID-HERE' with the actual UUID from the query above
-- ============================================================================

INSERT INTO super_admins (user_id, email, full_name)
VALUES ('YOUR-USER-ID-HERE', 'admin@lenzro.com', 'Yussuf Muse');

-- ============================================================================
-- Verify you're now a super admin
-- ============================================================================
SELECT * FROM super_admins WHERE email = 'admin@lenzro.com';
