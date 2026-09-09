import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class WoodshopScene extends BaseScene {
    constructor() {
        super({ key: 'WoodshopScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#451a03');
        this.createWoodshopAtmosphere();

        let startX = 60;
        if (data && data.from === 'FirewoodForestScene') {
            startX = 740;
        }

        this.currentLocationName = 'Bengkel & Gudang Kayu Mr. Heinreich (Timur Desa)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.heinreich = this.physics.add.staticSprite(220, 390, 'npc_heinreich').setDepth(5);
        this.heinreich.type = 'npc';

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');

        // Trigger Chapter 2 Banner when arriving with Honey
        if (hasHoney && qState.chapter === 'BAB 2' && !this.registry.get('ch2BannerShown')) {
            this.registry.set('ch2BannerShown', true);
            this.showChapterBanner('BAB 2: BERBURU MYTHICAL SEED', 'Bahan 2 Dari 3 Bahan Magis');
        }

        // Dialogue setup based on Chapter 2 progress
        if (hasSeed) {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Bawa [Mythical Seed] itu ke Mr. Breado si pembuat roti untuk diolah menjadi Magic Bread!' }
            ];
        } else if (qState.questNumber === 6) {
            this.heinreich.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Ini 3 Kayu Bakar Khusus yang kau minta dari pinggir hutan!' },
                { speaker: 'Mr. Heinreich', text: 'Kerja keras yang luar biasa, Goblin kecil! Sesuai janjiku, ini [Bahan 2: Mythical Seed] untukmu!' }
            ];
        } else if (qState.questNumber === 5) {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Sekarang cari 3 Kayu Bakar Khusus di Pinggir Hutan (Timur) lalu serahkan padaku ya, Goblin kecil!' }
            ];
        } else if (hasHoney) {
            this.heinreich.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Aku sudah berhasil mendapatkan Madu Murni! Sekarang aku membutuhkan [Bahan 2: Mythical Seed]!' },
                { speaker: 'Mr. Heinreich', text: 'Hoho! Kau Goblin kecil yang hebat juga! Tapi Mythical Seed itu langka. Bantu aku 2 tugas dulu ya.' },
                { speaker: 'Mr. Heinreich', text: 'Tugas pertama (Quest 4): Rapikan 5 Karung Pupuk di sebelah kanan gudang ini!' }
            ];
        } else if (!hasSmoker) {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Hei! Siapa kau, makhluk kecil berkulit hijau? Siapa yang menyuruhmu datang ke bengkel kayuku ini?' },
                { speaker: 'Aksel (Goblin)', text: 'Salam Paman Heinrich, namaku Aksel. Aku datang kemari atas petunjuk dari Grandma Mary!' },
                { speaker: 'Mr. Heinreich', text: 'Grandma Mary yang menyuruhmu kemari? Ada urusan apa seorang Goblin membawakan nama wanita tua bijak itu?' },
                { speaker: 'Aksel (Goblin)', text: 'Aku sedang membantu Grandma Mary di kebunnya. Beliau menyuruhku datang kepadamu untuk meminjam alat pengasap lebah (Bee Smoker).' },
                { speaker: 'Mr. Heinreich', text: 'Oho! Begitu rupanya... Karena kau datang atas petunjuk Grandma Mary dan berniat baik membantunya, tentu saja boleh!' },
                { speaker: 'Mr. Heinreich', text: 'Ambillah [Bee Smoker] di atas meja sampingku itu agar lebah magis tidak menyengatmu saat memanen madu!' }
            ];
        } else {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Gunakan [Bee Smoker] itu di kebun Grandma Mary agar lebahnya tenang saat dipanen!' }
            ];
        }

        // Bee Smoker Item (Quest 2)
        this.smokerItem = null;
        if (!hasSmoker && !hasHoney) {
            this.smokerItem = this.physics.add.staticSprite(320, 405, 'item_smoker');
            this.smokerItem.type = 'smoker_item';
        }

        // 5 Fertilizer Bags Group (Quest 4)
        this.bagsGroup = this.physics.add.staticGroup();
        this.bagCount = this.registry.get('bagCount') || 0;
        if (hasHoney && !hasSeed && this.bagCount < 5 && (qState.questNumber === 4 || qState.questNumber < 4)) {
            const bagPositions = [450, 520, 590, 660, 730];
            for (let i = this.bagCount; i < 5; i++) {
                const bag = this.bagsGroup.create(bagPositions[i], 408, 'fertilizer_bag');
                bag.type = 'bag';
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(20, 65, '◀ Kebun Grandma Mary', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Pinggir Hutan (Kayu) ➔', {
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
            if (this.nearTarget.type === 'npc') {
                this.startDialogue(this.nearTarget.dialogue, () => {
                    const qState = getQuestState(this.registry);
                    if (qState.questNumber === 6) {
                        this.giveMythicalSeed();
                    }
                });
            } else if (this.nearTarget.type === 'smoker_item') {
                this.collectSmoker();
            } else if (this.nearTarget.type === 'bag') {
                this.arrangeBag(this.nearTarget.sprite);
            }
        }
    }

    collectSmoker() {
        const inv = getInventory(this.registry);
        inv.push({ id: 'Bee Smoker', desc: 'Alat pengasap seng untuk menenangkan lebah galak.' });
        this.registry.set('inventory', inv);

        const notice = this.add.text(this.smokerItem.x, this.smokerItem.y - 30, '✨ + Bee Smoker!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#2ecc71', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        this.smokerItem.destroy();
        this.smokerItem = null;
        this.nearTarget = null;
        this.promptText.setVisible(false);
        this.renderInventorySlots();

        setQuestState(this.registry, {
            chapter: 'BAB 1',
            title: 'Quest 3: Panen Madu Murni',
            objective: 'Bee Smoker didapatkan! Kembali ke Kebun Grandma Mary & panen Madu [E].',
            questNumber: 3,
            completedQuests: [
                'Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary',
                'Quest 2: Dapatkan Bee Smoker dari Mr. Heinreich'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil mendapatkan [Bee Smoker]! Sekarang aku bisa memanen Madu Murni dari lebah Grandma Mary!' }
        ]);
    }

    arrangeBag(bagSprite) {
        this.bagCount++;
        this.registry.set('bagCount', this.bagCount);

        const notice = this.add.text(bagSprite.x, bagSprite.y - 25, `✨ Karung Pupuk Rapi! (${this.bagCount}/5)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        bagSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (this.bagCount >= 5) {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                objective: 'Karung pupuk rapi! Pergi ke Pinggir Hutan (Timur) & kumpulkan 3 Kayu Bakar Khusus.',
                questNumber: 5,
                completedQuests: [
                    'Quest 1-3: Bahan 1 Madu Murni',
                    'Quest 4: Rapikan 5 Karung Pupuk Gudang Heinreich'
                ]
            });
            this.updateQuestHUD();

            this.time.delayedCall(800, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Semua 5 Karung Pupuk di gudang sudah kurapikan!' },
                    { speaker: 'Mr. Heinreich', text: 'Bagus sekali! Sekarang tugas kedua: Jalan ke sebelah kanan ke Pinggir Hutan dan kumpulkan 3 Kayu Bakar Khusus!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 4: Susun 5 Karung Pupuk',
                objective: `Rapikan karung pupuk di gudang Heinreich (Progress: ${this.bagCount}/5).`,
                questNumber: 4
            });
            this.updateQuestHUD();
        }
    }

    giveMythicalSeed() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Bahan 2: Mythical Seed')) return;

        inv.push({ id: 'Bahan 2: Mythical Seed', desc: 'Benih langka berevolusi sihir energi kehidupan.' });
        this.registry.set('inventory', inv);

        this.renderInventorySlots();

        // Trigger Chapter 3 Banner & Quest State
        this.showChapterBanner('BAB 3: MEMBUAT MAGIC BREAD', 'Bahan 3 Dari 3 Bahan Magis');

        setQuestState(this.registry, {
            chapter: 'BAB 3',
            title: 'Bab 3: Olah Tepung Magis',
            objective: 'Bawa Mythical Seed ke Mesin Gilingan Batu Desa & temui Mr. Breado.',
            questNumber: 7,
            completedQuests: [
                'Quest 1-3: Bahan 1 Madu Murni',
                'Quest 4: Rapikan 5 Karung Pupuk',
                'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                'Quest 6: Terima Bahan 2 (Mythical Seed)'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Hore!! Aku mendapatkan [Bahan 2: Mythical Seed]!' },
            { speaker: 'Mr. Heinreich', text: 'Bawa benih magis itu ke Mr. Breado si koki roti desa untuk diolah menjadi Magic Bread!' },
            { speaker: 'Aksel (Goblin)', text: 'Terima kasih Mr. Heinreich! 2 Bahan selesai, tinggal 1 bahan terakhir (Magic Bread)!' }
        ]);
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heinreich.x, this.heinreich.y) < 60) {
            found = { type: 'npc', dialogue: this.heinreich.dialogue, x: this.heinreich.x, y: this.heinreich.y - 35, prompt: 'Tekan [E] Bicara Mr. Heinreich' };
        } else if (this.smokerItem && this.smokerItem.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.smokerItem.x, this.smokerItem.y) < 45) {
            found = { type: 'smoker_item', x: this.smokerItem.x, y: this.smokerItem.y - 25, prompt: 'Tekan [E] Ambil Bee Smoker' };
        }

        this.bagsGroup.children.iterate((bag) => {
            if (bag && bag.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, bag.x, bag.y) < 45) {
                found = { type: 'bag', sprite: bag, x: bag.x, y: bag.y - 25, prompt: 'Tekan [E] Rapikan Karung Pupuk' };
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
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                if (hasHoney) {
                    this.showMapLockedNotice('Tugas di kebun Grandma Mary selesai! Fokus pada tugas Mr. Heinreich.');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }
                this.scene.start('GrandmaGardenScene', { from: 'WoodshopScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const qState = getQuestState(this.registry);

                if (!hasHoney) {
                    this.showMapLockedNotice('Kumpulkan [Bahan 1: Madu Murni] dari kebun Grandma Mary dulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else if (qState.questNumber < 5) {
                    this.showMapLockedNotice('Bicara & rapikan 5 Karung Pupuk dulu bersama Mr. Heinreich!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('FirewoodForestScene', { from: 'WoodshopScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 8: FIREWOOD FOREST SCENE (PINGGIR HUTAN TIMUR - BAB 2)
// -------------------------------------------------------------
