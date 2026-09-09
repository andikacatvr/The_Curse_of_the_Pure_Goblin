import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class WitchCottageScene extends BaseScene {
    constructor() {
        super({ key: 'WitchCottageScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0e0618');
        this.createWitchCottageAtmosphere();

        this.currentLocationName = 'Dalam Pondok Penyihir';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        this.player = this.physics.add.sprite(60, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.shelf = this.physics.add.staticSprite(500, 390, 'potion_shelf').setDepth(4);

        this.joanne = this.physics.add.staticSprite(650, 393, 'npc_joanne').setDepth(5);
        this.joanne.type = 'npc';
        const isCursed = qState.chapter !== 'PROLOG';
        this.joanne.setVisible(isCursed);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(20, 65, '◀ Keluar Ke Halaman', {
            fontSize: '11px', fontStyle: 'bold', fill: '#60a5fa', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);

        this.createVisualInventoryUI();
        this.createDialogueUI();
        this.createQuestUI();

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
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'shelf') {
                this.triggerTheftCutscene();
            } else if (this.nearTarget.type === 'npc') {
                this.talkToJoanne();
            } else if (this.nearTarget.type === 'exit') {
                this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
            }
        }
    }

    talkToJoanne() {
        const inv = getInventory(this.registry);
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
        const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

        if (hasHoney && hasSeed && hasBread) {
            this.triggerEpilogueCutscene();
        } else {
            const dialogue = [
                { speaker: 'Madam Joanne', text: 'Kembali lagi, Aksel? Ingat, kau butuh 3 Bahan Magis untuk menyembuhkan adikmu dan melepaskan kutukan ini:' },
                { speaker: 'Madam Joanne', text: `1. [Madu Murni] dari kebun Grandma Mary: ${hasHoney ? '✅ (Sudah)' : '❌ (Belum)'}` },
                { speaker: 'Madam Joanne', text: `2. [Mythical Seed] dari Mr. Heinreich: ${hasSeed ? '✅ (Sudah)' : '❌ (Belum)'}` },
                { speaker: 'Madam Joanne', text: `3. [Magic Bread] dari Mr. Breado: ${hasBread ? '✅ (Sudah)' : '❌ (Belum)'}` },
                { speaker: 'Madam Joanne', text: 'Cepat selesaikan tugas warga desa dan kumpulkan semua bahannya!' }
            ];
            this.startDialogue(dialogue);
        }
    }

    triggerEpilogueCutscene() {
        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Madam Joanne! Aku telah berhasil mengumpulkan ketiga Bahan Magis (Madu Murni, Mythical Seed, dan Magic Bread)!' },
            { speaker: 'Aksel (Goblin)', text: 'Tolong lepaskan kutukan ini dan berikan obat ramuan untuk adikku Rachael!' },
            { speaker: 'Madam Joanne', text: 'Fufufu... Kau Goblin kerdil yang luar biasa gigih dan tulus, Aksel.' },
            { speaker: 'Madam Joanne', text: 'Ketahuilah... Botol ramuan yang kau curi dulu sebenarnya hanyalah Minyak Pegal Biasa!' },
            { speaker: 'Aksel (Goblin)', text: 'APA?! Ramuan yang kuambil dulu bukan obat?!' },
            { speaker: 'Madam Joanne', text: 'Tentu saja bukan! Tapi dengan 3 Bahan Magis hasil kerja kerasmu membantu warga desa ini, aku meracikkan RAMUAN KESEMBUHAN ASLI untuk adiknya!' },
            { speaker: 'Madam Joanne', text: 'Dan karena ketulusan hatimu, KUTUKAN GOBLIN DIHAPUSKAN!' }
        ], () => {
            const flash = this.add.rectangle(400, 225, 800, 450, 0xffffff, 0.95).setDepth(30);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    flash.destroy();
                    this.player.setTexture('player_human');
                    this.registry.set('isCursed', false);

                    const inv = getInventory(this.registry);
                    inv.push({ id: 'Ramuan Kesembuhan Asli', desc: 'Ramuan magis asli buatan Madam Joanne untuk Rachael.' });
                    this.registry.set('inventory', inv);
                    this.renderInventorySlots();

                    setQuestState(this.registry, {
                        chapter: 'BAB 4',
                        title: 'Bab 4: Pulang & Obati Rachael',
                        objective: 'Kutukan terlepas! Bawa [Ramuan Kesembuhan Asli] pulang ke rumah di barat lewat Jalan Hutan [◀].',
                        questNumber: 10,
                        completedQuests: [
                            'Quest 1-3: Bahan 1 Madu Murni',
                            'Quest 4-6: Bahan 2 Mythical Seed',
                            'Quest 7-9: Bahan 3 Magic Bread'
                        ]
                    });
                    this.updateQuestHUD();

                    this.startDialogue([
                        { speaker: 'Aksel (Manusia)', text: 'Tubuhku... Suaraku... Aku kembali menjadi manusia!' },
                        { speaker: 'Madam Joanne', text: 'Ini [Ramuan Kesembuhan Asli]. Keluarlah ke barat melalui Jalan Hutan untuk pulang ke rumahmu!' },
                        { speaker: 'Aksel (Manusia)', text: 'Terima kasih banyak Madam Joanne! Aku akan segera pulang membawa ramuan ini!' }
                    ], () => {
                        this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
                    });
                }
            });
        });
    }

    triggerTheftCutscene() {
        this.joanne.setVisible(true);

        const flash = this.add.rectangle(400, 225, 800, 450, 0xa855f7, 0.7).setDepth(19);
        this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

        this.startDialogue([
            { speaker: 'Aksel', text: 'Ini dia ramuannya! Aku berhasil mengambilnya—' },
            { speaker: 'Madam Joanne', text: 'BOCAH PENCURI! Berani sekali kau menyelinap masuk ke rumahku!!' },
            { speaker: 'Aksel', text: 'Aaaah! Madam Joanne?! A-ampun! Aku hanya ingin menyelamatkan adik perempuanku yang sakit parah!' },
            { speaker: 'Madam Joanne', text: 'Wah.. wah.. wah... kakak yang baik rupanya. Kulihat hebat juga kau bisa mengalahkan monster penjagaku.' },
            { speaker: 'Madam Joanne', text: '(Merancangkan sihir kegelapan) Tapi bukan berarti kau bisa lolos begitu saja! Bayar dosamu! Kutukan ini akan mengubah wujudmu menjadi Goblin kerdil!' },
            { speaker: 'Aksel (Goblin)', text: 'Aaaarrghh!! Tubuhku... kenapa kulitku jadi hijau dan kerdil?!' },
            { speaker: 'Madam Joanne', text: 'Dengarkan baik-baik, Goblin kecil!' },
            { speaker: 'Madam Joanne', text: 'Jika kau ingin menyembuhkan adikmu, kau butuh 3 Bahan Magis yang sesungguhnya!' },
            { speaker: 'Madam Joanne', text: '1. [Madu Murni] dari sarang lebah magis di kebun Grandma Mary.' },
            { speaker: 'Madam Joanne', text: '2. [Mythical Seed] dari Mr. Heinreich si tukang kayu desa.' },
            { speaker: 'Madam Joanne', text: '3. [Magic Bread] yang diolah oleh Mr. Breado si pembuat roti.' },
            { speaker: 'Madam Joanne', text: 'Bantu warga desa menyelesaikan tugas mereka agar mereka memberikan 3 bahan tersebut padamu!' },
            { speaker: 'Madam Joanne', text: 'Pertama-tama, pergilah ke barat dan cari rumah tua milik seorang nenek bernama Grandma Mary untuk mendapatkan petunjuk!' },
            { speaker: 'Madam Joanne', text: 'Bawa ketiga bahan itu kembali padaku jika kau ingin lepas dari kutukan dan mendapatkan obat asli adikmu!' },
            { speaker: 'Madam Joanne', text: 'CEPAT PERGILAH! KAU TIDAK PUNYA BANYAK WAKTU JIKA INGIN MENYELAMATKAN ADIKMU! HAHAHAHA!' }
        ], () => {
            this.registry.set('justCursed', true);
            this.registry.set('monsterDefeated', true);
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Mencari Madu Magis',
                objective: 'Cari Madu Magis di Kebun Nenek Mary (Jalan ke Barat).',
                questNumber: 1,
                completedQuests: ['Prolog: Menyelinap ke Rumah Penyihir & Kutukan Goblin']
            });
            this.updateQuestHUD();
            this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
        });
    }

    displayCurrentDialogue() {
        super.displayCurrentDialogue();

        if (this.currentDialogueIndex === 5) {
            this.player.setTexture('player_goblin');
        }
    }

    update() {
        let found = null;

        const qState = getQuestState(this.registry);
        if (qState.chapter === 'PROLOG' && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shelf.x, this.shelf.y) < 65) {
            found = { type: 'shelf', x: this.shelf.x, y: this.shelf.y - 35, prompt: 'Tekan [E] Ambil Botol Ramuan' };
        } else if (this.joanne && this.joanne.visible && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.joanne.x, this.joanne.y) < 65) {
            found = { type: 'npc', x: this.joanne.x, y: this.joanne.y - 35, prompt: 'Tekan [E] Bicara Madam Joanne' };
        } else if (this.player.x < 35) {
            found = { type: 'exit', x: 40, y: 360, prompt: 'Tekan [E] Keluar' };
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
                this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
            },
            canExitRight: false,
            maxX: 770
        });
    }
}

// -------------------------------------------------------------
// SCENE 5: GRANDMA MARY'S HOUSE & YARD SCENE
// -------------------------------------------------------------
