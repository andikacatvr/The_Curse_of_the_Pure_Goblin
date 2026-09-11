import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class GrandmaGardenScene extends BaseScene {
    constructor() {
        super({ key: 'GrandmaGardenScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e293b');
        this.createGrandmaGardenAtmosphere();

        this.currentLocationName = 'Halaman Rumah Grandma Mary (Barat Desa)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

        const qState = getQuestState(this.registry);
        if (qState.chapter === 'PROLOG') {
            qState.chapter = 'BAB 1';
            this.registry.set('questState', qState);
        }
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (!hasCure) ? 'player_goblin' : 'player_human';
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
                { speaker: 'Aksel (Goblin)', text: 'Nenek Mary, madunya sudah berhasil kupanen! Apakah Nenek tahu di mana aku bisa menemukan Bahan ke-2, yaitu Mythical Seed?' },
                { speaker: 'Grandma Mary', text: 'Luar biasa Goblin kecil yang baik hati! Hmmm... Mythical Seed ya? Sepertinya Nenek pernah mendengar nama itu dari Mr. Heinreich si tukang kayu di sebelah timur.' },
                { speaker: 'Grandma Mary', text: 'Dia pernah bercerita bahwa dia menyimpan biji ajaib yang konon membawa keberuntungan melimpah. Nenek sendiri kurang percaya takhayul seperti itu, hohoho...' },
                { speaker: 'Grandma Mary', text: 'Tapi melihat kegigihanmu, mungkin kau bisa coba menemuinya di bengkel kayu timur dan menanyakannya langsung padanya.' },
                { speaker: 'Aksel (Goblin)', text: 'Baik Nenek Mary! Aku akan segera menemui Mr. Heinreich di bengkel kayunya!' }
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
                    const inv = getInventory(this.registry);
                    const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                    if (!this.registry.get('talkedToMary')) {
                        this.registry.set('talkedToMary', true);
                        setQuestState(this.registry, {
                            chapter: 'BAB 1',
                            title: 'Quest 1: Bersihkan 5 Rumput Liar',
                            objective: 'Pergi ke Kebun Lebah sebelah barat (Jalan ke Barat) & bersihkan 5 rumput liar [E].',
                            questNumber: 1
                        });
                        this.updateQuestHUD();
                    } else if (hasHoney) {
                        setQuestState(this.registry, {
                            chapter: 'BAB 2',
                            title: 'Bab 2: Berburu Mythical Seed',
                            objective: 'Pergi ke Mr. Heinreich di Bengkel Kayu (Timur) untuk menanyakan Mythical Seed.',
                            questNumber: 4
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

    createGrandmaGardenAtmosphere() {
        // 1. Background image (Misty Pine Forest & Mountains for Grandma Mary's Yard)
        this.add.image(400, 225, 'grandma_mary_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Ambient drifting mist layers
        for (let m = 0; m < 3; m++) {
            const mist = this.add.ellipse(Phaser.Math.Between(100, 700), Phaser.Math.Between(260, 360), Phaser.Math.Between(250, 400), Phaser.Math.Between(40, 80), 0xe2e8f0, 0.08).setDepth(1);
            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 30, to: mist.x + 30 },
                alpha: { from: 0.04, to: 0.12 },
                duration: Phaser.Math.Between(4000, 7000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 3. Grandma Mary's Cozy Wooden Countryside Cottage & Garden
        this.createGrandmaCottage();
        this.createGardenAndFence();

        // 4. MAGICAL FIREFLIES (KUNANG-KUNANG)
        this.createFireflies();
    }

    createGrandmaCottage() {
        const cG = this.add.graphics().setDepth(2);

        // A. Stone Foundation Base
        cG.fillStyle(0x334155, 1);
        cG.fillRect(0, 385, 205, 33);
        cG.fillStyle(0x475569, 1);
        cG.fillRect(0, 385, 205, 5);
        for (let bx = 10; bx < 200; bx += 28) {
            cG.fillStyle(0x1e293b, 0.8);
            cG.fillRect(bx, 390, 2, 28);
        }

        // B. Main Wooden Timber Walls (X: 0 to 205, Y: 215 to 385)
        // Warm wood background
        cG.fillStyle(0x854d0e, 1);
        cG.fillRect(0, 215, 205, 170);

        // Horizontal wooden siding planks
        for (let py = 215; py < 385; py += 14) {
            cG.fillStyle((Math.floor(py / 14) % 2 === 0) ? 0x92400e : 0x78350f, 1);
            cG.fillRect(0, py, 205, 13);
            cG.fillStyle(0x451a03, 0.65);
            cG.fillRect(0, py + 12, 205, 1.5);
        }

        // Vertical timber framing pillars
        const pillars = [0, 95, 195];
        pillars.forEach(px => {
            cG.fillStyle(0x451a03, 1);
            cG.fillRect(px, 215, 10, 170);
            cG.fillStyle(0x78350f, 0.5);
            cG.fillRect(px + 2, 215, 6, 170);
        });

        // Cross-timber beams
        cG.fillStyle(0x451a03, 0.9);
        cG.fillRect(0, 215, 205, 8);
        cG.fillRect(0, 305, 205, 8);

        // C. Stone Chimney with Puffed Smoke
        cG.fillStyle(0x334155, 1);
        cG.fillRect(145, 85, 28, 65);
        cG.fillStyle(0x64748b, 1);
        cG.fillRect(141, 80, 36, 9);
        // Chimney brick lines
        cG.fillStyle(0x1e293b, 0.7);
        for (let cy = 94; cy < 150; cy += 11) {
            cG.fillRect(145, cy, 28, 2);
        }

        // Chimney rising smoke puffs
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(159, 76, Phaser.Math.Between(5, 8), 0xf1f5f9, 0.55).setDepth(2);
            this.tweens.add({
                targets: smoke,
                x: 159 + Phaser.Math.Between(15, 38),
                y: 76 - Phaser.Math.Between(35, 70),
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.55, to: 0 },
                duration: 2600 + i * 450,
                delay: i * 650,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // D. Thatched Gabled Cottage Roof (Roof eaves: X: -15 to 220, Apex: X: 95, Y: 110)
        // Shadow under overhang
        cG.fillStyle(0x3b1c04, 0.8);
        cG.fillTriangle(-15, 226, 95, 114, 220, 226);

        // Main roof terracotta / warm thatch layers
        cG.fillStyle(0xb45309, 1);
        cG.fillTriangle(-18, 222, 95, 106, 222, 222);
        cG.fillStyle(0xd97706, 1);
        cG.fillTriangle(-12, 217, 95, 112, 216, 217);

        // Decorative bargeboard trim
        cG.fillStyle(0x78350f, 1);
        cG.fillRect(89, 102, 12, 12);
        cG.fillCircle(95, 102, 6);

        // E. Warm Lit Window with Curtains & Flower Box (X: 30 to 80, Y: 245 to 295)
        // Soft amber lantern glow from inside
        const winGlow = this.add.circle(55, 270, 22, 0xfde047, 0.3).setDepth(2);
        this.tweens.add({
            targets: winGlow,
            alpha: { from: 0.2, to: 0.45 },
            scale: { from: 0.9, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        cG.fillStyle(0xfef08a, 0.95);
        cG.fillRoundedRect(32, 245, 46, 50, 4);
        // Window curtains (red gingham)
        cG.fillStyle(0xef4444, 0.85);
        cG.fillTriangle(32, 245, 44, 245, 32, 280);
        cG.fillTriangle(78, 245, 66, 245, 78, 280);
        // Window wooden cross-frame
        cG.fillStyle(0x451a03, 1);
        cG.fillRect(30, 243, 50, 3);
        cG.fillRect(30, 292, 50, 4);
        cG.fillRect(30, 243, 3, 52);
        cG.fillRect(77, 243, 3, 52);
        cG.fillRect(53, 243, 4, 52);
        cG.fillRect(30, 268, 50, 3);

        // Flower box under window
        cG.fillStyle(0x78350f, 1);
        cG.fillRect(28, 295, 54, 12);
        cG.fillStyle(0x92400e, 1);
        cG.fillRect(30, 297, 50, 8);
        // Blooming blossoms in flower box
        const boxFlowers = [
            { x: 34, col: 0xef4444 }, { x: 42, col: 0xfacc15 }, { x: 50, col: 0xec4899 },
            { x: 58, col: 0x38bdf8 }, { x: 66, col: 0xfacc15 }, { x: 74, col: 0xef4444 }
        ];
        boxFlowers.forEach(f => {
            cG.fillStyle(0x16a34a, 1);
            cG.fillCircle(f.x, 294, 3);
            cG.fillStyle(f.col, 1);
            cG.fillCircle(f.x, 292, 3.5);
            cG.fillStyle(0xffffff, 0.9);
            cG.fillCircle(f.x, 292, 1.2);
        });

        // F. Wooden Front Door (X: 125 to 175, Y: 310 to 385)
        cG.fillStyle(0x451a03, 1);
        cG.fillRoundedRect(122, 306, 56, 80, 6);
        cG.fillStyle(0x78350f, 1);
        cG.fillRoundedRect(125, 309, 50, 76, 4);
        // Door wooden vertical planks
        for (let dx = 137; dx < 175; dx += 12) {
            cG.fillStyle(0x451a03, 0.6);
            cG.fillRect(dx, 310, 1.5, 74);
        }
        // Golden door handle
        cG.fillStyle(0xfde047, 1);
        cG.fillCircle(168, 350, 3);

        // Hanging Porch Lantern beside Door
        cG.fillStyle(0x1e293b, 1);
        cG.fillRect(108, 320, 10, 2);
        cG.fillRect(116, 320, 2, 8);
        cG.fillStyle(0xfde047, 1);
        cG.fillRect(113, 328, 8, 10);
        cG.fillStyle(0x1e293b, 1);
        cG.fillTriangle(111, 328, 117, 324, 123, 328);

        // Warm lantern glow
        const lanternGlow = this.add.circle(117, 333, 16, 0xfde047, 0.35).setDepth(2);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.22, to: 0.48 },
            duration: 950,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Green Ivy / climbing vines on cottage left corner
        cG.fillStyle(0x15803d, 0.9);
        cG.fillCircle(6, 360, 9);
        cG.fillCircle(14, 345, 8);
        cG.fillCircle(5, 330, 7);
        cG.fillCircle(12, 318, 6);
        cG.fillStyle(0x22c55e, 0.85);
        cG.fillCircle(8, 358, 5);
        cG.fillCircle(15, 343, 4);
    }

    createGardenAndFence() {
        const gG = this.add.graphics().setDepth(2);

        // 1. Rustic White Wooden Picket Fence extending from house to right
        for (let fx = 198; fx <= 790; fx += 30) {
            // Picket post
            gG.fillStyle(0xf8fafc, 0.95);
            gG.fillRect(fx, 362, 8, 56);
            // Pointed tip
            gG.fillTriangle(fx - 1, 362, fx + 4, 350, fx + 9, 362);
            // Shadow side
            gG.fillStyle(0xcbd5e1, 0.6);
            gG.fillRect(fx + 6, 362, 2, 56);
        }
        // Horizontal fence rails
        gG.fillStyle(0xe2e8f0, 0.95);
        gG.fillRect(198, 375, 595, 6);
        gG.fillRect(198, 396, 595, 6);

        // 2. Vegetable Garden Bed (Carrots & Cabbages) near Grandma Mary
        gG.fillStyle(0x78350f, 0.9);
        gG.fillRoundedRect(340, 411, 230, 11, 4);
        // Sprouting carrots
        for (let cx = 355; cx < 450; cx += 22) {
            gG.fillStyle(0xf97316, 1);
            gG.fillTriangle(cx, 415, cx + 3, 411, cx + 6, 415);
            gG.fillStyle(0x22c55e, 1);
            gG.fillTriangle(cx + 1, 411, cx + 3, 403, cx + 5, 411);
        }
        // Round plump cabbages
        for (let cbx = 465; cbx < 555; cbx += 26) {
            gG.fillStyle(0x16a34a, 1);
            gG.fillCircle(cbx, 410, 7);
            gG.fillStyle(0x86efac, 1);
            gG.fillCircle(cbx - 1, 409, 4);
        }

        // 3. Blooming Countryside Flower Patches along the fence
        const gardenFlowers = [
            { x: 215, col: 0xef4444 }, { x: 232, col: 0xfacc15 }, { x: 285, col: 0xec4899 },
            { x: 305, col: 0x38bdf8 }, { x: 585, col: 0xfacc15 }, { x: 605, col: 0xec4899 },
            { x: 630, col: 0xef4444 }, { x: 660, col: 0x38bdf8 }, { x: 695, col: 0xfacc15 },
            { x: 730, col: 0xef4444 }, { x: 760, col: 0xec4899 }
        ];

        gardenFlowers.forEach(fl => {
            // Bush leaves
            gG.fillStyle(0x15803d, 0.95);
            gG.fillCircle(fl.x, 412, 6);
            gG.fillCircle(fl.x + 4, 410, 5);
            // Blossoms
            gG.fillStyle(fl.col, 1);
            gG.fillCircle(fl.x, 406, 4.5);
            gG.fillCircle(fl.x + 5, 408, 3.5);
            gG.fillStyle(0xffffff, 0.9);
            gG.fillCircle(fl.x, 406, 1.5);
        });
    }

    createFireflies() {
        const fireflyColors = [0xfef08a, 0xfde047, 0xa3e635, 0x86efac, 0x38bdf8];
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(30, 770);
            const y = Phaser.Math.Between(60, 390);
            const color = Phaser.Utils.Array.GetRandom(fireflyColors);

            // Soft aura glow
            const glow = this.add.circle(x, y, Phaser.Math.FloatBetween(4, 7), color, 0.28).setDepth(4);
            // Bright firefly center
            const core = this.add.circle(x, y, Phaser.Math.FloatBetween(1.2, 2.2), 0xffffff, 0.95).setDepth(4);

            // Wandering drift tween (organic flight path)
            const duration = Phaser.Math.Between(3000, 6000);
            const dx = Phaser.Math.Between(-45, 45);
            const dy = Phaser.Math.Between(-35, 35);

            this.tweens.add({
                targets: [glow, core],
                x: `+=${dx}`,
                y: `+=${dy}`,
                duration: duration,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Glowing & blinking flicker effect
            const blinkDuration = Phaser.Math.Between(800, 1600);
            this.tweens.add({
                targets: glow,
                scale: { from: 0.6, to: 1.4 },
                alpha: { from: 0.08, to: 0.65 },
                duration: blinkDuration,
                delay: i * 150,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.tweens.add({
                targets: core,
                alpha: { from: 0.15, to: 1 },
                duration: blinkDuration,
                delay: i * 150,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 5.5: BEE GARDEN & BEEHIVE DEEP AREA SCENE
// -------------------------------------------------------------
