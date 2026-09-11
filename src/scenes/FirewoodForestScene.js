import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class FirewoodForestScene extends BaseScene {
    constructor() {
        super({ key: 'FirewoodForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#0f2420');
        this.createFirewoodForestAtmosphere();

        this.currentLocationName = 'Area Kayu Bakar Khusus (Pinggir Hutan Timur)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

        let startX = 60;
        if (data && data.from === 'BakeryMillScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.add.text(20, 65, '◀ Bengkel Heinreich', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Gilingan & Toko Roti ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);

        // Firewood items group
        this.woodGroup = this.physics.add.staticGroup();
        const collected = this.registry.get('collectedFirewood') || [];
        const woodPositions = [260, 480, 700];

        for (let i = 0; i < 3; i++) {
            if (!collected.includes(i)) {
                const wItem = this.woodGroup.create(woodPositions[i], 410, 'special_firewood').setDepth(4);
                wItem.woodIndex = i;
                wItem.type = 'firewood';

                // Golden amber magical shimmer on special firewood
                const glow = this.add.circle(woodPositions[i], 410, 14, 0xfbbf24, 0.35).setDepth(3);
                this.tweens.add({
                    targets: glow,
                    scale: { from: 0.8, to: 1.3 },
                    alpha: { from: 0.15, to: 0.45 },
                    duration: 1400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                wItem.glowCircle = glow;
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

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

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget && this.nearTarget.type === 'firewood') {
            this.collectWood(this.nearTarget.sprite);
        }
    }

    collectWood(woodSprite) {
        let collected = this.registry.get('collectedFirewood') || [];
        if (!collected.includes(woodSprite.woodIndex)) {
            collected.push(woodSprite.woodIndex);
            this.registry.set('collectedFirewood', collected);
        }

        let count = collected.length;
        this.registry.set('firewoodCount', count);
        GameAudio.playCollect();

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `✨ Kayu Bakar Khusus! (${count}/3)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        if (woodSprite.glowCircle) {
            woodSprite.glowCircle.destroy();
        }
        woodSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (count >= 3) {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 6: Serahkan Kayu Bakar Khusus',
                objective: '3 Kayu Bakar Khusus terkumpul! Kembali ke Mr. Heinreich di Bengkel Kayu [E].',
                questNumber: 6,
                completedQuests: [
                    'Quest 1-3: Bahan 1 Madu Murni',
                    'Quest 4: Rapikan 5 Karung Pupuk Gudang Heinreich',
                    'Quest 5: Kumpulkan 3 Kayu Bakar Khusus'
                ]
            });
            this.updateQuestHUD();

            this.time.delayedCall(600, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 3 Kayu Bakar Khusus sudah terkumpul! Sekarang aku kembali ke Bengkel Mr. Heinreich!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                objective: `Kumpulkan kayu bakar khusus di Pinggir Hutan Timur (Progress: ${count}/3).`,
                questNumber: 5
            });
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;

        this.woodGroup.children.iterate((w) => {
            if (w && w.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) < 45) {
                found = { type: 'firewood', sprite: w, x: w.x, y: w.y - 25, prompt: 'Tekan [E] Ambil Kayu Bakar Khusus' };
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
            onExitLeft: () => {
                const collected = this.registry.get('collectedFirewood') || [];
                const inv = getInventory(this.registry);
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');

                if (collected.length < 3 && !hasSeed) {
                    this.showMapLockedNotice('Kumpulkan 3 Kayu Bakar Khusus dulu sebelum kembali ke Mr. Heinreich!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }
                this.scene.start('WoodshopScene', { from: 'FirewoodForestScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                if (!hasSeed) {
                    this.showMapLockedNotice('Serahkan kayu bakar ke Heinreich untuk dapatkan [Bahan 2: Mythical Seed] dulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('BakeryMillScene', { from: 'FirewoodForestScene' });
                }
            }
        });
    }

    createFirewoodForestAtmosphere() {
        // 1. High-fidelity Pixel Art Pine Forest Outskirts Background
        this.add.image(400, 225, 'firewood_forest_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Atmospheric Sunbeams / Canopy God Rays piercing through the forest
        const raysG = this.add.graphics().setDepth(1);
        raysG.fillStyle(0x86efac, 0.045);
        // Ray 1
        raysG.beginPath();
        raysG.moveTo(140, 0);
        raysG.lineTo(250, 0);
        raysG.lineTo(360, 420);
        raysG.lineTo(210, 420);
        raysG.closePath();
        raysG.fillPath();
        // Ray 2
        raysG.beginPath();
        raysG.moveTo(460, 0);
        raysG.lineTo(590, 0);
        raysG.lineTo(710, 420);
        raysG.lineTo(540, 420);
        raysG.closePath();
        raysG.fillPath();

        // Pulsing light shafts intensity
        this.tweens.add({
            targets: raysG,
            alpha: { from: 0.5, to: 0.95 },
            duration: 3500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Drifting misty forest fog layers
        for (let m = 0; m < 3; m++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(80, 720),
                Phaser.Math.Between(260, 370),
                Phaser.Math.Between(280, 440),
                Phaser.Math.Between(45, 80),
                0xe2e8f0,
                0.07
            ).setDepth(1);
            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 30, to: mist.x + 30 },
                alpha: { from: 0.03, to: 0.11 },
                duration: Phaser.Math.Between(5000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 4. Forest Floor Props: Mossy boulder & ancient moss-covered log
        const floorG = this.add.graphics().setDepth(2);
        // Mossy Boulder (X: 165, Y: 412)
        floorG.fillStyle(0x1e293b, 1);
        floorG.fillCircle(165, 412, 18);
        floorG.fillStyle(0x334155, 1);
        floorG.fillCircle(163, 408, 14);
        floorG.fillStyle(0x15803d, 0.85);
        floorG.fillCircle(163, 402, 9);
        floorG.fillStyle(0x22c55e, 0.7);
        floorG.fillCircle(166, 400, 5);

        // Ancient Fallen Log (X: 535, Y: 412)
        floorG.fillStyle(0x451a03, 1);
        floorG.fillRoundedRect(505, 406, 75, 12, 3);
        floorG.fillStyle(0x78350f, 0.9);
        floorG.fillRect(507, 408, 71, 4);
        floorG.fillStyle(0x15803d, 0.8);
        floorG.fillRoundedRect(518, 404, 38, 4, 2);

        // Wild forest ferns
        for (let fx = 40; fx < 780; fx += 95) {
            floorG.fillStyle(0x065f46, 0.9);
            floorG.fillTriangle(fx, 418, fx - 8, 402, fx + 2, 418);
            floorG.fillTriangle(fx + 3, 418, fx + 11, 404, fx + 7, 418);
        }

        // 5. Floating Magic Forest Spores / Luminous Pollen Specks
        const sporeColors = [0x86efac, 0xfde047, 0x6ee7b7, 0xfef08a];
        for (let s = 0; s < 18; s++) {
            const sx = Phaser.Math.Between(30, 770);
            const sy = Phaser.Math.Between(100, 410);
            const col = Phaser.Utils.Array.GetRandom(sporeColors);

            const spore = this.add.circle(sx, sy, Phaser.Math.FloatBetween(1, 2.2), col, 0.7).setDepth(3);

            this.tweens.add({
                targets: spore,
                x: spore.x + Phaser.Math.Between(-35, 35),
                y: spore.y - Phaser.Math.Between(20, 55),
                alpha: { from: 0.75, to: 0.15 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(2800, 5200),
                delay: s * 180,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 9: BAKERY MILL SCENE (TOKO ROTI & GILINGAN BATU - BAB 3)
// -------------------------------------------------------------
