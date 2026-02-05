-- Step 1: Add 'master' role to the enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';