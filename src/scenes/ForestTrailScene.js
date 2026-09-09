import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class ForestTrailScene extends BaseScene {
    constructor() {
        super({ key: 'ForestTrailScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#03170e');
        this.createForestAtmosphere();

        this.currentLocationName = 'Pinggir Hutan Mistis (Bertanya Arah)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const isEnding = hasCure || qState.chapter === 'EPILOG';
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        
        let startX = 50;
        if (data && (data.from === 'WitchYardScene' || data.from === 'WaterfallGorgeScene')) {
            startX = 740;
        } else if ((data && data.from === 'HomeScene') || (data && data.from === 'GrandmaGardenScene')) {
            startX = 60;
        } else if (qState.chapter !== 'PROLOG' && !hasCure) {
            startX = 740;
        }

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(3);
        this.physics.add.collider(this.player, this.platforms);

        this.hunter = this.physics.add.staticSprite(400, 393, 'npc_hunter').setDepth(3);
        this.hunter.type = 'npc';

        if (isEnding) {
            this.hunter.setVisible(false).setActive(false);
            if (this.hunter.body) this.hunter.body.enable = false;
        }

        if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2') {
            this.hunter.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Permisi paman, apakah paman tahu di mana letak Madu Magis Murni?' },
                { speaker: 'Pemburu Desa', text: 'Madu Magis? Oh! Lebah magis itu ada di kebun milik Grandma Mary di sebelah barat!' }
            ];
        } else {
            this.hunter.dialogue = [
                { speaker: 'Aksel', text: 'Permisi paman, apakah paman tahu di mana letak rumah penyihir Madam Joanne?' },
                { speaker: 'Pemburu Desa', text: 'Pondok Madam Joanne ada di sebelah timur, tapi kamu harus melewati Lembah Air Terjun terlebih dahulu, nak.' },
                { speaker: 'Pemburu Desa', text: 'Hati-hatilah! Di lembah air terjun itu ada bebatuan licin dan rintangan duri beracun (-1 HP).' },
                { speaker: 'Pemburu Desa', text: 'Jika terluka, petiklah Buah Kristal di pulau tengah untuk memulihkan darahmu.' },
                { speaker: 'Pemburu Desa', text: 'Setelah melewatinya, halaman rumah penyihir dijaga oleh seekor Monster Bayangan yang ganas!' },
                { speaker: 'Aksel', text: 'Terima kasih paman! Aku akan sangat berhati-hati melompat dan menjaga HP-ku.' }
            ];
        }

        // Quest 5 Special Firewood Items (If Quest 5 Active)
        this.woodGroup = this.physics.add.staticGroup();
        if (qState.questNumber === 5) {
            const woodCount = this.registry.get('firewoodCount') || 0;
            const woodPositions = [220, 480, 680];
            for (let i = woodCount; i < 3; i++) {
                const wItem = this.woodGroup.create(woodPositions[i], 415, 'special_firewood');
                wItem.type = 'firewood';
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        if (hasCure) {
            this.add.text(20, 65, '◀ Rumah Rachael (Ending)', { fontSize: '11px', fontStyle: 'bold', fill: '#4ade80', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 } }).setOrigin(0, 0).setDepth(20);
        }

        const askedHunter = !!this.registry.get('askedHunterDirections') || (qState.chapter !== 'PROLOG');
        this.rightExitText = this.add.text(780, 65, 'Lembah Air Terjun ➔', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);
        this.rightExitText.setVisible(askedHunter);

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

        if (qState.chapter === 'PROLOG' && !this.registry.get('forestTrailIntroSaid')) {
            this.registry.set('forestTrailIntroSaid', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Rachael, maaf jika aku berbohong... Sebenarnya aku tidak bermaksud pergi ke kota, tapi aku tahu harus ke mana...' },
                    { speaker: 'Aksel (Dalam Hati)', text: 'Rumah penyihir tua itu... Yaa, di mana konon katanya dia punya ramuan penyembuh segala penyakit!' },
                    { speaker: 'Aksel', text: 'Ada seorang pemburu di depan. Sebaiknya aku bertanya arah padanya.' }
                ]);
            });
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
                    if (!this.registry.get('askedHunterDirections')) {
                        this.registry.set('askedHunterDirections', true);
                        if (this.rightExitText) this.rightExitText.setVisible(true);

                        const qState = getQuestState(this.registry);
                        if (qState.chapter === 'PROLOG') {
                            setQuestState(this.registry, {
                                chapter: 'PROLOG',
                                title: 'Menuju Rumah Penyihir',
                                objective: 'Arah diketahui! Jalan ke timur [➔] menuju Halaman Rumah Penyihir.',
                                questNumber: 1
                            });
                            this.updateQuestHUD();
                        }
                    }
                });
            } else if (this.nearTarget.type === 'firewood') {
                this.collectFirewood(this.nearTarget.sprite);
            }
        }
    }

    collectFirewood(woodSprite) {
        let count = this.registry.get('firewoodCount') || 0;
        count++;
        this.registry.set('firewoodCount', count);

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `✨ Kayu Bakar Khusus (${count}/3)!`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#f59e0b', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        woodSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (count >= 3) {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 6: Serahkan Kayu Bakar Khusus',
                objective: '3 Kayu Bakar Khusus terkumpul! Kembali ke Mr. Heinreich di Bengkel Kayu.',
                questNumber: 6
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Berhasil mengumpulkan 3 Kayu Bakar Khusus! Sekarang aku serahkan ke Mr. Heinreich!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                objective: `Cari Kayu Bakar Khusus di pinggir hutan (Progress: ${count}/3).`
            });
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;
        const hunterActive = this.hunter && this.hunter.visible && this.hunter.active;

        if (hunterActive && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.hunter.x, this.hunter.y) < 60) {
            found = { type: 'npc', dialogue: this.hunter.dialogue, x: this.hunter.x, y: this.hunter.y - 35, prompt: 'Tekan [E] Tanya Arah' };
        }

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
                const inv = getInventory(this.registry);
                const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

                if (!hasCure) {
                    this.showMapLockedNotice('Aksel berjanji tidak akan pulang sebelum membawa obat untuk Rachael!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }
                this.scene.start('HomeScene', { from: 'ForestTrailScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const qState = getQuestState(this.registry);
                const asked = !!this.registry.get('askedHunterDirections') || (qState.chapter !== 'PROLOG');
                if (!asked) {
                    this.showMapLockedNotice('Tanyakan arah pondok Madam Joanne kepada Pemburu Desa terlebih dahulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                    return;
                }
                this.scene.start('WaterfallGorgeScene', { from: 'ForestTrailScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 2B: WATERFALL GORGE SCENE (LEMBAH AIR TERJUN DENGAN RINTANGAN)
// -------------------------------------------------------------
