import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, MAX_PLAYER_HP, getPlayerHP } from '../utils/gameState.js';

export class WaterfallGorgeScene extends BaseScene {
    constructor() {
        super({ key: 'WaterfallGorgeScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#041624');
        this.createWaterfallGorgeAtmosphere();

        this.currentLocationName = 'Lembah Air Terjun Berbahaya';
        this.registry.set('currentLocationName', this.currentLocationName);

        // Solid Platforms Static Group
        this.platforms = this.physics.add.staticGroup();

        // Platform 1 (Left Entrance Cliff) - safe entry from ForestTrailScene
        this.plat1 = this.platforms.create(75, 395, 'canyon_rock_platform').setScale(1.2, 1).refreshBody().setDepth(3);
        // Platform 2 (First Stepping Stone with Thorn Spikes)
        this.plat2 = this.platforms.create(230, 350, 'canyon_rock_platform').setScale(0.8, 1).refreshBody().setDepth(3);
        // Platform 3 (Mid Waterfall Island with Healing Crystal Fruit & Checkpoint)
        this.plat3 = this.platforms.create(400, 305, 'canyon_rock_platform').setScale(1.0, 1).refreshBody().setDepth(3);
        // Platform 4 (Second Stepping Stone with Thorn Spikes)
        this.plat4 = this.platforms.create(570, 350, 'canyon_rock_platform').setScale(0.8, 1).refreshBody().setDepth(3);
        // Platform 5 (Right Exit Cliff) - safe ground to WitchYardScene
        this.plat5 = this.platforms.create(725, 395, 'canyon_rock_platform').setScale(1.2, 1).refreshBody().setDepth(3);


        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';

        // Spawn position based on entry direction (startY diangkat ke 330 agar mendarat mulus di atas tebing y=379)
        let startX = 65;
        let startY = 330;
        if (data && data.from === 'WitchYardScene') {
            startX = 735;
            startY = 330;
        }
        this.checkpointX = startX;
        this.checkpointY = startY;
        this.reachedMidCheckpoint = false;

        this.player = this.physics.add.sprite(startX, startY, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Signpost with Warning Lore on Platform 1
        this.signpost = this.physics.add.staticSprite(125, 360, 'signpost').setDepth(4);
        this.signpost.type = 'npc';
        this.signpost.dialogue = [
            { speaker: 'Papan Peringatan Lembah', text: 'PERINGATAN: Lembah Air Terjun Berbahaya!' },
            { speaker: 'Papan Peringatan Lembah', text: 'Bebatuan licin dan tanaman duri beracun dapat melukai pengelana (-1 HP).' },
            { speaker: 'Papan Peringatan Lembah', text: 'Lompatlah dengan cermat! Jangan sampai terpeleset ke arus jurang di bawah.' },
            { speaker: 'Papan Peringatan Lembah', text: 'Petiklah Buah Kristal di pulau tengah untuk memulihkan darahmu jika terluka.' }
        ];

        // Obstacles: Poisonous Thorn Spikes
        this.spikes = this.physics.add.staticGroup();
        const spike1 = this.spikes.create(230, 322, 'thorn_spike').setDepth(4);
        const spike2 = this.spikes.create(570, 322, 'thorn_spike').setDepth(4);

        // Thorn Spikes gentle sinister pulse
        this.tweens.add({
            targets: [spike1, spike2],
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 750,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Overlap damage on thorns
        this.physics.add.overlap(this.player, this.spikes, (player, spike) => {
            if (this.isInvulnerable || this.isRespawning) return;
            const knock = player.x < spike.x ? -180 : 180;
            this.takeDamage(1, knock);
        });

        // Healing Crystal Fruit on Mid Platform (Platform 3 at y = 360)
        this.fruitGlow = this.add.circle(400, 305, 16, 0x38bdf8, 0.3).setDepth(4);
        this.tweens.add({
            targets: this.fruitGlow,
            alpha: 0.7,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.crystalFruit = this.physics.add.staticSprite(400, 305, 'crystal_fruit').setDepth(5);
        this.tweens.add({
            targets: this.crystalFruit,
            y: 297,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.hasShownFullHpToast = false;
        this.physics.add.overlap(this.player, this.crystalFruit, () => {
            if (!this.crystalFruit.active || this.isRespawning) return;
            const hp = getPlayerHP(this.registry);
            if (hp < MAX_PLAYER_HP) {
                this.crystalFruit.setActive(false).setVisible(false);
                this.fruitGlow.setVisible(false);
                this.healPlayer(1);

                // Spawn floating sparkle text
                const spark = this.add.text(400, 205, '+1 HP PULIH!', {
                    fontSize: '12px', fontStyle: 'bold', fill: '#4ade80'
                }).setOrigin(0.5).setDepth(15);
                this.tweens.add({
                    targets: spark,
                    y: 170,
                    alpha: 0,
                    duration: 1200,
                    onComplete: () => spark.destroy()
                });

                // Respawn fruit after 12 seconds
                this.time.delayedCall(12000, () => {
                    if (this.crystalFruit && this.crystalFruit.scene) {
                        this.crystalFruit.setActive(true).setVisible(true);
                        this.fruitGlow.setVisible(true);
                    }
                });
            } else if (!this.hasShownFullHpToast) {
                this.hasShownFullHpToast = true;
                this.showToastNotice('❤️ Darah Aksel masih penuh (3/3 HP)!');
                this.time.delayedCall(3000, () => { this.hasShownFullHpToast = false; });
            }
        });


        // Navigation labels (Navigasi Map di Atas)
        this.add.text(20, 65, '◀ Pinggir Hutan', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Halaman Pondok Penyihir ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);

        // Interaction Prompt
        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        // Controls setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        // Fall hazard failsafe: bila terjatuh dari tebing ke sungai di bawah
        this.onPlayerFallHazard = () => {
            if (this.isRespawning) return;
            if (this.player) {
                this.player.setVelocity(0, 0);
                this.player.setPosition(this.checkpointX, this.checkpointY || 330);
            }
        };
    }

    createWaterfallGorgeAtmosphere() {
        // 1. Background Image (Latar Pixel Art Hutan & Air Terjun Megah)
        this.add.image(400, 225, 'waterfall_canyon_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Ambient Sunlight & Mist Glow
        const ambientGlow = this.add.circle(400, 190, 170, 0x99f6e4, 0.06).setDepth(1);
        this.tweens.add({
            targets: ambientGlow,
            alpha: 0.14,
            scale: 1.12,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Dynamic Animated Cascading Water Streams (Aliran Air Terjun Mengalir)
        const waterLines = this.add.graphics().setDepth(2);
        const streams = [
            // Aliran Air Terjun Utama di Tengah (X: 350 - 450, Y: 135 - 340)
            { x: 355, top: 145, bot: 335, w: 2.5, color: 0x99f6e4, alpha: 0.55, speed: 1.2, seed: 0 },
            { x: 366, top: 138, bot: 340, w: 3.0, color: 0xccfbf1, alpha: 0.70, speed: 1.5, seed: 12 },
            { x: 378, top: 142, bot: 338, w: 2.0, color: 0x5eead4, alpha: 0.60, speed: 1.0, seed: 7 },
            { x: 390, top: 135, bot: 345, w: 3.5, color: 0xffffff, alpha: 0.85, speed: 1.7, seed: 20 },
            { x: 402, top: 134, bot: 345, w: 3.5, color: 0xf0fdfa, alpha: 0.85, speed: 1.6, seed: 4 },
            { x: 414, top: 138, bot: 342, w: 3.0, color: 0x99f6e4, alpha: 0.75, speed: 1.3, seed: 15 },
            { x: 426, top: 140, bot: 338, w: 2.5, color: 0x5eead4, alpha: 0.65, speed: 1.4, seed: 9 },
            { x: 438, top: 144, bot: 336, w: 2.0, color: 0xccfbf1, alpha: 0.60, speed: 1.1, seed: 18 },
            { x: 448, top: 150, bot: 332, w: 1.8, color: 0x2dd4bf, alpha: 0.50, speed: 1.0, seed: 3 },
            // Celah Air Terjun Tipis di Tebing Kanan
            { x: 532, top: 120, bot: 335, w: 1.8, color: 0xccfbf1, alpha: 0.65, speed: 1.2, seed: 8 },
            { x: 544, top: 140, bot: 330, w: 1.5, color: 0x99f6e4, alpha: 0.55, speed: 1.4, seed: 16 }
        ];

        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 850,
            repeat: -1,
            onUpdate: (tween) => {
                const progress = tween.getValue();
                waterLines.clear();
                streams.forEach(st => {
                    const cycleHeight = 36;
                    const curOffset = ((progress * st.speed + st.seed * 8) % 100 / 100) * cycleHeight;
                    waterLines.lineStyle(st.w, st.color, st.alpha);
                    for (let segY = st.top + curOffset; segY < st.bot; segY += cycleHeight) {
                        const segLen = Math.min(20, st.bot - segY);
                        if (segLen > 0) {
                            waterLines.lineBetween(st.x, segY, st.x, segY + segLen);
                        }
                    }
                });
            }
        });

        // 4. Waterfall Base Splash Foam & Froth Bubbles (Efek Buih & Gelembung Busa Air Alami)
        for (let b = 0; b < 28; b++) {
            const bx = 360 + Math.random() * 90;
            const by = 335 + Math.random() * 55;
            const rad = 1.8 + Math.random() * 3.2;
            const colorChoices = [0xffffff, 0xf0fdf4, 0xccfbf1, 0x99f6e4, 0x5eead4];
            const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
            const bubble = this.add.circle(bx, by, rad, col, 0.8).setDepth(2);

            this.tweens.add({
                targets: bubble,
                y: by + (Math.random() * 14 - 10),
                x: bx + (Math.random() * 26 - 13),
                scaleX: { from: 0.5, to: 1.4 },
                scaleY: { from: 0.5, to: 1.4 },
                alpha: { from: 0.85, to: 0 },
                duration: 900 + Math.random() * 1200,
                repeat: -1,
                delay: Math.random() * 1800,
                ease: 'Sine.easeOut'
            });
        }

        // 5. Water Splash Droplets (Cipratan Air Mikro di Titik Benturan)
        for (let s = 0; s < 12; s++) {
            const sx = 380 + Math.random() * 50;
            const sy = 338 + Math.random() * 15;
            const drop = this.add.circle(sx, sy, 1.5 + Math.random() * 1.5, 0xffffff, 0.9).setDepth(2);

            this.tweens.add({
                targets: drop,
                y: sy - (15 + Math.random() * 20),
                x: sx + (Math.random() * 24 - 12),
                alpha: { from: 0.9, to: 0 },
                scale: { from: 1.2, to: 0.4 },
                duration: 500 + Math.random() * 500,
                repeat: -1,
                delay: Math.random() * 1200,
                ease: 'Cubic.easeOut'
            });
        }

        // 6. Floating Mystical Cyan Spores & Light Particles (Spora Cahaya Gaib Melayang)
        for (let i = 0; i < 20; i++) {
            const px = 330 + Math.random() * 160;
            const py = 310 + Math.random() * 70;
            const rad = 1.5 + Math.random() * 2.5;
            const col = Math.random() > 0.4 ? 0x5eead4 : 0x86efac;
            const spore = this.add.circle(px, py, rad, col, 0.3 + Math.random() * 0.5).setDepth(2);

            this.tweens.add({
                targets: spore,
                y: py - (80 + Math.random() * 120),
                x: px + (Math.random() * 40 - 20),
                alpha: { from: 0.7, to: 0 },
                scale: { from: 0.8, to: 1.5 },
                duration: 2400 + Math.random() * 1800,
                repeat: -1,
                delay: Math.random() * 2500,
                ease: 'Sine.easeOut'
            });
        }

    }

    respawnPlayer() {
        this.checkpointX = 65;
        this.checkpointY = 330;
        this.reachedMidCheckpoint = false;
        if (this.player) {
            this.player.setPosition(65, 330);
            this.player.setVelocity(0, 0);
            this.player.clearTint();
        }
    }

    update() {
        // Update checkpoint when landing safely on mid island (Platform 3 at y = 360)
        if (this.player && this.player.body && this.player.body.touching.down) {
            if (this.player.x > 340 && this.player.x < 460 && this.player.y < 370) {
                if (!this.reachedMidCheckpoint) {
                    this.reachedMidCheckpoint = true;
                    this.checkpointX = 400;
                    this.checkpointY = 325;
                    this.showToastNotice('🚩 Titik aman pulau air terjun tercapai!');
                }
            }
        }

        let found = null;
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.signpost.x, this.signpost.y) < 60) {
            found = { type: 'npc', dialogue: this.signpost.dialogue, prompt: 'Tekan [E] Baca Peringatan Lembah' };
        }

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(this.player.x, this.player.y - 45).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                this.scene.start('ForestTrailScene', { from: 'WaterfallGorgeScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('WitchYardScene', { from: 'WaterfallGorgeScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 3: WITCH YARD SCENE
// -------------------------------------------------------------
