# Quick Setup Guide - Fix Payment Error

## The Error
You're getting a 500 error because the system needs to be set up for the new multi-account structure.

## Quick Fix (Choose One)

### Option 1: Add to Your `.env` File

Add these lines (using your existing Razorpay credentials):

```env
# Neon DB Connection (you should already have this)
DATABASE_URL=your_neon_db_connection_string

# Razorpay Account 1
RAZORPAY_ACCOUNT_1_KEY_ID=rzp_test_0gQpfBXcoa7vZ6
RAZORPAY_ACCOUNT_1_KEY_SECRET=Ut1IAGQ4G6UmoaQ32PSI6T01
RAZORPAY_ACCOUNT_COUNT=1
```

### Option 2: Add Database Setting

Run this SQL in your **Neon DB console**:

```sql
INSERT INTO settings (key, value, type, category, label, description) 
VALUES ('active_razorpay_account', '1', 'text', 'payment', 'Active Razorpay Account', 'Currently active Razorpay payment gateway account number')
ON CONFLICT (key) DO UPDATE SET value = '1';
```

## What's Happening

The payment API is trying to:
1. Connect to Neon DB using `DATABASE_URL`
2. Query database for `active_razorpay_account` setting
3. Use that value to fetch `RAZORPAY_ACCOUNT_N_KEY_ID` from ENV
4. If either is missing, it throws an error

## Recommended Steps

1. **Update your `.env`** with the new format:
   ```env
   DATABASE_URL=postgresql://user:password@host/database
   
   RAZORPAY_ACCOUNT_1_KEY_ID=rzp_test_0gQpfBXcoa7vZ6
   RAZORPAY_ACCOUNT_1_KEY_SECRET=Ut1IAGQ4G6UmoaQ32PSI6T01
   RAZORPAY_ACCOUNT_COUNT=1
   ```

2. **Run the database setup script** in Neon DB console:
   - Go to your Neon DB dashboard
   - Open SQL Editor
   - Run the INSERT statement above

3. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Test the payment** - Should work now!

## Verify Setup

Check if these exist:
- ✅ `.env` has `DATABASE_URL` (Neon DB connection)
- ✅ `.env` has `RAZORPAY_ACCOUNT_1_KEY_ID`
- ✅ `.env` has `RAZORPAY_ACCOUNT_1_KEY_SECRET`
- ✅ Neon DB has `active_razorpay_account` setting in `settings` table
