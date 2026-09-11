import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

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
        const mainPlatform = this.platforms.create(400, 427, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        this.player = this.physics.add.sprite(60, 377, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.shelf = this.physics.add.staticSprite(500, 385, 'potion_shelf').setDepth(4).setAlpha(0);

        if (qState.chapter === 'PROLOG') {
            const shelfGlow = this.add.circle(500, 360, 14, 0xfde047, 0.35).setDepth(3);
            this.tweens.add({
                targets: shelfGlow,
                scale: { from: 0.8, to: 1.3 },
                alpha: { from: 0.15, to: 0.55 },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        this.joanne = this.add.sprite(265, 245, 'witch_spirit').setDepth(4);
        this.joanne.setScale(0.23);
        this.joanne.type = 'npc';
        const isCursed = qState.chapter !== 'PROLOG';
        this.joanne.setVisible(isCursed);
        if (isCursed) {
            this.startJoanneFloating();
        }

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
        this.spawnCauldronBurst(265, 325);
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
                    GameAudio.playQuestComplete();

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
        this.joanneHasEmerged = false;
        this.joanne.setVisible(false);

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

        // Line 1: When Madam Joanne shouts "BOCAH PENCURI!", she emerges from cauldron with smoke burst!
        if (this.currentDialogueIndex === 1 && !this.joanneHasEmerged) {
            this.joanneHasEmerged = true;
            this.emergeJoanneFromCauldron();
        }

        if (this.currentDialogueIndex === 5) {
            this.player.setTexture('player_goblin');
        }
    }

    emergeJoanneFromCauldron() {
        this.joanne.setVisible(true);
        this.joanne.setPosition(265, 335);
        this.joanne.setScale(0.04);
        this.joanne.setAlpha(0);

        // Flash of purple lightning
        const flash = this.add.rectangle(400, 225, 800, 450, 0xa855f7, 0.65).setDepth(19);
        this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });

        // Cauldron smoke eruption
        this.spawnCauldronBurst(265, 325);

        // Rising tween out of the cauldron
        this.tweens.add({
            targets: this.joanne,
            y: 245,
            scale: 0.23,
            alpha: 1,
            duration: 850,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.startJoanneFloating();
            }
        });
    }

    startJoanneFloating() {
        if (this.joanneFloatTween) this.joanneFloatTween.stop();
        this.joanneFloatTween = this.tweens.add({
            targets: this.joanne,
            y: { from: 242, to: 248 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    spawnCauldronBurst(x, y) {
        const colors = [0xa855f7, 0x10b981, 0x818cf8, 0xfacc15, 0xffffff, 0xc084fc];
        for (let i = 0; i < 22; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const p = this.add.circle(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-5, 5), Phaser.Math.Between(8, 20), color, 0.75).setDepth(5);
            const targetX = x + Phaser.Math.Between(-65, 65);
            const targetY = y - Phaser.Math.Between(40, 130);
            this.tweens.add({
                targets: p,
                x: targetX,
                y: targetY,
                scale: { from: 0.5, to: Phaser.Math.FloatBetween(2.0, 3.4) },
                alpha: { from: 0.85, to: 0 },
                duration: Phaser.Math.Between(700, 1300),
                ease: 'Cubic.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }

    update() {
        let found = null;

        const qState = getQuestState(this.registry);
        if (qState.chapter === 'PROLOG' && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shelf.x, this.shelf.y) < 65) {
            found = { type: 'shelf', x: this.shelf.x, y: this.shelf.y - 35, prompt: 'Tekan [E] Ambil Botol Ramuan' };
        } else if (this.joanne && this.joanne.visible && Math.abs(this.player.x - 265) < 75) {
            found = { type: 'npc', x: 265, y: 175, prompt: 'Tekan [E] Bicara Madam Joanne' };
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

    createWitchCottageAtmosphere() {
        // 1. Witch Cottage Interior Background (Shifted slightly up so tiles_kayu sits under the cauldron)
        this.add.image(400, 192, 'witch_cottage_bg').setDisplaySize(800, 465).setDepth(0);

        // 2. Wooden Floor Surface (tiles_kayu) placed under cauldron feet
        this.add.image(0, 450, 'tiles_kayu').setOrigin(0, 1).setScale(800 / 770, 0.68).setDepth(2);

        // 3. Animated Cauldron Fire Glow (Under Cauldron: X: 265, Y: 390)
        const fireGlow = this.add.circle(265, 390, 22, 0xf97316, 0.35).setDepth(1);
        this.tweens.add({
            targets: fireGlow,
            scale: { from: 0.85, to: 1.25 },
            alpha: { from: 0.2, to: 0.55 },
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 4. Glowing Magical Brew inside Cauldron (X: 265, Y: 332)
        const cauldronGlow = this.add.circle(265, 332, 22, 0x10b981, 0.3).setDepth(1);
        this.tweens.add({
            targets: cauldronGlow,
            scale: { from: 0.9, to: 1.2 },
            alpha: { from: 0.18, to: 0.45 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 5. ANIMATED RISING SMOKE & STEAM PUFFS FROM CAULDRON (X: 265, Y: 322)
        // A. Primary mystical green-white steam clouds
        for (let i = 0; i < 9; i++) {
            const bx = 265 + Phaser.Math.Between(-8, 8);
            const smoke = this.add.circle(bx, 322, Phaser.Math.Between(7, 13), 0xd1fae5, 0.38).setDepth(3);
            this.tweens.add({
                targets: smoke,
                x: { from: bx, to: 265 + Phaser.Math.Between(-30, 30) },
                y: { from: 322, to: Phaser.Math.Between(130, 200) },
                scale: { from: 0.5, to: Phaser.Math.FloatBetween(2.4, 3.8) },
                alpha: { from: 0.5, to: 0 },
                duration: Phaser.Math.Between(2200, 3400),
                delay: i * 360,
                repeat: -1,
                ease: 'Cubic.easeOut'
            });
        }

        // B. Secondary wispy purple vapor plumes
        for (let j = 0; j < 5; j++) {
            const px = 265 + Phaser.Math.Between(-6, 6);
            const purpleWisp = this.add.circle(px, 324, Phaser.Math.Between(5, 9), 0xc084fc, 0.35).setDepth(3);
            this.tweens.add({
                targets: purpleWisp,
                x: { from: px, to: 265 + Phaser.Math.Between(-24, 24) },
                y: { from: 324, to: Phaser.Math.Between(145, 215) },
                scale: { from: 0.6, to: Phaser.Math.FloatBetween(1.8, 2.8) },
                alpha: { from: 0.45, to: 0 },
                duration: Phaser.Math.Between(2000, 3200),
                delay: 200 + j * 480,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // C. Foreground curling steam over cauldron rim and waist
        for (let m = 0; m < 5; m++) {
            const fx = 265 + Phaser.Math.Between(-12, 12);
            const fgSmoke = this.add.circle(fx, 326, Phaser.Math.Between(7, 13), 0xd1fae5, 0.4).setDepth(5);
            this.tweens.add({
                targets: fgSmoke,
                x: { from: fx, to: 265 + Phaser.Math.Between(-26, 26) },
                y: { from: 326, to: Phaser.Math.Between(210, 270) },
                scale: { from: 0.6, to: Phaser.Math.FloatBetween(2.0, 3.2) },
                alpha: { from: 0.5, to: 0 },
                duration: Phaser.Math.Between(2000, 3000),
                delay: m * 500,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 6. Floating magic motes drifting in the ambient cottage air
        for (let k = 0; k < 16; k++) {
            const sx = Phaser.Math.Between(40, 760);
            const sy = Phaser.Math.Between(60, 365);
            const dust = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.2, 0.6)).setDepth(3);
            this.tweens.add({
                targets: dust,
                y: sy - Phaser.Math.Between(15, 35),
                alpha: { from: 0.1, to: 0.7 },
                duration: Phaser.Math.Between(2400, 4600),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 5: GRANDMA MARY'S HOUSE & YARD SCENE
// -------------------------------------------------------------
