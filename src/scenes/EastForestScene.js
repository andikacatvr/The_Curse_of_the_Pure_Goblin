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

        this.currentLocationName = 'Hutan Belantara Timur (Jalur Kembali ke Rumah Madam Joanne)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

        let startX = 60;
        if (data && data.from === 'WitchYardScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Carved Directional Signpost with Hanging Magic Lantern
        const signG = this.add.graphics().setDepth(4);
        // Wooden Post
        signG.fillStyle(0x3b1d11, 1);
        signG.fillRect(396, 350, 8, 70);
        // Arrow Wooden Boards
        signG.fillStyle(0x5c2b16, 1);
        signG.fillRoundedRect(310, 362, 180, 26, 4);
        signG.fillStyle(0x854d0e, 1);
        signG.strokeRoundedRect(310, 362, 180, 26, 4);

        this.add.text(400, 375, '◄ Pemukiman | Kediaman Joanne ➔', {
            fontSize: '9.5px',
            fontStyle: 'bold',
            fill: '#fef08a',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(4);

        // Hanging magical lantern on signpost
        signG.fillStyle(0x0f172a, 1);
        signG.fillRect(388, 342, 24, 3);
        signG.fillRect(389, 345, 2, 8);
        signG.fillRect(386, 352, 8, 10);
        signG.fillStyle(0xc084fc, 1);
        signG.fillCircle(390, 357, 3);

        const lanternGlow = this.add.circle(390, 357, 18, 0xa855f7, 0.35).setDepth(3);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.2, to: 0.55 },
            scale: { from: 0.85, to: 1.2 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(20, 65, '◀ Pemukiman Desa', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Halaman Madam Joanne ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#c084fc', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
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
    }

    createEastForestAtmosphere() {
        // 1. High-fidelity Misty Birch Forest Background Asset
        this.add.image(400, 225, 'east_forest_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Cold Violet/Indigo Witchcraft Ambient Tint
        const ambG = this.add.graphics().setDepth(1);
        ambG.fillStyle(0x2e1065, 0.1);
        ambG.fillRect(0, 0, 800, 450);

        // 3. Drifting Eerie Forest Fog Layers
        for (let m = 0; m < 5; m++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(260, 410),
                Phaser.Math.Between(240, 420),
                Phaser.Math.Between(35, 65),
                0xe0e7ff,
                Phaser.Math.FloatBetween(0.06, 0.14)
            ).setDepth(1);

            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 35, to: mist.x + 35 },
                alpha: { from: 0.05, to: 0.18 },
                duration: Phaser.Math.Between(5000, 8500),
                yoyo: true,
                repeat: -1,
                delay: m * 500,
                ease: 'Sine.easeInOut'
            });
        }

        // 4. Ancient Runic Monolith Stone (Near X: 190)
        const runeG = this.add.graphics().setDepth(2);
        // Weathered monolith stone body
        runeG.fillStyle(0x1e1b4b, 1);
        runeG.fillRoundedRect(175, 275, 32, 143, 6);
        runeG.fillStyle(0x312e81, 0.8);
        runeG.fillRect(177, 277, 4, 139);

        // Glowing witchcraft runes etched on monolith
        const runeChars = [
            { text: 'ᚱ', y: 300, color: '#38bdf8' },
            { text: 'ᚦ', y: 330, color: '#c084fc' },
            { text: 'ᚨ', y: 360, color: '#2dd4bf' },
            { text: '⚡', y: 390, color: '#fde047' }
        ];

        runeChars.forEach(r => {
            const glyph = this.add.text(191, r.y, r.text, {
                fontSize: '13px',
                fontStyle: 'bold',
                fill: r.color
            }).setOrigin(0.5).setDepth(2);

            this.tweens.add({
                targets: glyph,
                alpha: { from: 0.25, to: 1 },
                scale: { from: 0.9, to: 1.15 },
                duration: Phaser.Math.Between(1600, 2400),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 5. Floating Witchcraft Will-o'-the-Wisps & Forest Spores
        for (let s = 0; s < 22; s++) {
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
        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (hasHoney && hasSeed && hasBread) {
                    this.showMapLockedNotice('Ketiga Bahan Magis sudah lengkap! Segera temui Madam Joanne di timur [➔].');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                } else {
                    this.scene.start('VillageResidentialScene', { from: 'EastForestScene' });
                }
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (!hasHoney || !hasSeed || !hasBread) {
                    this.showMapLockedNotice('Kumpulkan ketiga Bahan Magis dulu sebelum kembali ke Madam Joanne!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('WitchYardScene', { from: 'EastForestScene' });
                }
            }
        });
    }
}

