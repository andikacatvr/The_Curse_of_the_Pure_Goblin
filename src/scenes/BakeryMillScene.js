import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class BakeryMillScene extends BaseScene {
    constructor() {
        super({ key: 'BakeryMillScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#ca8a04');
        this.createBakeryMillAtmosphere();

        this.currentLocationName = 'Area Gilingan Batu & Toko Roti Mr. Breado (Bab 3)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

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
        GameAudio.playCollect();

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
        GameAudio.playCollect();

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

    createBakeryMillAtmosphere() {
        // 1. High-fidelity Pixel Art Sunrise Terraced Fields Background
        this.add.image(400, 225, 'bakery_mill_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Radiant Golden Sunrise Sunburst & Light Rays
        const sunGlow = this.add.circle(410, 132, 55, 0xfef08a, 0.28).setDepth(1);
        this.tweens.add({
            targets: sunGlow,
            scale: { from: 0.9, to: 1.25 },
            alpha: { from: 0.18, to: 0.38 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Morning sunrise sunbeams
        const sunRays = this.add.graphics().setDepth(1);
        sunRays.fillStyle(0xfef08a, 0.05);
        sunRays.fillTriangle(410, 132, 0, 0, 180, 0);
        sunRays.fillTriangle(410, 132, 620, 0, 800, 0);
        sunRays.fillTriangle(410, 132, 200, 420, 360, 420);
        sunRays.fillTriangle(410, 132, 460, 420, 620, 420);

        // 3. Morning Dawn Valley Mist Layers
        for (let m = 0; m < 3; m++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(80, 720),
                Phaser.Math.Between(240, 350),
                Phaser.Math.Between(260, 420),
                Phaser.Math.Between(40, 75),
                0xfef3c7,
                0.08
            ).setDepth(1);
            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 25, to: mist.x + 25 },
                alpha: { from: 0.04, to: 0.12 },
                duration: Phaser.Math.Between(4500, 7500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 4. Mr. Breado's Artisan Bakery Shopfront (Left: X: 0 to 180)
        this.createBreadoBakeryShop();

        // 5. Magic Oven Hearth & Warming Fire Glow on the Right (X: 710, Y: 380)
        const ovenGlow = this.add.circle(710, 382, 35, 0xf97316, 0.3).setDepth(3);
        this.tweens.add({
            targets: ovenGlow,
            scale: { from: 0.88, to: 1.18 },
            alpha: { from: 0.2, to: 0.45 },
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Oven Chimney Smoke (delicate baking bread aroma)
        for (let o = 0; o < 3; o++) {
            const ovenSmoke = this.add.circle(710, 340, Phaser.Math.Between(3, 5), 0xffedd5, 0.5).setDepth(3);
            this.tweens.add({
                targets: ovenSmoke,
                x: 710 + Phaser.Math.Between(6, 18),
                y: 340 - Phaser.Math.Between(30, 60),
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.5, to: 0 },
                duration: 2000 + o * 400,
                delay: o * 600,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 6. Floating Golden Flour & Morning Sun Motes
        for (let f = 0; f < 16; f++) {
            const dust = this.add.circle(
                Phaser.Math.Between(160, 750),
                Phaser.Math.Between(260, 415),
                Phaser.Math.FloatBetween(1, 2.2),
                0xfef3c7,
                0.7
            ).setDepth(3);
            this.tweens.add({
                targets: dust,
                x: dust.x + Phaser.Math.Between(-25, 30),
                y: dust.y - Phaser.Math.Between(15, 40),
                alpha: { from: 0.75, to: 0.15 },
                duration: Phaser.Math.Between(2400, 4800),
                delay: f * 200,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createBreadoBakeryShop() {
        const bG = this.add.graphics().setDepth(2);

        // A. Stone Foundation Base
        bG.fillStyle(0x334155, 1);
        bG.fillRect(0, 388, 175, 30);
        bG.fillStyle(0x475569, 1);
        bG.fillRect(0, 388, 175, 4);
        for (let bx = 12; bx < 175; bx += 26) {
            bG.fillStyle(0x1e293b, 0.8);
            bG.fillRect(bx, 392, 2, 26);
        }

        // B. Warm Terracotta Brick Walls (X: 0 to 175, Y: 215 to 388)
        bG.fillStyle(0x9a3412, 1);
        bG.fillRect(0, 215, 175, 173);

        // Brick mortar lines
        bG.fillStyle(0x7c2d12, 0.75);
        for (let by = 215; by < 388; by += 12) {
            bG.fillRect(0, by, 175, 1.5);
            const offset = (Math.floor(by / 12) % 2) * 14;
            for (let bx = offset; bx < 175; bx += 28) {
                bG.fillRect(bx, by, 1.5, 12);
            }
        }

        // Vertical corner timber pillars
        [0, 85, 165].forEach(px => {
            bG.fillStyle(0x451a03, 1);
            bG.fillRect(px, 215, 10, 173);
            bG.fillStyle(0x78350f, 0.6);
            bG.fillRect(px + 2, 215, 6, 173);
        });

        // Structural timber cross-beam
        bG.fillStyle(0x451a03, 0.95);
        bG.fillRect(0, 215, 175, 8);
        bG.fillRect(0, 305, 175, 7);

        // C. Brick Bakery Chimney with Rising Baking Smoke (X: 38, Y: 95 to 160)
        bG.fillStyle(0x7c2d12, 1);
        bG.fillRect(38, 95, 26, 60);
        bG.fillStyle(0x9a3412, 1);
        bG.fillRect(35, 90, 32, 8);
        bG.fillStyle(0x451a03, 0.8);
        for (let cy = 104; cy < 155; cy += 10) {
            bG.fillRect(38, cy, 26, 2);
        }

        // Fresh bread rising smoke puffs
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(51, 86, Phaser.Math.Between(4, 7), 0xffedd5, 0.6).setDepth(2);
            this.tweens.add({
                targets: smoke,
                x: 51 + Phaser.Math.Between(15, 38),
                y: 86 - Phaser.Math.Between(35, 70),
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.6, to: 0 },
                duration: 2400 + i * 420,
                delay: i * 620,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // D. Bakery Roof & Gables (Apex: X: 85, Y: 115; Eaves: X: -15 to 190, Y: 225)
        bG.fillStyle(0x271306, 0.85);
        bG.fillTriangle(-15, 228, 85, 118, 190, 228);

        bG.fillStyle(0xb45309, 1);
        bG.fillTriangle(-18, 224, 85, 110, 192, 224);
        bG.fillStyle(0xd97706, 1);
        bG.fillTriangle(-12, 219, 85, 116, 186, 219);

        // E. Classic Red and White Striped Bakery Awning (X: 10 to 165, Y: 228 to 258)
        const awningX = 12;
        const awningW = 152;
        const stripes = 8;
        const stW = awningW / stripes;
        for (let s = 0; s < stripes; s++) {
            bG.fillStyle(s % 2 === 0 ? 0xef4444 : 0xf8fafc, 1);
            bG.fillRect(awningX + s * stW, 228, stW, 26);
            bG.fillCircle(awningX + s * stW + stW / 2, 254, stW / 2);
        }
        // Awning shadow
        bG.fillStyle(0x000000, 0.25);
        bG.fillRect(awningX, 256, awningW, 4);

        // F. Lit Bakery Display Window (X: 20 to 68, Y: 265 to 315)
        const winGlow = this.add.circle(44, 290, 20, 0xfde047, 0.35).setDepth(2);
        this.tweens.add({
            targets: winGlow,
            alpha: { from: 0.25, to: 0.5 },
            scale: { from: 0.9, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Window pane
        bG.fillStyle(0xfef08a, 0.95);
        bG.fillRoundedRect(22, 266, 44, 46, 4);
        // Window frame
        bG.fillStyle(0x451a03, 1);
        bG.fillRect(20, 264, 48, 3);
        bG.fillRect(20, 310, 48, 4);
        bG.fillRect(20, 264, 3, 48);
        bG.fillRect(65, 264, 3, 48);
        bG.fillRect(43, 264, 3, 48);
        bG.fillRect(20, 287, 48, 3);

        // Bread Display Shelf inside window (baguettes & loaves)
        bG.fillStyle(0xd97706, 1);
        bG.fillEllipse(33, 302, 7, 4);
        bG.fillEllipse(54, 302, 7, 4);
        bG.fillStyle(0xb45309, 1);
        bG.fillEllipse(33, 299, 5, 2);
        bG.fillEllipse(54, 299, 5, 2);

        // G. Bakery Dutch Door (X: 108 to 154, Y: 308 to 388)
        bG.fillStyle(0x271306, 1);
        bG.fillRoundedRect(105, 305, 52, 83, 6);
        bG.fillStyle(0x78350f, 1);
        bG.fillRoundedRect(108, 308, 46, 80, 4);

        // Door panels & brass handle
        bG.fillStyle(0x451a03, 0.7);
        bG.fillRect(112, 314, 38, 30);
        bG.fillRect(112, 350, 38, 32);
        bG.fillStyle(0xfacc15, 1);
        bG.fillCircle(146, 348, 3);

        // H. Artisan Bakery Sign Board above door
        bG.fillStyle(0x78350f, 1);
        bG.fillRoundedRect(95, 292, 72, 14, 3);
        bG.fillStyle(0x451a03, 1);
        bG.strokeRoundedRect(95, 292, 72, 14, 3);

        this.add.text(131, 299, '🥖 TOKO ROTI BREADO', {
            fontSize: '6.5px',
            fontStyle: 'bold',
            fill: '#fef08a',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(3);

        // I. Flour Sacks & Bread Display Barrel outside (X: 165 to 195, Y: 395 to 415)
        const sackG = this.add.graphics().setDepth(2);
        // Flour sack (cream white)
        sackG.fillStyle(0xfef3c7, 1);
        sackG.fillEllipse(176, 408, 11, 10);
        sackG.fillStyle(0xd97706, 1);
        sackG.fillRect(174, 399, 4, 3);
        // Text "FLOUR" on sack
        sackG.fillStyle(0x92400e, 0.8);
        sackG.fillRect(171, 406, 10, 2);
    }
}

// -------------------------------------------------------------
// SCENE 10: VILLAGE RESIDENTIAL SCENE (3 RUMAH PEMESAN ROTI)
// -------------------------------------------------------------
