# BaenTech Store

BaenTech Store adalah aplikasi **e-commerce toko teknologi/elektronik** berbasis **React Frontend** dan **Java Spring Boot Microservices**. Project ini dibuat untuk mengelola proses belanja online mulai dari autentikasi user, manajemen produk, keranjang, checkout, pembayaran Xendit, pengiriman barang, ulasan produk, sampai laporan penjualan untuk admin.

Project ini disusun untuk kebutuhan pembelajaran, portofolio, dan presentasi akhir project. Struktur project dipisahkan antara frontend, backend microservices, database script, dokumentasi, dan file persiapan deploy.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Folder](#struktur-folder)
- [Daftar Service dan Port](#daftar-service-dan-port)
- [Database](#database)
- [Alur Sistem](#alur-sistem)
- [Role dan Hak Akses](#role-dan-hak-akses)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Cara Menjalankan Project Lokal](#cara-menjalankan-project-lokal)
- [Endpoint Utama](#endpoint-utama)
- [Catatan Docker dan Deploy](#catatan-docker-dan-deploy)
- [File Pengumpulan Project](#file-pengumpulan-project)
- [Catatan Keamanan](#catatan-keamanan)

---

## Fitur Utama

### User

- Register akun user.
- Login menggunakan email dan password.
- Login menggunakan Google OAuth2.
- Melihat daftar produk.
- Melihat detail produk.
- Menambahkan produk ke cart.
- Mengubah quantity produk di cart.
- Menghapus produk dari cart.
- Checkout pesanan.
- Membayar pesanan melalui Xendit.
- Melihat status pembayaran.
- Melihat daftar pesanan sendiri.
- Konfirmasi pesanan diterima.
- Memberikan ulasan/review produk.
- Menghapus ulasan sendiri.

### Admin

- Login sebagai admin.
- Dashboard admin.
- Manajemen produk.
- Manajemen kategori.
- Upload gambar produk.
- Melihat ulasan produk.
- Melihat semua order.
- Membatalkan order jika masih memenuhi aturan.
- Membuat data shipping/resi untuk order yang sudah dibayar.
- Melihat data pengiriman.
- Melihat laporan/summary penjualan.

### Payment dan Shipping

- Integrasi pembayaran menggunakan Xendit Invoice.
- Callback Xendit untuk update status payment.
- Update order menjadi `PAID` setelah pembayaran sukses.
- Pengurangan stok produk setelah payment sukses.
- Admin membuat shipping untuk order `PAID`.
- Order berubah menjadi `SHIPPED` setelah admin membuat shipping/resi.
- User melakukan konfirmasi pesanan diterima.
- Order berubah menjadi `COMPLETED`.

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- lucide-react
- Toast dan confirm custom provider

### Backend

- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- Google OAuth2 Login
- Spring Cloud Netflix Eureka
- Spring Cloud Gateway
- Spring Data JPA
- PostgreSQL
- WebClient
- Lombok
- Maven
- Spring Mail
- Apache POI untuk export Excel/report

### Integrasi Eksternal

- Xendit Invoice Payment
- Gmail SMTP untuk notification-service
- Google OAuth2 untuk login Google

### Deployment Preparation

- Dockerfile di setiap backend service
- `.dockerignore` di setiap backend service
- `docker-compose.yml` untuk persiapan deploy berbasis container
- `.env.example` untuk contoh environment variable

---

## Arsitektur Sistem

Project ini menggunakan arsitektur **microservices**. Frontend berkomunikasi ke backend melalui API Gateway. Gateway meneruskan request ke service yang sesuai. Eureka digunakan sebagai service registry ketika semua service dijalankan secara lokal.

```text
Frontend React / Browser
        |
        v
API Gateway Service
        |
        v
+-----------------------+
|  Discovery Service    |
|  Eureka Registry      |
+-----------------------+
        |
        v
Microservices:
- Auth Service
- Product Service
- User Service
- Cart Service
- Order Service
- Payment Service
- Shiping Service
- Notification Service
- Report Service
```

Setiap service bertanggung jawab pada domain masing-masing dan memiliki database/konfigurasi sendiri.

---

## Struktur Folder

```text
BaenTech-Store/
│
├── backend/
│   ├── discovery-service/
│   ├── gateway-service/
│   ├── auth-service/
│   ├── product-service/
│   ├── user-service/
│   ├── cart-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── shiping-serive/
│   ├── notification-service/
│   └── report-service/
│
├── frontend/
│   └── baentech-frontend/
│
├── database/
│   ├── ddl.sql
│   ├── dml.sql
│   └── docker-init/
│       └── 01-create-databases.sql
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Catatan: folder shipping service pada project masih bernama `shiping-serive`. Nama tersebut mengikuti struktur project yang sudah ada agar tidak merusak konfigurasi.

---

## Daftar Service dan Port

| Service | Port Lokal | Fungsi |
|---|---:|---|
| discovery-service | 8761 | Eureka service registry |
| gateway-service | 8080 | API Gateway utama |
| auth-service | 8081 | Register, login, JWT, Google OAuth2 |
| product-service | 8082 | Produk, kategori, review, gambar, stok |
| user-service | 8083 | Profile user dan alamat |
| cart-service | 8084 | Keranjang belanja |
| order-service | 8085 | Checkout dan order |
| payment-service | 8086 | Payment Xendit dan callback |
| shiping-serive | 8087 | Shipping/resi pengiriman |
| notification-service | 8088 | Email notification |
| report-service | 8089 | Laporan dan export Excel |

Semua service sudah disiapkan agar bisa membaca port dari environment variable `PORT`, sehingga lebih fleksibel untuk deploy ke platform cloud.

---

## Database

Project ini menggunakan PostgreSQL. Karena berbasis microservices, database dipisah berdasarkan service.

Database yang digunakan:

```sql
CREATE DATABASE baentech_auth_db;
CREATE DATABASE baentech_product_db;
CREATE DATABASE baentech_user_db;
CREATE DATABASE baentech_cart_db;
CREATE DATABASE baentech_order_db;
CREATE DATABASE baentech_payment_db;
CREATE DATABASE baentech_shipping_db;
```

File database yang disediakan:

```text
database/ddl.sql  -> struktur tabel / DDL
database/dml.sql  -> contoh data / DML
database/docker-init/01-create-databases.sql -> init database untuk Docker PostgreSQL
```

Karena database service terpisah, jalankan bagian DDL/DML sesuai database masing-masing.

---

## Alur Sistem

### 1. Register dan Login

```text
User register
-> Auth Service menyimpan user
-> Password dienkripsi
-> Role default USER
-> User login
-> Auth Service membuat JWT token
-> Frontend menyimpan token
-> Token digunakan untuk akses endpoint yang protected
```

### 2. Login Google OAuth2

```text
User klik login Google
-> Auth Service redirect ke Google OAuth2
-> Google mengembalikan data user
-> Auth Service membuat/mengecek user
-> Auth Service membuat JWT
-> User diarahkan kembali ke frontend
```

### 3. Produk dan Kategori

```text
Admin login
-> Admin membuat kategori
-> Admin membuat produk
-> Admin upload gambar produk
-> Produk aktif tampil di halaman user
```

Gambar produk disimpan pada kolom `image_url`. Untuk upload lokal, product-service menyimpan file pada folder uploads dan URL gambar disimpan ke database.

### 4. Cart

```text
User login
-> User melihat produk
-> User menambahkan produk ke cart
-> Cart Service menyimpan item cart
-> User bisa update quantity / hapus item
```

### 5. Checkout

```text
User checkout dari cart
-> Order Service membuat order
-> Status order = PENDING_PAYMENT
-> Cart dikosongkan
-> Frontend membuat payment Xendit
-> User diarahkan ke halaman pembayaran Xendit
```

### 6. Payment Xendit

```text
User membayar invoice Xendit
-> Xendit mengirim callback ke Payment Service
-> Payment Service validasi callback token
-> Payment status = SUCCESS
-> Payment Service memanggil Order Service internal
-> Order status = PAID
-> Order Service memanggil Product Service internal
-> Stock produk berkurang
```

Untuk menghindari stok berkurang dua kali, order-service hanya mengurangi stok ketika order berubah dari `PENDING_PAYMENT` menjadi `PAID`.

### 7. Shipping

```text
Admin melihat order PAID
-> Admin membuat shipping/resi
-> Shipping status = SHIPPED
-> Order status = SHIPPED
-> User melihat pesanan sedang dikirim
-> User klik Pesanan Diterima
-> Order status = COMPLETED
```

### 8. Review Produk

```text
User melihat detail produk
-> User memberi ulasan/rating
-> Product Service menyimpan review
-> Admin bisa melihat review produk dari halaman admin
```

### 9. Report

```text
Admin membuka report
-> Report Service mengambil data order/payment
-> Report Service menghitung summary
-> Admin bisa export laporan ke Excel
```

---

## Role dan Hak Akses

### USER

- Register dan login.
- Melihat produk.
- Melihat detail produk.
- Mengelola cart sendiri.
- Checkout.
- Membayar order.
- Melihat order sendiri.
- Konfirmasi pesanan diterima.
- Membuat dan menghapus review sendiri.

### ADMIN

- Login sebagai admin.
- Mengelola produk dan kategori.
- Upload gambar produk.
- Melihat semua order.
- Membatalkan order tertentu.
- Membuat shipping/resi.
- Melihat ulasan produk.
- Mengakses dashboard admin dan laporan.

Header JWT:

```text
Authorization: Bearer <TOKEN>
```

---

## Konfigurasi Environment

Project ini tidak menyimpan secret langsung di repository. Semua value sensitif dipindahkan ke `.env`.

File `.env` asli tidak boleh dipush ke GitHub. Yang boleh dipush adalah `.env.example`.

Contoh file environment:

```text
backend/auth-service/.env.example
backend/product-service/.env.example
backend/user-service/.env.example
backend/cart-service/.env.example
backend/order-service/.env.example
backend/payment-service/.env.example
backend/shiping-serive/.env.example
backend/notification-service/.env.example
backend/gateway-service/.env.example
backend/discovery-service/.env.example
.env.example
```

Cara membuat `.env` dari `.env.example` di Windows:

```cmd
copy backend\auth-service\.env.example backend\auth-service\.env
copy backend\product-service\.env.example backend\product-service\.env
copy backend\payment-service\.env.example backend\payment-service\.env
```

Lalu isi value yang masih kosong, seperti database, Google OAuth2, Xendit, Gmail, dan internal API key.

---

## Cara Menjalankan Project Lokal

### 1. Clone Repository

```cmd
git clone https://github.com/mrbaen454-xx/BaenTech-Store.git
cd BaenTech-Store
git checkout xendit-payment-update
```

### 2. Siapkan Database PostgreSQL

Buat database:

```sql
CREATE DATABASE baentech_auth_db;
CREATE DATABASE baentech_product_db;
CREATE DATABASE baentech_user_db;
CREATE DATABASE baentech_cart_db;
CREATE DATABASE baentech_order_db;
CREATE DATABASE baentech_payment_db;
CREATE DATABASE baentech_shipping_db;
```

### 3. Buat File `.env`

Copy dari `.env.example` pada masing-masing service, lalu isi value sesuai environment lokal.

### 4. Jalankan Backend

Jalankan service secara bertahap dari VS Code/terminal:

```text
1. discovery-service
2. gateway-service
3. auth-service
4. product-service
5. user-service
6. cart-service
7. order-service
8. payment-service
9. shiping-serive
10. notification-service
11. report-service jika diperlukan
```

Eureka Dashboard:

```text
http://localhost:8761
```

Gateway utama:

```text
http://localhost:8080
```

### 5. Jalankan Frontend

```cmd
cd frontend\baentech-frontend
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

Build frontend:

```cmd
npm run build
```

---

## Endpoint Utama

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /oauth2/authorization/google
```

### Product dan Category

```text
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
POST   /api/products/{id}/image
GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

### Review

```text
GET    /api/products/{id}/reviews
POST   /api/products/{id}/reviews
DELETE /api/products/reviews/{reviewId}
```

### Cart

```text
GET    /api/carts
POST   /api/carts/items
PUT    /api/carts/items/{id}
DELETE /api/carts/items/{id}
DELETE /api/carts/clear
```

### Order

```text
POST /api/orders/checkout
GET  /api/orders/my-orders
GET  /api/orders/{id}
GET  /api/orders/admin/all
PUT  /api/orders/{id}/cancel
PUT  /api/orders/{id}/complete
```

### Payment

```text
POST /api/payments/create
GET  /api/payments/my-payments
GET  /api/payments/order/{orderId}
POST /api/payments/xendit/callback
```

### Shipping

```text
POST /api/shippings/admin
GET  /api/shippings/admin
GET  /api/shippings/order/{orderId}
```

### Notification

```text
POST /api/notifications/send-email
```

### Report

```text
GET /api/reports/summary
GET /api/reports/orders
GET /api/reports/payments
GET /api/reports/orders/export-excel
GET /api/reports/payments/export-excel
```

---

## API Gateway Routes

```text
/api/auth/**           -> AUTH-SERVICE
/oauth2/**             -> AUTH-SERVICE
/login/oauth2/**       -> AUTH-SERVICE
/api/products/**       -> PRODUCT-SERVICE
/api/categories/**     -> PRODUCT-SERVICE
/uploads/products/**   -> PRODUCT-SERVICE
/api/users/**          -> USER-SERVICE
/api/addresses/**      -> USER-SERVICE
/api/carts/**          -> CART-SERVICE
/api/orders/**         -> ORDER-SERVICE
/api/payments/**       -> PAYMENT-SERVICE
/api/shippings/**      -> SHIPING-SERIVE
/api/notifications/**  -> NOTIFICATION-SERVICE
/api/reports/**        -> REPORT-SERVICE
```

---

## Catatan Docker dan Deploy

Project sudah disiapkan untuk deploy menggunakan Docker.

File yang tersedia:

```text
backend/*/Dockerfile
backend/*/.dockerignore
docker-compose.yml
database/docker-init/01-create-databases.sql
.env.example
```

Build salah satu service:

```cmd
cd backend\product-service
docker build -t baentech-product-service .
```

Menjalankan semua service dengan Docker Compose:

```cmd
docker compose up -d
```

Catatan:

- Docker Compose lebih cocok untuk VPS/server.
- Platform seperti Render biasanya menjalankan satu Dockerfile per service, bukan menjalankan `docker-compose.yml`.
- Upload gambar lokal perlu volume agar tidak hilang jika menggunakan Docker.
- Untuk production, gambar lebih baik dipindahkan ke object storage seperti Cloudinary atau S3 compatible storage.

---

## File Pengumpulan Project

Untuk pengumpulan project, file penting yang sudah disiapkan:

```text
Source Code Frontend:
frontend/baentech-frontend

Source Code Backend:
backend/

Struktur Database / DDL:
database/ddl.sql

Contoh Data / DML:
database/dml.sql

Persiapan Docker:
Dockerfile, .dockerignore, docker-compose.yml

Dokumentasi:
README.md
```

Flowchart bisa disimpan pada folder:

```text
docs/
```

Repository:

```text
https://github.com/mrbaen454-xx/BaenTech-Store
```

Branch utama project saat ini:

```text
xendit-payment-update
```

---

## Catatan Keamanan

Jangan pernah push file berikut ke GitHub:

```text
.env
.env.local
password database asli
Google OAuth secret asli
Xendit key asli
Gmail app password asli
uploads lokal jika berisi file private
node_modules
target
dist
```

Sebelum commit, cek file staged:

```cmd
git diff --cached --name-only
```

Jika secret pernah terlanjur terlihat atau masuk repository, segera rotate/ganti secret dari dashboard penyedia layanan terkait.

---

## Status Project

Fitur yang sudah tersedia:

- Frontend React/Vite.
- Backend Spring Boot microservices.
- JWT authentication.
- Google OAuth2 login.
- Admin dan user role.
- Product CRUD.
- Category CRUD.
- Product image upload.
- Product review.
- Cart.
- Checkout.
- Xendit payment.
- Payment callback.
- Stock reduction.
- Shipping/resi.
- User confirm received.
- Admin product reviews page.
- Report/Excel export.
- Environment variable setup.
- Dockerfile dan docker-compose preparation.

Project ini masih dapat dikembangkan lagi, misalnya:

- Penyimpanan gambar ke Cloudinary/object storage.
- Chat user-admin.
- Realtime notification.
- Deployment production penuh.
- Testing otomatis.
- Monitoring/logging production.

---

## Author

Project dibuat oleh:

```text
M. Saroni
BaenTech Store
```

Untuk kebutuhan pembelajaran, portofolio, dan presentasi project e-commerce berbasis microservices.
