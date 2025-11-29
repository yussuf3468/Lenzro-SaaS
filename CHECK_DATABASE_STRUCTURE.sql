-- ========================================
-- CHECK DATABASE STRUCTURE
-- Run this in Supabase SQL Editor to diagnose the issue
-- ========================================

-- 1. Check if organization_members table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
ORDER BY ordinal_position;

-- 2. Check foreign keys on organization_members
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'organization_members';

-- 3. Check if organizations table exists
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'organizations'
ORDER BY ordinal_position;

-- 4. Test a simple query on organization_members
SELECT id, user_id, organization_id, role 
FROM organization_members 
WHERE user_id = 'b2604f81-063a-4bc6-ab06-7fa8b9508018'
LIMIT 5;

-- 5. Test if we can manually join
SELECT 
    om.id as member_id,
    om.role,
    o.id as org_id,
    o.name as org_name
FROM organization_members om
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = 'b2604f81-063a-4bc6-ab06-7fa8b9508018'
LIMIT 5;
