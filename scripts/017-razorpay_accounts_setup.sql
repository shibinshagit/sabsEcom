-- Database Setup for Multiple Razorpay Accounts
-- This script supports ANY number of accounts configured in your .env file
-- Compatible with Neon DB (PostgreSQL)

-- Add active Razorpay account selector setting
INSERT INTO settings (key, value, type, category, label, description) 
VALUES (
  'active_razorpay_account', 
  '1', 
  'text', 
  'payment', 
  'Active Razorpay Account', 
  'Currently active Razorpay payment gateway account number'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = '1',
  description = 'Currently active Razorpay payment gateway account number';

-- Add label settings for each account you have configured
-- Add as many as needed based on your RAZORPAY_ACCOUNT_COUNT in .env

-- Account 1 label
INSERT INTO settings (key, value, type, category, label, description) 
VALUES (
  'razorpay_account_1_label', 
  'Account 1', 
  'text', 
  'payment', 
  'Razorpay Account 1 Label', 
  'Custom label for Razorpay Account 1'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = 'Account 1';

-- Account 2 label
INSERT INTO settings (key, value, type, category, label, description) 
VALUES (
  'razorpay_account_2_label', 
  'Account 2', 
  'text', 
  'payment', 
  'Razorpay Account 2 Label', 
  'Custom label for Razorpay Account 2'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = 'Account 2';

-- If you have more accounts (3, 4, 5, etc.), add them here:
-- Example for Account 3:
-- INSERT INTO settings (key, value, type, category, label, description) 
-- VALUES ('razorpay_account_3_label', 'Account 3', 'text', 'payment', 'Razorpay Account 3 Label', 'Custom label for Razorpay Account 3')
-- ON CONFLICT (key) DO UPDATE SET value = 'Account 3';

-- Verify the settings were added
SELECT * FROM settings WHERE key LIKE 'razorpay_%' OR key = 'active_razorpay_account';
