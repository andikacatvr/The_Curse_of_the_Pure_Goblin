import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';

export class HomeScene extends BaseScene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    create(data = {}) {
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli') || (data && data.ending === true);

        if (!hasCure && (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3')) {
            this.scene.start('GrandmaGardenScene');
            return;
        }

        this.cameras.main.setBackgroundColor('#13172e');
        this.createHomeAtmosphere();

        const title = hasCure ? 'Rumah Aksel & Rachael (Ending)' : 'Rumah Aksel & Rachael (Halaman Teras)';
        this.currentLocationName = title;
        this.registry.set('currentLocationName', title);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const hasWood = !!this.registry.get('hasCollectedFirewood');
        let startX = 360;
        if (data && data.from === 'LakeForestScene') {
            startX = 60;
        } else if (data && data.from === 'ForestTrailScene') {
            startX = 720;
        }
        if (hasCure && data && data.ending === true) {
            startX = 160;
        }

        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Rachael di Kursi Goyang
        this.rachael = this.physics.add.staticSprite(200, 395, 'npc_rachael').setDepth(5);
        this.rachael.type = 'npc';
        this.rachael.dialogue = [
            { speaker: 'Rachael', text: '(Suara bergetar lemah) Kak Aksel... hati-hatilah di jalan... jangan memaksakan dirimu...' },
            { speaker: 'Aksel', text: 'Tenanglah Rachael, bertahanlah demi kakak dan Nenek. Aku pasti kembali membawa obat!' }
        ];

        // Nenek di Teras Rumah
        this.grandma = this.physics.add.staticSprite(275, 393, 'npc_grandma_home').setDepth(5);
        this.grandma.type = 'npc';

        // Tumpukan Kayu Bakar di Teras (muncul setelah diambil dari Danau)
        this.firewoodStack = this.add.image(115, 412, 'special_firewood').setDepth(4).setScale(1.2);
        this.firewoodStack.setVisible(hasWood);

        this.itemsGroup = this.physics.add.staticGroup();

        // Pisau Belati di Meja Teras (muncul setelah adegan batuk darah / bawa kayu bakar)
        if (!hasCure && hasWood) {
            const hasDagger = inv.some(i => i.id === 'Pisau Belati');
            if (!hasDagger) {
                this.dagger = this.itemsGroup.create(380, 405, 'item_dagger');
                this.dagger.type = 'item';
                this.dagger.itemId = 'Pisau Belati';
                this.dagger.itemDesc = 'Senjata belati peninggalan keluarga untuk perlindungan di perjalanan.';
                this.dagger.setDepth(5);
            }
        }

        // Teks Petunjuk Arah Kiri & Kanan (Navigasi Map di Atas)
        this.leftExitText = this.add.text(20, 65, '◀ Ke Hutan Danau & Kaki Gunung\n(Cari Kayu Bakar)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(0, 0).setDepth(20);
        this.leftExitText.setVisible(!hasWood);

        this.rightExitText = this.add.text(780, 65, 'Ke Pinggir Hutan ➔\n(Jalan ke Kanan)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#60a5fa', align: 'right', backgroundColor: '#0f172acc', padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setDepth(20);
        this.rightExitText.setVisible(hasWood && !hasCure);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

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

        // 1. Prolog Bagian 1: Suruhan Nenek Mengambil Kayu Bakar di Hutan Danau & Ujung Danau Kaki Gunung
        if (!hasWood && !data.from && !this.registry.get('woodQuestIntroPlayed')) {
            this.registry.set('woodQuestIntroPlayed', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Nenek', text: 'Aksel, hari sudah mulai sore dan udara malam nanti akan sangat dingin...' },
                    { speaker: 'Nenek', text: 'Maukah kau tolong carikan 4 ikat kayu bakar kering di tepi Hutan Danau dan Ujung Danau Kaki Gunung sebelah barat [◀]? Perapian kita sudah hampir habis.' },
                    { speaker: 'Aksel', text: 'Tentu Nenek! Aku akan segera pergi ke Hutan Danau dan Ujung Danau Kaki Gunung di sebelah barat dan segera kembali membawa kayu bakar.' },
                    { speaker: 'Nenek', text: 'Terima kasih, Aksel. Hati-hati di jalan ya, jangan pulang terlalu larut. Rachael sedang istirahat di kursi goyang.' },
                    { speaker: 'Rachael', text: '(Tersenyum lembut dari kursi goyang) Hati-hati di jalan ya, Kak Aksel...' }
                ]);
                setQuestState(this.registry, {
                    chapter: 'PROLOG',
                    title: 'Mencari Kayu Bakar di Hutan Danau',
                    objective: 'Jalan ke arah barat [◀] melintasi Hutan Danau hingga Ujung Danau Kaki Gunung untuk mencari 4 kayu bakar suruhan Nenek.',
                    questNumber: 0
                });
                this.updateQuestHUD();
            });
        }

        // 2. Prolog Bagian 2: Aksel Pulang Membawa Kayu Bakar -> Rachael Batuk Darah
        if (hasWood && data && data.from === 'LakeForestScene' && !this.registry.get('coughCutscenePlayed')) {
            this.registry.set('coughCutscenePlayed', true);
            this.registry.set('prologueIntroPlayed', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Nenek, Rachael, aku sudah pulang! 4 ikat kayu bakar dari tepi danau dan kaki gunung sudah kutaruh di teras...' },
                    { speaker: 'Rachael', text: '(Duduk lemas di kursi goyang, tiba-tiba terbatuk hebat) Uhukk... uhukk!! Khh-...' },
                    { speaker: 'Narator', text: '(Setitik darah segar menetes di telapak tangan Rachael... Wajahnya semakin pucat pasi, nafasnya tercekat lemas.)' },
                    { speaker: 'Aksel', text: '(Panik berlari mendekat) Rachael! Bertahanlah! Rachael, kau baik-baik saja?!' },
                    { speaker: 'Nenek', text: '(Tergopoh-gopoh mendekat cemas) Astaga, Rachael cucuku! Rachael... apa yang terasa sakit, Nak?!' },
                    { speaker: 'Rachael', text: '(Suara parau dan sangat pelan) Kak Aksel... Nenek... tubuhku rasanya semakin lemas... dadaku sesak sekali...' },
                    { speaker: 'Aksel', text: 'Rachael, aku akan pergi ke kota untuk mencarikanmu obat!' },
                    { speaker: 'Nenek', text: 'Aksel.. jangan pergi, aku tahu niatmu ingin menyelamatkan adikmu ta tapi... jarak ke kota sangat jauh, kau akan kehabisan uang sebelum sampai sana.' },
                    { speaker: 'Aksel', text: 'Nenek.. aku tahu kau mengkhawatirkanku tapi aku janji aku akan segera kembali. Tolong jaga Rachael ya.' },
                    { speaker: 'Nenek', text: 'Baiklah, nenek akan menyiapkan bekal untukmu.' },
                    { speaker: 'Aksel', text: 'Terima kasih nenek!' }
                ], () => {
                    // Nenek memberikan item bekal makanan ke Aksel
                    const curInv = getInventory(this.registry);
                    if (!curInv.some(i => i.id === 'Roti Bekal')) {
                        curInv.push({ id: 'Roti Bekal', desc: 'Roti bekal buatan Nenek tercinta untuk perjalanan Aksel.' });
                        this.registry.set('inventory', curInv);
                        this.renderInventorySlots();

                        const notice = this.add.text(this.grandma.x, this.grandma.y - 32, '✨ + Roti Bekal (Dari Nenek)', {
                            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000bb', padding: { x: 5, y: 3 }
                        }).setOrigin(0.5).setDepth(30);

                        this.tweens.add({
                            targets: notice, y: notice.y - 30, alpha: 0, duration: 1600,
                            onComplete: () => notice.destroy()
                        });
                    }

                    // Tampilkan Belati di Meja Teras
                    if (!this.dagger && !curInv.some(i => i.id === 'Pisau Belati')) {
                        this.dagger = this.itemsGroup.create(380, 405, 'item_dagger');
                        this.dagger.type = 'item';
                        this.dagger.itemId = 'Pisau Belati';
                        this.dagger.itemDesc = 'Senjata belati peninggalan keluarga untuk perlindungan di perjalanan.';
                        this.dagger.setDepth(5);
                    }

                    setQuestState(this.registry, {
                        chapter: 'PROLOG',
                        title: 'Persiapan Menuju Kota',
                        objective: 'Bekal dari Nenek sudah di tas! Ambil Pisau Belati di meja teras sebelum berangkat ke Timur [➔].',
                        questNumber: 0
                    });
                    this.updateQuestHUD();

                    if (this.rightExitText) this.rightExitText.setVisible(true);
                });
            });
        }

        if (hasCure && data && data.ending === true) {
            this.triggerEndingCutscene();
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    triggerEndingCutscene() {
        if (this.isEndingTriggered) return;
        this.isEndingTriggered = true;

        if (this.promptText) this.promptText.setVisible(false);
        this.nearTarget = null;

        this.cameras.main.setBackgroundColor('#0f172a');

        if (this.player) {
            this.player.setVelocity(0, 0);
            this.player.setX(160);
            this.player.setY(380);
            this.player.setTexture('player_human');
        }

        this.time.delayedCall(500, () => {
            this.startDialogue([
                { speaker: 'Rachael', text: '(Air mata menetes, suara bergetar lemah) Abang... kau sudah kembali... Aku menunggumu, Abang... Aku takut kau tidak kembali...' },
                { speaker: 'Aksel', text: '(Berlari mendekat dan memeluk Rachael erat) Rachael... Maafkan aku membuatmu menunggu begitu lama. Aku sudah berjanji, kan? Aku tidak akan pernah meninggalkanmu!' },
                { speaker: 'Rachael', text: '(Menatap wajah abangnya yang tampak begitu lelah dan penuh luka kecil) Nafasmu terengah-engah... pakaianmu kotor dan robek... Abang, apa yang terjadi di luar sana? Kau pergi ke mana saja demi aku...?' },
                { speaker: 'Aksel', text: '(Tersenyum hangat menahan haru, menyembunyikan semua penderitaan kutukannya) Tidak ada apa-apa, Dik. Hanya sedikit perjalanan panjang di desa... Orang-orang baik di desa membantuku mendapatkan obat ini.' },
                { speaker: 'Aksel', text: 'Lihat, ini [Ramuan Kesembuhan Asli] untukmu. Minumlah sekarang, Rachael... Semua rasa sakit ini akan segera berakhir.' },
                { speaker: 'Rachael', text: '(Menerima botol ramuan magis yang berkilau keemasan) Botol ini... terasa sangat hangat di tanganku...' },
                { speaker: 'Rachael', text: '(Meminum ramuan magis perlahan) ... *Glek... Glek...*' },
                { speaker: 'Rachael', portrait: 'portrait_rachael_sembuh', text: '✨ (Cahaya keemasan menyelimuti tubuhnya, rona merah segar kembali ke pipinya) K-kehangatan ini... Rasa lemas dan nyeri di dadaku... semuanya hilang, Abang?!' },
                { speaker: 'Rachael', portrait: 'portrait_rachael_sembuh', text: '(Perlahan bangkit berdiri dari kursi goyang, menangis bahagia sambil memeluk Aksel) Abang! Kakiku tidak gemetar lagi! Aku bisa berdiri tegak! Aku sembuh, Abang... Aku sembuh total!!' },
                { speaker: 'Nenek', text: '(Menangis haru memeluk Aksel dan Rachael) Syukurlah ya Tuhan... Rachael cucuku sembuh! Aksel, kau cucu yang paling berani dan berbakti... Nenek bangga sekali padamu, Nak!' },
                { speaker: 'Aksel (Dalam Hati)', text: '(Mengepalkan tangan dengan air mata kelegaan) Semua penderitaan menjadi Goblin, cemoohan, dan kerja keras tanpa henti itu... semuanya terbayar lunas. Rachael... adikku terselamatkan.' },
                { speaker: 'Aksel', text: 'Alhamdulillah... Mulai hari ini, kita akan hidup bahagia bersama, Rachael, Nenek. Dan abang berjanji, abang akan selalu menjaga keluarga kita dengan jalan yang jujur dan benar!' }
            ], () => {
                this.registry.set('rachaelHealed', true);
                this.showChapterBanner('🎉 TAMAT: THE GOOD GOBLIN 🎉', 'Kutukan Terlepas - Rachael Sembuh Total!');
                setQuestState(this.registry, {
                    chapter: 'EPILOG (TAMAT)',
                    title: '🎉 GAME TAMAT! SELAMAT!',
                    objective: 'Rachael sembuh total & kutukan terlepas! Terima kasih telah bermain The Good Goblin.',
                    questNumber: 10,
                    completedQuests: [
                        'Prolog: Menghadapi Penyihir & Terkena Kutukan',
                        'Bab 1: Bahan 1 Madu Murni',
                        'Bab 2: Bahan 2 Mythical Seed',
                        'Bab 3: Bahan 3 Magic Bread',
                        'Epilog: Rachael Sembuh Total'
                    ]
                });
                this.updateQuestHUD();
            });
        });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'cure') {
                this.triggerEndingCutscene();
            } else if (this.nearTarget.type === 'npc') {
                this.startDialogue(this.nearTarget.dialogue);
            } else if (this.nearTarget.type === 'item') {
                this.collectItem(this.nearTarget.sprite);
            }
        }
    }

    collectItem(itemSprite) {
        const inv = getInventory(this.registry);
        inv.push({ id: itemSprite.itemId, desc: itemSprite.itemDesc });
        this.registry.set('inventory', inv);

        const notice = this.add.text(itemSprite.x, itemSprite.y - 30, `+ ${itemSprite.itemId}`, {
            fontSize: '13px', fontStyle: 'bold', fill: '#2ecc71', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 30, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        itemSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);
        this.renderInventorySlots();

        const hasDagger = inv.some(i => i.id === 'Pisau Belati');
        const hasBread = inv.some(i => i.id === 'Roti Bekal');

        if (hasDagger && hasBread && !this.registry.get('prologueSuppliesReady')) {
            this.registry.set('prologueSuppliesReady', true);
            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Menuju Rumah Penyihir',
                objective: 'Bekal siap! Jalan ke arah timur [➔] menuju Pinggir Hutan.',
                questNumber: 1
            });
            this.updateQuestHUD();

            this.time.delayedCall(400, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Dalam Hati)', text: 'Bekal dan belati sudah kubawa... Rachael, aku berjanji akan membawamu obat, tunggulah sebentar...' },
                    { speaker: 'Aksel', text: 'Aku pergi dulu ya Rachael adikku... Bertahanlah!' }
                ]);
            });
        }
    }

    createHomeAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. SKY GRADIENT (Warm Twilight / Nostalgic Dusk Sky)
        bgG.fillGradientStyle(0x13172e, 0x181e3a, 0x3d1f35, 0x5a2d28, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. CELESTIAL ELEMENTS (Twinkling Stars, Soft Clouds, Crescent Moon)
        for (let i = 0; i < 28; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 160);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.4, 0.9)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 1 },
                scale: { from: 0.7, to: 1.3 },
                duration: Phaser.Math.Between(1500, 3500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Crescent Moon in top right sky
        bgG.fillStyle(0xfef9c3, 0.95);
        bgG.fillCircle(710, 55, 18);
        bgG.fillStyle(0x161c36, 1);
        bgG.fillCircle(718, 50, 16);
        bgG.fillStyle(0xfef08a, 0.08);
        bgG.fillCircle(710, 55, 32);

        // Soft twilight clouds drifting gently
        const clouds = [
            { x: 120, y: 70, w: 110, h: 22 },
            { x: 380, y: 45, w: 140, h: 26 },
            { x: 580, y: 90, w: 100, h: 20 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0xd8b4e2, 0.18);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 10);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 4, c.h * 0.7);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 6, c.h * 0.85);
        });

        // 3. DISTANT MOUNTAINS & WOODLAND RIDGE
        bgG.fillStyle(0x1e1530, 0.9);
        bgG.fillTriangle(260, 418, 440, 190, 620, 418);
        bgG.fillTriangle(480, 418, 640, 220, 800, 418);
        bgG.fillTriangle(600, 418, 730, 250, 840, 418);

        const distantPines = [
            { x: 360, w: 40, h: 120 },
            { x: 420, w: 46, h: 145 },
            { x: 480, w: 42, h: 130 },
            { x: 540, w: 50, h: 155 },
            { x: 610, w: 45, h: 140 },
            { x: 670, w: 52, h: 165 },
            { x: 740, w: 48, h: 150 }
        ];
        distantPines.forEach(dp => {
            bgG.fillStyle(0x151f28, 0.95);
            bgG.fillRect(dp.x + dp.w * 0.4, 418 - dp.h, dp.w * 0.2, dp.h);
            bgG.fillStyle(0x0e1b18, 0.95);
            bgG.fillTriangle(dp.x, 418 - dp.h * 0.3, dp.x + dp.w * 0.5, 418 - dp.h, dp.x + dp.w, 418 - dp.h * 0.3);
            bgG.fillTriangle(dp.x - 4, 418 - dp.h * 0.1, dp.x + dp.w * 0.5, 418 - dp.h * 0.6, dp.x + dp.w + 4, 418 - dp.h * 0.1);
        });

        // Warm horizon dusk glow (subtle bottom strip only)
        bgG.fillStyle(0xf59e0b, 0.06);
        bgG.fillRect(0, 380, 800, 38);

        // 4. THE COTTAGE HOUSE (Rumah Aksel & Rachael)
        // Upper Wall Base (Warm timber)
        bgG.fillStyle(0x6c3614, 1);
        bgG.fillRect(0, 160, 330, 258);
        // Timber Horizontal Wood Planks
        for (let py = 168; py < 370; py += 16) {
            bgG.fillStyle(0x7c3f1d, 1);
            bgG.fillRect(0, py, 330, 14);
            bgG.fillStyle(0x9a4f27, 0.5);
            bgG.fillRect(0, py, 330, 2);
            bgG.fillStyle(0x451a03, 0.9);
            bgG.fillRect(0, py + 14, 330, 2);
        }

        // Stone Wall Foundation (Lower Cottage Wall)
        bgG.fillStyle(0x334155, 1);
        bgG.fillRect(0, 370, 330, 48);
        bgG.fillStyle(0x475569, 1);
        for (let row = 0; row < 3; row++) {
            const yOffset = 372 + row * 15;
            const xOffset = (row % 2 === 0) ? 0 : 16;
            for (let bx = xOffset; bx < 330; bx += 32) {
                bgG.fillRect(bx + 1, yOffset, 30, 13);
                bgG.fillStyle(0x1e293b, 0.6);
                bgG.fillRect(bx, yOffset, 1, 13);
                bgG.fillRect(bx, yOffset + 12, 31, 1);
                bgG.fillStyle(0x64748b, 0.4);
                bgG.fillRect(bx + 1, yOffset, 30, 1);
                bgG.fillStyle(0x475569, 1);
            }
        }

        // Vertical Timber Corner Posts & Crossbeams
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(0, 160, 14, 258);
        bgG.fillRect(318, 160, 12, 258);
        bgG.fillRect(180, 160, 10, 210);
        bgG.fillRect(0, 250, 330, 8);

        // Diagonal Tudor Style Timber Beams
        bgG.fillStyle(0x3a1502, 0.9);
        bgG.beginPath();
        bgG.moveTo(14, 168); bgG.lineTo(32, 168); bgG.lineTo(180, 250); bgG.lineTo(162, 250);
        bgG.closePath();
        bgG.fillPath();
        bgG.beginPath();
        bgG.moveTo(180, 168); bgG.lineTo(198, 168); bgG.lineTo(318, 250); bgG.lineTo(300, 250);
        bgG.closePath();
        bgG.fillPath();

        // 5. COTTAGE ROOF (Pitched Gable Roof with Rustic Shingles)
        bgG.fillStyle(0x3d1708, 1);
        bgG.fillTriangle(140, 52, -38, 185, 348, 185);

        bgG.fillStyle(0x993515, 1);
        bgG.fillTriangle(140, 50, -32, 180, 342, 180);

        const roofTiers = [
            { y: 80, leftX: 105, rightX: 175, color: 0xb23b17 },
            { y: 105, leftX: 75, rightX: 205, color: 0x8a2e12 },
            { y: 130, leftX: 40, rightX: 240, color: 0xb23b17 },
            { y: 155, leftX: 5, rightX: 275, color: 0x7c280e },
            { y: 178, leftX: -28, rightX: 338, color: 0xa43615 }
        ];
        roofTiers.forEach(tier => {
            bgG.fillStyle(tier.color, 1);
            bgG.fillRect(tier.leftX, tier.y, tier.rightX - tier.leftX, 8);
            bgG.fillStyle(0x451a03, 0.8);
            bgG.fillRect(tier.leftX, tier.y + 7, tier.rightX - tier.leftX, 2);
            for (let sx = tier.leftX + 12; sx < tier.rightX - 10; sx += 20) {
                bgG.fillRect(sx, tier.y, 2, 8);
            }
        });

        // Decorative Roof Ridge Cap & Fascia Trims
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(128, 46, 24, 8);
        bgG.beginPath();
        bgG.moveTo(140, 48); bgG.lineTo(146, 52); bgG.lineTo(-26, 184); bgG.lineTo(-34, 180);
        bgG.closePath();
        bgG.fillPath();
        bgG.beginPath();
        bgG.moveTo(140, 48); bgG.lineTo(134, 52); bgG.lineTo(336, 184); bgG.lineTo(344, 180);
        bgG.closePath();
        bgG.fillPath();

        // 6. STONE CHIMNEY & ANIMATED SMOKE PUFFS
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(52, 45, 34, 75);
        bgG.fillStyle(0x64748b, 1);
        bgG.fillRect(54, 47, 30, 10);
        bgG.fillStyle(0x334155, 1);
        bgG.fillRect(52, 65, 34, 2);
        bgG.fillRect(52, 85, 34, 2);
        bgG.fillRect(52, 105, 34, 2);
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(48, 40, 42, 8);
        bgG.fillStyle(0x94a3b8, 1);
        bgG.fillRect(50, 41, 38, 2);

        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(69, 36, 6 + i * 2, 0xe2e8f0, 0.4).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: { from: 69, to: 95 + i * 15 },
                y: { from: 36, to: -20 },
                scale: { from: 0.8, to: 2.4 },
                alpha: { from: 0.45, to: 0 },
                duration: 3200 + i * 600,
                delay: i * 900,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 7. COTTAGE BAY WINDOW (Glowing warmly from inside)
        bgG.fillStyle(0xfbbf24, 0.12);
        bgG.beginPath();
        bgG.moveTo(60, 290); bgG.lineTo(140, 290); bgG.lineTo(165, 414); bgG.lineTo(35, 414);
        bgG.closePath();
        bgG.fillPath();

        bgG.fillStyle(0x381e0d, 1);
        bgG.fillRoundedRect(56, 218, 88, 76, 4);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillRect(62, 224, 76, 64);
        bgG.fillStyle(0xf59e0b, 0.35);
        bgG.fillRect(62, 224, 76, 30);

        // Curtains
        bgG.fillStyle(0x991b1b, 0.95);
        bgG.fillTriangle(62, 224, 78, 224, 62, 280);
        bgG.fillTriangle(138, 224, 122, 224, 138, 280);

        // Window Mullion Crossbars
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(98, 224, 4, 64);
        bgG.fillRect(62, 254, 76, 4);
        bgG.fillStyle(0x542308, 1);
        bgG.fillRect(52, 290, 96, 6);

        // Window Planter / Flower Box
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(54, 296, 92, 14);
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(54, 308, 92, 2);
        bgG.fillStyle(0x16a34a, 1);
        for (let fx = 58; fx < 140; fx += 10) {
            bgG.fillCircle(fx, 295, 5);
        }
        const flowers = [
            { x: 62, c: 0xef4444 }, { x: 74, c: 0xfde047 }, { x: 86, c: 0xf43f5e },
            { x: 98, c: 0x38bdf8 }, { x: 110, c: 0xfde047 }, { x: 122, c: 0xef4444 }, { x: 134, c: 0xa855f7 }
        ];
        flowers.forEach(f => {
            bgG.fillStyle(f.c, 1);
            bgG.fillCircle(f.x, 293, 3);
            bgG.fillStyle(0xffffff, 0.9);
            bgG.fillCircle(f.x, 293, 1);
        });

        // 8. COTTAGE FRONT DOOR (Pintu Rumah)
        bgG.fillStyle(0x271306, 1);
        bgG.fillRect(238, 268, 68, 150);
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(242, 272, 60, 146);
        bgG.fillStyle(0x431e08, 1);
        bgG.fillRect(248, 280, 22, 55);
        bgG.fillRect(274, 280, 22, 55);
        bgG.fillRect(248, 345, 22, 65);
        bgG.fillRect(274, 345, 22, 65);
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(240, 290, 16, 5);
        bgG.fillRect(240, 385, 16, 5);
        bgG.fillStyle(0xf59e0b, 1);
        bgG.fillCircle(293, 355, 4);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(292, 354, 1.5);

        // 9. THE TERRACE / PORCH (Halaman Teras)
        // Porch Awning / Canopy Overhang
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(15, 268, 345, 8);
        bgG.fillStyle(0x8a2e12, 1);
        bgG.beginPath();
        bgG.moveTo(10, 258); bgG.lineTo(365, 258); bgG.lineTo(355, 272); bgG.lineTo(15, 272);
        bgG.closePath();
        bgG.fillPath();
        bgG.fillStyle(0xb23b17, 1);
        for (let vx = 20; vx < 355; vx += 14) {
            bgG.fillTriangle(vx, 272, vx + 7, 278, vx + 14, 272);
        }

        // Porch Wooden Support Pillars
        const porchPillars = [
            { x: 30, w: 10 },
            { x: 180, w: 10 },
            { x: 345, w: 10 }
        ];
        porchPillars.forEach(pillar => {
            bgG.fillStyle(0x5c2b0e, 1);
            bgG.fillRect(pillar.x, 272, pillar.w, 142);
            bgG.fillStyle(0x78350f, 0.8);
            bgG.fillRect(pillar.x + 2, 272, 3, 142);
            bgG.fillStyle(0x3a1705, 1);
            bgG.fillRect(pillar.x - 3, 272, pillar.w + 6, 6);
            bgG.fillRect(pillar.x - 3, 408, pillar.w + 6, 6);
            bgG.fillTriangle(pillar.x, 278, pillar.x - 12, 278, pillar.x, 290);
            bgG.fillTriangle(pillar.x + pillar.w, 278, pillar.x + pillar.w + 12, 278, pillar.x + pillar.w, 290);
        });

        // Hanging Porch Lantern
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(276, 274, 2, 12);
        bgG.fillTriangle(277, 286, 271, 292, 283, 292);
        bgG.fillStyle(0xfde047, 1);
        bgG.fillRect(272, 292, 10, 12);
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(271, 304, 12, 3);
        bgG.fillRect(276, 292, 2, 12);

        const lanternGlow = this.add.circle(277, 298, 28, 0xfbbf24, 0.22).setDepth(0);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.15, to: 0.32 },
            scale: { from: 0.92, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Raised Wooden Porch Deck / Floor
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(15, 412, 340, 6);
        bgG.fillStyle(0x854d0e, 1);
        bgG.fillRect(15, 407, 340, 5);
        bgG.fillStyle(0x3e1d08, 0.8);
        for (let dx = 25; dx < 350; dx += 24) {
            bgG.fillRect(dx, 407, 2, 11);
        }

        // Terrace Steps down to yard
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(350, 412, 20, 6);
        bgG.fillStyle(0x854d0e, 1);
        bgG.fillRect(350, 409, 20, 3);
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(366, 415, 14, 3);

        // Wooden Terrace Railing
        bgG.fillStyle(0x713f12, 1);
        bgG.fillRect(40, 372, 138, 4);
        for (let rx = 48; rx < 175; rx += 14) {
            bgG.fillStyle(0x854d0e, 1);
            bgG.fillRect(rx, 376, 4, 31);
            bgG.fillStyle(0x5c2b0e, 1);
            bgG.fillRect(rx, 404, 4, 3);
        }
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(40, 403, 138, 4);

        // 10. RACHAEL'S ROCKING CHAIR (Kursi Goyang Halaman Teras)
        const chairG = this.add.graphics().setDepth(1);
        chairG.fillStyle(0x5c2b0e, 1);
        chairG.fillRoundedRect(170, 414, 60, 4, 2);
        chairG.fillRect(168, 412, 4, 3);
        chairG.fillRect(228, 412, 4, 3);

        chairG.fillStyle(0x78350f, 1);
        chairG.fillRect(178, 396, 5, 20);
        chairG.fillRect(216, 396, 5, 20);
        chairG.fillRect(180, 406, 38, 3);

        chairG.fillStyle(0x92400e, 1);
        chairG.fillRect(174, 393, 48, 6);
        chairG.fillStyle(0xd97706, 1);
        chairG.fillRoundedRect(175, 389, 44, 5, 2);

        chairG.fillStyle(0x78350f, 1);
        chairG.fillRect(217, 345, 6, 50);
        chairG.fillStyle(0x92400e, 1);
        for (let sp = 348; sp < 388; sp += 8) {
            chairG.fillRect(212, sp, 4, 3);
        }
        chairG.fillStyle(0xb45309, 1);
        chairG.fillRoundedRect(214, 342, 10, 6, 2);

        chairG.fillStyle(0x92400e, 1);
        chairG.fillRect(176, 375, 28, 4);
        chairG.fillRect(176, 378, 4, 15);

        // 11. PREPARATION TABLE / GARDEN BENCH (Meja Persiapan Bekal)
        const tableG = this.add.graphics().setDepth(2);
        tableG.fillStyle(0x451a03, 1);
        tableG.fillRect(372, 412, 8, 22);
        tableG.fillRect(492, 412, 8, 22);
        tableG.fillRect(432, 414, 6, 20);
        tableG.fillStyle(0x5c2b0e, 1);
        tableG.fillRect(372, 424, 128, 4);
        tableG.fillStyle(0x78350f, 1);
        tableG.fillRoundedRect(362, 410, 148, 7, 2);
        tableG.fillStyle(0x9a4f27, 1);
        tableG.fillRect(364, 411, 144, 2);
        tableG.fillStyle(0xf8fafc, 0.9);
        tableG.fillRect(372, 410, 40, 3);
        tableG.fillRect(470, 410, 34, 3);
        this.add.text(435, 420, 'Meja Bekal', { fontSize: '9px', fontStyle: 'bold', fill: '#94a3b8' }).setOrigin(0.5).setDepth(2);

        // 12. POTTED PLANTS & FLOWERS ON TERRACE CORNERS
        const pots = [
            { x: 36, y: 407, plantColor: 0x22c55e, flowerColor: 0xf43f5e },
            { x: 334, y: 407, plantColor: 0x16a34a, flowerColor: 0xfde047 }
        ];
        pots.forEach(pot => {
            bgG.fillStyle(0xc2410c, 1);
            bgG.fillTriangle(pot.x - 7, pot.y - 12, pot.x + 7, pot.y - 12, pot.x, pot.y);
            bgG.fillRect(pot.x - 6, pot.y - 12, 12, 12);
            bgG.fillStyle(0x9a3412, 1);
            bgG.fillRect(pot.x - 8, pot.y - 14, 16, 3);
            bgG.fillStyle(pot.plantColor, 1);
            bgG.fillCircle(pot.x - 4, pot.y - 18, 6);
            bgG.fillCircle(pot.x + 4, pot.y - 18, 6);
            bgG.fillCircle(pot.x, pot.y - 23, 7);
            bgG.fillStyle(pot.flowerColor, 1);
            bgG.fillCircle(pot.x - 2, pot.y - 21, 2.5);
            bgG.fillCircle(pot.x + 3, pot.y - 19, 2.5);
        });

        // 13. FRONT YARD (Halaman Depan Rumah) & WINDING STONE PATHWAY
        const stones = [
            { x: 380, y: 420, rx: 12, ry: 4 },
            { x: 415, y: 423, rx: 15, ry: 5 },
            { x: 455, y: 421, rx: 14, ry: 4 },
            { x: 520, y: 423, rx: 16, ry: 5 },
            { x: 565, y: 421, rx: 15, ry: 4 },
            { x: 615, y: 423, rx: 18, ry: 5 },
            { x: 665, y: 421, rx: 16, ry: 4 },
            { x: 715, y: 423, rx: 17, ry: 5 },
            { x: 760, y: 421, rx: 18, ry: 5 }
        ];
        stones.forEach(st => {
            bgG.fillStyle(0x334155, 1);
            bgG.fillEllipse(st.x, st.y + 1, st.rx, st.ry);
            bgG.fillStyle(0x64748b, 1);
            bgG.fillEllipse(st.x, st.y, st.rx, st.ry);
            bgG.fillStyle(0x94a3b8, 0.7);
            bgG.fillEllipse(st.x - 2, st.y - 1, st.rx * 0.6, st.ry * 0.5);
        });

        // 14. RUSTIC WOODEN PICKET FENCE
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(515, 385, 220, 3);
        bgG.fillRect(515, 400, 220, 3);

        for (let fx = 520; fx < 735; fx += 16) {
            bgG.fillStyle(0x854d0e, 1);
            bgG.fillRect(fx, 375, 8, 38);
            bgG.fillTriangle(fx, 375, fx + 4, 368, fx + 8, 375);
            bgG.fillStyle(0xa16207, 0.6);
            bgG.fillRect(fx + 1, 375, 2, 38);
        }

        // Garden Arch / Gate Posts
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(734, 345, 10, 73);
        bgG.fillRect(775, 345, 10, 73);
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(730, 345, 58, 6);
        bgG.fillStyle(0x16a34a, 0.9);
        bgG.fillCircle(735, 355, 6);
        bgG.fillCircle(742, 350, 5);
        bgG.fillCircle(765, 350, 5);
        bgG.fillCircle(774, 358, 6);

        // 15. FRONT YARD TREE (Pohon Halaman Tepi Hutan)
        bgG.fillStyle(0x3e1d08, 1);
        bgG.fillRect(772, 180, 28, 238);
        bgG.fillStyle(0x5c2b0e, 0.7);
        bgG.fillRect(775, 180, 4, 238);
        bgG.fillStyle(0x3e1d08, 1);
        bgG.fillTriangle(772, 230, 725, 200, 772, 220);
        bgG.fillTriangle(772, 280, 715, 260, 772, 270);

        const leaves = [
            { x: 740, y: 170, r: 42, color: 0x14532d },
            { x: 710, y: 200, r: 35, color: 0x166534 },
            { x: 780, y: 140, r: 55, color: 0x15803d },
            { x: 700, y: 250, r: 28, color: 0x16a34a },
            { x: 760, y: 190, r: 45, color: 0x15803d }
        ];
        leaves.forEach(lf => {
            bgG.fillStyle(lf.color, 0.95);
            bgG.fillCircle(lf.x, lf.y, lf.r);
        });

        // 16. LAWN DETAILS: FLOWER BUSHES, GRASS TUFTS, WILDFLOWERS
        const bushes = [
            { x: 505, y: 412, r: 16, c: 0x15803d },
            { x: 535, y: 414, r: 12, c: 0x16a34a },
            { x: 635, y: 413, r: 15, c: 0x15803d },
            { x: 705, y: 414, r: 14, c: 0x166534 }
        ];
        bushes.forEach(b => {
            bgG.fillStyle(b.c, 0.95);
            bgG.fillCircle(b.x, b.y, b.r);
            bgG.fillCircle(b.x - b.r * 0.4, b.y + 2, b.r * 0.7);
            bgG.fillCircle(b.x + b.r * 0.4, b.y + 2, b.r * 0.7);
        });

        const yardFlowers = [
            { x: 395, y: 415, c: 0xfde047 },
            { x: 440, y: 416, c: 0xffffff },
            { x: 545, y: 414, c: 0xf43f5e },
            { x: 590, y: 416, c: 0xfde047 },
            { x: 650, y: 415, c: 0x60a5fa },
            { x: 690, y: 416, c: 0xffffff }
        ];
        yardFlowers.forEach(fl => {
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillRect(fl.x, fl.y, 2, 5);
            bgG.fillStyle(fl.c, 1);
            bgG.fillCircle(fl.x + 1, fl.y - 1, 2.5);
            bgG.fillStyle(0xf59e0b, 1);
            bgG.fillCircle(fl.x + 1, fl.y - 1, 1);
        });

        bgG.fillStyle(0x4ade80, 0.9);
        for (let gx = 370; gx < 790; gx += 22) {
            bgG.fillTriangle(gx, 418, gx + 3, 407, gx + 6, 418);
            bgG.fillTriangle(gx + 8, 418, gx + 12, 409, gx + 16, 418);
        }

        // 17. ATMOSPHERIC TWILIGHT FIREFLIES
        for (let i = 0; i < 16; i++) {
            const fx = Phaser.Math.Between(50, 770);
            const fy = Phaser.Math.Between(180, 410);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(1.5, 2.5), 0xfde047, 0.75).setDepth(3);

            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-25, 25),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.85 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(2000, 4200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        let found = null;
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const hasWood = !!this.registry.get('hasCollectedFirewood');

        if (this.grandma && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandma.x, this.grandma.y) < 60) {
            let grandmaDialogue;
            if (!hasWood) {
                grandmaDialogue = [
                    { speaker: 'Nenek', text: 'Aksel, pergilah ke arah barat [◀] melintasi Hutan Danau & Ujung Danau Kaki Gunung untuk mencari 4 ikat kayu bakar ya, Nak.' }
                ];
            } else {
                const hasDagger = inv.some(i => i.id === 'Pisau Belati');
                grandmaDialogue = hasDagger ? [
                    { speaker: 'Nenek', text: 'Hati-hati di jalan ya cucuku tersayang... Bawakan obat penawar untuk adikmu dan kembalilah dengan selamat. Doa Nenek selalu menyertaimu.' }
                ] : [
                    { speaker: 'Nenek', text: 'Aksel, jangan lupa bawa sebilah [Pisau Belati] di atas meja teras untuk melindungimu di perjalanan.' }
                ];
            }
            found = { type: 'npc', dialogue: grandmaDialogue, x: this.grandma.x, y: this.grandma.y - 35, prompt: 'Tekan [E] Bicara dengan Nenek' };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rachael.x, this.rachael.y) < 65) {
            if (this.registry.get('rachaelHealed')) {
                const healedDialogue = [
                    { speaker: 'Rachael', portrait: 'portrait_rachael_sembuh', text: 'Terima kasih banyak ya, Abang... Berkat ramuan magis dan perjuanganmu, tubuhku sudah sehat bugar kembali!' }
                ];
                found = { type: 'npc', dialogue: healedDialogue, x: this.rachael.x, y: this.rachael.y - 35, prompt: 'Tekan [E] Bicara dengan Rachael' };
            } else if (hasCure) {
                found = { type: 'cure', x: this.rachael.x, y: this.rachael.y - 35, prompt: 'Tekan [E] Minumkan Ramuan Kesembuhan ke Rachael' };
            } else {
                const rDialogue = !hasWood ? [
                    { speaker: 'Rachael', text: '(Tersenyum lemah) Hati-hati di tepi danau ya, Kak Aksel... udara pegunungan sore ini terasa sangat dingin.' }
                ] : this.rachael.dialogue;
                found = { type: 'npc', dialogue: rDialogue, x: this.rachael.x, y: this.rachael.y - 35, prompt: 'Tekan [E] Bicara dengan Rachael' };
            }
        }

        this.itemsGroup.children.iterate((item) => {
            if (item && item.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 45) {
                found = { type: 'item', sprite: item, x: item.x, y: item.y - 25, prompt: `Tekan [E] Ambil ${item.itemId}` };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        if (this.isEndingTriggered) {
            if (this.player) this.player.setVelocityX(0);
            return;
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: !hasWood,
            minX: 20,
            onExitLeft: () => {
                if (!hasWood) {
                    this.scene.start('LakeForestScene', { from: 'HomeScene' });
                }
            },
            canExitRight: true,
            maxX: 770,
            onExitRight: () => {
                if (hasCure) return;
                if (!hasWood) {
                    this.showMapLockedNotice('Cari 4 kayu bakar di Hutan Danau dan Ujung Danau Kaki Gunung sebelah barat [◀] terlebih dahulu!');
                    this.player.setX(720);
                    this.player.setVelocityX(-150);
                    return;
                }
                const inv = getInventory(this.registry);
                const hasDagger = inv.some(i => i.id === 'Pisau Belati');
                const hasBread = inv.some(i => i.id === 'Roti Bekal');
                if (!hasDagger || !hasBread) {
                    this.checkMapGate({
                        targetScene: 'ForestTrailScene',
                        reqQuestNum: 1,
                        lockMessage: 'Ambil Pisau Belati di meja teras sebelum berangkat ke Hutan Timur!',
                        direction: 'right'
                    });
                } else {
                    this.scene.start('ForestTrailScene', { from: 'HomeScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 1B: LAKE FOREST SCENE (HUTAN, DANAU, & PEGUNUNGAN DI BARAT)
// -------------------------------------------------------------
