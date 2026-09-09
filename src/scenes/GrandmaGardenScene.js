import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class GrandmaGardenScene extends BaseScene {
    constructor() {
        super({ key: 'GrandmaGardenScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#38bdf8');
        this.createGrandmaGardenAtmosphere();

        this.currentLocationName = 'Halaman Rumah Grandma Mary (Barat Desa)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        const startX = (data && data.from === 'BeeGardenScene') ? 60 : 750;

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.mary = this.physics.add.staticSprite(250, 395, 'npc_mary').setDepth(5);
        this.mary.type = 'npc';

        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const weedCount = this.registry.get('weedCount') || 0;

        if (hasHoney) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Luar biasa Goblin kecil yang baik hati! Kamu berhasil mendapatkan Madu Murni dari sarang lebah!' },
                { speaker: 'Aksel (Goblin)', text: 'Terima kasih banyak Nenek Mary! Sekarang aku menuju Mr. Heinreich untuk mencari Bahan 2 (Mythical Seed)!' }
            ];
        } else if (hasSmoker) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Bagus sekali! Kamu sudah membawa Bee Smoker dari Mr. Heinreich.' },
                { speaker: 'Grandma Mary', text: 'Sekarang pergilah ke Kebun Lebah di sebelah barat, dekati sarang lebah lalu tekan [E] untuk memanen Madu Murni!' }
            ];
        } else if (weedCount >= 5) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Terima kasih sudah membersihkan 5 rumput liar! Sekarang dapatkan Bee Smoker dari Mr. Heinreich di bengkel kayu (Timur) agar lebah tidak menyengat!' }
            ];
        } else if (this.registry.get('talkedToMary')) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Tolong bantu Nenek bersihkan 5 rumput liar di Kebun Lebah sebelah barat (Jalan ke Barat) dulu ya Goblin kecil yang baik!' }
            ];
        } else {
            this.mary.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'P-permisi... Apakah benar ini rumah tua kediaman Nenek yang bernama Grandma Mary?' },
                { speaker: 'Grandma Mary', text: 'Benar sekali, Nak. Akulah Grandma Mary, pemilik kebun tua ini. Siapakah kamu, makhluk kecil bertelinga runcing?' },
                { speaker: 'Aksel (Goblin)', text: 'Namaku Aksel... Aku datang kemari berdasarkan petunjuk dari penyihir Madam Joanne untuk mencari petunjuk mengenai Bahan Magis.' },
                { speaker: 'Aksel (Goblin)', text: '(Menunduk ragu dan cemas) Nenek... apakah Nenek tidak takut atau merasa jijik padaku? Tubuhku saat ini telah dikutuk menjadi Goblin yang buruk rupa...' },
                { speaker: 'Grandma Mary', text: '(Tersenyum hangat penuh ketulusan) Hohoho... Mataku mungkin sudah tua dan rabun, Aksel, tapi hatiku masih bisa melihat dengan sangat jelas.' },
                { speaker: 'Grandma Mary', text: 'Nenek melihat kebaikan dan ketulusan hati yang begitu murni di dalam dirimu. Bagi Nenek, wujud fisik bukanlah halangan untuk saling menerima dan menolong.' },
                { speaker: 'Aksel (Goblin)', text: 'Terima kasih banyak atas ketulusan hati Nenek... Sebenarnya, adikku sedang sakit parah di rumah. Aku sangat membutuhkan Madu Murni dari sarang lebah magis milik Nenek untuk obatnya.' },
                { speaker: 'Grandma Mary', text: 'Tentu saja boleh, Aksel yang berhati mulia! Namun saat ini sarang lebah di kebun barat sedang terganggu oleh tanaman liar.' },
                { speaker: 'Grandma Mary', text: 'Maukah kau membantu Nenek membersihkan 5 rumput liar di Kebun Lebah sebelah barat (Jalan ke Barat) terlebih dahulu?' },
                { speaker: 'Aksel (Goblin)', text: 'Tentu Nenek Mary! Aku akan segera pergi ke kebun barat dan membersihkan semua rumput liar itu!' }
            ];
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(20, 65, '◀ Kebun Lebah & Sarang Lebah\n(Jalan ke Barat)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.add.text(780, 65, 'Ke Bengkel Heinreich ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#f59e0b', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
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

        if (qState.chapter === 'BAB 1' && !this.registry.get('talkedToMary')) {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Bab 1: Bicara dengan Grandma Mary',
                objective: 'Bicara dengan Grandma Mary di Halaman Rumahnya (Tekan [E]).',
                questNumber: 1
            });
            this.updateQuestHUD();
        }

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
                    if (!this.registry.get('talkedToMary')) {
                        this.registry.set('talkedToMary', true);
                        setQuestState(this.registry, {
                            chapter: 'BAB 1',
                            title: 'Quest 1: Bersihkan 5 Rumput Liar',
                            objective: 'Pergi ke Kebun Lebah sebelah barat (Jalan ke Barat) & bersihkan 5 rumput liar [E].',
                            questNumber: 1
                        });
                        this.updateQuestHUD();
                    }
                });
            }
        }
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mary.x, this.mary.y) < 60) {
            found = { type: 'npc', dialogue: this.mary.dialogue, x: this.mary.x, y: this.mary.y - 35, prompt: 'Tekan [E] Bicara Nenek Mary' };
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
                this.scene.start('BeeGardenScene', { from: 'GrandmaGardenScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('WoodshopScene', { from: 'GrandmaGardenScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 5.5: BEE GARDEN & BEEHIVE DEEP AREA SCENE
// -------------------------------------------------------------
