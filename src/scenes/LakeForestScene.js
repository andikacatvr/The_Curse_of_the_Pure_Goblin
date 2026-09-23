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
        this.physics.world.setBounds(0, 0, 1200, 450);
        this.cameras.main.setBounds(0, 0, 1200, 450);
        this.cameras.main.setBackgroundColor('#141c24');
        this.createLakeForestAtmosphere();

        this.currentLocationName = 'Hutan Danau & Pegunungan Barat (Mencari Kayu)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        for (let px = 200; px <= 1200; px += 400) {
            const p = this.platforms.create(px, 434, 'platform').setScale(2, 1).refreshBody();
            p.setVisible(false);
        }

        // Ground / Terrain Sprite (Permukaan Tanah Pijakan Tile)
        this.createSeamlessGround('tanah_home', 2);

        let startX = 1120;
        if (data && data.from === 'MountainFootLakeScene') {
            startX = 80;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);
        this.cameras.main.startFollow(this.player, false, 0.045, 0.025);
        this.cameras.main.setDeadzone(80, 40);
        this.cameras.main._isFollowing = true;

        // 2 Batang Kayu Bakar yang Tersebar di Tepi Danau
        this.woodGroup = this.physics.add.staticGroup();
        const lakeWoodPositions = [
            { id: 'lake_wood_1', x: 420, y: 412 },
            { id: 'lake_wood_2', x: 820, y: 412 }
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

        // Teks Petunjuk Keluar ke Rumah (Navigasi Map di Atas - HD HTML Overlay)
        this.rightExitText = this.createRightNavHint('Ke Rumah Nenek & Rachael ➔\n(Jalan ke Kanan)', true);
        this.leftHint = this.createLeftNavHint('◀ Ujung Danau Kaki Gunung\n(Jalan ke Kiri)', true);

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
        // =========================================================================
        // TRUE MULTI-LAYER CINEMATIC PARALLAX (LAKE FOREST)
        // =========================================================================
        // Layer 0: Far Sky & Misty Mountain Ridges (Slowest scroll: 0.08)
        this.bgSky = this.add.image(600, 215, 'lake_parallax_sky')
            .setDisplaySize(1600, 460)
            .setDepth(0)
            .setScrollFactor(0.08, 1);

        // Layer 1: Midground Rolling Pine Forests & River/Lake (Medium scroll: 0.28)
        this.bgMid = this.add.image(600, 215, 'lake_parallax_mid')
            .setDisplaySize(1600, 460)
            .setDepth(1)
            .setScrollFactor(0.28, 1);

        // Layer 2: Foreground Framing Silhouette Trees & Branches (Close scroll: 0.55)
        this.bgTrees = this.add.image(600, 215, 'lake_parallax_trees')
            .setDisplaySize(1600, 460)
            .setDepth(1.8)
            .setScrollFactor(0.55, 1);

        // Soft Drifting Mountain Mist (Depth: 1.2, ScrollFactor: 0.32)
        const mistPositions = [
            { x: 240, y: 275, w: 260, h: 22, dur: 12000, dist: 60 },
            { x: 560, y: 260, w: 320, h: 26, dur: 16000, dist: -75 },
            { x: 880, y: 290, w: 250, h: 20, dur: 11000, dist: 55 },
            { x: 420, y: 315, w: 340, h: 24, dur: 14000, dist: -65 }
        ];

        mistPositions.forEach((m) => {
            const mist = this.add.graphics().setDepth(1.2).setScrollFactor(0.32, 1);
            mist.fillStyle(0xcce7f0, 0.08);
            mist.fillRoundedRect(m.x, m.y, m.w, m.h, 11);
            mist.fillStyle(0xdff1f7, 0.06);
            mist.fillCircle(m.x + m.w * 0.35, m.y + 2, m.h * 0.7);
            mist.fillCircle(m.x + m.w * 0.65, m.y - 2, m.h * 0.8);

            this.tweens.add({
                targets: mist,
                x: m.dist,
                alpha: { from: 0.5, to: 0.95 },
                duration: m.dur,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Dynamic Water Surface Shimmer & Ripples on the River Bend (ScrollFactor: 0.28)
        const waterRipples = [
            { x: 420, y: 310, w: 55, h: 2.5, dur: 2200 },
            { x: 620, y: 320, w: 75, h: 2.5, dur: 2800 },
            { x: 500, y: 340, w: 65, h: 3.0, dur: 2500 },
            { x: 740, y: 350, w: 85, h: 3.0, dur: 3100 },
            { x: 580, y: 365, w: 90, h: 3.2, dur: 2400 }
        ];

        waterRipples.forEach((wr, i) => {
            const rip = this.add.rectangle(wr.x, wr.y, wr.w, wr.h, 0xa5f3fc, 0.45)
                .setDepth(1.1)
                .setScrollFactor(0.28, 1);
            this.tweens.add({
                targets: rip,
                alpha: { from: 0.15, to: 0.65 },
                scaleX: { from: 0.75, to: 1.3 },
                duration: wr.dur,
                delay: i * 450,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Mystic Forest Fireflies / Floating Light Motes (ScrollFactor: 0.70)
        for (let i = 0; i < 20; i++) {
            const fx = Phaser.Math.Between(60, 1140);
            const fy = Phaser.Math.Between(160, 410);
            const col = Math.random() > 0.4 ? 0x67e8f9 : 0xa7f3d0;
            const ff = this.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 2.5), col, 0.75)
                .setDepth(3)
                .setScrollFactor(0.70, 1);

            this.tweens.add({
                targets: ff,
                x: fx + Phaser.Math.Between(-35, 35),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.95 },
                scale: { from: 0.7, to: 1.35 },
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

        GameAudio.playCollect();
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
                { speaker: 'Aksel', text: 'Semua 4 ikat kayu bakar sudah terkumpul lengkap! Cukup untuk menghangatkan rumah semalaman.' },
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

        this.woodGroup.getChildren().forEach((w) => {
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
            maxX: 1180,
            onExitRight: () => {
                this.scene.start('HomeScene', { from: 'LakeForestScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 1C: UJUNG DANAU KAKI GUNUNG (MOUNTAIN FOOT LAKE SCENE)
// -------------------------------------------------------------
