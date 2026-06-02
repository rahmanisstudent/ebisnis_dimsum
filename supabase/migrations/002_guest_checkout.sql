-- ============================================================
-- DimsumStore — Migration 002: Guest Checkout Support
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Drop NOT NULL constraint on orders.user_id to allow guest orders
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest contact columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- 3. Verify reviews table still only allows authenticated users (no changes needed)
-- But make sure that if reviews are queried, we can handle cases where user_id might not have a profile,
-- although reviews can only be made by logged-in users.

-- ============================================================
-- Done! Guest checkout fields added to orders table.
-- ============================================================
