import Phaser from 'phaser';
import { CERITA_GAME } from './cerita.js';

// Update judul di header halaman HTML
const titleEl = document.getElementById('game-title');
const groupEl = document.getElementById('group-title');
if (titleEl) titleEl.innerText = `🎮 ${CERITA_GAME.judulGame}`;
if (groupEl) groupEl.innerText = `Karya: ${CERITA_GAME.namaKelompok}`;

// Konversi warna hex string ('#3498db') ke angka hex (0x3498db)
function hexToNum(hexStr, defaultHex = 0x3498db) {
    if (!hexStr) return defaultHex;
    return parseInt(hexStr.replace('#', '0x'), 16) || defaultHex;
}

// ===============================================================
// 1. BOOT SCENE: MEMBUAT TEXTURE GRAFIS SESUAI CONFIG CERITA
// ===============================================================
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.generateTextures();
        this.scene.start('Babak1Scene');
    }

    generateTextures() {
        // Player (Hero)
        const heroColor = hexToNum(CERITA_GAME.hero.warna, 0x3498db);
        const heroG = this.make.graphics({ x: 0, y: 0, add: false });
        heroG.fillStyle(heroColor, 1);
        heroG.fillRoundedRect(0, 0, 32, 44, 6);
        // Mata
        heroG.fillStyle(0xffffff, 1);
        heroG.fillRect(6, 10, 8, 8);
        heroG.fillRect(18, 10, 8, 8);
        heroG.fillStyle(0x111111, 1);
        heroG.fillRect(9, 12, 4, 4);
        heroG.fillRect(21, 12, 4, 4);
        heroG.generateTexture('player_hero', 32, 44);

        // Teman (NPC)
        const npcColor = hexToNum(CERITA_GAME.babak1.teman.warna, 0xe67e22);
        const npcG = this.make.graphics({ x: 0, y: 0, add: false });
        npcG.fillStyle(npcColor, 1);
        npcG.fillRoundedRect(0, 0, 32, 42, 6);
        // Mata
        npcG.fillStyle(0xffffff, 1);
        npcG.fillRect(6, 10, 6, 6);
        npcG.fillRect(20, 10, 6, 6);
        npcG.fillStyle(0x111111, 1);
        npcG.fillRect(8, 12, 3, 3);
        npcG.fillRect(22, 12, 3, 3);
        npcG.generateTexture('npc_friend', 32, 42);

        // Musuh (Monster)
        const monsterColor = hexToNum(CERITA_GAME.babak2.musuh.warna, 0x7f1d1d);
        const monsterG = this.make.graphics({ x: 0, y: 0, add: false });
        monsterG.fillStyle(monsterColor, 1);
        monsterG.fillRoundedRect(0, 0, 42, 48, 8);
        // Mata merah menyeramkan
        monsterG.fillStyle(0xef4444, 1);
        monsterG.fillRect(8, 12, 8, 8);
        monsterG.fillRect(26, 12, 8, 8);
        monsterG.generateTexture('monster_enemy', 42, 48);

        // Barang Senjata / Item Misi
        const itemColor = hexToNum(CERITA_GAME.babak1.barangMisi.warna, 0xfacc15);
        const itemG = this.make.graphics({ x: 0, y: 0, add: false });
        itemG.fillStyle(itemColor, 1);
        itemG.fillRect(8, 0, 6, 22);
        itemG.fillStyle(0xef4444, 1);
        itemG.fillRect(3, 16, 16, 5);
        itemG.generateTexture('item_weapon', 22, 24);

        // Hadiah Kemenangan
        const giftG = this.make.graphics({ x: 0, y: 0, add: false });
        giftG.fillStyle(0x38bdf8, 1);
        giftG.fillCircle(14, 14, 12);
        giftG.fillStyle(0xffffff, 0.8);
        giftG.fillRect(10, 8, 8, 8);
        giftG.generateTexture('item_trophy', 28, 28);

        // Pintu
        const doorG = this.make.graphics({ x: 0, y: 0, add: false });
        doorG.fillStyle(0x451a03, 1);
        doorG.fillRect(0, 0, 42, 65);
        doorG.fillStyle(0xf59e0b, 1);
        doorG.fillCircle(32, 35, 4);
        doorG.generateTexture('door_wood', 42, 65);

        // Platform / Tanah dasar
        const groundG = this.make.graphics({ x: 0, y: 0, add: false });
        groundG.fillStyle(0x1e293b, 1);
        groundG.fillRect(0, 0, 400, 32);
        groundG.fillStyle(0x22c55e, 1);
        groundG.fillRect(0, 0, 400, 6);
        groundG.generateTexture('ground_platform', 400, 32);
    }
}

// ===============================================================
// 2. KELAS DASAR SCENE (Fungsi Bersama: Dialog, HUD, Gerakan)
// ===============================================================
class BaseStoryScene extends Phaser.Scene {
    setupPlayer(x, y) {
        this.player = this.physics.add.sprite(x, y, 'player_hero').setDepth(5);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            f: Phaser.Input.Keyboard.KeyCodes.F,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Nama Hero melayang di atas kepala
        this.heroTag = this.add.text(this.player.x, this.player.y - 28, CERITA_GAME.hero.nama, {
            fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', backgroundColor: '#00000088', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(6);
    }

    updatePlayerMovement() {
        if (!this.player || this.isTalking) {
            if (this.player) this.player.setVelocityX(0);
            return;
        }

        const speed = CERITA_GAME.hero.kecepatan || 200;
        const jumpSpeed = -(CERITA_GAME.hero.kekuatanLompat || 400);

        if (this.cursors.left.isDown || this.keys.a.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.keys.d.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.keys.w.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(jumpSpeed);
        }

        if (this.heroTag) {
            this.heroTag.setPosition(this.player.x, this.player.y - 28);
        }
    }

    createDialogueBox() {
        this.dialogContainer = this.add.container(400, 360).setDepth(30).setVisible(false);
        const bg = this.add.rectangle(0, 0, 720, 110, 0x0f172a, 0.95)
            .setStrokeStyle(3, 0xf59e0b)
            .setInteractive();

        this.speakerText = this.add.text(-330, -38, '', {
            fontSize: '14px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: 'Segoe UI'
        });

        this.speechText = this.add.text(-330, -12, '', {
            fontSize: '13px', fill: '#f1f5f9', fontFamily: 'Segoe UI', wordWrap: { width: 660 }
        });

        this.dialogNextHint = this.add.text(330, 35, 'Tekan [E] atau [Spasi] untuk Lanjut ➔', {
            fontSize: '11px', fill: '#94a3b8'
        }).setOrigin(1, 0.5);

        this.dialogContainer.add([bg, this.speakerText, this.speechText, this.dialogNextHint]);
        this.isTalking = false;
        this.dialogQueue = [];

        this.input.keyboard.on('keydown-E', () => this.advanceDialogue());
        this.input.keyboard.on('keydown-SPACE', () => this.advanceDialogue());
        bg.on('pointerdown', () => this.advanceDialogue());
    }

    startDialogue(speaker, messages, onComplete) {
        this.isTalking = true;
        this.dialogQueue = [...messages];
        this.dialogSpeaker = speaker;
        this.dialogOnComplete = onComplete;
        this.dialogContainer.setVisible(true);
        this.showNextMessage();
    }

    showNextMessage() {
        if (this.dialogQueue.length === 0) {
            this.dialogContainer.setVisible(false);
            this.isTalking = false;
            if (this.dialogOnComplete) this.dialogOnComplete();
            return;
        }
        const msg = this.dialogQueue.shift();
        this.speakerText.setText(`💬 ${this.dialogSpeaker}`);
        this.speechText.setText(msg);
    }

    advanceDialogue() {
        if (this.isTalking) {
            this.showNextMessage();
        }
    }

    showNotice(text, color = '#facc15') {
        const notice = this.add.text(400, 120, text, {
            fontSize: '13px', fontStyle: 'bold', fill: color, backgroundColor: '#000000cc', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(25);

        this.tweens.add({
            targets: notice,
            alpha: 0,
            y: 90,
            duration: 2500,
            ease: 'Power2',
            onComplete: () => notice.destroy()
        });
    }
}

// ===============================================================
// 3. BABAK 1 SCENE: TEMPAT AWAL & PERSIAPAN MISI
// ===============================================================
class Babak1Scene extends BaseStoryScene {
    constructor() {
        super({ key: 'Babak1Scene' });
    }

    create() {
        const b1 = CERITA_GAME.babak1;
        this.cameras.main.setBackgroundColor(b1.warnaLangit || '#1e293b');

        // Latar Hiasan (Bintang / Bukit Sederhana)
        const bgG = this.add.graphics().setDepth(0);
        for (let i = 0; i < 20; i++) {
            this.add.circle(Phaser.Math.Between(20, 780), Phaser.Math.Between(20, 180), Phaser.Math.Between(1, 2), 0xfef08a, 0.6);
        }
        // Pohon Hiasan
        bgG.fillStyle(0x166534, 0.8);
        bgG.fillCircle(120, 360, 45);
        bgG.fillCircle(640, 360, 50);

        // Judul Tempat di pojok kiri atas
        this.add.text(16, 16, b1.namaTempat, {
            fontSize: '15px', fontStyle: 'bold', fill: '#38bdf8'
        }).setDepth(20);

        // Platform / Tanah
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'ground_platform').setScale(2, 1).refreshBody().setDepth(2);

        // Hero Pemain
        this.setupPlayer(80, 380);

        // Karakter Teman (NPC)
        this.friend = this.physics.add.staticSprite(b1.teman.posisiX || 250, 396, 'npc_friend').setDepth(4);
        this.friendNameTag = this.add.text(this.friend.x, this.friend.y - 28, b1.teman.nama, {
            fontSize: '11px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#00000088', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(6);

        // Barang Misi
        this.hasItem = this.registry.get('hasWeapon') || false;
        if (!this.hasItem) {
            this.item = this.physics.add.staticSprite(b1.barangMisi.posisiX || 520, 405, 'item_weapon').setDepth(4);
            this.itemTag = this.add.text(this.item.x, this.item.y - 20, `${b1.barangMisi.icon} ${b1.barangMisi.nama}`, {
                fontSize: '11px', fontStyle: 'bold', fill: '#facc15'
            }).setOrigin(0.5).setDepth(6);
        }

        // Pintu Menuju Babak 2
        this.door = this.physics.add.staticSprite(b1.pintu.posisiX || 720, 385, 'door_wood').setDepth(3);
        this.add.text(this.door.x, 340, b1.pintu.tulisan, {
            fontSize: '11px', fontStyle: 'bold', fill: '#4ade80'
        }).setOrigin(0.5).setDepth(6);

        // Prompt Bantuan [E]
        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#fde047', backgroundColor: '#000000dd', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        // HUD Tas
        this.hudItem = this.add.text(780, 20, this.hasItem ? `🎒 Tas: [${b1.barangMisi.nama}]` : '🎒 Tas: (Kosong)', {
            fontSize: '12px', fontStyle: 'bold', fill: this.hasItem ? '#34d399' : '#94a3b8'
        }).setOrigin(1, 0.5).setDepth(20);

        this.createDialogueBox();

        // Sambutan otomatis saat pertama main
        if (!this.registry.get('introSpoken')) {
            this.registry.set('introSpoken', true);
            this.time.delayedCall(400, () => {
                this.startDialogue(b1.teman.nama, b1.teman.dialog);
            });
        }
    }

    update() {
        this.updatePlayerMovement();

        const b1 = CERITA_GAME.babak1;
        const distFriend = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.friend.x, this.friend.y);
        const distDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y);

        // Cek dekat Teman
        if (distFriend < 60) {
            this.promptText.setPosition(this.friend.x, this.friend.y - 45);
            this.promptText.setText(`Tekan [E] untuk bicara dengan ${b1.teman.nama}`);
            this.promptText.setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keys.e) && !this.isTalking) {
                this.startDialogue(b1.teman.nama, b1.teman.dialog);
            }
        }
        // Cek ambil barang
        else if (this.item && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.item.x, this.item.y) < 40) {
            this.hasItem = true;
            this.registry.set('hasWeapon', true);
            this.item.destroy();
            this.itemTag.destroy();
            this.item = null;
            this.hudItem.setText(`🎒 Tas: [${b1.barangMisi.nama}]`).setStyle({ fill: '#34d399' });
            this.showNotice(b1.barangMisi.pesanDapat);
        }
        // Cek dekat pintu
        else if (distDoor < 50) {
            this.promptText.setPosition(this.door.x, this.door.y - 45);
            this.promptText.setText('Tekan [E] Masuk Pintu');
            this.promptText.setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                if (!this.hasItem) {
                    this.showNotice(b1.pintu.pesanTerkunci, '#ef4444');
                } else {
                    this.scene.start('Babak2Scene');
                }
            }
        } else {
            this.promptText.setVisible(false);
        }
    }
}

// ===============================================================
// 4. BABAK 2 SCENE: TEMPAT TANTANGAN & LAWAN MUSUH
// ===============================================================
class Babak2Scene extends BaseStoryScene {
    constructor() {
        super({ key: 'Babak2Scene' });
    }

    create() {
        const b2 = CERITA_GAME.babak2;
        this.cameras.main.setBackgroundColor(b2.warnaLangit || '#0f172a');

        // Latar Hutan Seram Sederhana
        const bgG = this.add.graphics().setDepth(0);
        bgG.fillStyle(0x1e1b4b, 0.8);
        bgG.fillTriangle(100, 418, 180, 200, 260, 418);
        bgG.fillTriangle(450, 418, 550, 220, 650, 418);

        // Judul Tempat
        this.add.text(16, 16, b2.namaTempat, {
            fontSize: '15px', fontStyle: 'bold', fill: '#f87171'
        }).setDepth(20);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'ground_platform').setScale(2, 1).refreshBody().setDepth(2);

        // Hero Pemain di sebelah kiri
        this.setupPlayer(80, 380);

        // Musuh
        this.monsterHP = b2.musuh.nyawa || 3;
        this.maxHP = this.monsterHP;
        this.isMonsterDefeated = false;

        this.monster = this.physics.add.sprite(b2.musuh.posisiX || 550, 375, 'monster_enemy').setDepth(4);
        this.monster.setCollideWorldBounds(true);
        this.physics.add.collider(this.monster, this.platforms);

        this.monsterNameTag = this.add.text(this.monster.x, this.monster.y - 30, b2.musuh.nama, {
            fontSize: '11px', fontStyle: 'bold', fill: '#ef4444', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(6);

        this.monsterHpText = this.add.text(this.monster.x, this.monster.y - 14, `❤️ HP: ${this.monsterHP}/${this.maxHP}`, {
            fontSize: '10px', fontStyle: 'bold', fill: '#f87171'
        }).setOrigin(0.5).setDepth(6);

        // Petunjuk Serang
        this.battleHint = this.add.text(400, 90, b2.musuh.petunjukSerang, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(20);

        // Hadiah Kemenangan (Awalnya tersembunyi)
        this.trophy = null;

        // Pintu Pulang (Muncul setelah menang)
        this.doorHome = this.physics.add.staticSprite(b2.pintuPulang.posisiX || 720, 385, 'door_wood').setDepth(3).setVisible(false);
        this.doorHomeText = this.add.text(720, 340, b2.pintuPulang.tulisan, {
            fontSize: '11px', fontStyle: 'bold', fill: '#4ade80'
        }).setOrigin(0.5).setDepth(6).setVisible(false);

        // Modal Ending / Kemenangan
        this.createVictoryModal();
        this.createDialogueBox();
    }

    update() {
        this.updatePlayerMovement();

        if (!this.isMonsterDefeated && this.monster) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y);

            // Menyerang Musuh dengan Spasi atau F
            if (dist < 75 && (Phaser.Input.Keyboard.JustDown(this.keys.space) || Phaser.Input.Keyboard.JustDown(this.keys.f))) {
                this.hitMonster();
            }
        }

        // Cek ambil piala/hadiah
        if (this.trophy && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.trophy.x, this.trophy.y) < 40) {
            this.trophy.destroy();
            this.trophy = null;
            this.showNotice(CERITA_GAME.babak2.hadiah.pesanDapat);
            this.doorHome.setVisible(true);
            this.doorHomeText.setVisible(true);
        }

        // Cek masuk pintu ending
        if (this.doorHome.visible && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.doorHome.x, this.doorHome.y) < 45) {
            this.showVictoryModal();
        }
    }

    hitMonster() {
        this.monsterHP--;
        this.monsterHpText.setText(`❤️ HP: ${this.monsterHP}/${this.maxHP}`);

        // Efek kedip saat monster terpukul
        this.tweens.add({
            targets: this.monster,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 2
        });

        if (this.monsterHP <= 0) {
            this.isMonsterDefeated = true;
            this.battleHint.setVisible(false);
            this.monsterHpText.destroy();

            this.showNotice('💥 MONSTER KALAH!', '#4ade80');

            this.tweens.add({
                targets: [this.monster, this.monsterNameTag],
                alpha: 0,
                y: this.monster.y + 20,
                duration: 600,
                onComplete: () => {
                    this.monster.destroy();
                    this.monsterNameTag.destroy();
                    this.spawnTrophy();
                }
            });
        }
    }

    spawnTrophy() {
        const b2 = CERITA_GAME.babak2;
        this.trophy = this.physics.add.staticSprite(b2.hadiah.posisiX || 550, 405, 'item_trophy').setDepth(5);
        this.add.text(this.trophy.x, this.trophy.y - 22, `${b2.hadiah.icon} ${b2.hadiah.nama}`, {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8'
        }).setOrigin(0.5).setDepth(6);

        this.startDialogue('Info Cerita', [b2.musuh.pesanKalah]);
    }

    createVictoryModal() {
        this.victoryContainer = this.add.container(400, 225).setDepth(50).setVisible(false);

        const overlay = this.add.rectangle(0, 0, 800, 450, 0x000000, 0.75).setInteractive();
        const box = this.add.rectangle(0, 0, 600, 320, 0x1e293b, 0.98).setStrokeStyle(3, 0xf59e0b);

        const title = this.add.text(0, -110, CERITA_GAME.ending.judul, {
            fontSize: '18px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: 'Segoe UI'
        }).setOrigin(0.5);

        const group = this.add.text(0, -75, `Dibuat Oleh: ${CERITA_GAME.namaKelompok}`, {
            fontSize: '13px', fontStyle: 'bold', fill: '#38bdf8', fontFamily: 'Segoe UI'
        }).setOrigin(0.5);

        const message = this.add.text(0, -15, CERITA_GAME.ending.pesan, {
            fontSize: '13px', fill: '#f1f5f9', fontFamily: 'Segoe UI', align: 'center', wordWrap: { width: 520 }
        }).setOrigin(0.5);

        const moral = this.add.text(0, 55, CERITA_GAME.ending.pesanMoral, {
            fontSize: '12px', fontStyle: 'italic', fill: '#a7f3d0', fontFamily: 'Segoe UI', align: 'center', wordWrap: { width: 520 }
        }).setOrigin(0.5);

        // Tombol Main Lagi
        const restartBtn = this.add.rectangle(0, 115, 160, 36, 0x16a34a, 1)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const restartText = this.add.text(0, 115, '🔄 Main Lagi', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => {
            this.registry.set('hasWeapon', false);
            this.registry.set('introSpoken', false);
            this.scene.start('Babak1Scene');
        });

        this.victoryContainer.add([overlay, box, title, group, message, moral, restartBtn, restartText]);
    }

    showVictoryModal() {
        this.victoryContainer.setVisible(true);
    }
}

// ===============================================================
// 5. KONFIGURASI GAME PHASER
// ===============================================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: [BootScene, Babak1Scene, Babak2Scene]
};

new Phaser.Game(config);
