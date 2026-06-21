-- =========================================================
-- BaenTech Store - Database Definition Language (DDL)
-- =========================================================
-- Catatan:
-- 1. Project BaenTech menggunakan konsep microservices, sehingga setiap service
--    idealnya memiliki database sendiri.
-- 2. Jalankan bagian table sesuai database service masing-masing.
-- 3. Jika hanya untuk pemeriksaan struktur, file ini bisa dibaca sebagai satu
--    dokumen struktur database lengkap.
-- =========================================================

-- =========================================================
-- OPTIONAL: CREATE DATABASES
-- =========================================================
-- Jalankan sebagai user PostgreSQL yang punya akses CREATE DATABASE.
-- Jika database sudah dibuat, bagian ini boleh dilewati.

-- CREATE DATABASE baentech_auth_db;
-- CREATE DATABASE baentech_user_db;
-- CREATE DATABASE baentech_product_db;
-- CREATE DATABASE baentech_cart_db;
-- CREATE DATABASE baentech_order_db;
-- CREATE DATABASE baentech_payment_db;
-- CREATE DATABASE baentech_shipping_db;


-- =========================================================
-- DATABASE: baentech_auth_db
-- SERVICE : auth-service
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN,
    role VARCHAR(50) NOT NULL,
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'USER'))
);


-- =========================================================
-- DATABASE: baentech_user_db
-- SERVICE : user-service
-- =========================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone_number VARCHAR(255),
    profile_image_url TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);


-- =========================================================
-- DATABASE: baentech_product_db
-- SERVICE : product-service
-- =========================================================

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(255),
    image_url TEXT,
    price NUMERIC(19, 2) NOT NULL,
    stock INTEGER NOT NULL,
    warranty VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    category_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT chk_products_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'))
);

CREATE TABLE IF NOT EXISTS product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_product_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_product_reviews_rating
        CHECK (rating BETWEEN 1 AND 5)
);


-- =========================================================
-- DATABASE: baentech_cart_db
-- SERVICE : cart-service
-- =========================================================

CREATE TABLE IF NOT EXISTS carts (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    total_price NUMERIC(19, 2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_brand VARCHAR(255),
    product_image_url VARCHAR(255),
    price NUMERIC(19, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    sub_total NUMERIC(19, 2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    cart_id BIGINT,
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id)
        ON DELETE CASCADE
);


-- =========================================================
-- DATABASE: baentech_order_db
-- SERVICE : order-service
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    phone_number VARCHAR(255),
    shipping_address TEXT,
    city VARCHAR(255),
    province VARCHAR(255),
    postal_code VARCHAR(255),
    total_price NUMERIC(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT chk_orders_status
        CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_brand VARCHAR(255),
    product_image_url VARCHAR(255),
    price NUMERIC(19, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    sub_total NUMERIC(19, 2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    order_id BIGINT,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
);


-- =========================================================
-- DATABASE: baentech_payment_db
-- SERVICE : payment-service
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    payment_number VARCHAR(255) NOT NULL UNIQUE,
    amount NUMERIC(19, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    paid_at TIMESTAMP,
    gateway VARCHAR(30),
    gateway_order_id VARCHAR(150),
    gateway_invoice_id VARCHAR(150),
    redirect_url VARCHAR(1000),
    transaction_status VARCHAR(100),
    payment_type VARCHAR(100),
    payment_channel VARCHAR(100),
    payment_destination VARCHAR(100),
    raw_notification TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT chk_payments_method
        CHECK (payment_method IN ('BANK_TRANSFER', 'E_WALLET', 'QRIS', 'CREDIT_CARD', 'COD')),
    CONSTRAINT chk_payments_status
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'))
);


-- =========================================================
-- DATABASE: baentech_shipping_db
-- SERVICE : shiping-serive
-- =========================================================

CREATE TABLE IF NOT EXISTS shippings (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    order_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    phone_number VARCHAR(255),
    shipping_address TEXT,
    city VARCHAR(255),
    province VARCHAR(255),
    postal_code VARCHAR(255),
    courier VARCHAR(255),
    tracking_number VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    shipped_at TIMESTAMP,
    estimated_delivery_at TIMESTAMP,
    delivered_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT chk_shippings_status
        CHECK (status IN ('PENDING', 'SHIPPED', 'DELIVERED', 'RECEIVED', 'CANCELLED'))
);
