-- ============================================
-- Welcome Coupons (Master Table)
-- ============================================
CREATE TABLE IF NOT EXISTS welcome_coupons (
    id SERIAL PRIMARY KEY,

    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,

    -- discount flat | percentage
    discount_type VARCHAR(20) NOT NULL DEFAULT 'flat',
    
    discount_value_inr NUMERIC(10,2),
    discount_value_aed NUMERIC(10,2),

    -- maximum cap (for percentage type) - optional
    max_purchase_inr NUMERIC(10,2),
    max_purchase_aed NUMERIC(10,2),

    -- shop/location specific minimum orders
    minimum_purchase_inr NUMERIC(10,2) DEFAULT 0,
    minimum_purchase_aed NUMERIC(10,2) DEFAULT 0,

    -- apply only to: all | new | returning
    user_type_restriction VARCHAR(20) DEFAULT 'all',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- Track per-user coupon assignment + usage
-- (Each user can only have ONE welcome coupon)
-- ============================================
CREATE TABLE IF NOT EXISTS welcome_coupons_used (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    welcome_coupon_id INTEGER NOT NULL REFERENCES welcome_coupons(id) ON DELETE CASCADE,

    is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
    redeemed_at TIMESTAMP,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, welcome_coupon_id)
);


-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_welcome_coupons_used_user 
    ON welcome_coupons_used(user_id);

CREATE INDEX IF NOT EXISTS idx_welcome_coupons_used_coupon 
    ON welcome_coupons_used(welcome_coupon_id);

CREATE INDEX IF NOT EXISTS idx_welcome_coupons_active 
    ON welcome_coupons(is_active);

CREATE INDEX IF NOT EXISTS idx_welcome_coupons_code 
    ON welcome_coupons(code);

