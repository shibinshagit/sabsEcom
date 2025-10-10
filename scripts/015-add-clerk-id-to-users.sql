-- Add clerk_id column to users table for Google Sign-In integration
-- This allows us to link Clerk (Google) users with our database users

-- First, ensure users table exists (uncomment from previous schema)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add clerk_id column to link with Clerk authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Create index for better performance on clerk_id lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Create OTP table for email verification (if not exists)
CREATE TABLE IF NOT EXISTS user_otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update orders table to include user_id (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_email ON user_otps(email);
CREATE INDEX IF NOT EXISTS idx_user_otps_expires ON user_otps(expires_at);
