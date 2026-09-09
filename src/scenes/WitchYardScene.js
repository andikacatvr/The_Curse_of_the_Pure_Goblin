import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class WitchYardScene extends BaseScene {
    constructor() {
        super({ key: 'WitchYardScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#0a0618');
        this.createWitchYardAtmosphere();

        this.currentLocationName = 'Halaman Pondok Penyihir';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';

        let startX = 60;
        if (data && data.from === 'WitchCottageScene') {
            startX = 660;
        } else if (data && data.from === 'EastForestScene') {
            startX = 710;
        } else if (data && (data.from === 'WaterfallGorgeScene' || data.from === 'ForestTrailScene')) {
            startX = 60;
        } else if (qState.chapter !== 'PROLOG') {
            startX = 660;
        }

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.door = this.physics.add.staticSprite(700, 385, 'witch_door').setDepth(4);

        if (hasCure || qState.chapter === 'PROLOG') {
            this.add.text(20, 65, '◀ Lembah Air Terjun', {
                fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
            }).setOrigin(0, 0).setDepth(20);
        } else if (qState.chapter === 'BAB 4') {
            this.add.text(20, 65, '◀ Hutan Timur', {
                fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
            }).setOrigin(0, 0).setDepth(20);
        } else if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
            this.add.text(20, 65, '◀ Kebun Nenek Mary', {
                fontSize: '11px', fontStyle: 'bold', fill: '#86efac', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
            }).setOrigin(0, 0).setDepth(20);
        }
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            f: Phaser.Input.Keyboard.KeyCodes.F,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        if (this.registry.get('justCursed')) {
            this.registry.set('justCursed', false);

            this.showChapterBanner('BAB 1: MENCARI MADU MAGIS', 'Bahan 1 Dari 3 Bahan Magis');

            this.time.delayedCall(1000, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Uggggh... wujudku benar-benar berubah jadi Goblin hijau kerdil seperti ini...' },
                    { speaker: 'Aksel (Goblin)', text: 'Maafkan aku, Rachael... Karena kecerobohanku mencuri, kau harus menahan sakit lebih lama lagi...' },
                    { speaker: 'Aksel (Goblin)', text: 'Tapi aku tidak boleh patah semangat! Aku harus segera mengumpulkan 3 Bahan Magis itu!' },
                    { speaker: 'Aksel (Goblin)', text: 'Bahan pertama: [Madu Murni]. Aku harus bertanya ke warga desa di mana sarang lebah magis berada!' }
                ]);
            });
        }

        if (qState.chapter !== 'PROLOG' || this.registry.get('monsterDefeated')) {
            this.isMonsterDefeated = true;
        } else {
            this.monsterHP = 3;
            this.isMonsterDefeated = false;
            this.monster = this.physics.add.sprite(550, 375, 'monster_shadow').setDepth(5);
            this.monster.setCollideWorldBounds(true);
            this.physics.add.collider(this.monster, this.platforms);

            this.hpText = this.add.text(550, 335, '❤️ MONSTER HP: 3/3', {
                fontSize: '12px', fontStyle: 'bold', fill: '#ef4444', backgroundColor: '#000000cc', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(15);

            this.battleHint = this.add.text(400, 110, '⚔️ TEKAN [F] / [SPACE] DI DEKAT MONSTER UNTUK MENYERANG DENGAN PISAU!', {
                fontSize: '13px', fontStyle: 'bold', fill: '#f59e0b', backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setDepth(15);

            if (!this.registry.get('witchYardIntroSaid')) {
                this.registry.set('witchYardIntroSaid', true);
                this.time.delayedCall(450, () => {
                    this.startDialogue([
                        { speaker: 'Aksel', text: 'Inikah rumah penyihir tua itu... Nampaknya dijaga sama monster menyeramkan ini ya...' },
                        { speaker: 'Aksel', text: 'Aku harus mengalahkan monster ini dan mendapatkan ramuan penyembuh dari penyihir itu!' }
                    ]);
                });
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.input.keyboard.on('keydown-F', () => this.attackMonster());
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTalking) {
                this.nextDialogue();
            } else {
                this.attackMonster();
            }
        });

        this.input.keyboard.on('keydown-E', () => {
            if (this.isTalking) {
                this.nextDialogue();
            } else if (this.canEnterCottage() && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 75) {
                this.scene.start('WitchCottageScene', { from: 'WitchYardScene' });
            } else if (!this.canEnterCottage() && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 75) {
                this.showMapLockedNotice('Pintu terkunci rapat dari dalam! Selesaikan dulu pencarian 3 Bahan Magis.');
            }
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.isTalking) this.nextDialogue();
        });

        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    attackMonster() {
        if (this.isMonsterDefeated || !this.monster || !this.monster.active || this.isTalking) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y);
        if (dist < 75) {
            this.monsterHP--;

            const slash = this.add.rectangle(this.monster.x, this.monster.y, 40, 40, 0xef4444, 0.8);
            this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 250, onComplete: () => slash.destroy() });

            this.monster.setTint(0xffffff);
            this.time.delayedCall(150, () => this.monster.clearTint());

            if (this.monsterHP > 0) {
                this.hpText.setText(`❤️ MONSTER HP: ${this.monsterHP}/3`);
            } else {
                this.isMonsterDefeated = true;
                this.registry.set('monsterDefeated', true);
                if (this.hpText) this.hpText.destroy();

                this.tweens.add({
                    targets: this.monster, alpha: 0, y: this.monster.y + 20, duration: 600,
                    onComplete: () => {
                        this.monster.destroy();
                        this.onMonsterDefeated();
                    }
                });
            }
        }
    }

    onMonsterDefeated() {
        this.registry.set('monsterDefeated', true);
        if (this.battleHint) {
            this.battleHint.setText('✨ MONSTER DIKALAHKAN! DEKATI PINTU RUMAH & TEKAN [E] UNTUK MENYELINAP!');
            this.battleHint.setStyle({ fill: '#10b981' });
        }

        // Pisau hancur setelah pertarungan sengit
        const inv = getInventory(this.registry);
        const daggerIdx = inv.findIndex(i => i.id === 'Pisau Belati');
        if (daggerIdx !== -1) {
            inv[daggerIdx] = { id: 'Pisau (Hancur)', desc: 'Belati patah akibat pertarungan sengit melawan monster bayangan.' };
            this.registry.set('inventory', inv);
            this.renderInventorySlots();
        }

        setQuestState(this.registry, {
            chapter: 'PROLOG',
            title: 'Menyelinap Mencuri Ramuan',
            objective: 'Monster kalah! Dekati Pintu Rumah Penyihir & Tekan [E] Menyelinap.'
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel', text: 'Huh... pisauku hancur, badanku lelah... Huh kuat sekali monster itu... tapi aku lebih kuat, hahahaha!' },
            { speaker: 'Aksel (Dalam Hati)', text: 'Rachael, tunggulah sebentar lagi... Aku akan pulang dan kau akan sembuh!' },
            { speaker: 'Aksel', text: 'Pintunya ternyata tidak terkunci... dan penyihir itu sepertinya tidak ada di dalam. Ini kesempatanku menyelinap masuk dan mengambil obatnya!' }
        ]);
    }

    canEnterCottage() {
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
        const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
        const has3Ingredients = hasHoney && hasSeed && hasBread;

        if (qState.chapter === 'PROLOG' && this.isMonsterDefeated) {
            return true;
        }

        if (has3Ingredients) {
            return true;
        }

        return false;
    }

    update() {
        const qState = getQuestState(this.registry);

        if (this.canEnterCottage()) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 75) {
                const prompt = (qState.chapter === 'PROLOG') ? 'Tekan [E] Menyelinap Masuk' : 'Tekan [E] Masuk & Serahkan 3 Bahan';
                this.promptText.setPosition(this.door.x, this.door.y - 45).setText(prompt).setVisible(true);
            } else {
                this.promptText.setVisible(false);
            }
        } else if (this.monster && this.monster.active) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y) < 80) {
                this.promptText.setPosition(this.monster.x, this.monster.y - 40).setText('Tekan [F] / [SPACE] Tebas Pisau!').setVisible(true);
            } else {
                this.promptText.setVisible(false);
            }
        } else {
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const inv = getInventory(this.registry);
                const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

                if (hasCure || qState.chapter === 'PROLOG') {
                    this.scene.start('WaterfallGorgeScene', { from: 'WitchYardScene' });
                } else if (qState.chapter === 'BAB 4') {
                    this.scene.start('EastForestScene', { from: 'WitchYardScene' });
                } else if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
                    this.scene.start('GrandmaGardenScene');
                } else {
                    this.showMapLockedNotice('Aksel harus menyelinap masuk ke rumah penyihir untuk mencari obat Rachael!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                }
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

                if (hasCure) {
                    this.showMapLockedNotice('Kutukan sudah terlepas! Segera pulang ke barat [◀] untuk menyembuhkan Rachael!');
                } else if (qState.chapter === 'BAB 4') {
                    this.showMapLockedNotice('Ketiga Bahan Magis sudah lengkap! Masuklah ke rumah Madam Joanne [Tekan E di Pintu].');
                } else {
                    this.showMapLockedNotice('Hutan Timur terhalang kabut sihir pekat! Pergilah ke barat [◀] menuju Kebun Nenek Mary.');
                }
                this.player.setX(730);
                this.player.setVelocityX(-150);
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 4: WITCH COTTAGE INTERIOR
// -------------------------------------------------------------
