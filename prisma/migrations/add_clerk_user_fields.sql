-- Migration to support unified Clerk authentication
-- This adds fields to support child accounts with Clerk user IDs

-- Add new columns to Parent table for dashboard PIN
ALTER TABLE "parents" ADD COLUMN "dashboard_pin_hash" TEXT;
ALTER TABLE "parents" ADD COLUMN "onboarding_complete" BOOLEAN DEFAULT FALSE;

-- Add new Child table structure that references Clerk users
CREATE TABLE "child_accounts" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerk_user_id" TEXT NOT NULL UNIQUE,
  "parent_clerk_user_id" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Personalization (migrated from old Child table)
  "persona" TEXT NOT NULL DEFAULT 'friendly-raccoon',
  "language_level" TEXT NOT NULL DEFAULT 'foundation',
  "preferred_name" TEXT,
  
  -- Privacy controls
  "visibility_level" TEXT NOT NULL DEFAULT 'highlights',
  "account_status" TEXT NOT NULL DEFAULT 'active',
  
  -- Foreign key to parent
  CONSTRAINT "child_accounts_parent_clerk_user_id_fkey" 
    FOREIGN KEY ("parent_clerk_user_id") 
    REFERENCES "parents"("clerk_user_id") 
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX "child_accounts_parent_clerk_user_id_idx" ON "child_accounts"("parent_clerk_user_id");
CREATE INDEX "child_accounts_username_idx" ON "child_accounts"("username");
CREATE INDEX "child_accounts_account_status_idx" ON "child_accounts"("account_status");

-- Update existing tables to reference new child_accounts table
-- We'll need to do this in code as it requires data migration

-- Add temporary columns to maintain relationships during migration
ALTER TABLE "conversations" ADD COLUMN "child_account_id" TEXT;
ALTER TABLE "safety_events" ADD COLUMN "child_account_id" TEXT;
ALTER TABLE "child_memory" ADD COLUMN "child_account_id" TEXT;
ALTER TABLE "parent_notifications" ADD COLUMN "child_account_id" TEXT;