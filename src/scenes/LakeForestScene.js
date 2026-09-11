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
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        // Ground / Terrain Sprite (Permukaan Tanah Pijakan Tile)
        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(2);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);


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
        // 1. Panoramic Mountain Lake Background (Pixel Art Danau Pegunungan Senja)
        this.add.image(400, 225, 'lake_forest_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Drifting Lake Mist (Kabut Tipis Senja yang Melayang Halus di Atas Permukaan Air & Kaki Gunung)
        const mistClouds = [
            { x: 180, y: 300, w: 220, h: 22, dur: 12000, dist: 70 },
            { x: 380, y: 285, w: 260, h: 26, dur: 16000, dist: -80 },
            { x: 560, y: 315, w: 210, h: 20, dur: 11000, dist: 60 },
            { x: 280, y: 335, w: 290, h: 24, dur: 14000, dist: -70 }
        ];

        mistClouds.forEach((m) => {
            const mist = this.add.graphics().setDepth(1);
            mist.fillStyle(0xdbeafe, 0.09);
            mist.fillRoundedRect(m.x, m.y, m.w, m.h, 11);
            mist.fillStyle(0xccfbf1, 0.07);
            mist.fillCircle(m.x + m.w * 0.35, m.y + 2, m.h * 0.7);
            mist.fillCircle(m.x + m.w * 0.65, m.y - 2, m.h * 0.8);

            this.tweens.add({
                targets: mist,
                x: m.dist,
                alpha: { from: 0.6, to: 1.0 },
                duration: m.dur,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 3. Dynamic Water Surface Shimmer & Ripples (Kilauan & Riak Gelombang Danau Bergerak)
        const waterRipples = [
            { x: 320, y: 315, w: 55, h: 2.5, dur: 2200 },
            { x: 480, y: 325, w: 70, h: 2.5, dur: 2800 },
            { x: 260, y: 345, w: 65, h: 3.0, dur: 2500 },
            { x: 520, y: 355, w: 80, h: 3.0, dur: 3100 },
            { x: 370, y: 370, w: 90, h: 3.2, dur: 2400 },
            { x: 450, y: 385, w: 110, h: 3.5, dur: 2900 }
        ];

        waterRipples.forEach((wr, i) => {
            const rip = this.add.rectangle(wr.x, wr.y, wr.w, wr.h, 0x99f6e4, 0.4).setDepth(1);
            this.tweens.add({
                targets: rip,
                alpha: { from: 0.12, to: 0.6 },
                scaleX: { from: 0.75, to: 1.3 },
                duration: wr.dur,
                delay: i * 450,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 4. Ripples Around Fisherman's Boat (Riak Air di Bawah Perahu Sampan Nelayan)
        for (let r = 0; r < 2; r++) {
            const boatRipple = this.add.ellipse(442, 326, 38, 7).setDepth(1);
            boatRipple.setStrokeStyle(1.2, 0x99f6e4, 0.5);
            boatRipple.setFillStyle(0, 0);
            this.tweens.add({
                targets: boatRipple,
                scaleX: 1.8,
                scaleY: 1.5,
                alpha: 0,
                duration: 2600,
                delay: r * 1300,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 5. Golden Twilight Fireflies (Kunang-kunang Emas Senja di Tepi Hutan & Danau)
        for (let i = 0; i < 18; i++) {
            const fx = Phaser.Math.Between(40, 760);
            const fy = Phaser.Math.Between(180, 410);
            const col = Math.random() > 0.3 ? 0xfde047 : 0x86efac;
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
