import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class BeeGardenScene extends BaseScene {
    constructor() {
        super({ key: 'BeeGardenScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#38bdf8');
        this.createBeeGardenAtmosphere();

        this.currentLocationName = 'Kebun Lebah Magis & Sarang Lebah (Grandma Mary)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        this.player = this.physics.add.sprite(740, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.beehive = this.physics.add.staticSprite(650, 320, 'beehive').setDepth(4);
        this.add.text(650, 290, '🐝 Sarang Lebah Magis', { fontSize: '11px', fontStyle: 'bold', fill: '#fef08a' }).setOrigin(0.5).setDepth(20);

        this.weedsGroup = this.physics.add.staticGroup();
        this.weedCount = this.registry.get('weedCount') || 0;

        if (this.weedCount < 5) {
            const weedPositions = [150, 260, 370, 480, 570];
            for (let i = this.weedCount; i < 5; i++) {
                const weed = this.weedsGroup.create(weedPositions[i], 412, 'weed_node');
                weed.type = 'weed';
                weed.setDepth(4);
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(780, 65, 'Ke Halaman Grandma Mary ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
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

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'weed') {
                if (!this.registry.get('talkedToMary')) {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Aku harus bicara dulu dengan Grandma Mary di halaman sebelum membersihkan rumput liar di kebun ini!' }
                    ]);
                } else {
                    this.cleanWeed(this.nearTarget.sprite);
                }
            } else if (this.nearTarget.type === 'beehive') {
                this.harvestHoney();
            }
        }
    }

    cleanWeed(weedSprite) {
        this.weedCount++;
        this.registry.set('weedCount', this.weedCount);
        
        const notice = this.add.text(weedSprite.x, weedSprite.y - 25, `✨ Rumput Liar Bersih! (${this.weedCount}/5)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#4ade80', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        weedSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (this.weedCount >= 5) {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Quest 2: Beli Bee Smoker (Mr. Heinreich)',
                objective: 'Rumput liar selesai! Beli Bee Smoker dari Mr. Heinreich di bengkel kayu (Timur).',
                questNumber: 2,
                completedQuests: ['Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary']
            });

            this.time.delayedCall(800, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 5 rumput liar dan hama di Kebun Lebah sudah kubersihkan!' },
                    { speaker: 'Aksel (Goblin)', text: 'Sekarang aku perlu [Bee Smoker] dari Mr. Heinreich si tukang kayu agar lebahnya tidak menyengat saat dipanen!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Quest 1: Bersihkan 5 Rumput Liar',
                objective: `Bersihkan rumput liar di Kebun Lebah (Progress: ${this.weedCount}/5).`
            });
        }
        this.updateQuestHUD();
    }

    harvestHoney() {
        const inv = getInventory(this.registry);
        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');

        if (hasHoney) {
            this.startDialogue([{ speaker: 'Aksel (Goblin)', text: 'Madu Murni dari sarang lebah ini sudah berhasil kupanen!' }]);
            return;
        }

        if (!hasSmoker) {
            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Aduuh! Lebah-lebahnya marah dan menyengat! Aku harus mendapatkan [Bee Smoker] dulu dari Mr. Heinreich!' }
            ]);
            return;
        }

        const smoke = this.add.circle(this.beehive.x, this.beehive.y, 10, 0x94a3b8, 0.7);
        this.tweens.add({ targets: smoke, scaleX: 4, scaleY: 4, alpha: 0, duration: 1500, onComplete: () => smoke.destroy() });

        inv.push({ id: 'Bahan 1: Madu Murni', desc: 'Madu emas murni penetral racun & penyembuh penyakit.' });
        this.registry.set('inventory', inv);

        this.add.text(this.beehive.x, this.beehive.y - 35, '✨ + [Bahan 1: Madu Murni]!', {
            fontSize: '14px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5);

        this.renderInventorySlots();

        setQuestState(this.registry, {
            chapter: 'BAB 2',
            title: 'Bab 2: Berburu Mythical Seed',
            objective: 'Madu Murni dikumpulkan! Pergi ke Mr. Heinreich di Bengkel Kayu untuk Bahan 2 (Mythical Seed).',
            questNumber: 4,
            completedQuests: [
                'Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary',
                'Quest 2: Dapatkan Bee Smoker dari Mr. Heinreich',
                'Quest 3: Panen Bahan 1 (Madu Murni) dari Sarang Lebah'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! Asapnya menenangkan lebah dan aku mendapatkan [Bahan 1: Madu Murni]!' },
            { speaker: 'Grandma Mary', text: 'Luar biasa Aksel! Simpan baik-baik madu murni itu untuk adimu.' },
            { speaker: 'Aksel (Goblin)', text: 'Terima kasih Nenek Mary! 1 Bahan Magis selesai, sekarang aku menuju Mr. Heinreich untuk Bahan 2 (Mythical Seed)!' }
        ]);
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.beehive.x, this.beehive.y) < 60) {
            found = { type: 'beehive', x: this.beehive.x, y: this.beehive.y - 35, prompt: 'Tekan [E] Panen Madu Murni' };
        }

        this.weedsGroup.children.iterate((weed) => {
            if (weed && weed.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, weed.x, weed.y) < 45) {
                const promptMsg = this.registry.get('talkedToMary') ? 'Tekan [E] Bersihkan Rumput Liar' : 'Bicara Dulu dengan Nenek Mary!';
                found = { type: 'weed', sprite: weed, x: weed.x, y: weed.y - 25, prompt: promptMsg };
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
            canExitLeft: false,
            minX: 20,
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('GrandmaGardenScene', { from: 'BeeGardenScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 6: WOODSHOP SCENE (BENGKEL KAYU MR. HEINREICH - BAB 2)
// -------------------------------------------------------------
