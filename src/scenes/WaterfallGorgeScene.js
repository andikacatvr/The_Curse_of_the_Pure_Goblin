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

        // Spawn position based on entry direction
        let startX = 65;
        let startY = 355;
        if (data && data.from === 'WitchYardScene') {
            startX = 735;
            startY = 355;
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

        // Healing Crystal Fruit on Platform 3
        this.fruitGlow = this.add.circle(400, 255, 16, 0x38bdf8, 0.3).setDepth(4);
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

        this.crystalFruit = this.physics.add.staticSprite(400, 255, 'crystal_fruit').setDepth(5);
        this.tweens.add({
            targets: this.crystalFruit,
            y: 247,
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
                const spark = this.add.text(400, 235, '+1 HP PULIH!', {
                    fontSize: '12px', fontStyle: 'bold', fill: '#4ade80'
                }).setOrigin(0.5).setDepth(15);
                this.tweens.add({
                    targets: spark,
                    y: 200,
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

        // Fall hazard handler: if falling into water gorge pit
        this.onPlayerFallHazard = () => {
            if (this.isRespawning) return;

            // Take 1 damage from the turbulent water & fall
            this.takeDamage(1);

            const hp = getPlayerHP(this.registry);
            if (hp > 0) {
                // Safe respawn to latest reached platform
                this.player.setVelocity(0, 0);
                this.player.setPosition(this.checkpointX, this.checkpointY);
                this.showToastNotice('🌊 Aksel tercebur ke jurang air terjun! (-1 HP)');
            }
        };
    }

    createWaterfallGorgeAtmosphere() {
        const bgG = this.add.graphics();

        // 1. Twilight Canyon Sky Gradient
        for (let y = 0; y < 240; y += 4) {
            const ratio = y / 240;
            const r = Math.round(4 + ratio * 8);
            const g = Math.round(24 + ratio * 20);
            const b = Math.round(44 + ratio * 30);
            bgG.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            bgG.fillRect(0, y, 800, 4);
        }

        // 2. Distant Jagged Canyon Mountain Ridges
        bgG.fillStyle(0x0a1e2f, 0.95);
        bgG.beginPath();
        bgG.moveTo(0, 240);
        bgG.lineTo(0, 80);
        bgG.lineTo(90, 110);
        bgG.lineTo(190, 70);
        bgG.lineTo(290, 120);
        bgG.lineTo(390, 60);
        bgG.lineTo(510, 115);
        bgG.lineTo(620, 75);
        bgG.lineTo(720, 110);
        bgG.lineTo(800, 85);
        bgG.lineTo(800, 240);
        bgG.closePath();
        bgG.fillPath();

        // 3. Middle Canyon Rock Walls
        bgG.fillStyle(0x0c2538, 1);
        // Left Rock Wall
        bgG.fillRect(0, 100, 150, 350);
        // Right Rock Wall
        bgG.fillRect(650, 100, 150, 350);

        // Canyon Crevice Shadows
        bgG.fillStyle(0x061420, 1);
        bgG.beginPath();
        bgG.moveTo(340, 0);
        bgG.lineTo(460, 0);
        bgG.lineTo(470, 430);
        bgG.lineTo(330, 430);
        bgG.closePath();
        bgG.fillPath();

        // 4. Center Giant Cascading Waterfall Streams
        // Broad outer spray
        bgG.fillStyle(0x0284c7, 0.65);
        bgG.fillRect(352, 0, 96, 425);

        // Core rushing water body
        bgG.fillStyle(0x38bdf8, 0.85);
        bgG.fillRect(362, 0, 76, 425);

        // Secondary Cascade on Left Wall
        bgG.fillStyle(0x0284c7, 0.5);
        bgG.fillRect(150, 110, 28, 315);
        bgG.fillStyle(0x7dd3fc, 0.7);
        bgG.fillRect(156, 110, 16, 315);

        // Secondary Cascade on Right Wall
        bgG.fillStyle(0x0284c7, 0.5);
        bgG.fillRect(622, 110, 28, 315);
        bgG.fillStyle(0x7dd3fc, 0.7);
        bgG.fillRect(628, 110, 16, 315);

        // 5. Animated Shimmering Water Ribbons
        const waterLines = this.add.graphics();
        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 800,
            repeat: -1,
            onUpdate: (tween) => {
                const val = tween.getValue();
                const offset = (val / 100) * 30;
                waterLines.clear();

                // Main waterfall shimmering ribbons
                waterLines.lineStyle(2.5, 0xf0f9ff, 0.75);
                waterLines.lineBetween(372, offset, 372, 425);
                waterLines.lineBetween(388, (offset + 15) % 30, 388, 425);
                waterLines.lineBetween(404, offset, 404, 425);
                waterLines.lineBetween(420, (offset + 10) % 30, 420, 425);

                // Left cascade ribbons
                waterLines.lineStyle(1.5, 0xe0f2fe, 0.6);
                waterLines.lineBetween(164, 110 + offset, 164, 425);
                // Right cascade ribbons
                waterLines.lineBetween(636, 110 + offset, 636, 425);
            }
        });

        // 6. Waterfall Base Splash Foam & Mist
        const splashG = this.add.graphics();
        splashG.fillStyle(0xf0fdf4, 0.85);
        splashG.fillEllipse(400, 422, 140, 24);
        splashG.fillStyle(0xbae6fd, 0.7);
        splashG.fillEllipse(400, 425, 170, 28);

        this.tweens.add({
            targets: splashG,
            scaleX: 1.1,
            scaleY: 1.15,
            alpha: 0.75,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 7. Rising Water Spray Mist Particles
        for (let i = 0; i < 18; i++) {
            const mistX = 330 + Math.random() * 140;
            const mistY = 410 + Math.random() * 20;
            const radius = 6 + Math.random() * 12;
            const mistDot = this.add.circle(mistX, mistY, radius, 0xe0f2fe, 0.25).setDepth(2);

            this.tweens.add({
                targets: mistDot,
                y: 180 + Math.random() * 140,
                x: mistX + (Math.random() * 30 - 15),
                alpha: 0,
                scale: 1.6,
                duration: 2200 + Math.random() * 1600,
                repeat: -1,
                delay: Math.random() * 2000
            });
        }

        // 8. Raging Bottom River Torrent Pit (Hazard under platforms)
        const riverG = this.add.graphics().setDepth(2);
        riverG.fillStyle(0x0369a1, 0.95);
        riverG.fillRect(0, 422, 800, 28);
        riverG.fillStyle(0x38bdf8, 0.7);
        riverG.fillRect(0, 424, 800, 6);
        riverG.fillStyle(0xffffff, 0.8);
        for (let x = 10; x < 800; x += 45) {
            riverG.fillEllipse(x, 428, 26, 4);
        }

        // Rapid water foam scrolling animation
        this.tweens.add({
            targets: riverG,
            x: -25,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });
    }

    respawnPlayer() {
        this.checkpointX = 75;
        this.checkpointY = 355;
        this.reachedMidCheckpoint = false;
        if (this.player) {
            this.player.setPosition(75, 355);
            this.player.setVelocity(0, 0);
            this.player.clearTint();
        }
    }

    update() {
        // Update checkpoint when landing safely on mid island (Platform 3)
        if (this.player && this.player.body && this.player.body.touching.down) {
            if (this.player.x > 340 && this.player.x < 460) {
                if (!this.reachedMidCheckpoint) {
                    this.reachedMidCheckpoint = true;
                    this.checkpointX = 400;
                    this.checkpointY = 265;
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
