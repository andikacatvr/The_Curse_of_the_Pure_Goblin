import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class BakeryMillScene extends BaseScene {
    constructor() {
        super({ key: 'BakeryMillScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e3a5f');
        this.createBakeryMillAtmosphere();

        this.currentLocationName = 'Area Gilingan Batu & Toko Roti Mr. Breado (Bab 3)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'VillageResidentialScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // NPC Mr. Breado
        this.breado = this.physics.add.staticSprite(200, 390, 'npc_breado').setDepth(5);
        this.breado.type = 'npc';

        // Stone Mill (Interactive 1)
        this.mill = this.physics.add.staticSprite(380, 395, 'stone_mill').setDepth(4);
        this.mill.type = 'mill';

        // Bread Baskets (Interactive 2)
        this.basket = this.physics.add.staticSprite(550, 405, 'bread_basket').setDepth(4);
        this.basket.type = 'basket';

        // Magic Oven (Interactive 3)
        this.oven = this.physics.add.staticSprite(710, 380, 'magic_oven').setDepth(4);
        this.oven.type = 'oven';

        this.add.text(20, 65, '◀ Pinggir Hutan (Kayu)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Pemukiman Warga (3 Rumah) ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#60a5fa', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);

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

        this.updateDialogueState();
    }

    updateDialogueState() {
        const inv = getInventory(this.registry);
        const hasFlour = inv.some(i => i.id === 'Tepung Magis');
        const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
        const delivered = this.registry.get('deliveredHouses') || [];
        const qState = getQuestState(this.registry);

        if (hasMagicBread) {
            this.breado.dialogue = [
                { speaker: 'Mr. Breado', text: 'Selamat ya Goblin kecil yang baik hati! Ketiga Bahan Magis utama sudah lengkap di tanganmu!' },
                { speaker: 'Mr. Breado', text: 'Segera kembali ke kediaman Madam Joanne di timur untuk melepaskan kutukan & menyembuhkan adikmu!' }
            ];
        } else if (delivered.length >= 3 || qState.questNumber === 9) {
            this.breado.dialogue = [
                { speaker: 'Mr. Breado', text: 'Wah, kamu sudah kembali! Terima kasih banyak sudah mengantarkan seluruh roti ke rumah warga!' }
            ];
        } else if (hasFlour || qState.questNumber === 8) {
            this.breado.dialogue = [
                { speaker: 'Mr. Breado', text: 'Bantu aku mengantarkan 3 Keranjang Roti Pagi ke 3 rumah warga di area Pemukiman Warga (sebelah kanan) ya, Goblin kecil!' }
            ];
        } else {
            this.breado.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Halo Tuan, perkenalkan namaku Aksel...' },
                { speaker: 'Mr. Breado', text: 'Ohoho! Halo juga kawan kecil bertubuh hijau! Aku Mr. Breado si pembuat roti desa. Ada alasan apa gerangan yang membawamu datang kemari?' },
                { speaker: 'Aksel (Goblin)', text: 'Mr. Breado, kedatanganku kemari demi menyelamatkan adik perempuanku yang sedang sakit parah di rumah...' },
                { speaker: 'Aksel (Goblin)', text: 'Karena kesalahanku di masa lalu, aku terkena kutukan dari penyihir Madam Joanne yang mengubah tubuhku menjadi Goblin.' },
                { speaker: 'Aksel (Goblin)', text: 'Untuk menyelamatkannya dan melepaskan kutukan ini, aku membutuhkan sesuatu darimu sesuai petunjuk yang diberikan Madam Joanne, yaitu [Magic Bread]!' },
                { speaker: 'Mr. Breado', text: 'Astaga... Kisah perjuangan yang begitu menyentuh hati demi seorang adik! Tentu saja aku akan membantumu mendapatkan Magic Bread, Aksel!' },
                { speaker: 'Mr. Breado', text: 'Tapi benih keras [Mythical Seed] yang kau bawa itu harus digiling terlebih dahulu di Mesin Gilingan Batu Desa di sebelahku ini agar menjadi Tepung Magis!' },
                { speaker: 'Aksel (Goblin)', text: 'Baik Mr. Breado! Aku akan segera menggiling [Mythical Seed] ini!' }
            ];
        }
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'npc') {
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
                const delivered = this.registry.get('deliveredHouses') || [];

                if (delivered.length >= 3 && !hasMagicBread) {
                    this.giveMagicBreadReward();
                } else {
                    this.startDialogue(this.breado.dialogue);
                }
            } else if (this.nearTarget.type === 'mill') {
                this.grindSeed();
            } else if (this.nearTarget.type === 'basket') {
                this.deliverBread();
            } else if (this.nearTarget.type === 'oven') {
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
                if (hasMagicBread) {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Oven magis ini telah selesai memanggang Magic Bread yang kuterima dari Mr. Breado.' }
                    ]);
                } else {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Aroma harum Magic Bread tercium dari oven! Aku harus bicara ke Mr. Breado untuk menerima hadiahku.' }
                    ]);
                }
            }
        }
    }

    grindSeed() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Tepung Magis')) return;

        inv.push({ id: 'Tepung Magis', desc: 'Tepung halus berkilau emas hasil gilingan Mythical Seed.' });
        this.registry.set('inventory', inv);
        this.renderInventorySlots();

        const notice = this.add.text(this.mill.x, this.mill.y - 30, '✨ + Tepung Magis!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        setQuestState(this.registry, {
            chapter: 'BAB 3',
            title: 'Quest 8: Antar 3 Roti Pagi',
            objective: 'Tepung Magis didapatkan! Antarkan 3 Keranjang Roti Pagi ke 3 rumah warga di sebelah kanan [➔].',
            questNumber: 8,
            completedQuests: [
                'Quest 1-3: Bahan 1 Madu Murni',
                'Quest 4-6: Bahan 2 Mythical Seed',
                'Quest 7: Giling Mythical Seed Jadi Tepung Magis'
            ]
        });
        this.updateQuestHUD();
        this.updateDialogueState();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! Mythical Seed sudah berhasil digiling menjadi [Tepung Magis]!' },
            { speaker: 'Mr. Breado', text: 'Bagus sekali! Sekarang tugas berikutnya: Antarkan 3 Keranjang Roti Pagi ke 3 rumah warga di sebelah kanan (Pemukiman Warga) ya, Goblin kecil!' }
        ]);
    }

    deliverBread() {
        let count = this.registry.get('breadDeliverCount') || 0;
        if (count >= 3) {
            this.startDialogue([
                { speaker: 'Mr. Breado', text: 'Semua 3 roti sudah berhasil kamu antarkan ke rumah-rumah warga desa! Terima kasih ya, Goblin kecil yang baik hati!' }
            ]);
            return;
        }

        this.startDialogue([
            { speaker: 'Mr. Breado', text: 'Antarkan 3 keranjang roti ini ke 3 rumah warga yang berada di sebelah kanan (Pemukiman Warga)!' },
            { speaker: 'Aksel (Goblin)', text: 'Baik Mr. Breado, aku akan langsung mengantarkannya ke rumah-rumah warga!' }
        ]);
    }

    giveMagicBreadReward() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Bahan 3: Magic Bread')) return;

        inv.push({ id: 'Bahan 3: Magic Bread', desc: 'Roti magis emas kaya nutrisi sihir pemulihan, hadiah dari Mr. Breado.' });
        this.registry.set('inventory', inv);
        this.renderInventorySlots();

        const notice = this.add.text(this.breado.x, this.breado.y - 45, '✨ + Bahan 3: Magic Bread!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#2ecc71', backgroundColor: '#000000aa', padding: { x: 6, y: 3 }
        }).setOrigin(0.5);
        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1500, onComplete: () => notice.destroy() });

        setQuestState(this.registry, {
            chapter: 'BAB 4',
            title: 'Bab 4: Kembali ke Madam Joanne',
            objective: 'Ketiga Bahan Magis LENGKAP! Kembali ke Rumah Madam Joanne lewat Hutan Timur [➔].',
            questNumber: 10,
            completedQuests: [
                'Quest 1-3: Bahan 1 Madu Murni',
                'Quest 4-6: Bahan 2 Mythical Seed',
                'Quest 7-9: Bahan 3 Magic Bread'
            ]
        });
        this.updateQuestHUD();
        this.updateDialogueState();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Mr. Breado! Semua 3 keranjang roti pagi sudah berhasil kuantarkan ke seluruh rumah warga desa!' },
            { speaker: 'Mr. Breado', text: 'Luar biasa! Terima kasih banyak ya, Goblin kecil yang baik hati! Warga desa sangat terbantu olehmu.' },
            { speaker: 'Mr. Breado', text: 'Sebagai hadiah atas kebaikan dan bantuanmu, ini aku serahkan [Bahan 3: Magic Bread] yang baru saja selesai kupanggang dengan sempurna!' },
            { speaker: 'Aksel (Goblin)', text: 'HOREEE!! [Bahan 3: Magic Bread] akhirnya kudapatkan! Terima kasih banyak Mr. Breado!' },
            { speaker: 'Aksel (Dalam Hati)', text: '(Ketiga Bahan Magis akhirnya lengkap! Sekarang aku bisa kembali ke Madam Joanne untuk melepaskan kutukan dan menyembuhkan Rachael!)' }
        ], () => {
            this.showChapterBanner('SEMUA 3 BAHAN MAGIS LENGKAP!', 'Segera Temui Madam Joanne untuk Menyembuhkan Rachael!');
        });
    }

    update() {
        let found = null;
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasFlour = inv.some(i => i.id === 'Tepung Magis');
        const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
        const delivered = this.registry.get('deliveredHouses') || [];

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.breado.x, this.breado.y) < 60) {
            const prompt = (delivered.length >= 3 && !hasMagicBread) ? 'Tekan [E] Minta Hadiah Magic Bread dari Mr. Breado' : 'Tekan [E] Bicara Mr. Breado';
            found = { type: 'npc', x: this.breado.x, y: this.breado.y - 35, prompt: prompt };
        } else if (!hasFlour && !hasMagicBread && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mill.x, this.mill.y) < 55) {
            found = { type: 'mill', x: this.mill.x, y: this.mill.y - 30, prompt: 'Tekan [E] Giling Mythical Seed' };
        } else if (hasFlour && !hasMagicBread && qState.questNumber === 8 && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.basket.x, this.basket.y) < 55) {
            found = { type: 'basket', x: this.basket.x, y: this.basket.y - 25, prompt: 'Tekan [E] Info Roti Pagi' };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.oven.x, this.oven.y) < 60) {
            found = { type: 'oven', x: this.oven.x, y: this.oven.y - 35, prompt: 'Tekan [E] Lihat Oven Magis' };
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
                this.showMapLockedNotice('Tugas Mr. Heinreich sudah selesai! Fokus membantu Mr. Breado mengolah Magic Bread.');
                this.player.setX(35);
                this.player.setVelocityX(150);
            },
            canExitRight: true,
            onExitRight: () => {
                if (!hasFlour && !hasMagicBread) {
                    this.showMapLockedNotice('Giling Mythical Seed di Mesin Batu dulu menjadi Tepung Magis!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('VillageResidentialScene', { from: 'BakeryMillScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 10: VILLAGE RESIDENTIAL SCENE (3 RUMAH PEMESAN ROTI)
// -------------------------------------------------------------
