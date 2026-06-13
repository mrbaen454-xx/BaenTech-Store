# BaenTech Store

BaenTech Store adalah aplikasi e-commerce toko elektronik berbasis **Java Spring Boot Microservices**. Project ini dibuat untuk mengelola proses belanja online mulai dari autentikasi user, manajemen produk, keranjang, checkout, pembayaran, pengiriman barang, notifikasi email, sampai laporan penjualan dalam bentuk Excel.

## Tech Stack

* Java 21
* Spring Boot
* Spring Cloud Netflix Eureka
* Spring Cloud Gateway
* Spring Security
* JWT Authentication
* PostgreSQL
* WebClient
* Spring Mail
* Apache POI Excel
* Maven
* Lombok

## Architecture

Project ini menggunakan arsitektur microservices. Setiap service memiliki tanggung jawab masing-masing dan saling berkomunikasi menggunakan REST API melalui Eureka Service Discovery.

```text
Client / Postman / Frontend
        |
        v
Gateway Service
        |
        v
Microservices:
- Auth Service
- Product Service
- User Service
- Cart Service
- Order Service
- Payment Service
- Shipping Service
- Notification Service
- Report Service
```

## Project Structure

```text
BaenTech-Store/
├── backend/
│   ├── discovery-service/
│   ├── gateway-service/
│   ├── auth-service/
│   ├── product-service/
│   ├── user-service/
│   ├── cart-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── shipping-service/
│   ├── notification-service/
│   └── report-service/
│
├── database/
├── docs/
├── frontend/
├── README.md
└── .gitignore
```

## Services and Ports

| Service              | Port | Description                                 |
| -------------------- | ---: | ------------------------------------------- |
| Discovery Service    | 8761 | Eureka Server untuk service registry        |
| Gateway Service      | 8080 | API Gateway untuk routing semua service     |
| Auth Service         | 8081 | Login, register, JWT, role user/admin       |
| Product Service      | 8082 | CRUD produk, kategori, upload gambar, stock |
| User Service         | 8083 | Profile user dan alamat pengiriman          |
| Cart Service         | 8084 | Keranjang belanja user                      |
| Order Service        | 8085 | Checkout dan manajemen order                |
| Payment Service      | 8086 | Simulasi pembayaran                         |
| Shipping Service     | 8087 | Pengiriman, resi, scheduler delivered       |
| Notification Service | 8088 | Kirim email otomatis                        |
| Report Service       | 8089 | Laporan dan export Excel                    |

## Database

Project ini menggunakan PostgreSQL. Setiap service utama memiliki database sendiri.

```sql
CREATE DATABASE baentech_auth_db;
CREATE DATABASE baentech_product_db;
CREATE DATABASE baentech_user_db;
CREATE DATABASE baentech_cart_db;
CREATE DATABASE baentech_order_db;
CREATE DATABASE baentech_payment_db;
CREATE DATABASE baentech_shipping_db;
```

Notification Service dan Report Service versi saat ini tidak wajib menggunakan database.

## Main Features

### Auth Service

* Register user
* Login user/admin
* Generate JWT token
* Role based access: `USER` dan `ADMIN`
* Get current user
* Auto admin seeder
* Kirim email welcome setelah register melalui Notification Service

### Product Service

* CRUD kategori
* CRUD produk
* Search produk
* Filter produk berdasarkan kategori dan brand
* Upload gambar produk
* Public access untuk melihat produk
* Admin access untuk tambah, update, hapus produk
* Reduce stock setelah pembayaran berhasil

### User Service

* Create/update profile
* Get profile
* CRUD alamat user
* Set alamat utama
* Delete alamat

### Cart Service

* Add product to cart
* Get cart user
* Update quantity item
* Delete item cart
* Clear cart
* Mengambil detail produk dari Product Service

### Order Service

* Checkout dari cart
* Get my orders
* Get order detail
* Admin get all orders
* Update status order
* Cancel order
* Complete order setelah user confirm received
* Kirim email order berhasil dibuat melalui Notification Service

### Payment Service

* Create payment dari order
* Get payment user
* Get payment by order
* Admin get all payments
* Payment success
* Payment failed
* Cancel payment
* Update order menjadi `PAID` setelah payment success
* Reduce stock produk setelah payment success
* Kirim email payment success dan payment failed

### Shipping Service

* Create shipping untuk order yang sudah `PAID`
* Admin input kurir, nomor resi, dan lama pengiriman
* Status shipping:

  * `PENDING`
  * `SHIPPED`
  * `DELIVERED`
  * `RECEIVED`
  * `CANCELLED`
* Scheduler otomatis mengubah status `SHIPPED` menjadi `DELIVERED` jika estimasi sampai sudah lewat
* User confirm received
* Update order menjadi `COMPLETED`
* Kirim email:

  * Barang sedang dikirim
  * Barang sudah sampai
  * Pesanan selesai

### Notification Service

Notification Service digunakan sebagai service pusat untuk mengirim email dari service lain.

Email yang sudah terintegrasi:

* Welcome email setelah register
* Order created email setelah checkout
* Payment success email
* Payment failed email
* Shipping shipped email
* Shipping delivered email
* Order completed email

Endpoint utama:

```text
POST /api/notifications/send-email
```

Example body:

```json
{
  "to": "user@example.com",
  "subject": "Test Email BaenTech Store",
  "message": "Halo, ini adalah email dari BaenTech Store."
}
```

### Report Service

Report Service digunakan untuk melihat laporan dari order, payment, dan shipping.

Fitur:

* Summary dashboard report
* Order report
* Payment report
* Filter laporan berdasarkan tanggal
* Export order report ke Excel
* Export payment report ke Excel

Endpoints:

```text
GET /api/reports/summary
GET /api/reports/orders
GET /api/reports/orders?startDate=2026-06-01&endDate=2026-06-30
GET /api/reports/payments
GET /api/reports/payments?startDate=2026-06-01&endDate=2026-06-30
GET /api/reports/orders/export-excel
GET /api/reports/payments/export-excel
```

## API Gateway Routes

Gateway Service menjalankan routing ke semua microservices.

```text
/api/auth/**           -> AUTH-SERVICE
/api/products/**       -> PRODUCT-SERVICE
/api/categories/**     -> PRODUCT-SERVICE
/api/users/**          -> USER-SERVICE
/api/addresses/**      -> USER-SERVICE
/api/carts/**          -> CART-SERVICE
/api/orders/**         -> ORDER-SERVICE
/api/payments/**       -> PAYMENT-SERVICE
/api/shippings/**      -> SHIPPING-SERVICE
/api/notifications/**  -> NOTIFICATION-SERVICE
/api/reports/**        -> REPORT-SERVICE
```

## Main Flow

### Register Flow

```text
User register
-> Auth Service menyimpan user
-> Auth Service memanggil Notification Service
-> User menerima welcome email
```

### Checkout Flow

```text
User add product to cart
-> User checkout
-> Order Service mengambil data cart dari Cart Service
-> Order dibuat dengan status PENDING_PAYMENT
-> Cart dikosongkan
-> Email order created dikirim ke user
```

### Payment Flow

```text
User create payment
-> Admin/user melakukan simulasi payment success
-> Payment status menjadi SUCCESS
-> Order status menjadi PAID
-> Product stock berkurang
-> Email payment success dikirim ke user
```

### Shipping Flow

```text
Admin create shipping dari order PAID
-> Status shipping PENDING
-> Admin ship order dan isi kurir, resi, delivery days
-> Status shipping SHIPPED
-> Email barang sedang dikirim
-> Scheduler cek estimatedDeliveryAt
-> Jika waktu sudah lewat, status menjadi DELIVERED
-> Email barang sudah sampai
-> User confirm received
-> Status shipping RECEIVED
-> Order status COMPLETED
-> Email pesanan selesai
```

### Report Flow

```text
Admin request report
-> Report Service mengambil data dari Order Service
-> Report Service mengambil data dari Payment Service
-> Report Service mengambil data dari Shipping Service
-> Report Service menghitung summary atau export Excel
```

## Authentication and Authorization

Project ini menggunakan JWT.

Role:

```text
USER
ADMIN
```

Akses umum:

* `USER` dapat register, login, melihat produk, mengelola cart, checkout, payment, melihat order sendiri, dan confirm received.
* `ADMIN` dapat mengelola produk, melihat semua order, update status order, mengelola shipping, melihat report, dan export Excel.

Header Authorization:

```text
Authorization: Bearer <TOKEN>
```

## Environment Configuration

Contoh konfigurasi email di Notification Service:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

Jangan menyimpan Gmail App Password langsung di repository public.

## How to Run

Jalankan service secara berurutan:

```text
1. discovery-service
2. gateway-service
3. auth-service
4. product-service
5. user-service
6. cart-service
7. order-service
8. payment-service
9. shipping-service
10. notification-service
11. report-service
```

Atau minimal jalankan service yang dibutuhkan sesuai flow yang ingin dites.

Setelah semua service berjalan, buka Eureka Dashboard:

```text
http://localhost:8761
```

Pastikan semua service sudah terdaftar.

## Example Gateway Access

```text
http://localhost:8080/api/auth/login
http://localhost:8080/api/products
http://localhost:8080/api/carts
http://localhost:8080/api/orders/checkout
http://localhost:8080/api/payments/create
http://localhost:8080/api/shippings/admin
http://localhost:8080/api/reports/summary
```

## Report Export

Export order report:

```text
GET /api/reports/orders/export-excel
```

Export payment report:

```text
GET /api/reports/payments/export-excel
```

Gunakan Postman dengan fitur:

```text
Send and Download
```

## Git Notes

Sebelum push ke GitHub, pastikan file sensitif tidak ikut ter-push:

```text
application.properties yang berisi password asli
Gmail App Password
JWT secret production
file upload lokal
target/
.env
```

Contoh `.gitignore`:

```gitignore
target/
*.log
.env
.env.*
uploads/
.idea/
.vscode/
.DS_Store

# Maven wrapper jar cache
.mvn/wrapper/maven-wrapper.jar

# Sensitive config backup
application-local.properties
application-secret.properties
```

## Project Status

Backend microservices yang sudah dibuat:

* Discovery Service
* Gateway Service
* Auth Service
* Product Service
* User Service
* Cart Service
* Order Service
* Payment Service
* Shipping Service
* Notification Service
* Report Service

Status fitur utama:

* Register dan login JWT
* Email welcome register
* CRUD product dan category
* Upload image product
* Cart
* Checkout order
* Payment success/failed
* Stock reduction
* Shipping scheduler
* Email notification
* Report summary
* Export Excel

## Author

Developed by M Saroni for BaenTech Store backend microservices project.
