import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import {
    setQuestState,
    TOTAL_FIREWOOD,
    isFirewoodCollected,
    addCollectedFirewood,
    isAllFirewoodCollected
} from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class LakeForestScene extends BaseScene {
    constructor() {
        super({ key: 'LakeForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#161328');
        this.createLakeForestAtmosphere();

        this.currentLocationName = 'Hutan Danau & Pegunungan Barat (Mencari Kayu)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'platform').setScale(2.5, 1).refreshBody();

        let startX = 720;
        if (data && data.from === 'MountainFootLakeScene') {
            startX = 80;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // 2 Batang Kayu Bakar yang Tersebar di Tepi Danau
        this.woodGroup = this.physics.add.staticGroup();
        const lakeWoodPositions = [
            { id: 'lake_wood_1', x: 280, y: 412 },
            { id: 'lake_wood_2', x: 540, y: 412 }
        ];

        lakeWoodPositions.forEach(pos => {
            if (!isFirewoodCollected(this.registry, pos.id)) {
                const w = this.woodGroup.create(pos.x, pos.y, 'special_firewood');
                w.woodId = pos.id;
                w.type = 'firewood';
                w.setDepth(4);
            }
        });

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        // Teks Petunjuk Keluar ke Rumah (Navigasi Map di Atas)
        this.rightExitText = this.add.text(780, 65, 'Ke Rumah Nenek & Rachael ➔\n(Jalan ke Kanan)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);
        this.rightExitText.setVisible(true);

        this.leftHint = this.add.text(20, 65, '◀ Ujung Danau Kaki Gunung\n(Jalan ke Kiri)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);

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

        if (!this.registry.get('lakeSceneIntroSaid')) {
            this.registry.set('lakeSceneIntroSaid', true);
            this.time.delayedCall(400, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Udara di tepi danau pegunungan ini terasa sangat dingin... Pemandangannya sungguh asri.' },
                    { speaker: 'Aksel (Dalam Hati)', text: 'Aku harus segera mencari 4 ikat kayu bakar kering di sekitar danau dan kaki gunung sebelum malam tiba!' }
                ]);
            });
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    createLakeForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. SKY GRADIENT (Warm Twilight — sama seperti Rumah Aksel & Rachael)
        bgG.fillGradientStyle(0x13172e, 0x181e3a, 0x3d1f35, 0x5a2d28, 1);
        bgG.fillRect(0, 0, 800, 420);

        // Twinkling Stars
        for (let i = 0; i < 24; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 140);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.9)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.95 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(1800, 3600),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 2. MAJESTIC MOUNTAINS WITH SNOWCAPS (Pegunungan Megah)
        // Background Mountains (Deep Violet-Navy)
        bgG.fillStyle(0x18132e, 0.95);
        bgG.fillTriangle(-50, 390, 110, 120, 270, 390);
        bgG.fillTriangle(170, 390, 340, 90, 510, 390);
        bgG.fillTriangle(410, 390, 590, 110, 770, 390);
        bgG.fillTriangle(650, 390, 810, 140, 970, 390);

        // Snowcaps on peaks
        bgG.fillStyle(0xe2e8f0, 0.9);
        bgG.fillTriangle(95, 150, 110, 120, 125, 150);
        bgG.fillTriangle(320, 125, 340, 90, 360, 125);
        bgG.fillTriangle(570, 140, 590, 110, 610, 140);

        // Midground Mountain Ridge
        bgG.fillStyle(0x0e172e, 1);
        bgG.fillTriangle(30, 400, 210, 160, 390, 400);
        bgG.fillTriangle(310, 400, 480, 175, 650, 400);

        // 3. TRANQUIL LAKE WATER (Danau Luas Berkilau)
        // Water Body Surface
        bgG.fillStyle(0x0f2347, 1);
        bgG.fillRect(0, 270, 800, 140);
        bgG.fillGradientStyle(0x1e3a8a, 0x1e3a8a, 0x0284c7, 0x0284c7, 0.45);
        bgG.fillRect(0, 270, 800, 70);

        // Lake Shore Bank (Grass and stones)
        bgG.fillStyle(0x14532d, 0.9);
        bgG.fillRect(0, 405, 800, 15);
        bgG.fillStyle(0x365314, 1);
        bgG.fillRect(0, 403, 800, 3);

        // Water reflection ripples (Animated)
        for (let r = 0; r < 8; r++) {
            const rx = Phaser.Math.Between(50, 750);
            const ry = Phaser.Math.Between(280, 395);
            const rw = Phaser.Math.Between(40, 90);
            const ripple = this.add.rectangle(rx, ry, rw, 2.5, 0x67e8f9, 0.45).setDepth(1);
            this.tweens.add({
                targets: ripple,
                alpha: { from: 0.15, to: 0.65 },
                scaleX: { from: 0.8, to: 1.25 },
                duration: Phaser.Math.Between(1600, 2800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Reeds and Cattails along lake shore
        const reedX = [35, 75, 120, 260, 310, 470, 510, 680, 725];
        reedX.forEach(rx => {
            bgG.fillStyle(0x166534, 1);
            bgG.fillRect(rx, 375, 3, 30);
            bgG.fillRect(rx + 5, 380, 2.5, 25);
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRoundedRect(rx - 1, 372, 5, 12, 2);
        });

        // 4. LUSH PINE & EVERGREEN FOREST (Hutan Pinus Asri)
        const pines = [
            { x: 15, w: 55, h: 210 },
            { x: 85, w: 65, h: 240 },
            { x: 230, w: 60, h: 195 },
            { x: 440, w: 65, h: 220 },
            { x: 620, w: 70, h: 250 },
            { x: 740, w: 60, h: 215 }
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

        // Glowing fireflies / water wisps
        for (let i = 0; i < 14; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(260, 400);
            const ff = this.add.circle(fx, fy, Phaser.Math.Between(1.5, 2.5), 0x6ee7b7, 0.7).setDepth(2);
            this.tweens.add({
                targets: ff,
                x: fx + Phaser.Math.Between(-25, 25),
                y: fy + Phaser.Math.Between(-18, 18),
                alpha: { from: 0.2, to: 0.85 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(2200, 4000),
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
                this.collectLakeFirewood(this.nearTarget.sprite);
            }
        }
    }

    collectLakeFirewood(woodSprite) {
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
            this.rightExitText.setVisible(true);

            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Kayu Bakar Terkumpul!',
                objective: '4 ikat kayu bakar sudah terkumpul! Bawa pulang ke Rumah Nenek & Rachael di sebelah kanan [➔].',
                questNumber: 0
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: 'Aksel', text: 'Alhamdulillah, semua 4 ikat kayu bakar sudah terkumpul lengkap! Cukup untuk menghangatkan rumah semalaman.' },
                { speaker: 'Aksel', text: 'Sekarang aku harus segera pulang ke rumah Nenek dan Rachael di sebelah kanan [➔]!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Mencari Kayu Bakar di Hutan Danau',
                objective: `Kumpulkan kayu bakar di Hutan Danau & Ujung Danau Kaki Gunung (Terkumpul: ${count}/${TOTAL_FIREWOOD}).`,
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

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            minX: 20,
            onExitLeft: () => {
                this.scene.start('MountainFootLakeScene', { from: 'LakeForestScene' });
            },
            canExitRight: true,
            maxX: 780,
            onExitRight: () => {
                this.scene.start('HomeScene', { from: 'LakeForestScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 1C: UJUNG DANAU KAKI GUNUNG (MOUNTAIN FOOT LAKE SCENE)
// -------------------------------------------------------------
