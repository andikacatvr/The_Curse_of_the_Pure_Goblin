import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory } from '../utils/gameState.js';

export class EastForestScene extends BaseScene {
    constructor() {
        super({ key: 'EastForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e1b4b');
        this.createEastForestAtmosphere();

        this.currentLocationName = 'Hutan Belantara Timur (Jalan Menuju Kediaman Joanne)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(4.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        this.createSeamlessGround('tanah_home', 1);

        let startX = 60;
        if (data && data.from === 'WitchYardScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Directional Signpost
        this.createSignpost();

        this.createLeftNavHint('◀ Kebun Saffron', true);
        this.createRightNavHint('Halaman Madam Joanne ➔', true);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(20).setVisible(false);

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

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTalking) this.nextDialogue();
        });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();
    }

    createSignpost() {
        const signG = this.add.graphics().setDepth(4);
        signG.fillStyle(0x3b1d11, 1);
        signG.fillRect(296, 350, 8, 70);
        signG.fillStyle(0x5c2b16, 1);
        signG.fillRoundedRect(200, 362, 200, 26, 4);
        signG.fillStyle(0x854d0e, 1);
        signG.strokeRoundedRect(200, 362, 200, 26, 4);

        this.add.text(300, 375, '◄ Kebun Saffron | Kediaman Joanne ➔', {
            fontSize: '9.5px',
            fontStyle: 'bold',
            fill: '#fef08a',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(4);

        signG.fillStyle(0x0f172a, 1);
        signG.fillRect(288, 342, 24, 3);
        signG.fillRect(289, 345, 2, 8);
        signG.fillRect(309, 345, 2, 8);

        // Hanging lantern glow
        const glowCircle = this.add.circle(300, 360, 14, 0xfde047, 0.4).setDepth(4);
        this.tweens.add({
            targets: glowCircle,
            scale: { from: 0.85, to: 1.2 },
            alpha: { from: 0.25, to: 0.55 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'sign') {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Papan petunjuk di tepi hutan berkabut: Menuju barat (kiri) adalah Kebun Saffron & Pemukiman Warga, menuju timur (kanan) adalah Halaman Pondok Madam Joanne.' }
                ]);
            }
        }
    }

    createEastForestAtmosphere() {
        // Deep ancient birch forest background
        this.createSeamlessBackground('east_forest_bg', 0, 1100, 450);

        // Menacing Ancient Monolith Rune on the left
        const monolithG = this.add.graphics().setDepth(3);
        monolithG.fillStyle(0x1e1b4b, 1);
        monolithG.fillRoundedRect(196, 275, 28, 145, 4);
        monolithG.fillStyle(0x0f172a, 1);
        monolithG.fillRect(200, 282, 20, 130);

        const runes = ['ᚱ', 'ᚦ', 'ᚠ', 'ᛉ'];
        runes.forEach((r, i) => {
            const rText = this.add.text(210, 292 + (i * 30), r, {
                fontSize: '12px',
                fontStyle: 'bold',
                fill: '#a855f7'
            }).setOrigin(0.5).setDepth(4);

            this.tweens.add({
                targets: rText,
                alpha: { from: 0.35, to: 1 },
                duration: 1500 + (i * 300),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Floating misty spores & bioluminescent particles
        for (let s = 0; s < 16; s++) {
            const isCyan = s % 2 === 0;
            const spore = this.add.circle(
                Phaser.Math.Between(30, 770),
                Phaser.Math.Between(180, 420),
                Phaser.Math.FloatBetween(1.2, 2.5),
                isCyan ? 0x67e8f9 : 0xd8b4fe,
                0.75
            ).setDepth(3);

            this.tweens.add({
                targets: spore,
                x: spore.x + Phaser.Math.Between(-35, 35),
                y: spore.y - Phaser.Math.Between(20, 50),
                alpha: { from: 0.8, to: 0.1 },
                duration: Phaser.Math.Between(2600, 5200),
                delay: s * 160,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, 300, 380) < 65) {
            found = { type: 'sign', x: 300, y: 340, prompt: 'Tekan [E] Baca Petunjuk Jalan' };
        }

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
                this.scene.start('SaffronFarmScene', { from: 'EastForestScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (!hasHoney || !hasSeed || !hasBread) {
                    this.showMapLockedNotice('Kumpulkan ketiga Bahan Magis (termasuk Magic Bread) dulu sebelum kembali ke Madam Joanne!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('WitchYardScene', { from: 'EastForestScene' });
                }
            }
        });
    }
}
