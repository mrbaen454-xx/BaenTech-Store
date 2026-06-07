# BaenTech Store

BaenTech Store adalah aplikasi e-commerce toko elektronik berbasis microservices menggunakan Java Spring Boot.

Project ini dibuat untuk mengelola proses e-commerce mulai dari autentikasi user, manajemen produk, profil user, keranjang belanja, checkout order, sampai simulasi pembayaran.

## Tech Stack

- Java Spring Boot
- Spring Cloud Eureka
- Spring Cloud Gateway
- Spring Security JWT
- Spring Data JPA
- PostgreSQL
- Maven
- WebClient
- Lombok
- Validation

## Architecture

Project ini menggunakan arsitektur microservices.

```text
Frontend / Postman
        ↓
Gateway Service
        ↓
Microservices

 Services

discovery-service  → Service registry Eureka
gateway-service    → API Gateway
auth-service       → Authentication dan JWT
product-service    → Category dan Product
user-service       → Profile dan Address
cart-service       → Cart dan Cart Item
order-service      → Checkout dan Order
payment-service    → Payment simulation

Service Ports

discovery-service  : 8761
gateway-service    : 8080
auth-service       : 8081
product-service    : 8082
user-service       : 8083
cart-service       : 8084
order-service      : 8085
payment-service    : 8086

Databases

baentech_auth_db
baentech_product_db
baentech_user_db
baentech_cart_db
baentech_order_db
baentech_payment_db

Current Features

Auth Service
Register user
Login user
Generate JWT token
Role enum: ADMIN dan USER
Get current user
Admin seeder
Product Service
CRUD category
CRUD product
Search product
Filter product by category
Filter product by brand
Upload product image
Public access for GET products and categories
ADMIN access for create, update, delete
User Service
Create or update profile
Get my profile
Create address
Get my addresses
Get address by ID
Update address
Set main address
Delete address
Cart Service
Add item to cart
Get my cart
Update cart item quantity
Delete cart item
Clear cart
Cart-service mengambil detail produk dari product-service
Order Service
Checkout from cart
Get my orders
Get order by ID
Admin get all orders
Admin update order status
Cancel order
Order-service mengambil isi cart dari cart-service
Cart otomatis dikosongkan setelah checkout berhasil
Payment Service
Create payment from order
Get my payments
Get payment by ID
Get payment by order ID
Admin get all payments
Simulate payment success
Simulate payment failed
Cancel payment
Payment-service terhubung dengan order-service
Jika payment success, order status berubah menjadi PAID

Main Flow

1. User register/login
2. User melihat produk
3. User menambahkan produk ke cart
4. Cart-service mengambil detail produk dari product-service
5. User checkout order
6. Order-service mengambil isi cart dari cart-service
7. Order dibuat dengan status PENDING_PAYMENT
8. User membuat payment
9. Payment-service mengambil detail order dari order-service
10. Payment success
11. Payment-service mengubah order status menjadi PAID

Order Status

PENDING_PAYMENT
PAID
PROCESSING
SHIPPED
COMPLETED
CANCELLED

Payment Status

PENDING
SUCCESS
FAILED
EXPIRED
CANCELLED

Payment Method

BANK_TRANSFER
E_WALLET
QRIS
CREDIT_CARD
COD

API Gateway Routes

/api/auth/**       → auth-service
/api/products/**   → product-service
/api/categories/** → product-service
/api/users/**      → user-service
/api/addresses/**  → user-service
/api/carts/**      → cart-service
/api/orders/**     → order-service
/api/payments/**   → payment-service


How to Run

Jalankan service secara berurutan:

1. discovery-service
2. gateway-service
3. auth-service
4. product-service
5. user-service
6. cart-service
7. order-service
8. payment-service

Pastikan semua service muncul di Eureka:

http://localhost:8761
Example Test Flow
Login User
POST http://localhost:8081/api/auth/login
Add Item To Cart
POST http://localhost:8084/api/carts/items
Checkout Order
POST http://localhost:8085/api/orders/checkout
Create Payment
POST http://localhost:8086/api/payments/create
Payment Success
PUT http://localhost:8086/api/payments/{id}/success


Notes

Payment-service saat ini masih menggunakan simulasi pembayaran. Ke depannya service ini dapat dikembangkan untuk integrasi payment gateway seperti Midtrans Sandbox.