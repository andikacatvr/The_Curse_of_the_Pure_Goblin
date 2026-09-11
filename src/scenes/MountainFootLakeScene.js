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
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(2);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

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
        // 1. Panoramic Snowy Mountain Lake Background (Pixel Art Danau Kaki Gunung Megah)
        this.add.image(400, 225, 'mountain_foot_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Alpine Mountain Mist & Chill Fog (Kabut Dingin Kaki Gunung Salju yang Melayang)
        const mistClouds = [
            { x: 140, y: 310, w: 250, h: 26, dur: 14000, dist: 80 },
            { x: 360, y: 290, w: 280, h: 28, dur: 18000, dist: -90 },
            { x: 580, y: 320, w: 230, h: 22, dur: 13000, dist: 70 },
            { x: 260, y: 340, w: 310, h: 25, dur: 15000, dist: -80 }
        ];

        mistClouds.forEach((m) => {
            const mist = this.add.graphics().setDepth(1);
            mist.fillStyle(0xe0f2fe, 0.09);
            mist.fillRoundedRect(m.x, m.y, m.w, m.h, 12);
            mist.fillStyle(0xbae6fd, 0.07);
            mist.fillCircle(m.x + m.w * 0.35, m.y + 2, m.h * 0.75);
            mist.fillCircle(m.x + m.w * 0.65, m.y - 2, m.h * 0.85);

            this.tweens.add({
                targets: mist,
                x: m.dist,
                alpha: { from: 0.6, to: 1.05 },
                duration: m.dur,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 3. Dynamic Water Shimmer & Mountain Reflection Waves (Kilauan Riak Air Danau Pemantul Gunung)
        const lakeRipples = [
            { x: 280, y: 305, w: 60, h: 2.5, col: 0x99f6e4, dur: 2300 },
            { x: 420, y: 320, w: 75, h: 2.8, col: 0xfef08a, dur: 2700 },
            { x: 560, y: 315, w: 85, h: 2.5, col: 0x99f6e4, dur: 3100 },
            { x: 350, y: 345, w: 90, h: 3.0, col: 0xfde047, dur: 2500 },
            { x: 510, y: 350, w: 100, h: 3.2, col: 0x67e8f9, dur: 2900 },
            { x: 420, y: 375, w: 120, h: 3.5, col: 0x99f6e4, dur: 2600 },
            { x: 620, y: 365, w: 80, h: 3.0, col: 0xfef08a, dur: 3300 }
        ];

        lakeRipples.forEach((wr, i) => {
            const rip = this.add.rectangle(wr.x, wr.y, wr.w, wr.h, wr.col, 0.42).setDepth(1);
            this.tweens.add({
                targets: rip,
                alpha: { from: 0.12, to: 0.65 },
                scaleX: { from: 0.75, to: 1.3 },
                duration: wr.dur,
                delay: i * 420,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 4. Subtle Ripples at Mountain Pier / Shore (Riak Air di Sekitar Dermaga Kayu)
        for (let r = 0; r < 2; r++) {
            const pierRipple = this.add.ellipse(490, 392, 42, 8).setDepth(1);
            pierRipple.setStrokeStyle(1.2, 0x99f6e4, 0.5);
            pierRipple.setFillStyle(0, 0);
            this.tweens.add({
                targets: pierRipple,
                scaleX: 1.8,
                scaleY: 1.5,
                alpha: 0,
                duration: 2800,
                delay: r * 1400,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 5. Alpine Glowing Wisps & Frost Fireflies (Spora Salju & Kunang-kunang Dingin)
        for (let i = 0; i < 18; i++) {
            const fx = Phaser.Math.Between(40, 760);
            const fy = Phaser.Math.Between(180, 410);
            const col = (i % 2 === 0) ? 0xfde047 : 0x7dd3fc;
            const ff = this.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 2.5), col, 0.75).setDepth(3);

            this.tweens.add({
                targets: ff,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.15, to: 0.9 },
                scale: { from: 0.7, to: 1.3 },
                duration: Phaser.Math.Between(2000, 4200),
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

        GameAudio.playCollect();
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
                { speaker: 'Aksel', text: 'Semua 4 ikat kayu bakar sudah terkumpul lengkap dari danau dan kaki gunung!' },
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
