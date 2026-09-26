INSERT INTO categories (name, slug, description) VALUES
  ('Home', 'home', 'Thoughtful objects for a considered home.'),
  ('Accessories', 'accessories', 'Everyday pieces, made to last.'),
  ('Electronics', 'electronics', 'Useful technology for work and play.'),
  ('Lifestyle', 'lifestyle', 'Small essentials for the everyday.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO products (category_id, name, description, price, stock, image_url, rating, popularity, is_new, is_featured)
SELECT c.id, p.name, p.description, p.price, p.stock, p.image_url, p.rating, p.popularity, p.is_new, p.is_featured
FROM (VALUES
  ('Home', 'Arc table lamp', 'A soft pool of light, sculpted in brushed metal. Made for slow mornings and later nights.', 84.00, 18, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', 4.9, 98, TRUE, TRUE),
  ('Accessories', 'Everyday leather tote', 'A considered carryall in supple leather, with room for all the pieces that make a day.', 128.00, 12, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85', 4.8, 91, FALSE, TRUE),
  ('Electronics', 'Studio headphones', 'Detailed, immersive sound with an easy fit designed to stay with you all day.', 196.00, 24, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', 4.7, 89, TRUE, TRUE),
  ('Home', 'Cloud knit throw', 'A substantial, brushed cotton layer with a quiet texture and a little extra warmth.', 112.00, 9, 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=900&q=85', 4.9, 87, FALSE, FALSE),
  ('Lifestyle', 'Daily carry bottle', 'A double-wall stainless bottle that keeps the good stuff cold through the long way home.', 38.00, 42, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85', 4.6, 83, TRUE, FALSE),
  ('Home', 'Form ceramic set', 'A small-batch set of everyday ceramics, each piece made to feel right in your hands.', 64.00, 16, 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85', 4.8, 80, FALSE, FALSE),
  ('Accessories', 'Canvas weekend bag', 'A durable canvas weekender that packs flat, travels light, and wears in beautifully.', 94.00, 7, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 4.7, 77, FALSE, FALSE),
  ('Accessories', 'Field watch', 'A clean dial, a dependable movement, and a strap that only gets better with time.', 225.00, 5, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85', 4.9, 75, TRUE, FALSE)
) AS p(category, name, description, price, stock, image_url, rating, popularity, is_new, is_featured)
JOIN categories c ON c.name = p.category
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE existing.name = p.name);
