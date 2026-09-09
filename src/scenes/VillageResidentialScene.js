import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class VillageResidentialScene extends BaseScene {
    constructor() {
        super({ key: 'VillageResidentialScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#0f172a');
        this.createVillageResidentialAtmosphere();

        this.currentLocationName = 'Pemukiman Desa (3 Rumah Pemesan Roti)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'EastForestScene') {
            startX = 740;
        } else if (data && data.from === 'BakeryMillScene') {
            startX = 60;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // House 1: Pak Thomas
        this.house1 = this.physics.add.staticSprite(200, 370, 'village_house1').setDepth(4);
        this.npc1 = this.physics.add.staticSprite(240, 395, 'npc_thomas').setDepth(5);
        this.add.text(200, 305, 'Rumah 1\nPak Thomas', { fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', align: 'center' }).setOrigin(0.5).setDepth(20);

        // House 2: Ibu Sarah
        this.house2 = this.physics.add.staticSprite(420, 370, 'village_house2').setDepth(4);
        this.npc2 = this.physics.add.staticSprite(460, 395, 'npc_sarah').setDepth(5);
        this.add.text(420, 305, 'Rumah 2\nIbu Sarah', { fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', align: 'center' }).setOrigin(0.5).setDepth(20);

        // House 3: Paman Bob
        this.house3 = this.physics.add.staticSprite(640, 370, 'village_house3').setDepth(4);
        this.npc3 = this.physics.add.staticSprite(680, 395, 'npc_bob').setDepth(5);
        this.add.text(640, 305, 'Rumah 3\nPaman Bob', { fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', align: 'center' }).setOrigin(0.5).setDepth(20);

        this.add.text(20, 65, '◀ Toko Roti Mr. Breado', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Hutan Timur ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
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
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'house1') {
                this.deliverToHouse('thomas', 'Pak Thomas', this.house1);
            } else if (this.nearTarget.type === 'house2') {
                this.deliverToHouse('sarah', 'Ibu Sarah', this.house2);
            } else if (this.nearTarget.type === 'house3') {
                this.deliverToHouse('bob', 'Paman Bob', this.house3);
            }
        }
    }

    deliverToHouse(houseKey, name, sprite) {
        let delivered = this.registry.get('deliveredHouses') || [];
        if (delivered.includes(houseKey)) {
            let message = '';
            if (houseKey === 'thomas') message = 'Pak Thomas: "Rotinya masih hangat dan sangat lezat! Terima kasih ya, Goblin kecil yang baik hati!"';
            if (houseKey === 'sarah') message = 'Ibu Sarah: "Selamat pagi Goblin kecil yang manis! Roti hangat ini pas sekali untuk sarapan."';
            if (houseKey === 'bob') message = 'Paman Bob: "Terima kasih banyak Goblin kecil! Kamu makhluk kecil yang sangat rajin dan ramah!"';

            this.startDialogue([
                { speaker: name, text: message }
            ]);
            return;
        }

        const qState = getQuestState(this.registry);
        if (qState.questNumber < 8) {
            this.startDialogue([
                { speaker: name, text: 'Halo Goblin kecil! Kami sedang menunggu pesanan roti pagi dari Mr. Breado.' }
            ]);
            return;
        }

        delivered.push(houseKey);
        this.registry.set('deliveredHouses', delivered);
        const count = delivered.length;
        this.registry.set('breadDeliverCount', count);

        const notice = this.add.text(sprite.x, sprite.y - 40, `✨ Roti Terantar! (${count}/3)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        if (count >= 3) {
            setQuestState(this.registry, {
                chapter: 'BAB 3',
                title: 'Quest 9: Minta Hadiah Magic Bread',
                objective: '3 Roti Warga Terantar! Kembali & temui Mr. Breado [E] untuk menerima [Magic Bread] sebagai hadiah.',
                questNumber: 9,
                completedQuests: [
                    'Quest 1-3: Bahan 1 Madu Murni',
                    'Quest 4-6: Bahan 2 Mythical Seed',
                    'Quest 7: Giling Tepung Magis',
                    'Quest 8: Antar 3 Keranjang Roti Pagi ke Warga'
                ]
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: name, text: `Terima kasih banyak Goblin kecil yang baik hati! Ini roti pesanan yang kami tunggu!` },
                { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 3 rumah warga desa sudah menerima roti pagi mereka! Sekarang aku harus kembali menemui Mr. Breado di Toko Roti!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 3',
                title: 'Quest 8: Antar 3 Roti Pagi',
                objective: `Antar keranjang roti pagi ke 3 rumah warga desa (Progress: ${count}/3).`,
                questNumber: 8
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: name, text: `Wah, terima kasih Goblin kecil yang baik! Roti buatan Mr. Breado selalu yang terbaik!` },
                { speaker: 'Aksel (Goblin)', text: `Sama-sama! Masih ada ${3 - count} rumah lagi yang harus kuantarkan.` }
            ]);
        }
    }

    update() {
        let found = null;
        let delivered = this.registry.get('deliveredHouses') || [];

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house1.x, this.house1.y) < 70) {
            const prompt = delivered.includes('thomas') ? 'Tekan [E] Bicara Pak Thomas' : 'Tekan [E] Antar Roti (Rumah Pak Thomas)';
            found = { type: 'house1', x: this.house1.x, y: this.house1.y - 45, prompt: prompt };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house2.x, this.house2.y) < 70) {
            const prompt = delivered.includes('sarah') ? 'Tekan [E] Bicara Ibu Sarah' : 'Tekan [E] Antar Roti (Rumah Ibu Sarah)';
            found = { type: 'house2', x: this.house2.x, y: this.house2.y - 45, prompt: prompt };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house3.x, this.house3.y) < 70) {
            const prompt = delivered.includes('bob') ? 'Tekan [E] Bicara Paman Bob' : 'Tekan [E] Antar Roti (Rumah Paman Bob)';
            found = { type: 'house3', x: this.house3.x, y: this.house3.y - 45, prompt: prompt };
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
                const delivered = this.registry.get('deliveredHouses') || [];
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (delivered.length < 3 && !hasMagicBread) {
                    this.showMapLockedNotice('Antarkan 3 keranjang roti ke 3 rumah warga desa dulu!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }

                if (hasMagicBread) {
                    this.showMapLockedNotice('Magic Bread sudah didapatkan! Segera kembali ke Madam Joanne di timur.');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }

                this.scene.start('BakeryMillScene', { from: 'VillageResidentialScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const delivered = this.registry.get('deliveredHouses') || [];
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (delivered.length < 3 && !hasMagicBread) {
                    this.showMapLockedNotice('Antarkan 3 keranjang roti ke 3 rumah warga desa dulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('EastForestScene', { from: 'VillageResidentialScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 11: EAST FOREST SCENE (HUTAN LEBAT TIMUR / JALUR KE RUMAH PENYIHIR)
// -------------------------------------------------------------
