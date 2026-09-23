-- Replace single free_delivery with country-specific columns
-- Mirrors the existing pattern: price_aed/price_inr, available_aed/available_inr
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS free_delivery_aed BOOLEAN DEFAULT FALSE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS free_delivery_inr BOOLEAN DEFAULT FALSE;

-- Migrate any existing free_delivery = true to both countries
UPDATE product_variants SET free_delivery_aed = true, free_delivery_inr = true WHERE free_delivery = true;

-- Drop the old single column
ALTER TABLE product_variants DROP COLUMN IF EXISTS free_delivery;
