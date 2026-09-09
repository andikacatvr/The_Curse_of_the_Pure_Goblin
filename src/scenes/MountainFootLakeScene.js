import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import {
    setQuestState,
    TOTAL_FIREWOOD,
    isFirewoodCollected,
    addCollectedFirewood
} from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class MountainFootLakeScene extends BaseScene {
    constructor() {
        super({ key: 'MountainFootLakeScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e1435');
        this.createMountainFootAtmosphere();

        this.currentLocationName = 'Ujung Danau Kaki Gunung (Mencari Kayu)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'platform').setScale(2.5, 1).refreshBody();

        let startX = 720;
        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // 2 Batang Kayu Bakar di Ujung Danau Kaki Gunung
        this.woodGroup = this.physics.add.staticGroup();
        const mountainWoodPositions = [
            { id: 'mountain_wood_1', x: 240, y: 412 },
            { id: 'mountain_wood_2', x: 500, y: 412 }
        ];

        mountainWoodPositions.forEach(pos => {
            if (!isFirewoodCollected(this.registry, pos.id)) {
                const w = this.woodGroup.create(pos.x, pos.y, 'special_firewood');
                w.woodId = pos.id;
                w.type = 'firewood';
                w.setDepth(4);
            }
        });

        // Batu Prasasti Kuno di Kaki Gunung
        this.monument = this.physics.add.staticSprite(80, 395, 'platform').setDisplaySize(28, 38).setVisible(false);
        this.monumentVisual = this.add.container(80, 400).setDepth(4);
        const mBase = this.add.rectangle(0, 8, 36, 12, 0x1e293b).setStrokeStyle(1.5, 0x475569);
        const mPillar = this.add.rectangle(0, -6, 24, 28, 0x334155).setStrokeStyle(1.5, 0x64748b);
        const mTop = this.add.triangle(0, -22, -12, 0, 12, 0, 0, -10, 0x1e293b).setStrokeStyle(1, 0x64748b);
        const mRune = this.add.text(0, -6, 'ᛟ', { fontSize: '13px', fill: '#93c5fd' }).setOrigin(0.5);
        this.monumentVisual.add([mBase, mPillar, mTop, mRune]);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        // Petunjuk Arah (Navigasi Map di Atas)
        this.leftHint = this.add.text(20, 65, '▲ Tebing Curam Kaki Gunung\n(Jalur Tertutup Salju)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#94a3b8', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);

        this.rightExitText = this.add.text(780, 65, 'Kembali ke Hutan Danau ➔\n(Jalan ke Kanan)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        if (!this.registry.get('mountainFootIntroPlayed')) {
            this.registry.set('mountainFootIntroPlayed', true);
            this.time.delayedCall(400, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Wah... Ini dia Ujung Danau tepat di bawah kaki pegunungan megah! Hawa dingin dari lereng gunung begitu menusuk tulang.' },
                    { speaker: 'Aksel (Dalam Hati)', text: 'Lihat, ada banyak potongan kayu pinus tua di sekitar tepi danau ini. Aku bisa mengambilnya untuk kayu bakar perapian!' }
                ]);
            });
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    createMountainFootAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. SKY GRADIENT (Rich Senja / Alpine Twilight Sunset Sky)
        bgG.fillGradientStyle(0x181230, 0x27173e, 0x662241, 0xb45309, 1);
        bgG.fillRect(0, 0, 800, 420);

        // Radiant Sunset Horizon Glow
        bgG.fillGradientStyle(0x9a3412, 0xc2410c, 0xf59e0b, 0xfbbf24, 0.5);
        bgG.fillRect(0, 150, 800, 150);

        // Setting Sun sinking behind the mountain peaks
        bgG.fillStyle(0xf97316, 0.2);
        bgG.fillCircle(630, 170, 72);
        bgG.fillStyle(0xfbbf24, 0.35);
        bgG.fillCircle(630, 170, 44);
        bgG.fillStyle(0xfde047, 0.9);
        bgG.fillCircle(630, 170, 22);
        bgG.fillStyle(0xfffbeb, 0.95);
        bgG.fillCircle(630, 170, 13);

        // Soft Senja Clouds (Lembayung Senja)
        const sunsetClouds = [
            { x: 70, y: 65, w: 130, h: 22, col: 0xf43f5e },
            { x: 310, y: 45, w: 150, h: 25, col: 0xfb923c },
            { x: 530, y: 80, w: 120, h: 20, col: 0xfbbf24 },
            { x: 670, y: 105, w: 100, h: 18, col: 0xf472b6 }
        ];
        sunsetClouds.forEach(c => {
            bgG.fillStyle(c.col, 0.22);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 10);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 4, c.h * 0.65);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 5, c.h * 0.8);
        });

        // Early Twilight Stars (Bintang Senja di Langit Atas)
        for (let i = 0; i < 12; i++) {
            const sx = Phaser.Math.Between(20, 780);
            const sy = Phaser.Math.Between(10, 85);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.75)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.15, to: 0.75 },
                scale: { from: 0.8, to: 1.25 },
                duration: Phaser.Math.Between(2000, 3800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 2. TOWERING MOUNTAINS IN SENJA SILHOUETTE (Pegunungan Senja Megah)
        bgG.fillStyle(0x231638, 1);
        bgG.fillTriangle(-80, 410, 80, 40, 260, 410);
        bgG.fillStyle(0x2d1a45, 1);
        bgG.fillTriangle(-20, 410, 150, 70, 360, 410);
        bgG.fillTriangle(140, 410, 310, 95, 480, 410);

        // Distant peaks to the right (catching warm sunset glow)
        bgG.fillStyle(0x452055, 0.95);
        bgG.fillTriangle(380, 410, 540, 130, 700, 410);
        bgG.fillStyle(0x38194a, 0.95);
        bgG.fillTriangle(580, 410, 720, 150, 880, 410);

        // Snowcaps on peaks with Alpenglow (Pantulan Merona Sinar Senja di Salju)
        bgG.fillStyle(0xffe4e6, 0.95);
        bgG.fillTriangle(68, 65, 80, 40, 92, 65);
        bgG.fillTriangle(135, 95, 150, 70, 165, 95);
        bgG.fillTriangle(295, 120, 310, 95, 325, 120);
        bgG.fillTriangle(525, 150, 540, 130, 555, 150);

        // Golden peak highlights
        bgG.fillStyle(0xfef08a, 0.85);
        bgG.fillTriangle(76, 50, 80, 40, 84, 50);
        bgG.fillTriangle(146, 80, 150, 70, 154, 80);
        bgG.fillTriangle(306, 105, 310, 95, 314, 105);

        // Helper to draw filled polygon safely with Phaser Graphics
        const drawPoly = (coords, color, alpha = 1) => {
            if (coords.length < 4) return;
            bgG.fillStyle(color, alpha);
            bgG.beginPath();
            bgG.moveTo(coords[0], coords[1]);
            for (let i = 2; i < coords.length; i += 2) {
                bgG.lineTo(coords[i], coords[i + 1]);
            }
            bgG.closePath();
            bgG.fillPath();
        };

        // Giant Left Cliff Base (Close foreground cliff)
        drawPoly([
            -40, 412,
            -40, 90,
            60, 140,
            110, 220,
            160, 310,
            180, 412
        ], 0x241e35, 1);

        // Rocky cliff facets & fissures
        drawPoly([
            -20, 412,
            0, 180,
            50, 240,
            90, 340,
            110, 412
        ], 0x191426, 0.9);

        drawPoly([
            40, 200,
            80, 240,
            110, 230,
            80, 190
        ], 0x3a2c50, 0.8);

        // Mountain snow patches on cliff shelves (Alpenglow tint)
        bgG.fillStyle(0xffe4e6, 0.92);
        bgG.fillRoundedRect(35, 185, 32, 5, 2);
        bgG.fillRoundedRect(85, 275, 45, 6, 2);
        bgG.fillRoundedRect(130, 345, 36, 5, 2);

        // 3. TRANQUIL LAKE EDGE & COVE IN SENJA (Ujung Danau Berkilau Senja)
        bgG.fillStyle(0x131934, 1);
        bgG.fillRect(150, 280, 650, 130);
        // Sky reflection on lake
        bgG.fillGradientStyle(0xb45309, 0xbe123c, 0x1e3a8a, 0x0284c7, 0.45);
        bgG.fillRect(150, 280, 650, 70);

        // Lake Shore Bank
        bgG.fillStyle(0x14532d, 0.95);
        bgG.fillRect(0, 405, 800, 15);
        bgG.fillStyle(0x365314, 1);
        bgG.fillRect(0, 403, 800, 3);

        // Lake ripples (Golden sunset reflection)
        for (let r = 0; r < 7; r++) {
            const rx = Phaser.Math.Between(200, 750);
            const ry = Phaser.Math.Between(290, 395);
            const rw = Phaser.Math.Between(35, 80);
            const col = (r % 2 === 0) ? 0xfcd34d : 0x67e8f9;
            const ripple = this.add.rectangle(rx, ry, rw, 2.5, col, 0.45).setDepth(1);
            this.tweens.add({
                targets: ripple,
                alpha: { from: 0.15, to: 0.65 },
                scaleX: { from: 0.8, to: 1.2 },
                duration: Phaser.Math.Between(1800, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Shoreline rocks and boulders
        const boulders = [
            { x: 140, y: 408, w: 28, h: 14, col: 0x334155 },
            { x: 175, y: 410, w: 22, h: 11, col: 0x475569 },
            { x: 370, y: 411, w: 18, h: 9, col: 0x334155 },
            { x: 590, y: 409, w: 26, h: 13, col: 0x1e293b },
            { x: 730, y: 410, w: 20, h: 10, col: 0x475569 }
        ];
        boulders.forEach(b => {
            bgG.fillStyle(b.col, 1);
            bgG.fillRoundedRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 4);
            bgG.fillStyle(0x65a30d, 0.8);
            bgG.fillRoundedRect(b.x - b.w / 2 + 2, b.y - b.h / 2, b.w - 4, 3, 1);
        });

        // Reeds and Cattails
        const reedX = [190, 330, 420, 560, 670];
        reedX.forEach(rx => {
            bgG.fillStyle(0x166534, 1);
            bgG.fillRect(rx, 375, 3, 30);
            bgG.fillRect(rx + 5, 380, 2.5, 25);
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRoundedRect(rx - 1, 372, 5, 12, 2);
        });

        // 4. ALPINE PINES & FOREGROUND VEGETATION
        const pines = [
            { x: 120, w: 60, h: 230 },
            { x: 320, w: 65, h: 210 },
            { x: 530, w: 70, h: 245 },
            { x: 690, w: 65, h: 225 }
        ];
        pines.forEach(p => {
            bgG.fillStyle(0x271910, 1);
            bgG.fillRect(p.x + p.w * 0.42, 412 - p.h * 0.35, p.w * 0.16, p.h * 0.35);
            bgG.fillStyle(0x062818, 0.95);
            bgG.fillTriangle(p.x, 412 - p.h * 0.18, p.x + p.w * 0.5, 412 - p.h * 0.6, p.x + p.w, 412 - p.h * 0.18);
            bgG.fillStyle(0x0a3c24, 0.95);
            bgG.fillTriangle(p.x + 4, 412 - p.h * 0.45, p.x + p.w * 0.5, 412 - p.h * 0.85, p.x + p.w - 4, 412 - p.h * 0.45);
            bgG.fillStyle(0x14532d, 1);
            bgG.fillTriangle(p.x + 8, 412 - p.h * 0.7, p.x + p.w * 0.5, 412 - p.h, p.x + p.w - 8, 412 - p.h * 0.7);
        });

        // Glowing Alpine Wisps / Evening Spores (Lembayung Emas)
        for (let i = 0; i < 16; i++) {
            const fx = Phaser.Math.Between(40, 760);
            const fy = Phaser.Math.Between(240, 400);
            const col = (i % 2 === 0) ? 0xfde047 : 0x7dd3fc;
            const ff = this.add.circle(fx, fy, Phaser.Math.Between(1.5, 2.5), col, 0.75).setDepth(2);
            this.tweens.add({
                targets: ff,
                x: fx + Phaser.Math.Between(-25, 25),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.85 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(2000, 3800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'firewood') {
                this.collectMountainFirewood(this.nearTarget.sprite);
            } else if (this.nearTarget.type === 'monument') {
                this.startDialogue([
                    { speaker: 'Prasasti Kaki Gunung', text: '🏛️ "Jalur Pendakian Puncak Salju Abadi — Badai es abadi menjaga puncak tertinggi."' },
                    { speaker: 'Aksel', text: 'Tebing gunung di sini sangat terjal dan jalurnya membeku... Aku harus fokus mengumpulkan kayu bakar untuk Nenek dan Rachael.' }
                ]);
            }
        }
    }

    collectMountainFirewood(woodSprite) {
        const woodId = woodSprite.woodId;
        const count = addCollectedFirewood(this.registry, woodId);

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `🪵 Kayu Bakar (${count}/${TOTAL_FIREWOOD})!`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#f59e0b', backgroundColor: '#000000bb', padding: { x: 5, y: 3 }
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        GameAudio.playClick();
        woodSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (count >= TOTAL_FIREWOOD) {
            this.registry.set('hasCollectedFirewood', true);

            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Kayu Bakar Terkumpul!',
                objective: '4 ikat kayu bakar sudah terkumpul! Bawa pulang ke Rumah Nenek & Rachael di sebelah kanan [➔].',
                questNumber: 0
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: 'Aksel', text: 'Alhamdulillah, semua 4 ikat kayu bakar sudah terkumpul lengkap dari danau dan kaki gunung!' },
                { speaker: 'Aksel', text: 'Sekarang aku harus segera kembali ke Hutan Danau di sebelah kanan [➔] lalu pulang ke rumah Nenek dan Rachael!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Mencari Kayu Bakar di Hutan Danau',
                objective: `Kumpulkan kayu bakar di Hutan Danau & Ujung Danau Kaki Gunung (${count}/${TOTAL_FIREWOOD}).`,
                questNumber: 0
            });
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;

        this.woodGroup.children.iterate((w) => {
            if (w && w.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) < 50) {
                found = { type: 'firewood', sprite: w, x: w.x, y: w.y - 25, prompt: 'Tekan [E] Ambil Kayu Bakar' };
            }
        });

        if (!found && Phaser.Math.Distance.Between(this.player.x, this.player.y, 80, 400) < 55) {
            found = { type: 'monument', x: 80, y: 360, prompt: 'Tekan [E] Periksa Prasasti Kaki Gunung' };
        }

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: false,
            minX: 20,
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('LakeForestScene', { from: 'MountainFootLakeScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 2: FOREST TRAIL SCENE (PINGGIR HUTAN)
// -------------------------------------------------------------
