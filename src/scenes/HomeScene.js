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

        this.physics.world.setBounds(0, 0, 1200, 450);
        this.cameras.main.setBounds(0, 0, 1200, 450);
        this.cameras.main.setBackgroundColor('#13172e');
        this.createHomeAtmosphere();

        const title = hasCure ? 'Rumah Aksel & Rachael (Ending)' : 'Rumah Aksel & Rachael (Halaman Teras)';
        this.currentLocationName = title;
        this.registry.set('currentLocationName', title);

        this.platforms = this.physics.add.staticGroup();
        for (let px = 200; px <= 1200; px += 400) {
            const p = this.platforms.create(px, 434, 'platform').setScale(2, 1).refreshBody();
            p.setVisible(false);
        }

        const hasWood = !!this.registry.get('hasCollectedFirewood');
        let startX = 520;
        if (data && data.from === 'LakeForestScene') {
            startX = 60;
        } else if (data && data.from === 'ForestTrailScene') {
            startX = 1120;
        }
        if (hasCure && data && data.ending === true) {
            startX = 320;
        }
        if (data && data.endingDone === true) {
            this.registry.set('rachaelHealed', true);
            startX = 260;
        }
        const isFirstIntro = !hasWood && !data.from && !this.registry.get('woodQuestIntroPlayed');
        if (isFirstIntro) {
            startX = 650;
        }

        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);
        if (!isFirstIntro) {
            this.cameras.main.startFollow(this.player, false, 0.045, 0.025);
            this.cameras.main.setDeadzone(80, 40);
            this.cameras.main._isFollowing = true;
        }

        // Rachael di Kursi Goyang (Teras Depan Rumah)
        const isRachaelHealed = !!this.registry.get('rachaelHealed');
        const rachaelY = isRachaelHealed ? 406 : 418;
        this.rachael = this.physics.add.staticSprite(320, rachaelY, 'npc_rachael').setDepth(5).setScale(0.28);
        this.rachael.setOrigin(0.5, 1);
        this.rachael.refreshBody();
        if (!isRachaelHealed && this.anims.exists('rachael_idle')) {
            this.rachael.anims.play('rachael_idle', true);
        } else if (isRachaelHealed) {
            this.rachael.setFrame(0);
        }
        this.rachael.type = 'npc';
        this.rachael.dialogue = [
            { speaker: 'Rachael', text: '(Suara bergetar lemah) Kak Aksel... hati-hatilah di jalan... jangan memaksakan dirimu...' },
            { speaker: 'Aksel', text: 'Tenanglah Rachael, bertahanlah demi kakak dan Nenek. Aku pasti kembali membawa obat!' }
        ];

        // Nenek di Teras Depan Rumah
        this.grandma = this.physics.add.staticSprite(395, 418, 'npc_grandma_home').setDepth(5).setScale(0.21);
        this.grandma.setOrigin(0.5, 1);
        this.grandma.refreshBody();
        this.grandma.type = 'npc';

        // Tumpukan Kayu Bakar di Samping Teras (muncul setelah diambil dari Danau)
        this.firewoodStack = this.add.image(235, 412, 'special_firewood').setDepth(4).setScale(1.2);
        this.firewoodStack.setVisible(hasWood);

        this.itemsGroup = this.physics.add.staticGroup();

        // Pisau Belati di Meja Teras (muncul setelah adegan batuk darah / bawa kayu bakar)
        if (!hasCure && hasWood) {
            const hasDagger = inv.some(i => i.id === 'Pisau Belati');
            if (!hasDagger) {
                this.dagger = this.itemsGroup.create(500, 405, 'belati_pixel');
                this.dagger.setDisplaySize(11, 38);
                this.dagger.setAngle(-12);
                this.dagger.type = 'item';
                this.dagger.itemId = 'Pisau Belati';
                this.dagger.itemDesc = 'Senjata belati peninggalan keluarga untuk perlindungan di perjalanan.';
                this.dagger.setDepth(5);

                this.tweens.add({
                    targets: this.dagger,
                    y: 401,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Teks Petunjuk Arah Kiri & Kanan (HD HTML Overlay Navigasi Map)
        this.leftExitText = this.createLeftNavHint('◀ Ke Hutan Danau & Kaki Gunung\n(Cari Kayu Bakar)', !hasWood);
        this.rightExitText = this.createRightNavHint('Ke Pinggir Hutan ➔\n(Jalan ke Kanan)', hasWood && !hasCure);

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
        if (isFirstIntro) {
            this.registry.set('woodQuestIntroPlayed', true);
            this.triggerIntroCutscene();
        }

        // 2. Prolog Bagian 2: Aksel Pulang Membawa Kayu Bakar -> Rachael Batuk Darah
        if (hasWood && data && data.from === 'LakeForestScene' && !this.registry.get('coughCutscenePlayed')) {
            this.registry.set('coughCutscenePlayed', true);
            this.registry.set('prologueIntroPlayed', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Nenek Linda, Rachael, aku sudah pulang! 4 ikat kayu bakar dari tepi danau dan kaki gunung sudah kutaruh di teras...' },
                    { speaker: 'Rachael', text: '(Duduk lemas di kursi goyang, tiba-tiba terbatuk hebat) Uhukk... uhukk!! Khh-...' },
                    { speaker: 'Narator', text: '(Setitik darah segar menetes di telapak tangan Rachael... Wajahnya semakin pucat pasi, nafasnya tercekat lemas.)' },
                    { speaker: 'Aksel', text: '(Panik berlari mendekat) Rachael! Bertahanlah! Rachael, kau baik-baik saja?!' },
                    { speaker: 'Nenek Linda', text: '(Tergopoh-gopoh mendekat cemas) Astaga, Rachael cucuku! Rachael... apa yang terasa sakit, Nak?!' },
                    { speaker: 'Rachael', text: '(Suara parau dan sangat pelan) Kak Aksel... Nenek Linda... tubuhku rasanya semakin lemas... dadaku sesak sekali...' },
                    { speaker: 'Aksel', text: 'Rachael, aku akan pergi ke kota untuk mencarikanmu obat!' },
                    { speaker: 'Nenek Linda', text: 'Aksel.. jangan pergi, aku tahu niatmu ingin menyelamatkan adikmu ta tapi... jarak ke kota sangat jauh, kau akan kehabisan uang sebelum sampai sana.' },
                    { speaker: 'Aksel', text: 'Nenek Linda.. aku tahu kau mengkhawatirkanku tapi aku janji aku akan segera kembali. Tolong jaga Rachael ya.' },
                    { speaker: 'Nenek Linda', text: 'Baiklah, nenek akan menyiapkan bekal untukmu.' },
                    { speaker: 'Aksel', text: 'Terima kasih Nenek Linda!' }
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
                        this.dagger = this.itemsGroup.create(500, 405, 'belati_pixel');
                        this.dagger.setDisplaySize(11, 38);
                        this.dagger.setAngle(-12);
                        this.dagger.type = 'item';
                        this.dagger.itemId = 'Pisau Belati';
                        this.dagger.itemDesc = 'Senjata belati peninggalan keluarga untuk perlindungan di perjalanan.';
                        this.dagger.setDepth(5);

                        this.tweens.add({
                            targets: this.dagger,
                            y: 401,
                            duration: 1200,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
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

    triggerIntroCutscene() {
        this.isIntroCutsceneRunning = true;
        this.isTalking = true;

        if (this.promptText) this.promptText.setVisible(false);

        // 1. Cinematic Letterbox Bars
        const topBar = this.add.rectangle(0, -60, 1600, 60, 0x000000).setOrigin(0, 0).setDepth(200).setScrollFactor(0);
        const bottomBar = this.add.rectangle(0, 450, 1600, 60, 0x000000).setOrigin(0, 0).setDepth(200).setScrollFactor(0);
        this.tweens.add({ targets: topBar, y: 0, duration: 900, ease: 'Cubic.easeOut' });
        this.tweens.add({ targets: bottomBar, y: 395, duration: 900, ease: 'Cubic.easeOut' });

        // 2. Camera sweeps from high sky down to terrace
        this.cameras.main.stopFollow();
        this.cameras.main.centerOn(600, 180);
        this.cameras.main.setZoom(0.95);

        // 3. Player auto-walks towards Nenek & Rachael
        if (this.player) {
            this.player.setFlipX(true);
            if (this.anims.exists('player_walk')) {
                this.player.anims.play('player_walk', true);
            }
            this.tweens.add({
                targets: this.player,
                x: 485,
                duration: 2200,
                ease: 'Linear',
                onComplete: () => {
                    if (this.player) {
                        this.player.setVelocity(0, 0);
                        if (this.anims.exists('player_idle')) {
                            this.player.anims.play('player_idle', true);
                        } else {
                            this.player.setFrame(0);
                        }
                    }
                }
            });
        }

        // Camera smoothly glides down over 2400ms
        this.cameras.main.pan(430, 360, 2400, 'Cubic.easeInOut');
        this.cameras.main.zoomTo(1.15, 2400, 'Cubic.easeInOut');

        // 4. Start dialogue after camera glide and auto-walk
        this.time.delayedCall(2500, () => {
            this.startDialogue([
                { speaker: 'Nenek Linda', text: 'Aksel, hari sudah mulai sore dan udara malam nanti akan sangat dingin...' },
                { speaker: 'Nenek Linda', text: 'Maukah kau tolong carikan 4 ikat kayu bakar kering di tepi Hutan Danau dan Ujung Danau Kaki Gunung sebelah barat [◀]? Perapian kita sudah hampir habis.' },
                { speaker: 'Aksel', text: 'Tentu Nenek Linda! Aku akan segera pergi ke Hutan Danau dan Ujung Danau Kaki Gunung di sebelah barat dan segera kembali membawa kayu bakar.' },
                { speaker: 'Nenek Linda', text: 'Terima kasih, Aksel. Hati-hati di jalan ya, jangan pulang terlalu larut. Rachael sedang istirahat di kursi goyang.' },
                { speaker: 'Rachael', text: '(Tersenyum lembut dari kursi goyang) Hati-hati di jalan ya, Kak Aksel... jangan sampai kedinginan.' }
            ], () => {
                // Retract letterbox bars
                this.tweens.add({
                    targets: topBar,
                    y: -60,
                    duration: 600,
                    ease: 'Cubic.easeIn',
                    onComplete: () => topBar.destroy()
                });
                this.tweens.add({
                    targets: bottomBar,
                    y: 450,
                    duration: 600,
                    ease: 'Cubic.easeIn',
                    onComplete: () => bottomBar.destroy()
                });

                // Return camera to normal player follow
                const defaultZoom = this.currentZoom || 0.85;
                this.cameras.main.zoomTo(defaultZoom, 800, 'Sine.easeInOut');
                this.cameras.main.startFollow(this.player, false, 0.045, 0.025);
                this.cameras.main.setDeadzone(80, 40);
                this.cameras.main._isFollowing = true;

                this.isIntroCutsceneRunning = false;
                this.isTalking = false;

                setQuestState(this.registry, {
                    chapter: 'PROLOG',
                    title: 'Mencari Kayu Bakar di Hutan Danau',
                    objective: 'Jalan ke arah barat [◀] melintasi Hutan Danau hingga Ujung Danau Kaki Gunung untuk mencari 4 kayu bakar suruhan Nenek.',
                    questNumber: 0
                });
                this.updateQuestHUD();

                this.showToastNotice('🚶 Gunakan tombol [A][D] atau Panah untuk melangkah ke Barat [◀]!');
            });
        });
    }

    triggerEndingCutscene() {
        if (this.isEndingTriggered) return;
        this.isEndingTriggered = true;
        this.isTalking = true;

        if (this.promptText) this.promptText.setVisible(false);
        this.nearTarget = null;

        // 1. Cinematic Letterbox Bars
        const topBar = this.add.rectangle(0, -60, 1600, 60, 0x000000).setOrigin(0, 0).setDepth(200).setScrollFactor(0);
        const bottomBar = this.add.rectangle(0, 450, 1600, 60, 0x000000).setOrigin(0, 0).setDepth(200).setScrollFactor(0);
        this.tweens.add({ targets: topBar, y: 0, duration: 800, ease: 'Cubic.easeOut' });
        this.tweens.add({ targets: bottomBar, y: 395, duration: 800, ease: 'Cubic.easeOut' });
        this.letterboxBars = [topBar, bottomBar];

        // 2. Camera Director: Stop follow, smooth pan & zoom to the family
        this.cameras.main.stopFollow();
        this.cameras.main.pan(330, 370, 1500, 'Sine.easeInOut');
        this.cameras.main.zoomTo(1.35, 1500, 'Sine.easeInOut');

        // 3. Player auto-walks to front of Rachael
        if (this.player) {
            this.player.setVelocity(0, 0);
            this.player.setTexture('player_human');
            this.tweens.add({
                targets: this.player,
                x: 275,
                duration: 1200,
                ease: 'Power1',
                onComplete: () => {
                    if (this.player) this.player.setFlipX(false);
                }
            });
        }

        // 4. Hook for step-by-step cinematic events during dialogue
        let floatingVial = null;

        this.onDialogueLine = (index, currentData) => {
            // Line 4: Aksel reveals the glowing Ramuan Kesembuhan Asli
            if (index === 4 && !floatingVial) {
                floatingVial = this.add.container(298, 370).setDepth(10);
                const bottleGlow = this.add.circle(0, 0, 16, 0xfde047, 0.6);
                const bottleG = this.add.graphics();
                bottleG.fillStyle(0xfbbf24, 0.95);
                bottleG.fillRoundedRect(-6, -10, 12, 18, 3);
                bottleG.fillStyle(0x78350f, 1);
                bottleG.fillRect(-3, -14, 6, 4);
                floatingVial.add([bottleGlow, bottleG]);

                this.tweens.add({
                    targets: floatingVial,
                    y: floatingVial.y - 8,
                    duration: 900,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // Line 6: Rachael drinks the potion
            if (index === 6 && floatingVial) {
                GameAudio.playCollect();
                this.tweens.add({
                    targets: floatingVial,
                    alpha: 0,
                    scale: 0,
                    duration: 500,
                    onComplete: () => {
                        floatingVial.destroy();
                        floatingVial = null;
                    }
                });
                this.createHealingAuraBurst(320, 380);
            }

            // Line 7: Miracle healing golden warmth
            if (index === 7) {
                this.cameras.main.flash(1100, 255, 255, 210);
                this.createHealingAuraBurst(320, 380);

                if (this.rachael) {
                    if (this.anims.exists('rachael_idle')) {
                        this.rachael.anims.stop();
                    }
                    this.rachael.setFrame(0);
                    // Rachael rises from the rocking chair
                    this.tweens.add({
                        targets: this.rachael,
                        y: 406,
                        scaleX: 0.30,
                        scaleY: 0.30,
                        duration: 800,
                        ease: 'Back.easeOut'
                    });
                }
            }

            // Line 8: Rachael embraces Aksel
            if (index === 8) {
                this.spawnHugHearts(295, 365);
                if (this.rachael) {
                    this.tweens.add({
                        targets: this.rachael,
                        x: 295,
                        duration: 700,
                        ease: 'Sine.easeOut'
                    });
                }
            }

            // Line 9: Nenek joins the warm hug
            if (index === 9 && this.grandma) {
                this.tweens.add({
                    targets: this.grandma,
                    x: 345,
                    duration: 800,
                    ease: 'Sine.easeOut'
                });
            }
        };

        // 5. Start emotional cutscene dialogue
        this.time.delayedCall(700, () => {
            this.startDialogue([
                { speaker: 'Rachael', text: '(Air mata menetes, suara bergetar lemah) Abang... kau sudah kembali... Aku menunggumu, Abang... Aku takut kau tidak kembali...' },
                { speaker: 'Aksel', text: '(Berlari mendekat dan memeluk Rachael erat) Rachael... Maafkan aku membuatmu menunggu begitu lama. Aku sudah berjanji, kan? Aku tidak akan pernah meninggalkanmu!' },
                { speaker: 'Rachael', text: '(Menatap wajah abangnya yang tampak begitu lelah dan penuh luka kecil) Nafasmu terengah-engah... pakaianmu kotor dan robek... Abang, apa yang terjadi di luar sana? Kau pergi ke mana saja demi aku...?' },
                { speaker: 'Aksel', text: '(Tersenyum hangat menahan haru, menyembunyikan semua penderitaan kutukannya) Tidak ada apa-apa, Dik. Hanya sedikit perjalanan panjang di desa... Orang-orang baik di desa membantuku mendapatkan obat ini.' },
                { speaker: 'Aksel', text: 'Lihat, ini [Ramuan Kesembuhan Asli] dari Madam Joanne untukmu. Minumlah sekarang, Rachael... Semua rasa sakit ini akan segera berakhir.' },
                { speaker: 'Rachael', text: '(Menerima botol ramuan magis yang berkilau keemasan) Botol ini... terasa sangat hangat di tanganku...' },
                { speaker: 'Rachael', text: '(Meminum ramuan magis perlahan) ... *Glek... Glek...*' },
                { speaker: 'Rachael', portrait: 'portrait_rachael_sembuh', text: '✨ (Cahaya keemasan menyelimuti tubuhnya, rona merah segar kembali ke pipinya) K-kehangatan ini... Rasa lemas dan nyeri di dadaku... semuanya hilang, Abang?!' },
                { speaker: 'Rachael', portrait: 'portrait_rachael_sembuh', text: '(Perlahan bangkit berdiri dari kursi goyang, menangis bahagia sambil memeluk Aksel) Abang! Kakiku tidak gemetar lagi! Aku bisa berdiri tegak! Aku sembuh, Abang... Aku sembuh total!!' },
                { speaker: 'Nenek Linda', text: '(Menangis haru memeluk Aksel dan Rachael) Syukurlah ya Tuhan... Rachael cucuku sembuh! Aksel, kau cucu yang paling berani dan berbakti... Nenek bangga sekali padamu, Nak!' },
                { speaker: 'Aksel (Dalam Hati)', text: '(Mengepalkan tangan dengan air mata kelegaan) Semua penderitaan menjadi Goblin, cemoohan, dan kerja keras tanpa henti itu... semuanya terbayar lunas. Rachael... adikku terselamatkan.' },
                { speaker: 'Aksel', text: 'Mulai hari ini, kita akan hidup bahagia bersama, Rachael, Nenek Linda. Dan abang berjanji, abang akan selalu menjaga keluarga kita dengan jalan yang jujur dan benar!' }
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

                // Fade out to EndingScene (Epilogue & Credits Roll)
                this.cameras.main.fadeOut(2000, 9, 13, 22);
                this.time.delayedCall(2200, () => {
                    if (this.letterboxBars) {
                        this.letterboxBars.forEach(b => b.destroy());
                        this.letterboxBars = null;
                    }
                    this.scene.start('EndingScene');
                });
            });
        });
    }

    createHealingAuraBurst(x, y) {
        for (let r = 0; r < 3; r++) {
            const ring = this.add.circle(x, y, 12, 0xfde047, 0.85).setDepth(8);
            this.tweens.add({
                targets: ring,
                scale: 4.8 + r * 1.6,
                alpha: 0,
                duration: 1100 + r * 280,
                delay: r * 200,
                ease: 'Cubic.easeOut',
                onComplete: () => ring.destroy()
            });
        }

        const colors = [0xfef08a, 0xfbbf24, 0xf59e0b, 0x34d399, 0xffffff];
        for (let p = 0; p < 36; p++) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(45, 140);
            const col = Phaser.Utils.Array.GetRandom(colors);
            const sparkle = this.add.circle(x, y, Phaser.Math.Between(2, 5), col, 1).setDepth(9);

            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed - 25,
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(900, 1600),
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
    }

    spawnHugHearts(x, y) {
        for (let h = 0; h < 9; h++) {
            const heart = this.add.text(
                x + Phaser.Math.Between(-25, 25),
                y + Phaser.Math.Between(-10, 10),
                '❤️',
                { fontSize: `${Phaser.Math.Between(15, 24)}px` }
            ).setOrigin(0.5).setDepth(12);

            this.tweens.add({
                targets: heart,
                y: heart.y - Phaser.Math.Between(40, 75),
                x: heart.x + Phaser.Math.Between(-20, 20),
                alpha: 0,
                scale: { from: 0.6, to: 1.35 },
                duration: Phaser.Math.Between(1200, 1800),
                delay: h * 140,
                ease: 'Sine.easeOut',
                onComplete: () => heart.destroy()
            });
        }
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
        // =========================================================================
        // TRUE MULTI-LAYER CINEMATIC PARALLAX
        // =========================================================================
        // Layer 0: Far Sky & Majestic Mountain Peaks (Slowest scroll: 0.08)
        this.bgSky = this.add.image(600, 215, 'home_parallax_sky')
            .setDisplaySize(1600, 460)
            .setDepth(0)
            .setScrollFactor(0.08, 1);

        // Layer 1: Midground Rolling Pine Forests & Misty Lake (Medium scroll: 0.25)
        this.bgMid = this.add.image(600, 215, 'home_parallax_mid')
            .setDisplaySize(1600, 460)
            .setDepth(1)
            .setScrollFactor(0.25, 1);

        // Layer 2: Foreground Framing Trees & Ancient Oaks (Close scroll: 0.50)
        this.bgTrees = this.add.image(600, 215, 'home_parallax_trees')
            .setDisplaySize(1600, 460)
            .setDepth(1.8)
            .setScrollFactor(0.50, 1);

        // Soft Drifting Twilight Mist over the Distant Lake (ScrollFactor: 0.28)
        for (let i = 0; i < 4; i++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(150, 1050),
                Phaser.Math.Between(260, 360),
                Phaser.Math.Between(220, 380),
                Phaser.Math.Between(20, 35),
                0xdbeafe,
                0.08
            ).setDepth(1.2).setScrollFactor(0.28, 1);

            this.tweens.add({
                targets: mist,
                x: mist.x + Phaser.Math.Between(-40, 40),
                alpha: { from: 0.05, to: 0.12 },
                duration: Phaser.Math.Between(5000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // =========================================================================
        // FOREGROUND GAMEPLAY LAYER: COTTAGE, GROUND, FENCES, PROPS (ScrollFactor: 1.0)
        // =========================================================================
        const bgG = this.add.graphics().setDepth(2);

        // Ground / Terrain Sprites (tanah_home) tiling seamlessly across wide world [-400, 1600]
        for (let gx = -400; gx <= 1600; gx += 385) {
            const groundSprite = this.add.image(gx, 418, 'tanah_home').setDepth(2);
            groundSprite.setOrigin(0, 117 / 250);
            groundSprite.setScale(386 / 770);
        }

        // The Cottage House (shifted right to x: 290 to give left yard breathing room)
        const houseSprite = this.add.image(290, 418, 'building_rumah').setDepth(2);
        houseSprite.setOrigin(0.5, 1);
        const houseScale = 340 / houseSprite.width;
        houseSprite.setScale(houseScale);

        // Chimney Smoke Puffs
        const smokeX = 290 - (houseSprite.displayWidth / 2) + (60 * houseScale);
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

        // Warm Window Glow
        bgG.fillStyle(0xfbbf24, 0.08);
        bgG.beginPath();
        bgG.moveTo(180, 310); bgG.lineTo(260, 310); bgG.lineTo(285, 418); bgG.lineTo(155, 418);
        bgG.closePath();
        bgG.fillPath();

        // Hanging Porch Lantern Glow
        const lanternGlow = this.add.circle(397, 350, 28, 0xfbbf24, 0.18).setDepth(2);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.12, to: 0.28 },
            scale: { from: 0.92, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rustic wooden trail signpost in the left garden pointing to Lake Forest
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(58, 380, 5, 38);
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(38, 374, 46, 15);
        this.add.text(61, 381, '◀ Danau', {
            fontSize: '8px',
            fill: '#fef08a',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        // Winding Stone Pathway (spanning from left path x: 50 to eastern gate x: 1145)
        const stones = [
            { x: 50, y: 421, rx: 12, ry: 4 },
            { x: 95, y: 423, rx: 14, ry: 5 },
            { x: 500, y: 420, rx: 14, ry: 4 },
            { x: 545, y: 423, rx: 16, ry: 5 },
            { x: 595, y: 421, rx: 15, ry: 4 },
            { x: 650, y: 423, rx: 17, ry: 5 },
            { x: 705, y: 421, rx: 16, ry: 4 },
            { x: 760, y: 423, rx: 17, ry: 5 },
            { x: 815, y: 421, rx: 18, ry: 5 },
            { x: 870, y: 423, rx: 16, ry: 5 },
            { x: 925, y: 421, rx: 17, ry: 4 },
            { x: 980, y: 423, rx: 18, ry: 5 },
            { x: 1035, y: 421, rx: 16, ry: 4 },
            { x: 1090, y: 423, rx: 17, ry: 5 },
            { x: 1145, y: 422, rx: 18, ry: 5 }
        ];
        stones.forEach(st => {
            bgG.fillStyle(0x334155, 1);
            bgG.fillEllipse(st.x, st.y + 1, st.rx, st.ry);
            bgG.fillStyle(0x64748b, 1);
            bgG.fillEllipse(st.x, st.y, st.rx, st.ry);
            bgG.fillStyle(0x94a3b8, 0.7);
            bgG.fillEllipse(st.x - 2, st.y - 1, st.rx * 0.6, st.ry * 0.5);
        });

        // Rustic Wooden Picket Fence (spanning from x: 615 to 1075)
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(615, 385, 460, 3);
        bgG.fillRect(615, 400, 460, 3);

        for (let fx = 620; fx < 1075; fx += 16) {
            bgG.fillStyle(0x854d0e, 1);
            bgG.fillRect(fx, 375, 8, 38);
            bgG.fillTriangle(fx, 375, fx + 4, 368, fx + 8, 375);
            bgG.fillStyle(0xa16207, 0.6);
            bgG.fillRect(fx + 1, 375, 2, 38);
        }

        // Garden Arch / Gate Posts (x: 1075)
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(1075, 345, 10, 73);
        bgG.fillRect(1116, 345, 10, 73);
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(1071, 345, 58, 6);
        bgG.fillStyle(0x16a34a, 0.9);
        bgG.fillCircle(1076, 355, 6);
        bgG.fillCircle(1083, 350, 5);
        bgG.fillCircle(1106, 350, 5);
        bgG.fillCircle(1115, 358, 6);

        // Front Yard Trees
        const trees = [
            { x: 1155, y: 160, w: 32, h: 258, foliageX: 1135 }
        ];
        trees.forEach(t => {
            bgG.fillStyle(0x3e1d08, 1);
            bgG.fillRect(t.x, t.y, t.w, t.h);
            bgG.fillStyle(0x5c2b0e, 0.7);
            bgG.fillRect(t.x + 3, t.y, 4, t.h);
            bgG.fillStyle(0x3e1d08, 1);
            bgG.fillTriangle(t.x, t.y + 50, t.x - 47, t.y + 20, t.x, t.y + 40);
            bgG.fillTriangle(t.x, t.y + 100, t.x - 57, t.y + 80, t.x, t.y + 90);

            const leaves = [
                { x: t.foliageX, y: t.y - 10, r: 42, color: 0x14532d },
                { x: t.foliageX - 30, y: t.y + 20, r: 35, color: 0x166534 },
                { x: t.foliageX + 40, y: t.y - 40, r: 55, color: 0x15803d },
                { x: t.foliageX - 40, y: t.y + 70, r: 28, color: 0x16a34a },
                { x: t.foliageX + 20, y: t.y + 10, r: 45, color: 0x15803d }
            ];
            leaves.forEach(lf => {
                bgG.fillStyle(lf.color, 0.95);
                bgG.fillCircle(lf.x, lf.y, lf.r);
            });
        });

        // Bushes & Wildflowers across the 1200px terrain
        const bushes = [
            { x: 45, y: 413, r: 14, c: 0x15803d },
            { x: 85, y: 414, r: 12, c: 0x16a34a },
            { x: 575, y: 412, r: 16, c: 0x15803d },
            { x: 610, y: 414, r: 13, c: 0x16a34a },
            { x: 715, y: 413, r: 15, c: 0x15803d },
            { x: 805, y: 414, r: 14, c: 0x166534 },
            { x: 910, y: 412, r: 16, c: 0x15803d },
            { x: 995, y: 413, r: 15, c: 0x16a34a },
            { x: 1060, y: 414, r: 14, c: 0x15803d }
        ];
        bushes.forEach(b => {
            bgG.fillStyle(b.c, 0.95);
            bgG.fillCircle(b.x, b.y, b.r);
            bgG.fillCircle(b.x - b.r * 0.4, b.y + 2, b.r * 0.7);
            bgG.fillCircle(b.x + b.r * 0.4, b.y + 2, b.r * 0.7);
        });

        const yardFlowers = [
            { x: 35, y: 415, c: 0xfde047 },
            { x: 75, y: 416, c: 0xffffff },
            { x: 515, y: 415, c: 0xfde047 },
            { x: 560, y: 416, c: 0xffffff },
            { x: 645, y: 414, c: 0xf43f5e },
            { x: 695, y: 416, c: 0xfde047 },
            { x: 770, y: 415, c: 0x60a5fa },
            { x: 830, y: 416, c: 0xffffff },
            { x: 920, y: 415, c: 0xfde047 },
            { x: 980, y: 416, c: 0xf43f5e },
            { x: 1045, y: 415, c: 0x60a5fa }
        ];
        yardFlowers.forEach(fl => {
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillRect(fl.x, fl.y, 2, 5);
            bgG.fillStyle(fl.c, 1);
            bgG.fillCircle(fl.x + 1, fl.y - 1, 2.5);
            bgG.fillStyle(0xf59e0b, 1);
            bgG.fillCircle(fl.x + 1, fl.y - 1, 1);
        });


        // Fireflies drifting in the twilight
        for (let i = 0; i < 24; i++) {
            const fx = Phaser.Math.Between(50, 1160);
            const fy = Phaser.Math.Between(180, 410);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(1.5, 2.5), 0xfde047, 0.75).setDepth(3);

            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-35, 35),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.9 },
                scale: { from: 0.7, to: 1.3 },
                duration: Phaser.Math.Between(1800, 3200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 1000)
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
                    { speaker: 'Nenek Linda', text: 'Aksel, pergilah ke arah barat [◀] melintasi Hutan Danau & Ujung Danau Kaki Gunung untuk mencari 4 ikat kayu bakar ya, Nak.' }
                ];
            } else {
                const hasDagger = inv.some(i => i.id === 'Pisau Belati');
                grandmaDialogue = hasDagger ? [
                    { speaker: 'Nenek Linda', text: 'Hati-hati di jalan ya cucuku tersayang... Bawakan obat penawar untuk adikmu dan kembalilah dengan selamat. Doa Nenek selalu menyertaimu.' }
                ] : [
                    { speaker: 'Nenek Linda', text: 'Aksel, jangan lupa bawa sebilah [Pisau Belati] di atas meja teras untuk melindungimu di perjalanan.' }
                ];
            }
            found = { type: 'npc', dialogue: grandmaDialogue, x: this.grandma.x, y: this.grandma.y - 35, prompt: 'Tekan [E] Bicara dengan Nenek Linda' };
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

        this.itemsGroup.getChildren().forEach((item) => {
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

        if (this.isEndingTriggered || this.isIntroCutsceneRunning) {
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
            maxX: 1170,
            onExitRight: () => {
                if (hasCure) return;
                if (!hasWood) {
                    this.showMapLockedNotice('Cari 4 kayu bakar di Hutan Danau dan Ujung Danau Kaki Gunung sebelah barat [◀] terlebih dahulu!');
                    this.player.setX(1120);
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
                        direction: 'right',
                        pushBackX: 1120
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
