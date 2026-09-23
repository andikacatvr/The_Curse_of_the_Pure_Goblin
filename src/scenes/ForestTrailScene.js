import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

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
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(4.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        this.createSeamlessGround('tanah_home', 2);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const isEnding = hasCure || qState.chapter === 'EPILOG';
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        
        let startX = 50;
        if (data && (data.from === 'WitchYardScene' || data.from === 'WaterfallGorgeScene' || data.from === 'WoodshopScene')) {
            startX = 740;
        } else if ((data && data.from === 'HomeScene') || (data && data.from === 'GrandmaGardenScene')) {
            startX = 60;
        } else if (qState.chapter !== 'PROLOG' && !hasCure) {
            startX = 740;
        }

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.hunter = this.physics.add.staticSprite(400, 393, 'npc_hunter').setDepth(4);
        this.hunter.type = 'npc';

        if (isEnding) {
            this.hunter.setVisible(false).setActive(false);
            if (this.hunter.body) this.hunter.body.enable = false;
        }

        if (qState.chapter === 'BAB 1') {
            const weedCount = this.registry.get('weedCount') || 0;
            const hasTalkedMary = !!this.registry.get('talkedToMary');
            const hasSmoker = inv.some(i => i.id === 'Bee Smoker');

            if (hasSmoker) {
                this.hunter.dialogue = [
                    { speaker: 'Pemburu Desa', text: 'Bagus Aksel, kamu sudah mendapatkan Bee Smoker itu! Cepat kembali ke kebun Nenek Mary di barat [◀] untuk menenangkan lebah magis!' }
                ];
            } else if (weedCount >= 5) {
                this.hunter.dialogue = [
                    { speaker: 'Aksel (Goblin)', text: 'Paman Pemburu! Nenek Mary menyuruhku meminjam Bee Smoker dari Mr. Heinreich di sebelah timur.' },
                    { speaker: 'Pemburu Desa', text: 'Oh, alat pengasap lebah itu? Teruslah lurus ke timur [➔] menyusuri jalan hutan ini, bengkel kayu Heinreich ada di depan!' }
                ];
            } else if (hasTalkedMary) {
                this.hunter.dialogue = [
                    { speaker: 'Pemburu Desa', text: 'Grandma Mary di ujung barat [◀] adalah orang yang sangat baik. Bantulah dia membersihkan kebunnya terlebih dahulu, Aksel!' }
                ];
            } else {
                this.hunter.dialogue = [
                    { speaker: 'Pemburu Desa', text: 'WAAAH! G-Goblin liar?! Dari mana asalmu?! Jangan serang aku!' },
                    { speaker: 'Aksel (Goblin)', text: 'T-tunggu paman Pemburu! Ini aku, Aksel! Aku dikutuk oleh penyihir itu... Tolong beritahu aku di mana letak kebun Nenek Mary!' },
                    { speaker: 'Pemburu Desa', text: 'Hah?! Aksel?! Ya ampun... apa yang diperbuat nenek sihir itu padamu... Cepatlah ke barat [◀], rumah dan kebun Nenek Mary ada di ujung jalan ini!' }
                ];
            }
        } else if (qState.chapter === 'BAB 2') {
            this.hunter.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Paman Pemburu, Nenek Mary bilang Mr. Heinreich tahu sesuatu tentang Mythical Seed. Apakah bengkel kayunya lewat timur?' },
                { speaker: 'Pemburu Desa', text: 'Benar sekali, Aksel! Teruslah berjalan ke timur [➔] menyusuri jalan hutan ini. Bengkel kayu Heinreich ada di lembah timur!' }
            ];
        } else if (qState.chapter === 'BAB 3') {
            this.hunter.dialogue = [
                { speaker: 'Pemburu Desa', text: 'Semangat terus, Aksel! Kebaikan hatimu akan selalu bersinar apa pun wujud fisikmu.' }
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
            this.createLeftNavHint('◀ Rumah Rachael (Ending)', true);
        } else if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
            this.createLeftNavHint('◀ Kebun Nenek Mary', true);
        }

        const askedHunter = !!this.registry.get('askedHunterDirections') || (qState.chapter !== 'PROLOG');
        let rightNavHintText = 'Lembah Air Terjun ➔';
        if (qState.chapter === 'BAB 1') {
            const talkedToMary = !!this.registry.get('talkedToMary');
            rightNavHintText = talkedToMary ? 'Bengkel Heinreich ➔' : 'Lembah Air Terjun ➔';
        } else if (qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
            rightNavHintText = 'Bengkel Heinreich ➔';
        }
        this.rightExitText = this.createRightNavHint(rightNavHintText, askedHunter);

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
        GameAudio.playCollect();

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

        this.woodGroup.getChildren().forEach((w) => {
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
                const qState = getQuestState(this.registry);
                const inv = getInventory(this.registry);
                const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

                if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
                    this.scene.start('GrandmaGardenScene', { from: 'ForestTrailScene' });
                    return;
                }

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

                if (qState.chapter === 'BAB 1') {
                    const talkedToMary = !!this.registry.get('talkedToMary');
                    if (!talkedToMary) {
                        this.showMapLockedNotice('Aksel harus mencari Grandma Mary di sebelah barat [◀] terlebih dahulu!');
                        this.player.setX(740);
                        this.player.setVelocityX(-150);
                        return;
                    }
                    this.scene.start('WoodshopScene', { from: 'ForestTrailScene' });
                    return;
                } else if (qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
                    this.scene.start('WoodshopScene', { from: 'ForestTrailScene' });
                    return;
                }

                this.scene.start('WaterfallGorgeScene', { from: 'ForestTrailScene' });
            }
        });
    }

    createForestAtmosphere() {
        // 1. Lush Deep Forest Background (Pixel Art Hutan Hijau Lebat)
        this.createSeamlessBackground('forest_trail_bg', 0, 1100, 450);

        // 2. Light Rays / Sunbeams Filtering Through High Tree Canopy
        const lightShafts = this.add.graphics().setDepth(1);
        lightShafts.fillStyle(0x6ee7b7, 0.05);
        lightShafts.beginPath();
        lightShafts.moveTo(120, 0); lightShafts.lineTo(260, 0);
        lightShafts.lineTo(340, 420); lightShafts.lineTo(160, 420);
        lightShafts.closePath();
        lightShafts.fillPath();

        lightShafts.beginPath();
        lightShafts.moveTo(480, 0); lightShafts.lineTo(620, 0);
        lightShafts.lineTo(720, 420); lightShafts.lineTo(540, 420);
        lightShafts.closePath();
        lightShafts.fillPath();

        this.tweens.add({
            targets: lightShafts,
            alpha: { from: 0.6, to: 1.2 },
            duration: 3500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Drifting Misty Forest Fog (Efek Kabut Hutan Rimba Melayang)
        const forestMists = [
            { x: 140, y: 310, w: 260, h: 28, dur: 12000, dist: 80 },
            { x: 380, y: 280, w: 290, h: 32, dur: 16000, dist: -90 },
            { x: 570, y: 325, w: 240, h: 25, dur: 11000, dist: 70 },
            { x: 250, y: 350, w: 320, h: 30, dur: 14000, dist: -80 },
            { x: 420, y: 380, w: 340, h: 28, dur: 13000, dist: 60 }
        ];

        forestMists.forEach((m) => {
            const mist = this.add.graphics().setDepth(1);
            mist.fillStyle(0xd1fae5, 0.08);
            mist.fillRoundedRect(m.x, m.y, m.w, m.h, 14);
            mist.fillStyle(0xa7f3d0, 0.06);
            mist.fillCircle(m.x + m.w * 0.35, m.y + 2, m.h * 0.75);
            mist.fillCircle(m.x + m.w * 0.65, m.y - 2, m.h * 0.85);

            this.tweens.add({
                targets: mist,
                x: m.dist,
                alpha: { from: 0.55, to: 1.1 },
                duration: m.dur,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 4. Floating Forest Wisps / Green Fireflies (Kunang-kunang Hijau & Spora Rimbun)
        for (let i = 0; i < 20; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(150, 410);
            const col = Math.random() > 0.4 ? 0x6ee7b7 : 0xa7f3d0;
            const ff = this.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 2.5), col, 0.75).setDepth(3);

            this.tweens.add({
                targets: ff,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.15, to: 0.9 },
                scale: { from: 0.7, to: 1.4 },
                duration: Phaser.Math.Between(2200, 4500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 2B: WATERFALL GORGE SCENE (LEMBAH AIR TERJUN DENGAN RINTANGAN)
// -------------------------------------------------------------
