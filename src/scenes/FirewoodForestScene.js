import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, setQuestState } from '../utils/gameState.js';

export class FirewoodForestScene extends BaseScene {
    constructor() {
        super({ key: 'FirewoodForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#091e17');
        this.createFirewoodForestAtmosphere();

        this.currentLocationName = 'Area Kayu Bakar Khusus (Pinggir Hutan Timur)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

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
                const wItem = this.woodGroup.create(woodPositions[i], 410, 'special_firewood');
                wItem.woodIndex = i;
                wItem.type = 'firewood';
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

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `✨ Kayu Bakar Khusus! (${count}/3)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

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
}

// -------------------------------------------------------------
// SCENE 9: BAKERY MILL SCENE (TOKO ROTI & GILINGAN BATU - BAB 3)
// -------------------------------------------------------------
