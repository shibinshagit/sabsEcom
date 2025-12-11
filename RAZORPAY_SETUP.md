# Environment Variables Configuration

## Razorpay Multiple Accounts Setup (Fully Dynamic)

The system now **automatically detects** all Razorpay accounts configured in your `.env` file. You can add as many accounts as needed (2, 3, 4, 5, etc.).

Configure your `.env` file as follows:

```env
# Database Configuration
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Razorpay Account 1
RAZORPAY_ACCOUNT_1_KEY_ID=rzp_test_0gQpfBXcoa7vZ6
RAZORPAY_ACCOUNT_1_KEY_SECRET=Ut1IAGQ4G6UmoaQ32PSI6T01
RAZORPAY_ACCOUNT_1_LABEL=Primary Account

# Razorpay Account 2
RAZORPAY_ACCOUNT_2_KEY_ID=rzp_live_xxxxx
RAZORPAY_ACCOUNT_2_KEY_SECRET=secret_xxxxx
RAZORPAY_ACCOUNT_2_LABEL=Secondary Account

# Razorpay Account 3 (Optional - add as many as needed)
RAZORPAY_ACCOUNT_3_KEY_ID=rzp_live_yyyyy
RAZORPAY_ACCOUNT_3_KEY_SECRET=secret_yyyyy
RAZORPAY_ACCOUNT_3_LABEL=Third Account

# Total number of Razorpay accounts configured
RAZORPAY_ACCOUNT_COUNT=3
```

**Note:** The admin panel will automatically detect and display all configured accounts!

## Database Setup

Add settings to your `settings` table for each account you configure. The system will automatically detect them.

```sql
-- Active Razorpay account selector (1, 2, 3, etc.)
INSERT INTO settings (`key`, `value`, `type`, `category`, `label`, `description`) 
VALUES ('active_razorpay_account', '1', 'text', 'payment', 'Active Razorpay Account', 'Currently active Razorpay payment gateway account')
ON DUPLICATE KEY UPDATE `value` = '1';

-- Account labels (add one for each account in your .env)
INSERT INTO settings (`key`, `value`, `type`, `category`, `label`, `description`) 
VALUES ('razorpay_account_1_label', 'Account 1', 'text', 'payment', 'Razorpay Account 1 Label', 'Custom label for Razorpay Account 1')
ON DUPLICATE KEY UPDATE `value` = 'Account 1';

INSERT INTO settings (`key`, `value`, `type`, `category`, `label`, `description`) 
VALUES ('razorpay_account_2_label', 'Account 2', 'text', 'payment', 'Razorpay Account 2 Label', 'Custom label for Razorpay Account 2')
ON DUPLICATE KEY UPDATE `value` = 'Account 2';

-- For Account 3, 4, 5, etc., add similar entries
-- INSERT INTO settings (`key`, `value`, `type`, `category`, `label`, `description`) 
-- VALUES ('razorpay_account_3_label', 'Account 3', 'text', 'payment', 'Razorpay Account 3 Label', 'Custom label for Razorpay Account 3')
-- ON DUPLICATE KEY UPDATE `value` = 'Account 3';
```

## How It Works

1. **Environment Variables**: Store Razorpay credentials securely (never in database)
2. **Database Setting**: Store only the active account number (1 or 2)
3. **Admin Panel**: Switch between accounts via Settings → Payment tab
4. **Payment API**: Dynamically loads credentials based on active account

## Security Notes

- ✅ Credentials are stored in ENV (secure)
- ✅ Only account selector is in database
- ✅ `key_secret` is never exposed to frontend
- ✅ Only `key_id` is sent to client for Razorpay checkout
