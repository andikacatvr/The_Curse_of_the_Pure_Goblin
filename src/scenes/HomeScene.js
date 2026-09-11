import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

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
        mainPlatform.setVisible(false);

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
        this.rachael = this.physics.add.staticSprite(200, 418, 'npc_rachael').setDepth(5).setScale(0.28);
        this.rachael.setOrigin(0.5, 1);
        this.rachael.refreshBody();
        if (this.anims.exists('rachael_idle')) {
            this.rachael.anims.play('rachael_idle', true);
        }
        this.rachael.type = 'npc';
        this.rachael.dialogue = [
            { speaker: 'Rachael', text: '(Suara bergetar lemah) Kak Aksel... hati-hatilah di jalan... jangan memaksakan dirimu...' },
            { speaker: 'Aksel', text: 'Tenanglah Rachael, bertahanlah demi kakak dan Nenek. Aku pasti kembali membawa obat!' }
        ];

        // Nenek di Teras Rumah
        this.grandma = this.physics.add.staticSprite(275, 418, 'npc_grandma_home').setDepth(5).setScale(0.21);
        this.grandma.setOrigin(0.5, 1);
        this.grandma.refreshBody();
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
                        GameAudio.playCollect();

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
                { speaker: 'Aksel', text: 'Mulai hari ini, kita akan hidup bahagia bersama, Rachael, Nenek. Dan abang berjanji, abang akan selalu menjaga keluarga kita dengan jalan yang jujur dan benar!' }
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
        GameAudio.playCollect();

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
        // 1. PANORAMIC VILLAGE VALLEY BACKGROUND (Pixel Art Desa Warga Senja)
        this.add.image(400, 225, 'home_village_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. YARD ELEMENTS (Pagar Kayu, Pohon Tepi Pagar, Rumput, Semak, dan Jalan Batu)
        const bgG = this.add.graphics().setDepth(2);


        // 3b. GROUND / TERRAIN SPRITE (tanah.png)
        const groundScale = 800 / 770;
        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(groundScale);

        // 4. THE COTTAGE HOUSE — Using cropped rumah.png pixel art sprite
        const houseSprite = this.add.image(170, 418, 'building_rumah').setDepth(2);
        // Anchor from bottom-center so the foundation sits directly on the ground line (y = 418)
        houseSprite.setOrigin(0.5, 1);
        // Scale house to ~340px wide to fit the cottage grounds
        const houseScale = 340 / houseSprite.width;
        houseSprite.setScale(houseScale);

        // 5. CHIMNEY SMOKE PUFFS (Animated on top of the house sprite)
        const smokeX = 170 - (houseSprite.displayWidth / 2) + (60 * houseScale);
        const smokeY = 418 - houseSprite.displayHeight + (18 * houseScale);
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(smokeX, smokeY, 6 + i * 2, 0xe2e8f0, 0.4).setDepth(3);
            this.tweens.add({
                targets: smoke,
                x: { from: smokeX, to: smokeX + 26 + i * 15 },
                y: { from: smokeY, to: smokeY - 56 },
                scale: { from: 0.8, to: 2.4 },
                alpha: { from: 0.45, to: 0 },
                duration: 3200 + i * 600,
                delay: i * 900,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 6. WARM WINDOW GLOW (Subtle light cone from the house)
        bgG.fillStyle(0xfbbf24, 0.08);
        bgG.beginPath();
        bgG.moveTo(60, 310); bgG.lineTo(140, 310); bgG.lineTo(165, 418); bgG.lineTo(35, 418);
        bgG.closePath();
        bgG.fillPath();

        // 7. HANGING PORCH LANTERN GLOW (animated)
        const lanternGlow = this.add.circle(277, 350, 28, 0xfbbf24, 0.18).setDepth(2);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.12, to: 0.28 },
            scale: { from: 0.92, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
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
