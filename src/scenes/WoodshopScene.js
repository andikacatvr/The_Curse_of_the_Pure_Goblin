import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class WoodshopScene extends BaseScene {
    constructor() {
        super({ key: 'WoodshopScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e293b');
        this.createWoodshopAtmosphere();

        let startX = 60;
        if (data && data.from === 'FirewoodForestScene') {
            startX = 740;
        }

        this.currentLocationName = 'Bengkel & Gudang Kayu Mr. Heinreich (Timur Desa)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

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
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Semua karung pupuk sudah rapi dan ini 3 Kayu Bakar Khusus dari pinggir hutan!' },
                { speaker: 'Mr. Heinreich', text: 'Kerja keras dan baktimu sungguh luar biasa, Aksel. Sesuai janjiku... ambillah satu Mythical Seed ini untuk kesembuhan adikmu!' }
            ];
        } else if (qState.questNumber === 5) {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Sekarang cari 3 Kayu Bakar Khusus di Pinggir Hutan (Timur) lalu serahkan padaku ya, Goblin kecil!' }
            ];
        } else if (hasHoney) {
            this.heinreich.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Salam Mr. Heinreich! Nenek Mary bilang Anda pernah menemukan sebuah benda bernama Mythical Seed... Apakah itu benar?' },
                { speaker: 'Mr. Heinreich', text: 'Hah?! Biji itu? Dari mana kau mengetahuinya, Goblin kecil? Apa kau juga percaya pada hal seperti itu?' },
                { speaker: 'Mr. Heinreich', text: 'Percaya atau tidak, aku melihatnya dengan mataku sendiri... Biji ini benar-benar membawa keberuntungan hidup. Lihatlah, bukankah biji ini sangat cantik bercahaya?' },
                { speaker: 'Mr. Heinreich', text: 'Dulu aku menemukannya di sebuah ladang tersembunyi yang amat indah, di mana semua tanaman tumbuh begitu subur dan ajaib. Sayangnya tempat itu sangat jauh dan dijaga oleh kekuatan misterius, sehingga aku tak bisa kembali ke sana lagi.' },
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich, kumohon berikan biji itu padaku! Adik perempuanku, Rachael, sedang sakit keras dan membeku karena kutukan penyihir. Aku rela menanggung kutukan tubuh goblin ini asalkan adikku bisa selamat...' },
                { speaker: 'Mr. Heinreich', text: '(Tertegun dan menghela napas haru) ...Seorang kakak yang rela berkorban menjadi makhluk buruk rupa demi adiknya...' },
                { speaker: 'Mr. Heinreich', text: 'Baiklah, hatiku luluh mendengarnya. Sebenarnya aku memiliki dua biji ini, dan aku bersedia memberikan satu untukmu.' },
                { speaker: 'Mr. Heinreich', text: 'Namun sebagai gantinya, bantulah orang tua ini menyelesaikan pekerjaan bengkel dulu: rapikan 5 karung pupuk di sebelah kanan gudang ini!' }
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
            this.smokerItem = this.physics.add.staticSprite(320, 405, 'item_smoker').setDepth(5);
            this.smokerItem.type = 'smoker_item';
        }

        // 5 Fertilizer Bags Group (Quest 4)
        this.bagsGroup = this.physics.add.staticGroup();
        this.bagCount = this.registry.get('bagCount') || 0;
        if (hasHoney && !hasSeed && this.bagCount < 5 && (qState.questNumber === 4 || qState.questNumber < 4)) {
            const bagPositions = [450, 520, 590, 660, 730];
            for (let i = this.bagCount; i < 5; i++) {
                const bag = this.bagsGroup.create(bagPositions[i], 408, 'fertilizer_bag').setDepth(4);
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
        GameAudio.playCollect();

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
        GameAudio.playCollect();

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
            { speaker: 'Mr. Heinreich', text: 'Simpan baik-baik benih magis itu dan bawa ke Mr. Breado si koki roti desa untuk diolah menjadi Magic Bread!' },
            { speaker: 'Aksel (Goblin)', text: 'Terima kasih banyak atas kebaikan dan kemurahan hatimu, Mr. Heinreich! 2 Bahan Magis selesai, sekarang aku menuju Mr. Breado!' }
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

    createWoodshopAtmosphere() {
        // 1. High-fidelity Pixel Art Valley Woodshop Background
        this.add.image(400, 225, 'woodshop_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Gentle drifting mountain valley mist
        for (let m = 0; m < 3; m++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(220, 320),
                Phaser.Math.Between(260, 420),
                Phaser.Math.Between(40, 75),
                0xe2e8f0,
                0.07
            ).setDepth(1);
            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 25, to: mist.x + 25 },
                alpha: { from: 0.03, to: 0.1 },
                duration: Phaser.Math.Between(5000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 3. Cabin Chimney Rising Smoke Puffs in the Valley
        const chimneys = [
            { x: 310, y: 232 },
            { x: 525, y: 250 }
        ];
        chimneys.forEach(ch => {
            for (let i = 0; i < 3; i++) {
                const smoke = this.add.circle(ch.x, ch.y, Phaser.Math.Between(3, 5), 0xf1f5f9, 0.45).setDepth(1);
                this.tweens.add({
                    targets: smoke,
                    x: ch.x + Phaser.Math.Between(8, 22),
                    y: ch.y - Phaser.Math.Between(25, 45),
                    scale: { from: 0.8, to: 2.2 },
                    alpha: { from: 0.45, to: 0 },
                    duration: 2200 + i * 400,
                    delay: i * 700,
                    repeat: -1,
                    ease: 'Sine.easeOut'
                });
            }
        });

        // 4. Hanging Oil Lantern from the Tree Branch (X: 640, Y: 75)
        const lanternG = this.add.graphics().setDepth(2);
        // Chain from branch down
        lanternG.lineStyle(1.5, 0x1e293b, 0.9);
        lanternG.beginPath();
        lanternG.moveTo(640, 75);
        lanternG.lineTo(640, 98);
        lanternG.strokePath();
        // Lantern cap & bottom
        lanternG.fillStyle(0x0f172a, 1);
        lanternG.fillRect(634, 98, 12, 3);
        lanternG.fillRect(635, 113, 10, 2);
        lanternG.lineStyle(1.5, 0x0f172a, 1);
        lanternG.strokeRect(634, 101, 12, 12);
        lanternG.fillStyle(0xfde047, 0.9);
        lanternG.fillRect(636, 103, 8, 8);

        // Warm amber lantern glow
        const lanternGlow = this.add.circle(640, 107, 24, 0xfbbf24, 0.35).setDepth(2);
        this.tweens.add({
            targets: lanternGlow,
            scale: { from: 0.85, to: 1.2 },
            alpha: { from: 0.25, to: 0.45 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 5. Mr. Heinreich's Rustic Timber House & Carpenter Workshop (Left side)
        this.createHeinreichHouse();

        // 6. Rustic Outdoor Workbench for Mr. Heinreich (under smoker at X: 320)
        const benchG = this.add.graphics().setDepth(2);
        benchG.fillStyle(0x78350f, 1);
        benchG.fillRect(298, 410, 44, 8);
        benchG.fillStyle(0x451a03, 1);
        benchG.fillRect(298, 416, 44, 2);
        benchG.fillStyle(0x451a03, 1);
        benchG.fillRect(302, 418, 5, 16);
        benchG.fillRect(333, 418, 5, 16);

        // 7. Stacked Firewood & Timber Logs beside the workshop (X: 172 to 206)
        const logG = this.add.graphics().setDepth(2);
        const logRows = [
            { y: 412, xs: [180, 200] },
            { y: 396, xs: [190] }
        ];
        logRows.forEach(row => {
            row.xs.forEach(lx => {
                logG.fillStyle(0x78350f, 1);
                logG.fillCircle(lx, row.y, 10);
                logG.fillStyle(0xd97706, 0.7);
                logG.fillCircle(lx, row.y, 7);
                logG.fillStyle(0x451a03, 0.8);
                logG.strokeCircle(lx, row.y, 4);
                logG.fillCircle(lx, row.y, 1.5);
            });
        });

        // 8. Tree Stump with embedded Woodcutter's Axe (X: 205, Y: 410)
        const stumpG = this.add.graphics().setDepth(2);
        stumpG.fillStyle(0x5c2b0c, 1);
        stumpG.fillRect(198, 404, 18, 20);
        stumpG.fillStyle(0xb45309, 1);
        stumpG.fillEllipse(207, 404, 9, 4);
        stumpG.lineStyle(2, 0xd97706, 1);
        stumpG.beginPath();
        stumpG.moveTo(205, 404);
        stumpG.lineTo(196, 388);
        stumpG.strokePath();
        stumpG.fillStyle(0x94a3b8, 1);
        stumpG.fillTriangle(202, 403, 208, 397, 204, 394);

        // 9. Floating Wood Sawdust Particles in the Workshop Breeze
        for (let s = 0; s < 12; s++) {
            const dust = this.add.circle(
                Phaser.Math.Between(150, 380),
                Phaser.Math.Between(340, 415),
                Phaser.Math.FloatBetween(1, 2),
                0xfde047,
                0.65
            ).setDepth(3);
            this.tweens.add({
                targets: dust,
                x: dust.x + Phaser.Math.Between(15, 40),
                y: dust.y - Phaser.Math.Between(10, 25),
                alpha: { from: 0.65, to: 0.1 },
                duration: Phaser.Math.Between(2000, 3500),
                delay: s * 250,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createHeinreichHouse() {
        const hG = this.add.graphics().setDepth(2);

        // A. Stone Foundation Base (X: 0 to 180, Y: 388 to 418)
        hG.fillStyle(0x334155, 1);
        hG.fillRect(0, 388, 180, 30);
        hG.fillStyle(0x475569, 1);
        hG.fillRect(0, 388, 180, 4);
        for (let bx = 12; bx < 180; bx += 26) {
            hG.fillStyle(0x1e293b, 0.85);
            hG.fillRect(bx, 392, 2, 26);
        }

        // B. Heavy Timber Log Walls (X: 0 to 180, Y: 215 to 388)
        hG.fillStyle(0x451a03, 1);
        hG.fillRect(0, 215, 180, 173);

        // Horizontal interlocking wooden log planks
        for (let py = 215; py < 388; py += 15) {
            hG.fillStyle((Math.floor(py / 15) % 2 === 0) ? 0x78350f : 0x5c2b0c, 1);
            hG.fillRect(0, py, 180, 14);
            hG.fillStyle(0x271306, 0.7);
            hG.fillRect(0, py + 13, 180, 2);
        }

        // Vertical corner timber pillars & framing
        [0, 92, 170].forEach(px => {
            hG.fillStyle(0x271306, 1);
            hG.fillRect(px, 215, 10, 173);
            hG.fillStyle(0x5c2b0c, 0.6);
            hG.fillRect(px + 2, 215, 6, 173);
        });

        // Cross-timber structural beams
        hG.fillStyle(0x271306, 0.9);
        hG.fillRect(0, 215, 180, 8);
        hG.fillRect(0, 305, 180, 7);

        // C. Cobblestone Chimney with Puffed Smoke (X: 42, Y: 90 to 160)
        hG.fillStyle(0x334155, 1);
        hG.fillRect(42, 95, 26, 60);
        hG.fillStyle(0x64748b, 1);
        hG.fillRect(39, 90, 32, 8);
        hG.fillStyle(0x1e293b, 0.75);
        for (let cy = 104; cy < 155; cy += 11) {
            hG.fillRect(42, cy, 26, 2);
        }

        // Chimney rising smoke puffs
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(55, 86, Phaser.Math.Between(4, 7), 0xf1f5f9, 0.55).setDepth(2);
            this.tweens.add({
                targets: smoke,
                x: 55 + Phaser.Math.Between(12, 32),
                y: 86 - Phaser.Math.Between(35, 65),
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.55, to: 0 },
                duration: 2500 + i * 400,
                delay: i * 600,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // D. Alpine Timber Gabled Roof (Apex: X: 88, Y: 115; Eaves: X: -15 to 195, Y: 225)
        // Shadow under overhang
        hG.fillStyle(0x1c0b03, 0.85);
        hG.fillTriangle(-15, 228, 88, 118, 195, 228);

        // Timber roof shingle layers
        hG.fillStyle(0x5c2b0c, 1);
        hG.fillTriangle(-18, 224, 88, 110, 197, 224);
        hG.fillStyle(0x78350f, 1);
        hG.fillTriangle(-12, 219, 88, 116, 191, 219);

        // Decorative bargeboard trim
        hG.fillStyle(0x451a03, 1);
        hG.fillRect(82, 106, 12, 12);
        hG.fillCircle(88, 106, 6);

        // E. Warm Lit Workshop Window with Shutters (X: 20 to 68, Y: 245 to 295)
        const winGlow = this.add.circle(44, 270, 22, 0xfde047, 0.3).setDepth(2);
        this.tweens.add({
            targets: winGlow,
            alpha: { from: 0.2, to: 0.45 },
            scale: { from: 0.9, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Window warm lit pane
        hG.fillStyle(0xfef08a, 0.95);
        hG.fillRoundedRect(22, 245, 44, 48, 4);

        // Wooden cross-frame
        hG.fillStyle(0x451a03, 1);
        hG.fillRect(20, 243, 48, 3);
        hG.fillRect(20, 290, 48, 4);
        hG.fillRect(20, 243, 3, 50);
        hG.fillRect(65, 243, 3, 50);
        hG.fillRect(43, 243, 3, 50);
        hG.fillRect(20, 267, 48, 3);

        // Wooden Window Shutters on sides
        hG.fillStyle(0x78350f, 1);
        hG.fillRect(10, 245, 11, 48);
        hG.fillRect(69, 245, 11, 48);
        hG.fillStyle(0x451a03, 0.8);
        hG.fillRect(10, 245, 11, 2);
        hG.fillRect(10, 291, 11, 2);
        hG.fillRect(69, 245, 11, 2);
        hG.fillRect(69, 291, 11, 2);

        // F. Carpenter's Workshop Arched Door (X: 114 to 160, Y: 308 to 388)
        hG.fillStyle(0x271306, 1);
        hG.fillRoundedRect(111, 305, 52, 83, 6);
        hG.fillStyle(0x5c2b0c, 1);
        hG.fillRoundedRect(114, 308, 46, 80, 4);

        // Door vertical timber planks
        for (let dx = 124; dx < 160; dx += 9) {
            hG.fillStyle(0x271306, 0.6);
            hG.fillRect(dx, 309, 1.5, 78);
        }

        // Iron strap hinges on door
        hG.fillStyle(0x1e293b, 1);
        hG.fillRect(114, 322, 22, 4);
        hG.fillCircle(116, 324, 3);
        hG.fillRect(114, 368, 22, 4);
        hG.fillCircle(116, 370, 3);

        // Iron ring door handle
        hG.lineStyle(2, 0x1e293b, 1);
        hG.strokeCircle(153, 350, 3.5);

        // Workshop Wooden Sign Board above door
        hG.fillStyle(0x78350f, 1);
        hG.fillRoundedRect(104, 292, 66, 14, 3);
        hG.fillStyle(0x451a03, 1);
        hG.strokeRoundedRect(104, 292, 66, 14, 3);

        this.add.text(137, 299, '🪵 BENGKEL KAYU', {
            fontSize: '7px',
            fontStyle: 'bold',
            fill: '#fef08a',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(3);

        // G. Tool Rack Mounted on Exterior Wall (under window: X: 16 to 75, Y: 322 to 365)
        hG.fillStyle(0x78350f, 1);
        hG.fillRect(16, 325, 64, 6);
        hG.fillStyle(0x271306, 1);
        hG.fillRect(16, 329, 64, 2);

        // Logging Saw hanging
        hG.fillStyle(0x94a3b8, 1);
        hG.fillRect(22, 333, 4, 32);
        hG.fillTriangle(22, 365, 36, 355, 22, 345);
        hG.fillStyle(0x78350f, 1);
        hG.fillRect(20, 331, 8, 4);

        // Broad axe hanging
        hG.fillStyle(0x78350f, 1);
        hG.fillRect(44, 333, 4, 30);
        hG.fillStyle(0x94a3b8, 1);
        hG.fillTriangle(40, 335, 54, 331, 48, 343);

        // Claw hammer hanging
        hG.fillStyle(0x92400e, 1);
        hG.fillRect(64, 333, 4, 26);
        hG.fillStyle(0x64748b, 1);
        hG.fillRect(60, 331, 12, 5);

        // H. Porch Lantern beside Door (X: 96, Y: 322)
        hG.fillStyle(0x1e293b, 1);
        hG.fillRect(94, 322, 10, 2);
        hG.fillRect(102, 322, 2, 7);
        hG.fillStyle(0xfde047, 1);
        hG.fillRect(99, 329, 8, 10);
        hG.fillStyle(0x1e293b, 1);
        hG.fillTriangle(97, 329, 103, 325, 109, 329);

        // Warm porch lantern glow
        const porchGlow = this.add.circle(103, 334, 16, 0xfde047, 0.35).setDepth(2);
        this.tweens.add({
            targets: porchGlow,
            alpha: { from: 0.22, to: 0.48 },
            duration: 950,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

// -------------------------------------------------------------
// SCENE 8: FIREWOOD FOREST SCENE (PINGGIR HUTAN TIMUR - BAB 2)
// -------------------------------------------------------------
