import Phaser from 'phaser';
import { CONFIG_SKELETON } from './cerita.js';
import { DisplayManager } from './DisplayManager.js';

// Typography System (Identik dengan The Curse of the Pure Goblin)
const FONT_TITLE = '"Pirata One", cursive, serif';
const FONT_BODY = '"Fredoka", "Segoe UI", sans-serif';

// High-DPI Super-Sampling untuk teks tajam
if (Phaser && Phaser.GameObjects && Phaser.GameObjects.Text) {
    const origSetStyle = Phaser.GameObjects.Text.prototype.setStyle;
    Phaser.GameObjects.Text.prototype.setStyle = function (style, updateText, setDefaults) {
        if (!style) style = {};
        if (!style.fontFamily) style.fontFamily = FONT_BODY;
        if (style.resolution === undefined) {
            style.resolution = Math.max(3, (window.devicePixelRatio || 1) * 2);
        }
        return origSetStyle.call(this, style, updateText, setDefaults);
    };
}

function hexToNum(hexStr, defaultHex = 0x38bdf8) {
    if (!hexStr) return defaultHex;
    return parseInt(hexStr.replace('#', '0x'), 16) || defaultHex;
}

function isMobileOrTablet() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

    // 1. Deteksi mutlak Desktop / PC / Laptop (Windows, macOS Desktop, Linux Desktop) -> Wajib FALSE
    const isWindowsPC = /windows nt|win32|win64/i.test(ua);
    const isMacDesktop = /macintosh|mac os x/i.test(ua) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isLinuxDesktop = /linux/i.test(ua) && !/android/i.test(ua);

    if (isWindowsPC || isMacDesktop || isLinuxDesktop) {
        return false;
    }

    // 2. Deteksi Android, Tablet, iPad, & Mobile
    const isAndroid = /android/i.test(ua);
    const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /ipad/i.test(ua);
    const isMobilePhone = /iphone|ipod|blackberry|iemobile|opera mini|mobile|crios/i.test(ua);
    const isTabletUA = /tablet|silk|kindle/i.test(ua);

    return isAndroid || isIPad || isMobilePhone || isTabletUA;
}

const isMobileDevice = isMobileOrTablet;

// ===============================================================
// 💾 SAVE & LOAD MANAGER (LOCALSTORAGE)
// ===============================================================
export const SaveManager = {
    KEY: 'template_game_save_v1',
    save(data) {
        try {
            const payload = {
                ...data,
                timestamp: Date.now(),
                dateStr: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
            localStorage.setItem(this.KEY, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.error('Save error:', e);
            return false;
        }
    },
    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Load error:', e);
            return null;
        }
    },
    hasSave() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            return !!data && typeof data === 'object';
        } catch (e) {
            return false;
        }
    },
    clear() {
        try {
            localStorage.removeItem(this.KEY);
        } catch (e) {}
    }
};

// ===============================================================
// 1. BOOT SCENE: TEXTURE GENERATOR (POLOSAN / SKELETON)
// ===============================================================
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.generateSkeletonTextures();
        this.scene.start('TitleScene');
    }

    generateSkeletonTextures() {
        // Player (Minimalist Hero Box)
        const pColor = hexToNum(CONFIG_SKELETON.player.warna, 0x38bdf8);
        const pG = this.make.graphics({ x: 0, y: 0, add: false });
        pG.fillStyle(pColor, 1);
        pG.fillRoundedRect(0, 0, 32, 44, 5);
        pG.lineStyle(1.5, 0xffffff, 0.9);
        pG.strokeRoundedRect(0, 0, 32, 44, 5);
        // Eyes
        pG.fillStyle(0xffffff, 1);
        pG.fillRect(6, 12, 7, 7);
        pG.fillRect(19, 12, 7, 7);
        pG.fillStyle(0x0f172a, 1);
        pG.fillRect(9, 14, 4, 4);
        pG.fillRect(22, 14, 4, 4);
        pG.generateTexture('skeleton_player', 32, 44);

        // Ground Platform (Warna & Aksen identik Goblin Game)
        const gG = this.make.graphics({ x: 0, y: 0, add: false });
        gG.fillStyle(0x166534, 1);
        gG.fillRect(0, 0, 400, 32);
        gG.fillStyle(0x22c55e, 1);
        gG.fillRect(0, 0, 400, 6);
        gG.generateTexture('skeleton_ground', 400, 32);

        // Floating Platform Block
        const bG = this.make.graphics({ x: 0, y: 0, add: false });
        bG.fillStyle(0x1e293b, 1);
        bG.fillRoundedRect(0, 0, 130, 24, 4);
        bG.lineStyle(2, 0x334155, 1);
        bG.strokeRoundedRect(0, 0, 130, 24, 4);
        bG.generateTexture('skeleton_platform', 130, 24);

        // Collectible Item (Koin Emas)
        const coinG = this.make.graphics({ x: 0, y: 0, add: false });
        coinG.fillStyle(0xf59e0b, 1);
        coinG.fillCircle(12, 12, 11);
        coinG.fillStyle(0xfde047, 1);
        coinG.fillCircle(12, 12, 7);
        coinG.fillStyle(0xffffff, 0.8);
        coinG.fillRect(8, 8, 4, 4);
        coinG.generateTexture('skeleton_item', 24, 24);

        // Test Hazard Duri
        const hazG = this.make.graphics({ x: 0, y: 0, add: false });
        hazG.fillStyle(0xef4444, 1);
        hazG.beginPath();
        hazG.moveTo(0, 24);
        hazG.lineTo(12, 0);
        hazG.lineTo(24, 24);
        hazG.closePath();
        hazG.fillPath();
        hazG.generateTexture('skeleton_hazard', 24, 24);
    }
}

// ===============================================================
// 2. TITLE SCENE: LAYAR MENU UTAMA SKELETON
// ===============================================================
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#090d16');

        // Garis-garis dekoratif grid latar belakang
        const bgG = this.add.graphics();
        bgG.lineStyle(1, 0x1e293b, 0.35);
        for (let x = 0; x < 800; x += 40) {
            bgG.beginPath();
            bgG.moveTo(x, 0);
            bgG.lineTo(x, 450);
            bgG.strokePath();
        }
        for (let y = 0; y < 450; y += 40) {
            bgG.beginPath();
            bgG.moveTo(0, y);
            bgG.lineTo(800, y);
            bgG.strokePath();
        }

        // Title Header Container
        const titleContainer = this.add.container(400, 95);
        
        const titleText = this.add.text(0, 0, `⚔️ ${(CONFIG_SKELETON.judulGame || 'TEMPLATE GAME 2D').toUpperCase()}`, {
            fontSize: '30px',
            fontStyle: 'bold',
            fill: '#38bdf8',
            fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        const subTitleText = this.add.text(0, 36, CONFIG_SKELETON.subJudul || 'Kerangka Game Cerita & Petualangan 2D', {
            fontSize: '13px',
            fill: '#94a3b8',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        titleContainer.add([titleText, subTitleText]);

        // Animasi melayang halus pada judul
        this.tweens.add({
            targets: titleContainer,
            y: 90,
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Menu Buttons Container
        const startY = 195;

        // 1. Tombol Petualangan Baru
        this.createMenuButton(400, startY, '⚔️ Petualangan Baru', 0x2563eb, 0x60a5fa, () => {
            this.scene.start('GameScene', { isNewGame: true });
        });

        // 2. Tombol Lanjutkan Petualangan (Cek apakah ada save data)
        const hasSave = SaveManager.hasSave();
        const saveData = hasSave ? SaveManager.load() : null;
        let continueLabel = '📂 Lanjutkan Petualangan';
        let continueSub = '';
        if (saveData) {
            const itemLen = (saveData.inventory && Array.isArray(saveData.inventory)) ? saveData.inventory.length : 0;
            continueSub = `HP: ${saveData.hp || 3}/${saveData.maxHp || 3} • Tas: ${itemLen} Item • ${saveData.dateStr || 'Tersimpan'}`;
        } else {
            continueSub = 'Belum ada progres tersimpan';
        }

        this.createMenuButton(
            400,
            startY + 60,
            continueLabel,
            hasSave ? 0x0f172a : 0x090d16,
            hasSave ? 0x10b981 : 0x334155,
            () => {
                if (hasSave) {
                    this.scene.start('GameScene', { isLoadGame: true });
                }
            },
            hasSave,
            continueSub
        );

        // 3. Tombol Pengaturan Layar
        this.createMenuButton(400, startY + 120, '⚙️ Pengaturan Resolusi', 0x1e293b, 0x64748b, () => {
            this.toggleSettingsModal(true);
        });

        // Footer Info
        this.add.text(400, 420, `Proyek: ${CONFIG_SKELETON.namaKelompok || 'Kelompok Developer'} • Phaser 3 Skeleton`, {
            fontSize: '11px',
            fill: '#475569',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Modal Pengaturan di Title Scene
        this.createTitleSettingsModal();
    }

    createMenuButton(x, y, label, bgColor, borderColor, callback, isEnabled = true, subText = '') {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 270, subText ? 48 : 42, bgColor, isEnabled ? 0.95 : 0.4)
            .setStrokeStyle(2, borderColor);

        if (isEnabled) {
            bg.setInteractive({ useHandCursor: true });
        }

        const txt = this.add.text(0, subText ? -7 : 0, label, {
            fontSize: '14px',
            fontStyle: 'bold',
            fill: isEnabled ? '#ffffff' : '#64748b',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        container.add([bg, txt]);

        if (subText) {
            const sub = this.add.text(0, 13, subText, {
                fontSize: '10px',
                fill: isEnabled ? '#34d399' : '#64748b',
                fontFamily: FONT_BODY
            }).setOrigin(0.5);
            container.add(sub);
        }

        if (isEnabled) {
            bg.on('pointerover', () => {
                bg.setFillStyle(0x1d4ed8, 1);
                bg.setStrokeStyle(2.5, 0x93c5fd);
                this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100 });
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(bgColor, 0.95);
                bg.setStrokeStyle(2, borderColor);
                this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
            });
            bg.on('pointerdown', callback);
        }

        return container;
    }

    createTitleSettingsModal() {
        this.settingsModal = this.add.container(400, 225).setDepth(50).setVisible(false);
        const overlay = this.add.rectangle(0, 0, 800, 450, 0x000000, 0.75).setInteractive();
        const box = this.add.rectangle(0, 0, 480, 260, 0x0f172a, 0.98).setStrokeStyle(2, 0x38bdf8);

        const header = this.add.text(0, -95, '⚙️ PENGATURAN RESOLUSI LAYAR', {
            fontSize: '16px', fontStyle: 'bold', fill: '#38bdf8', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Resolusi
        const resLabel = this.add.text(-200, -45, '🖥️ Resolusi Layar:', { fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY });
        const resBtn = this.add.rectangle(80, -38, 200, 28, 0x1e3a8a, 0.95).setStrokeStyle(1.5, 0x38bdf8).setInteractive({ useHandCursor: true });
        const resBtnText = this.add.text(80, -38, DisplayManager.current.label, { fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY }).setOrigin(0.5);

        resBtn.on('pointerdown', () => {
            const nextRes = DisplayManager.cycleNext();
            resBtnText.setText(nextRes.label);
        });

        // Fullscreen
        const fsBtn = this.add.rectangle(205, -38, 32, 28, 0x334155, 0.9).setStrokeStyle(1.5, 0x94a3b8).setInteractive({ useHandCursor: true });
        const fsText = this.add.text(205, -38, '⛶', { fontSize: '13px', fill: '#ffffff' }).setOrigin(0.5);
        fsBtn.on('pointerdown', () => DisplayManager.toggleFullscreen(this));

        // Info
        const infoText = this.add.text(0, 15, 'Pengaturan resolusi disimpan otomatis untuk sesi bermain Anda.', {
            fontSize: '11px', fill: '#94a3b8', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Close
        const closeBtn = this.add.rectangle(0, 75, 120, 32, 0x1e293b, 1).setStrokeStyle(1.5, 0x64748b).setInteractive({ useHandCursor: true });
        const closeText = this.add.text(0, 75, 'Tutup [ESC]', { fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY }).setOrigin(0.5);

        closeBtn.on('pointerdown', () => this.toggleSettingsModal(false));
        overlay.on('pointerdown', () => this.toggleSettingsModal(false));
        this.input.keyboard.on('keydown-ESC', () => this.toggleSettingsModal(false));

        this.settingsModal.add([overlay, box, header, resLabel, resBtn, resBtnText, fsBtn, fsText, infoText, closeBtn, closeText]);
    }

    toggleSettingsModal(state) {
        this.settingsModal.setVisible(state);
    }
}

// ===============================================================
// 3. GAME SCENE: SKELETON WITH FULL HUD & RESOLUTION MANAGER
// ===============================================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data = {}) {
        this.startData = data;
        this.isGameOver = false;
        this.collectedItemIds = [];
        this.savedSpawnPos = null;

        if (data.isLoadGame && SaveManager.hasSave()) {
            const save = SaveManager.load();
            this.hp = save.hp !== undefined ? save.hp : (CONFIG_SKELETON.player.hpMaksimal || 3);
            this.maxHp = save.maxHp || (CONFIG_SKELETON.player.hpMaksimal || 3);
            this.inventory = Array.isArray(save.inventory) ? [...save.inventory] : [...(CONFIG_SKELETON.inventoryAwal || [])];
            this.quest = save.quest ? { ...save.quest } : { ...CONFIG_SKELETON.questAwal };
            this.collectedItemIds = Array.isArray(save.collectedItemIds) ? [...save.collectedItemIds] : [];
            if (save.playerX && save.playerY) {
                this.savedSpawnPos = { x: save.playerX, y: save.playerY };
            }
        } else {
            // New Game / Default
            this.hp = CONFIG_SKELETON.player.hpMaksimal || 3;
            this.maxHp = CONFIG_SKELETON.player.hpMaksimal || 3;
            this.inventory = [...(CONFIG_SKELETON.inventoryAwal || [])];
            this.quest = { ...CONFIG_SKELETON.questAwal };
            this.collectedItemIds = [];
            if (data.isNewGame) {
                SaveManager.clear();
            }
        }
    }

    create() {
        this.cameras.main.setBackgroundColor('#0b1329');

        this.touchState = { left: false, right: false, jump: false };
        this.isInvOpen = false;
        this.isQuestOpen = false;
        this.isSettingsOpen = false;

        // Buat Dunia Polosan
        this.createWorld();

        // Buat Karakter
        this.createPlayer();

        // Buat Top Navbar HUD Identik Goblin Game
        this.createGoblinStyleHUD();

        // Buat Kontrol Touch Android/Tablet Identik Goblin Game
        this.createGoblinStyleTouchControls();

        // Buat Modal Game Over
        this.createGameOverModalUI();

        // Keyboard Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        this.input.keyboard.on('keydown-Q', () => this.toggleQuestModal());
        this.input.keyboard.on('keydown-I', () => this.toggleInventoryModal());
        this.input.keyboard.on('keydown-ESC', () => this.toggleSettingsModal());

        // Simpan posisi awal game baru secara otomatis
        if (this.startData && this.startData.isNewGame) {
            this.autoSave(false);
        }
    }

    autoSave(showToast = true) {
        if (!this.player || !this.player.body || this.isGameOver) return;
        const data = {
            hp: this.hp,
            maxHp: this.maxHp,
            playerX: Math.round(this.player.x),
            playerY: Math.round(this.player.y),
            inventory: this.inventory,
            quest: this.quest,
            collectedItemIds: this.collectedItemIds
        };
        SaveManager.save(data);
        if (showToast) {
            this.showFloatingToast('💾 Progres Tersimpan Otomatis', 0x10b981);
        }
    }

    createWorld() {
        this.platforms = this.physics.add.staticGroup();

        // Lantai Dasar
        this.platforms.create(400, 434, 'skeleton_ground').setScale(2.5, 1).refreshBody();

        // Platform Melayang
        this.platforms.create(250, 320, 'skeleton_platform').refreshBody();
        this.platforms.create(560, 270, 'skeleton_platform').refreshBody();

        // Sample Item Koin (Hanya dibuat jika belum pernah diambil di data save)
        if (!this.collectedItemIds.includes('koin_emas')) {
            this.sampleItem = this.physics.add.sprite(560, 220, 'skeleton_item');
            this.sampleItem.body.setAllowGravity(false);
            this.tweens.add({
                targets: this.sampleItem,
                y: 212,
                yoyo: true,
                repeat: -1,
                duration: 800,
                ease: 'Sine.easeInOut'
            });
        } else {
            this.sampleItem = null;
        }

        // Sample Hazard Duri
        this.hazard = this.physics.add.staticSprite(400, 406, 'skeleton_hazard');

        // Teks Petunjuk Skeleton Polosan
        this.add.text(400, 105, '⚙️ SKELETON / FRAME TEMPLATE 2D', {
            fontSize: '15px', fontStyle: 'bold', fill: '#64748b', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.add.text(400, 128, 'Resolusi & Fitur DisplayManager Identik Game Utama', {
            fontSize: '12px', fill: '#475569', fontFamily: FONT_BODY
        }).setOrigin(0.5);
    }

    createPlayer() {
        const spawnX = this.savedSpawnPos ? this.savedSpawnPos.x : 220;
        const spawnY = this.savedSpawnPos ? this.savedSpawnPos.y : 360;
        this.player = this.physics.add.sprite(spawnX, spawnY, 'skeleton_player').setDepth(10);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);

        // Ambil item -> masuk inventory
        if (this.sampleItem) {
            this.physics.add.overlap(this.player, this.sampleItem, () => {
                if (this.sampleItem && this.sampleItem.active) {
                    this.sampleItem.destroy();
                    this.collectedItemIds.push('koin_emas');
                    this.inventory.push({
                        id: 'koin_emas',
                        nama: 'Koin Emas Murni',
                        deskripsi: 'Koin berharga yang berhasil diambil dari platform melayang.',
                        icon: '🪙'
                    });
                    this.updateInventoryBadge();
                    this.showFloatingToast('✨ +1 Koin Emas (Masuk Tas!)', 0xfacc15);

                    this.quest.selesai = true;
                    this.quest.deskripsi = '✅ Item berhasil diambil! Klik tombol [🎒 Tas] di kanan atas untuk melihat isi tas.';
                    this.autoSave(true);
                }
            });
        }

        // Kena hazard -> kurang HP
        this.physics.add.overlap(this.player, this.hazard, () => {
            if (!this.isInvincible && !this.isGameOver) {
                this.takeDamage(1);
            }
        });
    }

    // ===============================================================
    // 3. TOP NAVBAR HUD (100% IDENTIK DENGAN CURSE OF THE GOBLIN)
    // ===============================================================
    createGoblinStyleHUD() {
        // A. HP DISPLAY (Top Left: Identik Curse of the Pure Goblin)
        this.healthContainer = this.add.container(16, 13).setDepth(25).setScrollFactor(0);

        // Pill background (134 x 26)
        const hpBg = this.add.rectangle(67, 13, 134, 26, 0x0f172a, 0.85)
            .setInteractive({ useHandCursor: true });

        const hpLabel = this.add.text(8, 4, 'HP', {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#f43f5e',
            fontFamily: FONT_TITLE
        });

        this.hpHeartTexts = [];
        for (let i = 0; i < this.maxHp; i++) {
            const heart = this.add.text(32 + i * 22, 4, '❤️', {
                fontSize: '14px'
            });
            this.hpHeartTexts.push(heart);
        }

        this.hpNumericText = this.add.text(102, 5, `${this.hp}/${this.maxHp}`, {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#fda4af',
            fontFamily: FONT_BODY
        });

        this.healthContainer.add([hpBg, hpLabel, ...this.hpHeartTexts, this.hpNumericText]);
        this.updateHPDisplay();

        // B. QUEST BUTTON (Top Left samping HP: Box Dark Navy + Border Biru)
        this.questBtnContainer = this.add.container(195, 26).setDepth(25).setScrollFactor(0);

        const questBtnBg = this.add.rectangle(0, 0, 72, 34, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x38bdf8)
            .setInteractive({ useHandCursor: true });

        const questBtnText = this.add.text(0, 0, 'Quest', {
            fontSize: '13px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.questBtnContainer.add([questBtnBg, questBtnText]);

        questBtnBg.on('pointerdown', () => this.toggleQuestModal());
        questBtnBg.on('pointerover', () => {
            questBtnBg.setFillStyle(0x1e293b, 1);
            questBtnBg.setStrokeStyle(2, 0x60a5fa);
            this.tweens.add({ targets: this.questBtnContainer, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        questBtnBg.on('pointerout', () => {
            questBtnBg.setFillStyle(0x0f172a, 0.9);
            questBtnBg.setStrokeStyle(2, 0x38bdf8);
            this.tweens.add({ targets: this.questBtnContainer, scaleX: 1, scaleY: 1, duration: 100 });
        });

        // C. INVENTORY BUTTON (Top Right: x=720, y=26, Minimalist White Vector Bag Icon)
        this.bagBtnContainer = this.add.container(720, 26).setDepth(25).setScrollFactor(0);

        const bagBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        // Gambar Ikon Tas Vector
        const bagGraphics = this.add.graphics();
        const drawBagIcon = (color = 0xf8fafc) => {
            bagGraphics.clear();
            bagGraphics.lineStyle(2, color, 1);
            bagGraphics.beginPath();
            bagGraphics.arc(0, -6.5, 3.5, Math.PI, 0, false);
            bagGraphics.strokePath();
            bagGraphics.strokeRoundedRect(-8.5, -5.5, 17, 16, 2.5);
            bagGraphics.beginPath();
            bagGraphics.moveTo(-8.5, 0);
            bagGraphics.lineTo(8.5, 0);
            bagGraphics.strokePath();
            bagGraphics.fillStyle(color, 1);
            bagGraphics.fillRect(-2, -2, 4, 4);
        };
        drawBagIcon(0xf8fafc);

        // Badge jumlah item di tas
        this.bagBadgeBg = this.add.circle(13, -12, 7, 0x10b981, 1);
        this.bagBadgeText = this.add.text(13, -12, `${this.inventory.length}`, {
            fontSize: '9px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.bagBtnContainer.add([bagBtnBg, bagGraphics, this.bagBadgeBg, this.bagBadgeText]);

        bagBtnBg.on('pointerdown', () => this.toggleInventoryModal());
        bagBtnBg.on('pointerover', () => {
            bagBtnBg.setFillStyle(0x1e293b, 1);
            bagBtnBg.setStrokeStyle(2, 0xf59e0b);
            drawBagIcon(0xfde047);
            this.tweens.add({ targets: this.bagBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });
        bagBtnBg.on('pointerout', () => {
            bagBtnBg.setFillStyle(0x0f172a, 0.9);
            bagBtnBg.setStrokeStyle(2, 0x64748b);
            drawBagIcon(0xf8fafc);
            this.tweens.add({ targets: this.bagBtnContainer, scaleX: 1, scaleY: 1, duration: 100 });
        });

        // D. MENU / SETTINGS BUTTON (Top Right: x=765, y=26, Hamburger Icon)
        this.menuBtnContainer = this.add.container(765, 26).setDepth(25).setScrollFactor(0);

        const menuBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        const line1 = this.add.rectangle(0, -6, 18, 2.5, 0xf8fafc, 1);
        const line2 = this.add.rectangle(0, 0, 18, 2.5, 0xf8fafc, 1);
        const line3 = this.add.rectangle(0, 6, 18, 2.5, 0xf8fafc, 1);

        this.menuBtnContainer.add([menuBtnBg, line1, line2, line3]);

        menuBtnBg.on('pointerdown', () => this.toggleSettingsModal());
        menuBtnBg.on('pointerover', () => {
            menuBtnBg.setFillStyle(0x1e293b, 1);
            menuBtnBg.setStrokeStyle(2, 0x38bdf8);
            this.tweens.add({ targets: this.menuBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });
        menuBtnBg.on('pointerout', () => {
            menuBtnBg.setFillStyle(0x0f172a, 0.9);
            menuBtnBg.setStrokeStyle(2, 0x64748b);
            this.tweens.add({ targets: this.menuBtnContainer, scaleX: 1, scaleY: 1, duration: 100 });
        });

        // Buat Popup Modals (Quest, Inventory, & Settings/Resolution)
        this.createQuestModalUI();
        this.createInventoryModalUI();
        this.createSettingsModalUI();
    }

    updateHPDisplay() {
        if (this.hpHeartTexts) {
            for (let i = 0; i < this.maxHp; i++) {
                if (this.hpHeartTexts[i]) {
                    if (i < this.hp) {
                        this.hpHeartTexts[i].setText('❤️');
                        this.hpHeartTexts[i].setAlpha(1);
                    } else {
                        this.hpHeartTexts[i].setText('🖤');
                        this.hpHeartTexts[i].setAlpha(0.35);
                    }
                }
            }
        }
        if (this.hpNumericText) {
            this.hpNumericText.setText(`${this.hp}/${this.maxHp}`);
            if (this.hp <= 1) {
                this.hpNumericText.setFill('#ef4444');
            } else {
                this.hpNumericText.setFill('#fda4af');
            }
        }
    }

    updateInventoryBadge() {
        if (this.bagBadgeText) {
            this.bagBadgeText.setText(`${this.inventory.length}`);
        }
    }

    takeDamage(amount) {
        if (this.isGameOver) return;
        this.hp = Math.max(0, this.hp - amount);
        this.updateHPDisplay();
        this.showFloatingToast('💥 -1 HP Terkena Duri!', 0xef4444);

        if (this.hp === 0) {
            this.triggerGameOver();
            return;
        }

        this.autoSave(false);

        this.isInvincible = true;
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            repeat: 3,
            duration: 120,
            onComplete: () => {
                this.player.setAlpha(1);
                this.isInvincible = false;
            }
        });
    }

    createGameOverModalUI() {
        this.gameOverModal = this.add.container(400, 225).setDepth(60).setVisible(false).setScrollFactor(0);
        const overlay = this.add.rectangle(0, 0, 800, 450, 0x000000, 0.85).setInteractive();
        const box = this.add.rectangle(0, 0, 480, 260, 0x180509, 0.98).setStrokeStyle(2.5, 0xef4444);

        const skull = this.add.text(0, -75, '☠️', { fontSize: '34px' }).setOrigin(0.5);
        const title = this.add.text(0, -32, 'GAME OVER', {
            fontSize: '32px', fontStyle: 'bold', fill: '#ef4444', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        const subtitle = this.add.text(0, 8, 'Karakter Anda telah kehabisan HP!', {
            fontSize: '13px', fill: '#fca5a5', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Tombol 1: Muat Checkpoint Terakhir
        const reloadBtn = this.add.rectangle(0, 56, 240, 36, 0x2563eb, 0.95)
            .setStrokeStyle(1.5, 0x60a5fa)
            .setInteractive({ useHandCursor: true });
        const reloadText = this.add.text(0, 56, '🔄 Muat Checkpoint Terakhir', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        reloadBtn.on('pointerover', () => reloadBtn.setFillStyle(0x1d4ed8, 1));
        reloadBtn.on('pointerout', () => reloadBtn.setFillStyle(0x2563eb, 0.95));
        reloadBtn.on('pointerdown', () => {
            this.isGameOver = false;
            this.gameOverModal.setVisible(false);
            this.scene.restart({ isLoadGame: true });
        });

        // Tombol 2: Kembali ke Menu Utama
        const menuBtn = this.add.rectangle(0, 102, 240, 34, 0x1e293b, 1)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const menuText = this.add.text(0, 102, '🏠 Kembali ke Menu Utama', {
            fontSize: '12px', fontStyle: 'bold', fill: '#cbd5e1', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x334155, 1));
        menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1e293b, 1));
        menuBtn.on('pointerdown', () => {
            this.isGameOver = false;
            this.scene.start('TitleScene');
        });

        this.gameOverModal.add([overlay, box, skull, title, subtitle, reloadBtn, reloadText, menuBtn, menuText]);
    }

    triggerGameOver() {
        this.isGameOver = true;
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
        }
        this.cameras.main.shake(350, 0.018);
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            duration: 450,
            onComplete: () => {
                this.gameOverModal.setVisible(true);
            }
        });
    }

    // ===============================================================
    // 4. KONTROL TOUCH ANDROID / TABLET (IDENTIK GOBLIN GAME)
    // ===============================================================
    createGoblinStyleTouchControls() {
        const isTouchScreen = isMobileOrTablet();
        
        // Di PC / Laptop: Sembunyikan dan nonaktifkan tombol sentuh secara default
        if (!isTouchScreen) {
            this.touchControlsEnabled = false;
            try {
                localStorage.removeItem('template_touch_controls');
            } catch (e) {}
        } else {
            this.touchControlsEnabled = true;
            try {
                const saved = localStorage.getItem('template_touch_controls');
                if (saved !== null) {
                    this.touchControlsEnabled = saved === 'true';
                }
            } catch (e) {}
        }

        this.mobileControlsContainer = this.add.container(0, 0).setDepth(28).setScrollFactor(0);
        this.mobileControlsContainer.setVisible(this.touchControlsEnabled);

        // 1. Tombol Kiri [◀] (x: 62, y: 390)
        this.leftBtnContainer = this.add.container(62, 390);
        const leftBg = this.add.rectangle(0, 0, 56, 56, 0x0f172a, 0.78)
            .setStrokeStyle(2, 0x475569)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 76, 76), Phaser.Geom.Rectangle.Contains);
        const leftIcon = this.add.text(0, 0, '◀', {
            fontSize: '24px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.leftBtnContainer.add([leftBg, leftIcon]);

        leftBg.on('pointerdown', () => {
            this.touchState.left = true;
            leftBg.setFillStyle(0x2563eb, 0.9);
            leftBg.setStrokeStyle(2.5, 0x60a5fa);
            leftIcon.setFill('#ffffff');
            this.tweens.add({ targets: this.leftBtnContainer, scaleX: 0.94, scaleY: 0.94, duration: 80 });
        });
        const releaseLeft = () => {
            this.touchState.left = false;
            leftBg.setFillStyle(0x0f172a, 0.78);
            leftBg.setStrokeStyle(2, 0x475569);
            leftIcon.setFill('#f8fafc');
            this.tweens.add({ targets: this.leftBtnContainer, scaleX: 1, scaleY: 1, duration: 80 });
        };
        leftBg.on('pointerup', releaseLeft);
        leftBg.on('pointerout', releaseLeft);

        // 2. Tombol Kanan [▶] (x: 134, y: 390)
        this.rightBtnContainer = this.add.container(134, 390);
        const rightBg = this.add.rectangle(0, 0, 56, 56, 0x0f172a, 0.78)
            .setStrokeStyle(2, 0x475569)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 76, 76), Phaser.Geom.Rectangle.Contains);
        const rightIcon = this.add.text(0, 0, '▶', {
            fontSize: '24px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.rightBtnContainer.add([rightBg, rightIcon]);

        rightBg.on('pointerdown', () => {
            this.touchState.right = true;
            rightBg.setFillStyle(0x2563eb, 0.9);
            rightBg.setStrokeStyle(2.5, 0x60a5fa);
            rightIcon.setFill('#ffffff');
            this.tweens.add({ targets: this.rightBtnContainer, scaleX: 0.94, scaleY: 0.94, duration: 80 });
        });
        const releaseRight = () => {
            this.touchState.right = false;
            rightBg.setFillStyle(0x0f172a, 0.78);
            rightBg.setStrokeStyle(2, 0x475569);
            rightIcon.setFill('#f8fafc');
            this.tweens.add({ targets: this.rightBtnContainer, scaleX: 1, scaleY: 1, duration: 80 });
        };
        rightBg.on('pointerup', releaseRight);
        rightBg.on('pointerout', releaseRight);

        // 3. Tombol Lompat [▲] (x: 735, y: 390)
        this.jumpBtnContainer = this.add.container(735, 390);
        const jumpBg = this.add.rectangle(0, 0, 58, 58, 0x0f172a, 0.78)
            .setStrokeStyle(2, 0x475569)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 78, 78), Phaser.Geom.Rectangle.Contains);
        const jumpIcon = this.add.text(0, 0, '▲', {
            fontSize: '24px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.jumpBtnContainer.add([jumpBg, jumpIcon]);

        jumpBg.on('pointerdown', () => {
            this.touchState.jump = true;
            jumpBg.setFillStyle(0x2563eb, 0.9);
            jumpBg.setStrokeStyle(2.5, 0x60a5fa);
            jumpIcon.setFill('#ffffff');
            this.tweens.add({ targets: this.jumpBtnContainer, scaleX: 0.94, scaleY: 0.94, duration: 80 });
        });
        const releaseJump = () => {
            this.touchState.jump = false;
            jumpBg.setFillStyle(0x0f172a, 0.78);
            jumpBg.setStrokeStyle(2, 0x475569);
            jumpIcon.setFill('#f8fafc');
            this.tweens.add({ targets: this.jumpBtnContainer, scaleX: 1, scaleY: 1, duration: 80 });
        };
        jumpBg.on('pointerup', releaseJump);
        jumpBg.on('pointerout', releaseJump);

        this.mobileControlsContainer.add([this.leftBtnContainer, this.rightBtnContainer, this.jumpBtnContainer]);
    }

    // ===============================================================
    // 5. MODAL PENGATURAN (DENGAN PENGATUR RESOLUSI & FULLSCREEN)
    // ===============================================================
    createSettingsModalUI() {
        this.settingsModal = this.add.container(400, 225).setDepth(50).setVisible(false).setScrollFactor(0);
        const overlay = this.add.rectangle(0, 0, 800, 450, 0x000000, 0.75).setInteractive();
        const box = this.add.rectangle(0, 0, 520, 320, 0x0f172a, 0.98).setStrokeStyle(2.5, 0xf59e0b);

        const headerBg = this.add.rectangle(0, -125, 520, 38, 0x1e1b4b, 1).setStrokeStyle(1.5, 0x6366f1);
        const header = this.add.text(0, -125, '⚙️ PENGATURAN & RESOLUSI LAYAR', {
            fontSize: '16px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Baris Pengatur Resolusi Layar
        const resLabel = this.add.text(-220, -65, '🖥️ Resolusi Layar:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });

        const resBtn = this.add.rectangle(95, -57, 210, 28, 0x1e3a8a, 0.95)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setInteractive({ useHandCursor: true });

        this.resBtnText = this.add.text(95, -57, DisplayManager.current.label, {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resBtn.on('pointerover', () => resBtn.setFillStyle(0x2563eb, 1));
        resBtn.on('pointerout', () => resBtn.setFillStyle(0x1e3a8a, 0.95));
        resBtn.on('pointerdown', () => {
            const nextRes = DisplayManager.cycleNext();
            this.resBtnText.setText(nextRes.label);
            this.showFloatingToast(`📺 Resolusi: ${nextRes.label}`, 0x38bdf8);
        });

        // Tombol Fullscreen ⛶
        const fsBtn = this.add.rectangle(225, -67, 34, 28, 0x334155, 0.9)
            .setStrokeStyle(1.5, 0x94a3b8)
            .setInteractive({ useHandCursor: true });
        const fsIcon = this.add.text(225, -67, '⛶', { fontSize: '13px', fill: '#ffffff' }).setOrigin(0.5);

        fsBtn.on('pointerover', () => fsBtn.setFillStyle(0x475569, 1));
        fsBtn.on('pointerout', () => fsBtn.setFillStyle(0x334155, 0.9));
        fsBtn.on('pointerdown', () => {
            DisplayManager.toggleFullscreen(this);
        });

        // 2. Baris Tombol Sentuh HP/Tablet (Bisa dinyalakan/dimatikan)
        const touchLabel = this.add.text(-220, -25, '📱 Tombol Sentuh Layar:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });

        this.touchToggleBtn = this.add.rectangle(135, -17, 130, 26, this.touchControlsEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.touchToggleText = this.add.text(135, -17, this.touchControlsEnabled ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.touchToggleBtn.on('pointerdown', () => {
            this.touchControlsEnabled = !this.touchControlsEnabled;
            try {
                localStorage.setItem('template_touch_controls', this.touchControlsEnabled ? 'true' : 'false');
            } catch (e) {}
            this.mobileControlsContainer.setVisible(this.touchControlsEnabled);
            this.touchToggleBtn.setFillStyle(this.touchControlsEnabled ? 0x16a34a : 0xdc2626, 0.9);
            this.touchToggleText.setText(this.touchControlsEnabled ? 'AKTIF [ON]' : 'MATI [OFF]');
            this.showFloatingToast(this.touchControlsEnabled ? '📱 Tombol Layar: AKTIF' : '📱 Tombol Layar: NONAKTIF');
        });

        // Informasi Kontrol Game
        const ctrlTitle = this.add.text(-220, 20, '🎮 PANDUAN KONTROL:', {
            fontSize: '13px', fontStyle: 'bold', fill: '#38bdf8', fontFamily: FONT_BODY
        });

        const ctrlList = this.add.text(-220, 42,
            '• PC / Komputer: Tombol A/D/W atau Panah untuk bergerak & lompat\n' +
            '• Tablet / Android: Tombol sentuh [◀] [▶] [▲] (Otomatis aktif di HP/Tablet)\n' +
            '• [Q] Buka Quest Misi • [I] Buka Tas Inventaris • [ESC] Pengaturan', {
            fontSize: '11px', fill: '#cbd5e1', lineSpacing: 4, fontFamily: FONT_BODY
        });

        // Tombol Baris Bawah: [ 💾 Simpan Game ] [ 🏠 Menu Utama ] [ Tutup [ESC] ]
        const saveManualBtn = this.add.rectangle(-140, 130, 130, 32, 0x15803d, 1)
            .setStrokeStyle(1.5, 0x86efac)
            .setInteractive({ useHandCursor: true });
        const saveManualText = this.add.text(-140, 130, '💾 Simpan Game', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        saveManualBtn.on('pointerdown', () => {
            this.autoSave(true);
            this.showFloatingToast('💾 Progres Berhasil Disimpan Manual!', 0x22c55e);
        });

        const toMenuBtn = this.add.rectangle(0, 130, 120, 32, 0x1e293b, 1)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const toMenuText = this.add.text(0, 130, '🏠 Menu Utama', {
            fontSize: '11px', fontStyle: 'bold', fill: '#cbd5e1', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        toMenuBtn.on('pointerdown', () => {
            this.autoSave(false);
            this.scene.start('TitleScene');
        });

        const closeBtn = this.add.rectangle(130, 130, 110, 32, 0x334155, 1)
            .setStrokeStyle(1.5, 0x94a3b8)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(130, 130, 'Tutup [ESC]', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        closeBtn.on('pointerdown', () => this.toggleSettingsModal(false));
        overlay.on('pointerdown', () => this.toggleSettingsModal(false));

        this.settingsModal.add([
            overlay, box, headerBg, header,
            resLabel, resBtn, this.resBtnText, fsBtn, fsIcon,
            touchLabel, this.touchToggleBtn, this.touchToggleText,
            ctrlTitle, ctrlList,
            saveManualBtn, saveManualText,
            toMenuBtn, toMenuText,
            closeBtn, closeText
        ]);
    }

    toggleSettingsModal(forceState) {
        this.isSettingsOpen = (forceState !== undefined) ? forceState : !this.isSettingsOpen;
        if (this.isSettingsOpen) {
            this.toggleQuestModal(false);
            this.toggleInventoryModal(false);
            if (this.resBtnText) this.resBtnText.setText(DisplayManager.current.label);
        }
        this.settingsModal.setVisible(this.isSettingsOpen);
    }

    createQuestModalUI() {
        this.questModal = this.add.container(400, 225).setDepth(40).setVisible(false).setScrollFactor(0);
        const overlay = this.add.rectangle(0, 0, 800, 450, 0x000000, 0.65).setInteractive();
        const box = this.add.rectangle(0, 0, 460, 270, 0x0b1a32, 0.98).setStrokeStyle(2, 0x38bdf8);

        const header = this.add.text(0, -100, '📋 MISI & QUEST SKELETON', {
            fontSize: '16px', fontStyle: 'bold', fill: '#38bdf8', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.questTitleText = this.add.text(-200, -50, '', {
            fontSize: '14px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        });

        this.questDescText = this.add.text(-200, -15, '', {
            fontSize: '12px', fill: '#cbd5e1', wordWrap: { width: 400 }, lineSpacing: 4, fontFamily: FONT_BODY
        });

        const closeBtn = this.add.rectangle(0, 95, 120, 32, 0x1e293b, 1)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(0, 95, 'Tutup [Q]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        closeBtn.on('pointerdown', () => this.toggleQuestModal(false));
        overlay.on('pointerdown', () => this.toggleQuestModal(false));

        this.questModal.add([overlay, box, header, this.questTitleText, this.questDescText, closeBtn, closeText]);
    }

    toggleQuestModal(forceState) {
        this.isQuestOpen = (forceState !== undefined) ? forceState : !this.isQuestOpen;
        if (this.isQuestOpen) {
            this.toggleInventoryModal(false);
            this.toggleSettingsModal(false);
            this.questTitleText.setText(`🎯 ${this.quest.judul}`);
            this.questDescText.setText(this.quest.deskripsi);
        }
        this.questModal.setVisible(this.isQuestOpen);
    }

    createInventoryModalUI() {
        this.invModal = this.add.container(400, 225).setDepth(40).setVisible(false).setScrollFactor(0);
        const overlay = this.add.rectangle(0, 0, 800, 450, 0x000000, 0.65).setInteractive();
        const box = this.add.rectangle(0, 0, 480, 280, 0x0b1a32, 0.98).setStrokeStyle(2, 0x153154);

        const header = this.add.text(0, -108, '🎒 TAS INVENTARIS SKELETON', {
            fontSize: '15px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.invItemsContainer = this.add.container(0, 0);

        const closeBtn = this.add.rectangle(0, 105, 120, 32, 0x1e293b, 1)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(0, 105, 'Tutup [I]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        closeBtn.on('pointerdown', () => this.toggleInventoryModal(false));
        overlay.on('pointerdown', () => this.toggleInventoryModal(false));

        this.invModal.add([overlay, box, header, this.invItemsContainer, closeBtn, closeText]);
    }

    toggleInventoryModal(forceState) {
        this.isInvOpen = (forceState !== undefined) ? forceState : !this.isInvOpen;
        if (this.isInvOpen) {
            this.toggleQuestModal(false);
            this.toggleSettingsModal(false);
            this.renderInventorySlots();
        }
        this.invModal.setVisible(this.isInvOpen);
    }

    renderInventorySlots() {
        this.invItemsContainer.removeAll(true);

        const startX = -180;
        const startY = -45;
        const slotSize = 72;
        const gap = 18;

        for (let i = 0; i < 4; i++) {
            const x = startX + i * (slotSize + gap);
            const slotBg = this.add.rectangle(x, startY, slotSize, slotSize, 0x04070e, 0.98)
                .setStrokeStyle(2, 0x153154);
            this.invItemsContainer.add(slotBg);

            const item = this.inventory[i];
            if (item) {
                const icon = this.add.text(x, startY - 12, item.icon || '📦', { fontSize: '26px' }).setOrigin(0.5);
                const name = this.add.text(x, startY + 18, item.nama || 'Item', {
                    fontSize: '10px', fill: '#f8fafc', align: 'center', wordWrap: { width: 68 }, fontFamily: FONT_BODY
                }).setOrigin(0.5);
                this.invItemsContainer.add([icon, name]);
            } else {
                const empty = this.add.text(x, startY, 'Kosong', { fontSize: '10px', fill: '#475569', fontFamily: FONT_BODY }).setOrigin(0.5);
                this.invItemsContainer.add(empty);
            }
        }

        const info = this.add.text(0, 42, `Total Barang: ${this.inventory.length} / 4 Slot Digunakan`, {
            fontSize: '12px', fill: '#94a3b8', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.invItemsContainer.add(info);
    }

    showFloatingToast(msg, color = 0x38bdf8) {
        const hexColor = '#' + color.toString(16).padStart(6, '0');
        const toast = this.add.text(this.player.x, this.player.y - 35, msg, {
            fontSize: '11px', fontStyle: 'bold', fill: hexColor, backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }, fontFamily: FONT_BODY
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: toast,
            y: toast.y - 25,
            alpha: 0,
            duration: 1200,
            onComplete: () => toast.destroy()
        });
    }

    update() {
        if (!this.player || !this.player.body) return;

        if (this.isGameOver || this.isQuestOpen || this.isInvOpen || this.isSettingsOpen) {
            this.player.setVelocityX(0);
            return;
        }

        const speed = CONFIG_SKELETON.player.kecepatan || 220;
        const jumpSpeed = -(CONFIG_SKELETON.player.kekuatanLompat || 440);

        const left = (this.cursors && this.cursors.left.isDown) || (this.keys && this.keys.a.isDown) || this.touchState.left;
        const right = (this.cursors && this.cursors.right.isDown) || (this.keys && this.keys.d.isDown) || this.touchState.right;
        const jump = (this.cursors && this.cursors.up.isDown) || (this.keys && this.keys.w.isDown) || (this.keys && this.keys.space.isDown) || this.touchState.jump;

        if (left) {
            this.player.setVelocityX(-speed);
        } else if (right) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        if (jump && (this.player.body.touching.down || this.player.body.blocked.down)) {
            this.player.setVelocityY(jumpSpeed);
        }
    }
}

// ===============================================================
// 6. INISIALISASI PHASER CONFIG (100% SAMA DENGAN GOBLIN GAME)
// ===============================================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3
    },
    resolution: Math.max(2, window.devicePixelRatio || 2),
    render: {
        antialias: false,
        antialiasGL: false,
        roundPixels: true,
        pixelArt: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 650 },
            debug: false
        }
    },
    scene: [BootScene, TitleScene, GameScene]
};

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        window.__templateGame = new Phaser.Game(config);
    });
} else {
    window.__templateGame = new Phaser.Game(config);
}
