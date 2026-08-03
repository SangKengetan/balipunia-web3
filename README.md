# 🛕 Balipunia — Platform Donasi Pura Berbasis Web3

**Balipunia** adalah platform donasi transparan untuk pura (tempat ibadah Hindu Bali) yang menggabungkan sistem pembayaran konvensional (Midtrans/QRIS) dengan teknologi blockchain (BSC Testnet). Platform ini memungkinkan donasi on-chain menggunakan stablecoin (USDT/USDC), pelaporan keuangan yang teranchor ke blockchain melalui IPFS, serta mekanisme penarikan dana yang diawasi oleh sistem voting Trustee.

---

## 📋 Daftar Isi

- [Definisi & Arsitektur](#definisi--arsitektur)
- [Fitur Sistem](#fitur-sistem)
- [Peran Pengguna](#peran-pengguna)
- [Smart Contract](#smart-contract)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Folder](#struktur-folder)
- [Cara Instalasi](#cara-instalasi)
- [Variabel Lingkungan (.env)](#variabel-lingkungan-env)
- [Deploy Smart Contract](#deploy-smart-contract)
- [Menjalankan Sistem](#menjalankan-sistem)
- [Alur Sistem](#alur-sistem)

---

## Definisi & Arsitektur

Balipunia terdiri dari **3 komponen utama** yang berjalan secara terpisah:

```
project/
├── frontend/       # React + Vite + TailwindCSS (antarmuka pengguna)
├── backend/        # Node.js + Express (REST API server)
└── blockchain/     # Hardhat (smart contract Solidity + deploy scripts)
```

### Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                    │
│  • Halaman publik (daftar pura, detail campaign)         │
│  • Dashboard Admin Pura, Super Admin, Trustee, Donor     │
│  • Integrasi wallet (MetaMask/WalletConnect)             │
│  • Pembayaran on-chain (ethers.js → BSC Testnet)         │
└──────────────────┬──────────────────┬────────────────────┘
                   │ REST API          │ ethers.js (RPC)
┌──────────────────▼──────┐  ┌────────▼──────────────────┐
│   BACKEND (Express.js)  │  │  BSC TESTNET BLOCKCHAIN    │
│   • Autentikasi JWT     │  │  • DonationVaultV5         │
│   • Kelola data pura,   │  │  • VotingGovernance (V3)   │
│     campaign, laporan   │  │  • FinancialReportAnchor   │
│   • Payment via Midtrans│  │                            │
│   • Upload ke IPFS      │  │  Token: USDT / USDC        │
│     (via Pinata)        │  │  (BEP-20 Testnet)          │
│   • Database PostgreSQL │  └───────────────────────────┘
└─────────────────────────┘
```

---

## Fitur Sistem

### 🌐 Fitur Publik (Tanpa Login)
| Fitur | Deskripsi |
|-------|-----------|
| **Daftar Pura** | Melihat semua pura yang terdaftar beserta informasi singkat |
| **Detail Pura** | Melihat profil pura, daftar campaign aktif, dan laporan keuangan |
| **Detail Campaign** | Melihat informasi kegiatan, target, saldo on-chain, dan riwayat donasi |
| **Donasi Off-chain** | Donasi via Midtrans (transfer bank, QRIS, GoPay, dll.) tanpa perlu wallet |
| **Donasi On-chain** | Donasi menggunakan USDT/USDC melalui wallet MetaMask/WalletConnect |
| **Laporan Keuangan Publik** | Melihat laporan keuangan pura yang telah di-anchor ke blockchain |
| **Leaderboard** | Melihat peringkat donatur terbanyak |
| **FAQ** | Halaman tanya jawab umum |

### 🙏 Fitur Donor (Setelah Login)
| Fitur | Deskripsi |
|-------|-----------|
| **Registrasi & Login** | Daftar dengan email + password atau login via Google OAuth |
| **Dashboard Donor** | Melihat histori donasi off-chain dan riwayat transaksi |
| **Donasi Terautentikasi** | Donasi dengan identitas terverifikasi (tercatat nama/email) |

### 🏛️ Fitur Admin Pura (Dashboard)
| Fitur | Deskripsi |
|-------|-----------|
| **Login Admin** | Login dengan address wallet + password |
| **Dashboard** | Ringkasan statistik pura (total donasi, campaign aktif) |
| **Kelola Campaign** | Buat, lihat, dan kelola kegiatan/campaign donasi |
| **Mekanisme Dana** | Pilih mekanisme: `SC_ONLY` (on-chain) atau `HYBRID` (on-chain + off-chain) |
| **Buat Campaign On-chain** | Mendaftarkan campaign ke smart contract `DonationVaultV5` |
| **Laporan Campaign** | Membuat laporan progress kegiatan |
| **Laporan Keuangan** | Membuat laporan keuangan lengkap dengan file pendukung |
| **Anchor ke Blockchain** | Meng-anchor CID laporan keuangan ke `FinancialReportAnchor` contract |
| **Permintaan Penarikan** | Mengajukan permintaan withdraw dana campaign ke Trustee |
| **Kelola Profil Pura** | Mengubah informasi, foto, dan wallet pura |

### 👑 Fitur Super Admin
| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Super Admin** | Statistik keseluruhan platform |
| **Manajemen Admin** | Membuat, menonaktifkan, atau menghapus akun Admin Pura |
| **Manajemen FAQ** | Membuat, mengedit, dan menghapus FAQ publik |
| **Laporan Global** | Melihat laporan donasi off-chain seluruh platform |
| **Penarikan Off-chain** | Mengelola dan memproses permintaan withdraw dana off-chain (Midtrans) |
| **Transfer Dana** | Memantau status transfer dana ke rekening pura |

### 🔐 Fitur Trustee
| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Trustee** | Melihat daftar permintaan penarikan dana yang perlu disetujui |
| **Review Proposal** | Melihat detail proposal withdraw beserta laporan keuangan |
| **Voting** | Memberikan suara setuju/tolak pada proposal withdraw |
| **Eksekusi Otomatis** | Dana otomatis ditransfer jika ≥ 2 dari 3 Trustee menyetujui |

---

## Peran Pengguna

```
SUPER_ADMIN     → Mengelola seluruh platform & admin
ADMIN_PURA      → Mengelola pura, campaign, laporan, dan withdraw
TRUSTEE         → Mengawasi dan memberi suara pada proposal withdraw
DONOR           → Berdonasi dan memantau penggunaan dana
(Publik)        → Melihat informasi tanpa perlu login
```

### Hierarki Trustee
Setiap Admin Pura wajib mendaftarkan **3 Trustee** (wallet address) di smart contract. Penarikan dana campaign on-chain hanya dapat dilakukan jika **minimal 2 dari 3 Trustee** menyetujui proposal.

---

## Smart Contract

| Kontrak | Versi Aktif | Fungsi |
|---------|-------------|--------|
| `DonationVaultV5` | V5 | Menyimpan dana donasi (USDT/USDC), registrasi campaign, eksekusi withdraw |
| `VotingGovernance` | V3 | Manajemen Trustee, sistem voting proposal withdraw |
| `FinancialReportAnchor` | V1 | Meng-anchor CID laporan keuangan ke blockchain (event-only, hemat gas) |

### Mekanisme Penarikan Dana

**SC_ONLY (On-chain Only):**
```
Admin Pura → requestWithdraw() → Trustee Vote (≥2/3) → executeWithdrawScOnly() → Dana ke payout wallet
```

**HYBRID (On-chain + Off-chain via Midtrans):**
```
Admin Pura → requestWithdraw() → Trustee Vote (≥2/3) → finalizeHybridWithdraw() → Super Admin proses transfer off-chain
```

---

## Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19 | UI Framework |
| Vite | 7 | Build tool & dev server |
| TailwindCSS | 4 | Styling |
| React Router | 7 | Client-side routing |
| ethers.js | 6 | Interaksi blockchain |
| WalletConnect | 2 | Koneksi wallet mobile |
| Axios | 1.x | HTTP client |
| Framer Motion | 12 | Animasi |
| Lucide React | - | Icon library |
| SweetAlert2 | 11 | Dialog/alert |
| React Google OAuth | - | Login via Google |
| qrcode.react | - | Generate QR Code |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | ≥18 | Runtime |
| Express | 5 | Web framework |
| PostgreSQL | - | Database utama |
| node-postgres (pg) | 8 | PostgreSQL client |
| JWT (jsonwebtoken) | 9 | Autentikasi admin |
| bcryptjs | 3 | Hash password |
| ethers.js | 6 | Interaksi blockchain dari server |
| Midtrans Client | 1.4 | Payment gateway |
| Pinata SDK | 2 | Upload file ke IPFS |
| Multer | 2 | Upload file |
| Google Auth Library | - | Verifikasi token Google OAuth |
| Nodemon | - | Auto-reload development |

### Blockchain
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Hardhat | 2.22 | Framework development smart contract |
| Solidity | 0.8.20 | Bahasa smart contract |
| ethers.js | 5 | Dipakai oleh Hardhat |
| BSC Testnet | Chain ID: 97 | Jaringan blockchain yang digunakan |

---

## Struktur Folder

```
project/
├── frontend/
│   ├── public/                   # Aset statis (logo, gambar bank)
│   ├── src/
│   │   ├── api/                  # Fungsi pemanggilan REST API backend
│   │   │   ├── axios.js          # Instance axios terkonfigurasi
│   │   │   ├── adminPura.api.js
│   │   │   ├── faq.api.js
│   │   │   ├── public.api.js
│   │   │   ├── superAdmin.api.js
│   │   │   └── trustee.api.js
│   │   ├── assets/               # Gambar/aset untuk dalam kode
│   │   ├── components/           # Komponen UI yang dapat digunakan ulang
│   │   │   ├── adminpura/        # Layout & sidebar Admin Pura
│   │   │   ├── public/           # Card campaign, card pura
│   │   │   ├── super-admin/      # Komponen Super Admin
│   │   │   └── toast/            # Sistem notifikasi toast
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Halaman utama per peran
│   │   │   ├── admin/            # Login & redirect admin
│   │   │   ├── adminpura/        # Semua halaman dashboard Admin Pura
│   │   │   ├── donor/            # Login, register, dashboard donor
│   │   │   ├── public/           # Pura list, campaign detail, FAQ
│   │   │   ├── super-admin/      # Semua halaman Super Admin
│   │   │   └── trustee/          # Dashboard & detail voting Trustee
│   │   ├── services/
│   │   │   └── blockchain/       # Interaksi langsung dengan smart contract
│   │   │       ├── abi/          # ABI file (DonationVault, Voting, FinancialAnchor)
│   │   │       ├── constants.js  # Alamat kontrak & token
│   │   │       ├── provider.js   # Web3 provider
│   │   │       ├── onchainCampaign.js
│   │   │       ├── onchainDonation.js
│   │   │       ├── onchainTrustee.js
│   │   │       └── voting.js
│   │   ├── utils/                # Fungsi utilitas (notifikasi, dll.)
│   │   ├── App.jsx               # Root routing aplikasi
│   │   └── main.jsx              # Entry point React
│   ├── .env                      # Variabel lingkungan frontend
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── blockchain/           # Interaksi blockchain dari sisi server
│   │   │   ├── abi/              # ABI file (DonationVaultABI, VotingABI, FinancialAnchor)
│   │   │   ├── listener/         # Blockchain event listener
│   │   │   ├── constant.js
│   │   │   ├── financialAnchor.contract.js
│   │   │   ├── provider.js
│   │   │   ├── signer.js
│   │   │   ├── vault.contract.js
│   │   │   └── voting.contract.js
│   │   ├── controllers/          # Handler request HTTP
│   │   │   ├── adminpura/
│   │   │   ├── public/
│   │   │   ├── superadmin/
│   │   │   └── trustee/
│   │   ├── db/
│   │   │   └── pool.js           # Koneksi PostgreSQL
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js     # JWT authentication
│   │   │   ├── requireRole.js         # Role-based access control
│   │   │   └── upload.middleware.js   # File upload (Multer)
│   │   ├── routes/               # Definisi endpoint API
│   │   │   ├── adminpura/
│   │   │   ├── superadmin/
│   │   │   └── trustee/
│   │   ├── services/             # Business logic
│   │   │   ├── adminpura/
│   │   │   ├── public/
│   │   │   ├── superadmin/
│   │   │   └── trustee/
│   │   ├── app.js                # Express app & middleware setup
│   │   └── server.js             # Entry point server
│   ├── .env                      # Variabel lingkungan backend
│   └── package.json
│
└── blockchain/
    ├── contracts/                # Smart contract Solidity
    │   ├── DonationVaultV5.sol   # ✅ Kontrak aktif: vault donasi
    │   ├── VotingV3.sol          # ✅ Kontrak aktif: governance voting
    │   └── FinancialReportAnchor.sol # ✅ Kontrak aktif: anchor laporan
    ├── scripts/                  # Script deploy & utilitas
    │   ├── deploy.js             # Deploy semua kontrak sekaligus
    │   ├── deploy-donationvault.js
    │   ├── deploy-financialreport.js
    │   ├── deploy-governance.js
    │   └── set-governance.js
    ├── test/                     # Unit test kontrak
    ├── artifacts/                # Hasil kompilasi (auto-generated)
    ├── cache/                    # Cache Hardhat (auto-generated)
    ├── hardhat.config.js         # Konfigurasi Hardhat & network
    ├── .env                      # Variabel lingkungan blockchain
    └── package.json
```

---

## Cara Instalasi

### Prasyarat

Pastikan software berikut telah terinstal:

- **Node.js** versi ≥ 18 ([download](https://nodejs.org))
- **npm** versi ≥ 9
- **PostgreSQL** versi ≥ 14 ([download](https://www.postgresql.org/download/))
- **Git**
- **MetaMask** (browser extension, untuk testing)

### 1. Clone Repository

```bash
git clone <url-repository>
cd project
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Buat file `.env` berdasarkan contoh di bagian [Variabel Lingkungan](#variabel-lingkungan-env), kemudian:

```bash
# Buat database PostgreSQL
# Masuk ke psql lalu jalankan:
# CREATE DATABASE balipunia;

# Jalankan server
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Buat file `.env` berdasarkan contoh, lalu:

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 4. Setup Blockchain (Opsional — Hanya untuk deploy ulang)

```bash
cd blockchain
npm install
```

Buat file `.env`, lalu kompilasi kontrak:

```bash
npx hardhat compile
```

---

## Variabel Lingkungan (.env)

### Frontend (`frontend/.env`)

```env
# URL API backend yang digunakan
VITE_API_BASE_URL=http://localhost:5000

# Google OAuth Client ID (dari Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Backend (`backend/.env`)

```env
# ============================================================
# SERVER
# ============================================================
PORT=5000

# ============================================================
# DATABASE
# ============================================================
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:password@localhost:5432/balipunia

# ============================================================
# AUTENTIKASI
# ============================================================
# Secret key untuk signing JWT token admin
JWT_SECRET=your_super_secret_jwt_key_here

# ============================================================
# GOOGLE OAUTH
# ============================================================
# Client ID Google untuk verifikasi login donor via Google
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# ============================================================
# IPFS / PINATA
# ============================================================
# Credentials dari dashboard Pinata (https://pinata.cloud)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
PINATA_JWT=your_pinata_jwt_token
# Subdomain gateway IPFS milik akun Pinata kamu
PINATA_GATEAWAY=your_subdomain.mypinata.cloud

# ============================================================
# PAYMENT GATEWAY — MIDTRANS
# ============================================================
# Dari dashboard Midtrans (https://dashboard.midtrans.com)
MIDTRANS_SERVER_KEY=Mid-server-xxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxx

# ============================================================
# BLOCKCHAIN — BSC TESTNET
# ============================================================
# RPC endpoint BSC Testnet
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com

# Alamat smart contract yang sudah di-deploy
DONATION_VAULT_ADDRESS=0xYourDonationVaultAddress
FINANCIAL_REPORT_ANCHOR_ADDRESS=0xYourFinancialReportAnchorAddress
VOTING_CONTRACT_ADDRESS=0xYourVotingContractAddress

# Alamat token stablecoin di BSC Testnet
USDT_ADDRESS=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
USDC_ADDRESS=0x64544969ed7EBf5f083679233325356EbE738930

# Private key akun Super Admin (untuk signing transaksi blockchain dari server)
# ⚠️ JANGAN pernah commit nilai aslinya ke Git!
OWNER_PRIVATE_KEY=0xYourSuperAdminPrivateKey
SUPER_ADMIN_PRIVATE_KEY=0xYourSuperAdminPrivateKey

# Private key akun Trustee (opsional, jika backend perlu sign atas nama trustee)
TRUSTEE_PRIVATE_KEY=0xYourTrusteePrivateKey
```

### Blockchain (`blockchain/.env`)

```env
# ============================================================
# DEPLOY KEYS
# ============================================================
# Private key akun yang akan melakukan deploy kontrak
DEPLOYER_PRIVATE_KEY=0xYourDeployerPrivateKey

# Private key Super Admin (dipakai oleh Hardhat tasks)
SUPERADMIN_PRIVATE_KEY=0xYourSuperAdminPrivateKey

# Private key lain (opsional, untuk testing)
PRIVATE_KEY=0xYourAdminPuraPrivateKey
PRIVATE_KEY2=0xYourTrusteePrivateKey

# ============================================================
# BLOCKCHAIN NETWORK
# ============================================================
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com

# ============================================================
# TOKEN ADDRESS (BSC Testnet)
# ============================================================
USDT_ADDRESS=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
USDC_ADDRESS=0x64544969ed7EBf5f083679233325356EbE738930

# ============================================================
# TRUSTEE ADDRESSES
# ============================================================
TRUSTEE_1=0xTrustee1WalletAddress
TRUSTEE_2=0xTrustee2WalletAddress
TRUSTEE_3=0xTrustee3WalletAddress

# ============================================================
# CONTRACT ADDRESSES (diisi setelah deploy)
# ============================================================
DONATION_VAULT_ADDRESS=0xYourDonationVaultAddress
GOVERNANCE_ADDRESS=0xYourVotingGovernanceAddress
```

---

## Deploy Smart Contract

> Pastikan akun deployer memiliki saldo BNB di BSC Testnet.
> Faucet: https://testnet.bnbchain.org/faucet-smart

### Deploy semua kontrak sekaligus:

```bash
cd blockchain

# Kompilasi terlebih dahulu
npx hardhat compile

# Deploy ke BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Deploy per kontrak (opsional):

```bash
# Deploy hanya DonationVault
npx hardhat run scripts/deploy-donationvault.js --network bscTestnet

# Deploy hanya FinancialReportAnchor
npx hardhat run scripts/deploy-financialreport.js --network bscTestnet

# Deploy hanya VotingGovernance
npx hardhat run scripts/deploy-governance.js --network bscTestnet

# Hubungkan Vault dengan Governance
npx hardhat run scripts/set-governance.js --network bscTestnet
```

Setelah deploy, **update alamat kontrak** di:
1. `backend/.env` → `DONATION_VAULT_ADDRESS`, `VOTING_CONTRACT_ADDRESS`, `FINANCIAL_REPORT_ANCHOR_ADDRESS`
2. `frontend/src/services/blockchain/constants.js` → `DONATION_VAULT_ADDRESS`, `VOTING_ADDRESS`

---

## Menjalankan Sistem

Jalankan ketiga service secara bersamaan (gunakan terminal terpisah):

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

| Service | URL Default |
|---------|-------------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| BSC Testnet | https://testnet.bscscan.com |

---

## Alur Sistem

### Alur Donasi Off-chain (Midtrans)
```
Donatur → Pilih Campaign → Isi Form Donasi → Bayar via Midtrans (QRIS/Bank)
→ Webhook Midtrans → Backend catat transaksi → Saldo off-chain campaign bertambah
```

### Alur Donasi On-chain (Crypto)
```
Donatur → Connect Wallet → Pilih Campaign → Approve USDT/USDC → Donate()
→ Smart Contract DonationVaultV5 menyimpan dana → Event Donated ter-emit
```

### Alur Penarikan Dana (SC_ONLY)
```
Admin Pura → Buat Laporan Keuangan → Upload ke IPFS → Anchor CID ke Blockchain
→ Ajukan Permintaan Withdraw → 3 Trustee menerima notifikasi
→ Trustee review laporan → Voting (setuju/tolak)
→ ≥ 2 Trustee setuju → Smart contract otomatis transfer dana ke payout wallet
```

### Alur Penarikan Dana (HYBRID)
```
Admin Pura → Ajukan Withdraw → Trustee Voting
→ ≥ 2 setuju → Super Admin memproses transfer dana off-chain ke rekening pura
→ Admin Pura mengkonfirmasi penerimaan
```

---

## Keamanan

> ⚠️ **PENTING:** File `.env` mengandung informasi sensitif seperti private key dan API secret. **Jangan pernah** commit file `.env` ke repository Git.

Pastikan file `.gitignore` sudah menyertakan:
```
.env
node_modules/
```

Private key yang tersimpan di `.env` backend hanya digunakan untuk signing transaksi blockchain tertentu yang memerlukan otoritas server (misalnya, finalisasi withdraw off-chain dari sisi sistem).

---

## Kontribusi

Proyek ini merupakan bagian dari penelitian skripsi. Untuk pertanyaan atau kontribusi, silakan hubungi melalui repository ini.

---

*Dibuat dengan ❤️ untuk transparansi donasi pura di Bali.*
