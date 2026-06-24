-- =========================================================
-- BaenTech Store - Data Manipulation Language (DML)
-- =========================================================
-- Catatan:
-- 1. Project menggunakan microservices, sehingga data sample dibagi per database.
-- 2. Jalankan bagian INSERT sesuai database service masing-masing.
-- 3. Jika hanya untuk pemeriksaan, file ini berisi contoh data lengkap.
-- 4. Password sample auth-service untuk semua akun: password
-- =========================================================


-- =========================================================
-- DATABASE: baentech_auth_db
-- SERVICE : auth-service
-- =========================================================

TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (full_name, email, password, enabled, role) VALUES
('Admin BaenTech', 'admin@baentech.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 'ADMIN'),
('M Saroni', 'saroni@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 'USER'),
('Asep Nugraha', 'asep@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 'USER'),
('Siti Aminah', 'siti@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 'USER'),
('Budi Santoso', 'budi@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 'USER');


-- =========================================================
-- DATABASE: baentech_user_db
-- SERVICE : user-service
-- =========================================================

TRUNCATE TABLE user_profiles RESTART IDENTITY CASCADE;

INSERT INTO user_profiles (email, full_name, phone_number, profile_image_url, created_at, updated_at) VALUES
('saroni@example.com', 'M Saroni', '081234567890', NULL, NOW(), NOW()),
('asep@example.com', 'Asep Nugraha', '081234567891', NULL, NOW(), NOW()),
('siti@example.com', 'Siti Aminah', '081234567892', NULL, NOW(), NOW()),
('budi@example.com', 'Budi Santoso', '081234567893', NULL, NOW(), NOW()),
('admin@baentech.com', 'Admin BaenTech', '081234567899', NULL, NOW(), NOW());


-- =========================================================
-- DATABASE: baentech_product_db
-- SERVICE : product-service
-- =========================================================

TRUNCATE TABLE product_reviews RESTART IDENTITY CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Laptop', 'Kategori laptop untuk kuliah, kerja, desain, dan gaming', NOW(), NOW()),
('Smartphone', 'Kategori smartphone Android dan iOS', NOW(), NOW()),
('Accessories', 'Aksesoris teknologi seperti mouse, keyboard, dan charger', NOW(), NOW()),
('Monitor', 'Monitor untuk kerja, desain, dan gaming', NOW(), NOW()),
('Audio', 'Perangkat audio seperti headset, speaker, dan earbuds', NOW(), NOW());

INSERT INTO products
(name, description, brand, image_url, price, stock, warranty, status, category_id, created_at, updated_at)
VALUES
('Lenovo IdeaPad Slim 3', 'Laptop ringan untuk kuliah, kerja, browsing, dan kebutuhan harian.', 'Lenovo', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop', 7499000, 15, '1 Tahun Garansi Resmi', 'ACTIVE', 1, NOW(), NOW()),
('ASUS VivoBook 14', 'Laptop stylish dengan performa stabil untuk multitasking dan produktivitas.', 'ASUS', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900&auto=format&fit=crop', 8299000, 12, '1 Tahun Garansi Resmi', 'ACTIVE', 1, NOW(), NOW()),
('MacBook Air M1', 'Laptop tipis dengan chip Apple M1, cocok untuk kerja, desain ringan, dan belajar coding.', 'Apple', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop', 12999000, 8, '1 Tahun Garansi Resmi', 'ACTIVE', 1, NOW(), NOW()),
('iPhone 13 128GB', 'Smartphone iOS dengan kamera jernih, performa cepat, dan desain premium.', 'Apple', 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop', 9499000, 10, '1 Tahun Garansi Resmi', 'ACTIVE', 2, NOW(), NOW()),
('Samsung Galaxy A55 5G', 'Smartphone 5G dengan layar Super AMOLED dan baterai tahan lama.', 'Samsung', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&auto=format&fit=crop', 5999000, 20, '1 Tahun Garansi Resmi', 'ACTIVE', 2, NOW(), NOW()),
('Logitech MX Master 3S', 'Mouse wireless premium untuk produktivitas, desain ergonomis, dan scroll presisi.', 'Logitech', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=900&auto=format&fit=crop', 1399000, 25, '1 Tahun Garansi Resmi', 'ACTIVE', 3, NOW(), NOW()),
('Keychron K2 Mechanical Keyboard', 'Keyboard mechanical wireless dengan layout compact dan feel mengetik nyaman.', 'Keychron', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&auto=format&fit=crop', 1299000, 18, '1 Tahun Garansi Toko', 'ACTIVE', 3, NOW(), NOW()),
('LG UltraGear 24 Inch 144Hz', 'Monitor gaming 24 inch dengan refresh rate 144Hz dan tampilan tajam.', 'LG', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=900&auto=format&fit=crop', 2499000, 9, '3 Tahun Garansi Resmi', 'ACTIVE', 4, NOW(), NOW()),
('Sony WH-1000XM4', 'Headphone wireless noise cancelling dengan kualitas audio premium.', 'Sony', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop', 3999000, 11, '1 Tahun Garansi Resmi', 'ACTIVE', 5, NOW(), NOW()),
('JBL Flip 6 Portable Speaker', 'Speaker bluetooth portable dengan suara bass kuat dan desain tahan air.', 'JBL', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&auto=format&fit=crop', 1899000, 16, '1 Tahun Garansi Resmi', 'ACTIVE', 5, NOW(), NOW());

INSERT INTO product_reviews (product_id, email, user_name, rating, comment, created_at, updated_at) VALUES
(1, 'saroni@example.com', 'M Saroni', 5, 'Laptopnya ringan dan cocok untuk kuliah.', NOW(), NOW()),
(2, 'asep@example.com', 'Asep Nugraha', 4, 'Performa bagus untuk kerja harian.', NOW(), NOW()),
(4, 'siti@example.com', 'Siti Aminah', 5, 'Kamera bagus dan performanya cepat.', NOW(), NOW()),
(6, 'budi@example.com', 'Budi Santoso', 5, 'Mouse nyaman dipakai lama.', NOW(), NOW()),
(9, 'saroni@example.com', 'M Saroni', 4, 'Noise cancelling mantap untuk belajar dan kerja.', NOW(), NOW());


-- =========================================================
-- DATABASE: baentech_cart_db
-- SERVICE : cart-service
-- =========================================================

TRUNCATE TABLE cart_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE carts RESTART IDENTITY CASCADE;

INSERT INTO carts (email, total_price, created_at, updated_at) VALUES
('saroni@example.com', 8798000, NOW(), NOW()),
('asep@example.com', 2499000, NOW(), NOW());

INSERT INTO cart_items
(product_id, product_name, product_brand, product_image_url, price, quantity, sub_total, created_at, updated_at, cart_id)
VALUES
(1, 'Lenovo IdeaPad Slim 3', 'Lenovo', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop', 7499000, 1, 7499000, NOW(), NOW(), 1),
(7, 'Keychron K2 Mechanical Keyboard', 'Keychron', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&auto=format&fit=crop', 1299000, 1, 1299000, NOW(), NOW(), 1),
(8, 'LG UltraGear 24 Inch 144Hz', 'LG', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=900&auto=format&fit=crop', 2499000, 1, 2499000, NOW(), NOW(), 2);


-- =========================================================
-- DATABASE: baentech_order_db
-- SERVICE : order-service
-- =========================================================

TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;

INSERT INTO orders
(order_number, email, recipient_name, phone_number, shipping_address, city, province, postal_code, total_price, status, created_at, updated_at)
VALUES
('ORD-20260621-0001', 'saroni@example.com', 'M Saroni', '081234567890', 'Kp. Cipongkor RT 01 RW 02', 'Kabupaten Bandung Barat', 'Jawa Barat', '40564', 8798000, 'PENDING_PAYMENT', NOW(), NOW()),
('ORD-20260621-0002', 'asep@example.com', 'Asep Nugraha', '081234567891', 'Jl. Cibaduyut No. 10', 'Bandung', 'Jawa Barat', '40236', 2499000, 'SHIPPED', NOW(), NOW()),
('ORD-20260621-0003', 'siti@example.com', 'Siti Aminah', '081234567892', 'Jl. Asia Afrika No. 20', 'Bandung', 'Jawa Barat', '40111', 9499000, 'COMPLETED', NOW(), NOW());

INSERT INTO order_items
(product_id, product_name, product_brand, product_image_url, price, quantity, sub_total, created_at, updated_at, order_id)
VALUES
(1, 'Lenovo IdeaPad Slim 3', 'Lenovo', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop', 7499000, 1, 7499000, NOW(), NOW(), 1),
(7, 'Keychron K2 Mechanical Keyboard', 'Keychron', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&auto=format&fit=crop', 1299000, 1, 1299000, NOW(), NOW(), 1),
(8, 'LG UltraGear 24 Inch 144Hz', 'LG', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=900&auto=format&fit=crop', 2499000, 1, 2499000, NOW(), NOW(), 2),
(4, 'iPhone 13 128GB', 'Apple', 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop', 9499000, 1, 9499000, NOW(), NOW(), 3);


-- =========================================================
-- DATABASE: baentech_payment_db
-- SERVICE : payment-service
-- =========================================================

TRUNCATE TABLE payments RESTART IDENTITY CASCADE;

INSERT INTO payments
(order_id, order_number, email, payment_number, amount, payment_method, status, paid_at, gateway, gateway_order_id, gateway_invoice_id, redirect_url, transaction_status, payment_type, payment_channel, payment_destination, raw_notification, created_at, updated_at)
VALUES
(1, 'ORD-20260621-0001', 'saroni@example.com', 'PAY-20260621-0001', 8798000, 'QRIS', 'PENDING', NULL, 'XENDIT', 'ORD-20260621-0001', 'INV-EXAMPLE-001', 'https://checkout-staging.xendit.co/example-001', 'PENDING', 'QRIS', 'QRIS', NULL, NULL, NOW(), NOW()),
(2, 'ORD-20260621-0002', 'asep@example.com', 'PAY-20260621-0002', 2499000, 'E_WALLET', 'SUCCESS', NOW(), 'XENDIT', 'ORD-20260621-0002', 'INV-EXAMPLE-002', 'https://checkout-staging.xendit.co/example-002', 'PAID', 'EWALLET', 'OVO', NULL, NULL, NOW(), NOW()),
(3, 'ORD-20260621-0003', 'siti@example.com', 'PAY-20260621-0003', 9499000, 'BANK_TRANSFER', 'SUCCESS', NOW(), 'XENDIT', 'ORD-20260621-0003', 'INV-EXAMPLE-003', 'https://checkout-staging.xendit.co/example-003', 'PAID', 'BANK_TRANSFER', 'BCA', '1234567890', NULL, NOW(), NOW());


-- =========================================================
-- DATABASE: baentech_shipping_db
-- SERVICE : shiping-serive
-- =========================================================

TRUNCATE TABLE shippings RESTART IDENTITY CASCADE;

INSERT INTO shippings
(order_id, order_number, email, recipient_name, phone_number, shipping_address, city, province, postal_code, courier, tracking_number, status, shipped_at, estimated_delivery_at, delivered_at, received_at, created_at, updated_at)
VALUES
(2, 'ORD-20260621-0002', 'asep@example.com', 'Asep Nugraha', '081234567891', 'Jl. Cibaduyut No. 10', 'Bandung', 'Jawa Barat', '40236', 'JNE', 'JNE123456789', 'SHIPPED', NOW(), NOW() + INTERVAL '3 days', NULL, NULL, NOW(), NOW()),
(3, 'ORD-20260621-0003', 'siti@example.com', 'Siti Aminah', '081234567892', 'Jl. Asia Afrika No. 20', 'Bandung', 'Jawa Barat', '40111', 'J&T Express', 'JT987654321', 'RECEIVED', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW(), NOW(), NOW());
