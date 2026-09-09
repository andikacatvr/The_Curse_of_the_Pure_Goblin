# 🎮 Panduan Template Game 2D (Skeleton / Wireframe Kosongan)

Template game ini dirancang sebagai **Frame / Skeleton kosongan** (tanpa alur cerita, karakter khusus, ataupun aset dunia bawaan). Sangat cocok sebagai fondasi belajar untuk kelompok agar bebas berkreasi dari nol!

---

## 📱 Fitur & Elemen UI yang Sudah Siap Pakai

### 1. Navbar Top / HUD
- **HP (Nyawa)**: Menampilkan status darah karakter dalam bentuk hati (`❤️ ❤️ ❤️`). Sudah dilengkapi sistem berkurang jika terkena rintangan & respawn otomatis.
- **Tombol `[📋 Quest]`**: Berada di atas; saat diklik atau ditekan tombol `[Q]`, membuka modal popup berisi misi dan tujuan petualangan.
- **Tombol `[🎒 Inventory]`**: Berada di kanan atas lengkap dengan angka jumlah barang; saat diklik atau ditekan tombol `[I]`, membuka kotak tas 4 slot.

### 2. Kontrol Layar Sentuh (Android / Tablet)
- **Tombol Kiri [◀]** & **Kanan [▶]**: Berada di pojok kiri bawah layar untuk menggerakkan karakter secara responsif (*multi-touch*).
- **Tombol Atas [▲]**: Berada di pojok kanan bawah layar untuk melompat.
- *Tetap support keyboard PC (A/D/W, tombol panah, spasi, Q, I).*

---

## 📁 Struktur File Template

```text
template-game/
├── cerita.js       <-- ⭐ Konfigurasi dasar skeleton (nama game, warna hero, quest, tas awal)
├── index.html      <-- Halaman web responsif
├── main.js         <-- Engine Phaser skeleton dengan Top Navbar HUD & Touch Controls
└── PANDUAN.md      <-- Dokumen panduan ini
```

---

## 🚀 Cara Menjalankan

Cukup buka alamat ini di browser:
👉 **`http://localhost:5173/template-game/index.html`**

Bisa dibuka dari laptop, komputer, maupun tablet Android!
