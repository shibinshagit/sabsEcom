-- -- Ensure all tables exist with proper relationships and constraints

-- -- Update orders table with better structure
-- CREATE TABLE IF NOT EXISTS orders (
--     id SERIAL PRIMARY KEY,
--     customer_name VARCHAR(200) NOT NULL,
--     customer_email VARCHAR(200),
--     customer_phone VARCHAR(50) NOT NULL,
--     order_type VARCHAR(50) DEFAULT 'dine-in', -- dine-in, takeaway, delivery
--     table_number INTEGER,
--     delivery_address TEXT,
--     total_amount DECIMAL(10,2) NOT NULL,
--     tax_amount DECIMAL(10,2) DEFAULT 0,
--     delivery_fee DECIMAL(10,2) DEFAULT 0,
--     final_total DECIMAL(10,2) NOT NULL,
--     status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
--     special_instructions TEXT,
--     estimated_completion_time TIMESTAMP,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Update order_items table
-- CREATE TABLE IF NOT EXISTS order_items (
--     id SERIAL PRIMARY KEY,
--     order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
--     menu_item_id INTEGER REFERENCES menu_items(id),
--     menu_item_name VARCHAR(200) NOT NULL, -- Store name for historical purposes
--     quantity INTEGER NOT NULL,
--     unit_price DECIMAL(10,2) NOT NULL,
--     total_price DECIMAL(10,2) NOT NULL,
--     special_requests TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Update reservations table with better structure
-- CREATE TABLE IF NOT EXISTS reservations (
--     id SERIAL PRIMARY KEY,
--     customer_name VARCHAR(200) NOT NULL,
--     customer_email VARCHAR(200),
--     customer_phone VARCHAR(50) NOT NULL,
--     party_size INTEGER NOT NULL CHECK (party_size > 0),
--     reservation_date DATE NOT NULL,
--     reservation_time TIME NOT NULL,
--     status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no-show
--     special_requests TEXT,
--     table_preference VARCHAR(100), -- window, private, etc.
--     occasion VARCHAR(100), -- birthday, anniversary, etc.
--     dietary_restrictions TEXT,
--     confirmation_code VARCHAR(20) UNIQUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create customers table for better customer management
-- CREATE TABLE IF NOT EXISTS customers (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(200) NOT NULL,
--     email VARCHAR(200) UNIQUE,
--     phone VARCHAR(50),
--     date_of_birth DATE,
--     preferences TEXT,
--     dietary_restrictions TEXT,
--     total_orders INTEGER DEFAULT 0,
--     total_spent DECIMAL(10,2) DEFAULT 0,
--     last_visit TIMESTAMP,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
-- CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
-- CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_email);
-- CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date, reservation_time);
-- CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
-- CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_email);
-- CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- -- Insert sample data for testing
-- INSERT INTO orders (customer_name, customer_email, customer_phone, order_type, total_amount, tax_amount, final_total, status) VALUES
-- ('John Smith', 'john@example.com', '+1-555-0101', 'dine-in', 85.00, 7.23, 92.23, 'completed'),
-- ('Sarah Johnson', 'sarah@example.com', '+1-555-0102', 'takeaway', 45.50, 3.87, 49.37, 'ready'),
-- ('Mike Davis', 'mike@example.com', '+1-555-0103', 'delivery', 67.25, 5.72, 76.96, 'preparing'),
-- ('Emily Wilson', 'emily@example.com', '+1-555-0104', 'dine-in', 120.00, 10.20, 130.20, 'pending')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO reservations (customer_name, customer_email, customer_phone, party_size, reservation_date, reservation_time, status, confirmation_code) VALUES
-- ('Robert Brown', 'robert@example.com', '+1-555-0201', 4, CURRENT_DATE + INTERVAL '1 day', '19:00:00', 'confirmed', 'RES001'),
-- ('Lisa Garcia', 'lisa@example.com', '+1-555-0202', 2, CURRENT_DATE + INTERVAL '2 days', '20:30:00', 'pending', 'RES002'),
-- ('David Miller', 'david@example.com', '+1-555-0203', 6, CURRENT_DATE + INTERVAL '3 days', '18:00:00', 'confirmed', 'RES003'),
-- ('Anna Taylor', 'anna@example.com', '+1-555-0204', 3, CURRENT_DATE, '19:30:00', 'completed', 'RES004')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO customers (name, email, phone, total_orders, total_spent, last_visit) VALUES
-- ('John Smith', 'john@example.com', '+1-555-0101', 5, 425.50, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- ('Sarah Johnson', 'sarah@example.com', '+1-555-0102', 3, 156.75, CURRENT_TIMESTAMP - INTERVAL '1 week'),
-- ('Mike Davis', 'mike@example.com', '+1-555-0103', 2, 134.21, CURRENT_TIMESTAMP - INTERVAL '3 days'),
-- ('Emily Wilson', 'emily@example.com', '+1-555-0104', 1, 130.20, CURRENT_TIMESTAMP)
-- ON CONFLICT (email) DO NOTHING;
