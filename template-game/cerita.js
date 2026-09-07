// ===============================================================
// 📝 LEMBAR CERITA GAME (EDIT FILE INI BERSAMA KELOMPOKMU!)
// ===============================================================
// Adik-adik / Kakak pendamping cukup mengubah tulisan di dalam tanda kutip ("...")
// dan memilih warna yang disukai. Tidak perlu mengubah kode rumit!

export const CERITA_GAME = {
    // -----------------------------------------------------------
    // 1. INFORMASI KELOMPOK & JUDUL GAME
    // -----------------------------------------------------------
    judulGame: "Petualangan Bintang Petualang",
    namaKelompok: "Kelompok 1 - Harimau Juara",

    // -----------------------------------------------------------
    // 2. KARAKTER UTAMA (HERO KAMU)
    // -----------------------------------------------------------
    hero: {
        nama: "Aksel",
        // Pilihan warna: '#3498db' (Biru), '#2ecc71' (Hijau), '#e74c3c' (Merah), '#f1c40f' (Kuning), '#9b59b6' (Ungu)
        warna: "#3498db",
        kecepatan: 220,     // Kecepatan lari
        kekuatanLompat: 420 // Tinggi lompatan
    },

    // -----------------------------------------------------------
    // 3. BABAK 1: TEMPAT AWAL (Contoh: Rumah, Desa, Pinggir Hutan)
    // -----------------------------------------------------------
    babak1: {
        namaTempat: "📍 Desa Daun Rimbun (Awal Cerita)",
        warnaLangit: "#1e293b", // Warna suasana langit
        warnaTanah: "#15803d",  // Warna rumput/lantai

        // Karakter Teman (NPC) yang memberi misi
        teman: {
            nama: "Kakek Bijak",
            warna: "#e67e22", // Warna baju teman (Oranye)
            posisiX: 250,     // Posisi berdiri teman di layar
            dialog: [
                "Halo anak muda yang baik hati!",
                "Batu Kristal Pelindung desa kita telah dicuri monster nakal!",
                "Ambil Pedang Keberanian di sebelah kanan sana.",
                "Lalu pergilah lewat pintu ke Hutan Monster untuk merebutnya kembali!"
            ]
        },

        // Barang yang harus diambil
        barangMisi: {
            nama: "Pedang Keberanian",
            icon: "⚔️",
            warna: "#facc15", // Warna keemasan
            posisiX: 520,     // Posisi barang berada
            pesanDapat: "✨ Kamu berhasil mengambil [Pedang Keberanian]!"
        },

        // Pintu lanjut ke tempat berikutnya
        pintu: {
            posisiX: 720,
            tulisan: "Ke Hutan Monster ➔",
            pesanTerkunci: "🔒 Pintu terkunci! Ambil senjatamu dulu sebelum pergi berpetualang!"
        }
    },

    // -----------------------------------------------------------
    // 4. BABAK 2: TEMPAT TANTANGAN / RINTANGAN (Contoh: Gua / Hutan Monster)
    // -----------------------------------------------------------
    babak2: {
        namaTempat: "📍 Hutan Ranting Gelap (Babak Melawan Monster)",
        warnaLangit: "#0f172a", // Langit lebih gelap
        warnaTanah: "#334155",  // Tanah bebatuan

        // Karakter Musuh
        musuh: {
            nama: "Monster Kabut Hitam",
            warna: "#7f1d1d", // Merah tua gelap
            posisiX: 550,     // Posisi monster
            nyawa: 3,         // Jumlah pukulan untuk mengalahkan musuh
            petunjukSerang: "⚔️ DEKATI MONSTER LALU TEKAN [SPASI] ATAU [F] UNTUK MENYERANG!",
            pesanKalah: "💥 Monster berhasil dikalahkan dan lari ketakutan!\nKristal Pelindung Desa terjatuh ke tanah!"
        },

        // Hadiah yang didapat setelah musuh kalah
        hadiah: {
            nama: "Kristal Pelindung Desa",
            icon: "💎",
            posisiX: 550,
            pesanDapat: "🏆 Kamu menyelamatkan [Kristal Pelindung Desa]!"
        },

        // Pintu jalan pulang menuju tamat
        pintuPulang: {
            posisiX: 720,
            tulisan: "Kembali ke Desa ➔"
        }
    },

    // -----------------------------------------------------------
    // 5. PESAN KEMENANGAN (TAMAT / ENDING)
    // -----------------------------------------------------------
    ending: {
        judul: "🎉 SELAMAT! MISI KELOMPOK SELESAI!",
        pesan: "Berkat keberanian dan kerja sama kalian, desa kembali aman dan damai selamanya!",
        pesanMoral: "💡 Pesan Moral: Keberanian dan niat tulus menolong sesama akan selalu membawa kebaikan bagi semua orang."
    }
};
