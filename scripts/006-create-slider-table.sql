-- -- Create slider table for homepage hero slider
-- CREATE TABLE IF NOT EXISTS slider_content (
--     id SERIAL PRIMARY KEY,
--     title VARCHAR(500) NOT NULL,
--     subtitle VARCHAR(500),
--     image_url TEXT NOT NULL,
--     button_text VARCHAR(100),
--     button_link VARCHAR(200),
--     is_active BOOLEAN DEFAULT true,
--     sort_order INTEGER DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Insert default slider content
-- INSERT INTO slider_content (title, subtitle, image_url, button_text, button_link, is_active, sort_order) VALUES
-- ('Culinary Excellence Redefined', 'Experience the finest dining in an atmosphere of luxury and sophistication', '/placeholder.svg?height=800&width=1200', 'Explore Menu', '/menu', true, 1),
-- ('Artistry on Every Plate', 'Where passion meets precision in every carefully crafted dish', '/placeholder.svg?height=800&width=1200', 'View Menu', '/menu', true, 2),
-- ('Curated Wine Selection', 'Discover the perfect pairing for your extraordinary dining experience', '/placeholder.svg?height=800&width=1200', 'Book Table', '/reservations', true, 3)
-- ON CONFLICT DO NOTHING;
