# NutriSight

> **Platform Cerdas Analisis dan Estimasi Gizi Makanan Berbasis AI & Computer Vision**

![NutriSight Banner](https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=1200)

**NutriSight** adalah aplikasi *fullstack* modern yang dirancang untuk memonitor, mendeteksi, dan mengestimasi kandungan gizi makanan secara *real-time* dari sebuah gambar. Menggunakan perpaduan deteksi objek mutakhir (**Ultralytics AI**), pengolahan citra (*Computer Vision* untuk estimasi volume berbasis dimensi nampan/wadah), serta **Fuzzy Logic**, NutriSight mampu memberikan estimasi berat dan nutrisi makanan dengan akurat langsung di dasbor pengguna.

---

## Arsitektur Sistem

Proyek ini menggunakan arsitektur *micro-services / modular* yang terbagi menjadi 3 bagian utama:

```mermaid
graph LR
    Client[Frontend: Astro + React] -->|HTTP / API| API[Backend: NestJS]
    API -->|Proxy Upload & Auth| Model[AI Service: Python Flask]
    Model -->|Inference| Ultralytics[Ultralytics API Endpoint]
    Model -->|Query Gizi| DB[(Supabase PostgreSQL)]
    API -->|Manajemen Pengguna| DB
```

### 1. Frontend (`/frontend`)
Dasbor antarmuka pengguna yang sangat cepat, interaktif, dan responsif.
* **Framework:** [Astro v5](https://astro.build/) & [React 19](https://react.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Animasi & Visualisasi:** Motion & Chart.js (React-Chartjs-2)
* **Fitur Utama:** Visualisasi metrik gizi harian, riwayat deteksi makanan, dan antarmuka unggah foto makanan dengan hasil *overlay* deteksi (*bounding box*) secara langsung.

### 2. Backend API (`/backend`)
Layanan API terpusat yang aman, bertindak sebagai pengelola data utama dan *secure proxy*.
* **Framework:** [NestJS v11](https://nestjs.com/) (TypeScript)
* **ORM & Database:** [Prisma v6](https://www.prisma.io/) terhubung ke PostgreSQL ([Supabase](https://supabase.com/))
* **Keamanan & Autentikasi:** Enkripsi kata sandi dengan Bcrypt, autentikasi berbasis JWT (Passport-JWT), dan proteksi *header* menggunakan Helmet.
* **Fitur Utama:** Registrasi & login pengguna, autentikasi sesi, penanganan unggahan file (*multipart/form-data* menggunakan Multer), serta meneruskan permintaan analisis citra ke servis AI.

### 3. AI & Estimation Service (`/transformer_model`)
Mesin inferensi cerdas pengolah gambar dan penghitung estimasi gizi.
* **Framework:** Python 3 & Flask
* **AI & Computer Vision:** Integrasi model **Ultralytics API**, penghitungan rasio piksel dan kalibrasi *tray/nampan* (perspektif *warping*, deteksi kontur), serta **Fuzzy Logic** (`fuzzy.py`) untuk penyesuaian tingkat kematangan/kondisi spesifik makanan.
* **Fitur Utama:** Menerima gambar, memanggil endpoint model Ultralytics, menghitung estimasi gramatur makanan berdasarkan area piksel dan volume referensi, mengambil data gizi dari Supabase, dan mengembalikan respons JSON terstruktur beserta gambar *overlay* yang telah digambar *bounding box*.

---

## Panduan Instalasi & Menjalankan Lokal

Pastikan Anda telah menginstal **Node.js (v20+)**, **Python (v3.10+)**, dan memiliki akun/proyek aktif di **Supabase** serta **Ultralytics**.

### Langkah 1: Clone Repositori
```bash
git clone <url-repositori-anda>
cd "Research 2"
```

### Langkah 2: Konfigurasi Variabel Lingkungan (`.env`)
Buat file `.env` di masing-masing direktori layanan berdasarkan file `.env.example` yang tersedia:

1. **Backend (`backend/.env`)**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
   JWT_SECRET="rahasia-super-aman-anda"
   ```
2. **AI Model (`transformer_model/.env`)**
   ```env
   API_MENU="https://predict-xxx.a.run.app"
   API_MAIN_KEY="ul_xxx"
   TRANSFORMER_PORT=3002
   ```

### Langkah 3: Instalasi & Menjalankan Service

#### A. Menjalankan Backend (NestJS)
```bash
cd backend
npm install
npm run prisma:generate
npm run start:dev
```
Backend akan berjalan di `http://localhost:3000`.

#### B. Menjalankan AI Service (Python)
Buka terminal baru:
```bash
cd transformer_model
python -m venv venv
# Aktivasi venv (Windows)
.\venv\Scripts\activate
# Aktivasi venv (macOS/Linux)
# source venv/bin/activate

pip install -r requirements.txt
python model.py
```
Service Flask AI akan berjalan di `http://localhost:3002`.

#### C. Menjalankan Frontend (Astro)
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Aplikasi dasbor NutriSight dapat diakses melalui browser di `http://localhost:4321`.

---

## Struktur Direktori Utama

```text
Research 2/
├── backend/                  # Layanan API utama (NestJS)
│   ├── prisma/               # Skema database & seeder
│   └── src/                  # Modul Auth, Detection, Nutrition, dll.
├── frontend/                 # Dasbor antarmuka (Astro + React)
│   └── src/
│       ├── features/         # Komponen spesifik fitur (Dashboard, dll.)
│       ├── layouts/          # Tata letak halaman utama
│       └── shared/           # Komponen UI bersama (Navbar, dll.)
└── transformer_model/        # Layanan Estimasi AI & Pengolahan Citra
    ├── fuzzy.py              # Algoritma Fuzzy Logic
    ├── model.py              # Entry point Flask API
    └── nutrition_estimator.py# Alur inti estimasi citra & pemetaan gizi
```

---