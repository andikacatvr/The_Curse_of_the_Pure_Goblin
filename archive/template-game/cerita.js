// ===============================================================
// 📝 SKELETON / CONFIG DASAR TEMPLATE GAME 2D
// ===============================================================
// File ini adalah rangka (skeleton) kosongan yang siap diisi
// data cerita, quest, item, dan pengaturan karakter kelompok.

export const CONFIG_SKELETON = {
    // 1. Informasi Proyek
    judulGame: "Template Petualangan 2D",
    subJudul: "Kerangka Game Cerita & Eksplorasi Polosan",
    namaKelompok: "Kelompok Developer",

    // 2. Setelan Dasar Hero / Player
    player: {
        nama: "Player",
        warna: "#38bdf8",     // Warna kotak karakter (Hex)
        kecepatan: 220,       // Kecepatan jalan
        kekuatanLompat: 440,  // Daya lompat
        hpMaksimal: 3         // Jumlah nyawa awal
    },

    // 3. Setelan Awal Quest / Misi
    questAwal: {
        judul: "Misi Pertama: Menjelajahi Dunia",
        deskripsi: "Jelajahi platform skeleton, ambil koin item untuk tas inventaris, dan pelajari kontrol gerakan.",
        selesai: false
    },

    // 4. Tas / Inventaris Awal (Bisa kosong atau isi item contoh)
    inventoryAwal: [
        { id: 'item_kunci', nama: 'Kunci Perunggu', deskripsi: 'Kunci misterius pembuka pintu rintangan.', icon: '🗝️' }
    ],

    // 5. Warna Tema Dunia (Skeleton World)
    world: {
        warnaLangit: "#0f172a",    // Slate dark
        warnaPlatform: "#1e293b",  // Platform utama
        warnaAksen: "#38bdf8"      // Aksen cyan / border
    }
};
