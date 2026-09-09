import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory } from '../utils/gameState.js';

export class EastForestScene extends BaseScene {
    constructor() {
        super({ key: 'EastForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#051f1a');
        this.createEastForestAtmosphere();

        this.currentLocationName = 'Hutan Belantara Timur (Jalur Kembali ke Rumah Madam Joanne)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'WitchYardScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Signpost in center
        this.add.rectangle(400, 400, 12, 40, 0x78350f).setDepth(4);
        this.add.rectangle(400, 380, 150, 24, 0xd97706).setDepth(4);
        this.add.text(400, 380, '◄ Pemukiman | Witch Yard ►', { fontSize: '10px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0.5).setDepth(4);

        this.add.text(20, 65, '◀ Pemukiman Desa', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Halaman Madam Joanne ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#a855f7', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
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

    update() {
        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                this.showMapLockedNotice('Ketiga Bahan Magis sudah lengkap! Segera temui Madam Joanne di timur.');
                this.player.setX(35);
                this.player.setVelocityX(150);
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

