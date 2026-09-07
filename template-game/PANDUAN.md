# 🎮 Panduan Template Game 2D untuk Kelompok Belajar Anak

Halo Kakak Pengajar dan Adik-adik!
Template game ini dirancang agar adik-adik bisa **berkreasi membuat cerita petualangan 2D mereka sendiri** dengan sangat mudah, tanpa perlu pusing memikirkan rumus koding atau fisika game!

---

## 📁 Struktur Folder Game

```text
template-game/
├── cerita.js       <-- ⭐ INI SATU-SATUNYA FILE YANG DIUBAH ADIK-ADIK!
├── index.html      <-- Tampilan halaman web
├── main.js         <-- Mesin game otomatis (tidak perlu diubah)
└── PANDUAN.md      <-- Lembar panduan ini
```

---

## 🚀 Cara Menjalankan Game

### Opsi 1: Di Komputer Kakak Pengajar (Langsung Buka di Browser)
Karena server web sudah aktif, cukup buka browser dan ketik alamat:
👉 **`http://localhost:5173/template-game/index.html`**

Setiap kali adik-adik menyimpan perubahan di `cerita.js`, game di browser akan **otomatis ter-update seketika (Auto Reload)!**

### Opsi 2: Dibagikan ke Laptop Murid / Kelompok
Jika ingin dicopy ke 5 laptop kelompok:
1. Copy seluruh folder `template-game` ini ke laptop kelompok.
2. Di laptop kelompok, jalankan perintah:
   ```bash
   npm install
   npm run dev
   ```

---

## 📝 5 Bagian Cerita yang Bisa Diisi Adik-adik di `cerita.js`

Buka file **`cerita.js`** dengan editor (VS Code, Notepad, dll), lalu ajak adik-adik berdiskusi mengisi bagian ini:

### 1. Judul & Nama Kelompok
- **`judulGame`**: Judul petualangan mereka (Contoh: *"Misteri Pedang Cahaya"*).
- **`namaKelompok`**: Nama kelompok mereka (Contoh: *"Kelompok Elang Perkasa"*).

### 2. Karakter Utama (Hero)
- **`nama`**: Nama karakter jagoan mereka.
- **`warna`**: Pilih warna kesukaan:
  - Biru: `'#3498db'`
  - Hijau: `'#2ecc71'`
  - Merah: `'#e74c3c'`
  - Kuning: `'#f1c40f'`
  - Ungu: `'#9b59b6'`
- **`kecepatan`** & **`kekuatanLompat`**: Bisa dibuat pelari cepat atau pelompat tinggi!

### 3. Babak 1 (Tempat Awal & Misi)
- **`namaTempat`**: Nama desa/tempat awal (Contoh: *"📍 Rumah Desa Bawah Bukit"*).
- **`teman.nama`**: Siapa yang memberi misi (Kakek Bijak, Ibu Kelinci, Pak Guru, dll).
- **`teman.dialog`**: Deretan kalimat obrolan saat tombol `[E]` ditekan.
- **`barangMisi.nama`**: Benda yang harus dicari (Pedang, Tongkat Sakti, Kunci Emas, dll).
- **`pintu.pesanTerkunci`**: Nasihat jika belum mengambil barang misi sebelum pergi.

### 4. Babak 2 (Tantangan & Musuh)
- **`musuh.nama`**: Siapa nama monster/rintangan yang dihadapi (Monster Api, Robot Nakal, dll).
- **`musuh.nyawa`**: Jumlah pukulan `[Spasi]` atau `[F]` sampai monster kalah.
- **`hadiah.nama`**: Hadiah kemenangan (Batu Permata, Buku Rahasia, Mahkota Kebaikan, dll).

### 5. Ending / Pesan Kemenangan
- **`ending.judul`**: Kata-kata perayaan tamat.
- **`ending.pesan`**: Cerita akhir setelah mereka menang.
- **`ending.pesanMoral`**: Nasihat / pesan moral yang ingin disampaikan kelompok!

---

## 🕹️ Tombol Kontrol Game
- **A / Panah Kiri**: Bergerak ke kiri
- **D / Panah Kanan**: Bergerak ke kanan
- **W / Panah Atas**: Lompat
- **E**: Mengajak bicara teman / Membuka pintu
- **Spasi / F**: Menyerang monster saat jarak dekat
