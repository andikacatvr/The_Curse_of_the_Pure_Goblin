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
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 450, 'tanah_witch').setDepth(2);
        groundSprite.setOrigin(0, 1);
        groundSprite.setScale(800 / 770, 0.55);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';

        let startX = 60;
        if (data && data.from === 'WitchCottageScene') {
            startX = 475;
        } else if (data && data.from === 'EastForestScene') {
            startX = 710;
        } else if (data && (data.from === 'WaterfallGorgeScene' || data.from === 'ForestTrailScene')) {
            startX = 60;
        } else if (qState.chapter !== 'PROLOG') {
            startX = 475;
        }

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Pintu Utama Rumah Penyihir (berada di tengah teras depan pada gambar X: 475, Y: 380)
        this.door = this.physics.add.staticSprite(475, 380, 'witch_door').setDepth(4);
        this.door.setAlpha(0);

        // Magic Door Glow / Entrance Indicator
        this.doorGlow = this.add.circle(475, 380, 22, 0xa855f7, 0.35).setDepth(3);
        this.tweens.add({
            targets: this.doorGlow,
            alpha: { from: 0.15, to: 0.55 },
            scale: { from: 0.85, to: 1.25 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        const doorSpark = this.add.circle(475, 380, 4.5, 0xfde047, 0.75).setDepth(3);
        this.tweens.add({
            targets: doorSpark,
            alpha: { from: 0.3, to: 0.95 },
            scale: { from: 0.7, to: 1.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

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
            // Monster menghadang di halaman depan (X: 360) sebelum pemain bisa mencapai pintu utama di X: 475
            this.monster = this.physics.add.sprite(360, 368, 'monster_shadow').setDepth(5);
            this.monster.setScale(0.18); // 90 x 90 px, ukuran proporsional mengintimidasi
            this.monster.body.setSize(380, 420);
            this.monster.body.setOffset(60, 60);
            this.monster.setCollideWorldBounds(true);
            this.physics.add.collider(this.monster, this.platforms);

            // Menacing subtle breathing/floating animation
            this.tweens.add({
                targets: this.monster,
                scaleY: { from: 0.18, to: 0.188 },
                scaleX: { from: 0.18, to: 0.174 },
                duration: 1100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.hpText = this.add.text(360, 305, '❤️ MONSTER HP: 3/3', {
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
        if (dist < 85) {
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
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y) < 90) {
                this.promptText.setPosition(this.monster.x, this.monster.y - 50).setText('Tekan [F] / [SPACE] Tebas Pisau!').setVisible(true);
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

    createWitchYardAtmosphere() {
        // 1. PANORAMIC WITCH COTTAGE VALLEY BACKGROUND (latarbelakangrumahpenyihir.jpg)
        this.add.image(400, 225, 'witch_yard_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Subtle mystical night tint & gentle floating magical stars
        const mistG = this.add.graphics().setDepth(0);
        mistG.fillStyle(0x3b0764, 0.12);
        mistG.fillRect(0, 0, 800, 450);

        for (let i = 0; i < 20; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 150);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.2, 0.7)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.1, to: 0.8 },
                scale: { from: 0.8, to: 1.2 },
                duration: Phaser.Math.Between(1800, 3800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 5. The Witch Cottage Pixel Art Mansion Asset (Depth: 1)
        const cottageBg = this.add.image(0, 0, 'witch_yard_house').setOrigin(0, 0);
        cottageBg.setDisplaySize(800, 450);
        cottageBg.setDepth(1);

        // 6. Yard Scenery Graphics (Depth: 2 & 3)
        const yardG = this.add.graphics().setDepth(2);

        // --- B. SPOOKY CROOKED GOTHIC FENCE & GATE (x: 10 to 240) ---
        // Crossbars
        yardG.fillStyle(0x231435, 0.95);
        yardG.fillRect(10, 375, 230, 5);
        yardG.fillRect(10, 395, 230, 5);

        // Pickers with spiked tips
        for (let fx = 15; fx <= 235; fx += 20) {
            const h = 48 + ((fx * 7) % 15);
            yardG.fillStyle(0x2d1b40, 1);
            yardG.fillRect(fx, 418 - h, 6, h);
            yardG.fillTriangle(fx - 2, 418 - h, fx + 3, 418 - h - 8, fx + 8, 418 - h);
        }

        // Open Broken Gate Post at x: 245
        yardG.fillStyle(0x1a0f28, 1);
        yardG.fillRect(242, 355, 10, 63);
        yardG.fillStyle(0x35194d, 1);
        yardG.fillRect(240, 350, 14, 6);

        // --- C. ANCIENT MOSS-COVERED RUNESTONE (x: 95, y: 418) ---
        yardG.fillStyle(0x332644, 1);
        yardG.fillRoundedRect(90, 372, 22, 46, 6);
        yardG.fillStyle(0x4a3b5e, 0.8);
        yardG.fillRoundedRect(92, 374, 18, 20, 4);

        // Glowing runes carved into the stone
        const runeGlow = this.add.text(101, 388, 'ᛟ', {
            fontSize: '15px', fontStyle: 'bold', fill: '#c084fc'
        }).setOrigin(0.5).setDepth(3);
        this.tweens.add({
            targets: runeGlow,
            alpha: { from: 0.3, to: 0.95 },
            scale: { from: 0.9, to: 1.15 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- D. HANGING POST LANTERN ON FENCE (x: 35, y: 350) ---
        yardG.fillStyle(0x1a0f28, 1);
        yardG.fillRect(32, 355, 6, 63);
        yardG.fillRect(32, 355, 20, 4);
        yardG.fillRect(50, 355, 2, 8);
        // Lantern box
        yardG.fillStyle(0x130a1c, 1);
        yardG.fillRect(46, 363, 10, 14);
        yardG.fillStyle(0xfef08a, 0.95);
        yardG.fillRect(48, 365, 6, 10);
        // Warm lantern light halo
        const lanternHalo = this.add.circle(51, 370, 24, 0xf59e0b, 0.22).setDepth(3);
        this.tweens.add({
            targets: lanternHalo,
            alpha: { from: 0.12, to: 0.3 },
            scale: { from: 0.85, to: 1.18 },
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- E. ANIMATED BUBBLING WITCH CAULDRON (x: 165, y: 402) ---
        // Fire pit stones & green embers beneath
        yardG.fillStyle(0x1c1917, 1);
        yardG.fillCircle(155, 416, 6);
        yardG.fillCircle(165, 417, 7);
        yardG.fillCircle(176, 416, 6);
        yardG.fillStyle(0x22c55e, 0.6);
        yardG.fillCircle(165, 415, 8);

        // Heavy Black Iron Cauldron Pot
        yardG.fillStyle(0x181024, 1);
        yardG.fillCircle(165, 398, 18);
        yardG.fillRect(147, 385, 36, 10);
        yardG.fillStyle(0x281938, 1);
        yardG.fillRoundedRect(144, 382, 42, 6, 3);

        // Boiling green potion surface
        yardG.fillStyle(0x22c55e, 0.9);
        yardG.fillEllipse(165, 384, 32, 6);

        // Cauldron bubbling glow aura
        const cauldronGlow = this.add.circle(165, 386, 28, 0x22c55e, 0.25).setDepth(3);
        this.tweens.add({
            targets: cauldronGlow,
            alpha: { from: 0.15, to: 0.4 },
            scale: { from: 0.85, to: 1.2 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rising potion bubbles & steam puffs
        for (let i = 0; i < 6; i++) {
            const bx = Phaser.Math.Between(154, 176);
            const bubble = this.add.circle(bx, 384, Phaser.Math.Between(2, 4), 0x86efac, 0.8).setDepth(3);
            this.tweens.add({
                targets: bubble,
                y: 384 - Phaser.Math.Between(25, 55),
                x: bx + Phaser.Math.Between(-12, 12),
                alpha: { from: 0.9, to: 0 },
                scale: { from: 1, to: 1.8 },
                duration: Phaser.Math.Between(1200, 2200),
                delay: i * 350,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // --- F. THORNY BRAMBLES & OVERGROWN WITCH WEEDS (x: 10 to 450) ---
        yardG.fillStyle(0x28103c, 0.95);
        for (let gx = 10; gx < 460; gx += 18) {
            const gh = 10 + ((gx * 3) % 14);
            yardG.fillTriangle(gx, 418, gx + 3, 418 - gh, gx + 7, 418);
            yardG.fillTriangle(gx + 6, 418, gx + 10, 418 - gh * 0.7, gx + 13, 418);
        }

        // 7. CREEPING LOW GROUND FOG / MIST (Depth: 3)
        // Multi-layered dense mist rolling across the yard
        const mistLayers = [
            { x: 100, y: 405, w: 260, h: 30, alpha: 0.25, color: 0x581c87, dur: 7000, dx: 50 },
            { x: 300, y: 412, w: 320, h: 34, alpha: 0.28, color: 0x3b0764, dur: 8500, dx: -60 },
            { x: 520, y: 408, w: 300, h: 32, alpha: 0.22, color: 0x6b21a8, dur: 9000, dx: 45 },
            { x: 200, y: 385, w: 280, h: 26, alpha: 0.20, color: 0x7e22ce, dur: 7600, dx: -45 },
            { x: 680, y: 410, w: 240, h: 28, alpha: 0.22, color: 0x581c87, dur: 8200, dx: 35 },
            { x: 140, y: 350, w: 220, h: 22, alpha: 0.14, color: 0x9333ea, dur: 8800, dx: 40 }
        ];

        mistLayers.forEach(m => {
            const mist = this.add.ellipse(m.x, m.y, m.w, m.h, m.color, m.alpha).setDepth(3);
            this.tweens.add({
                targets: mist,
                x: m.x + m.dx,
                alpha: { from: m.alpha * 0.65, to: m.alpha * 1.35 },
                scaleX: { from: 0.92, to: 1.15 },
                duration: m.dur,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 8. BIOLUMINESCENT WITCH MUSHROOMS (Depth: 3)
        const mushrooms = [
            { x: 80, y: 414, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 115, y: 415, col: 0x06b6d4, glow: 0x67e8f9 },
            { x: 140, y: 414, col: 0x22c55e, glow: 0x86efac },
            { x: 195, y: 416, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 270, y: 414, col: 0x06b6d4, glow: 0x67e8f9 },
            { x: 395, y: 415, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 445, y: 415, col: 0x22c55e, glow: 0x86efac }
        ];
        mushrooms.forEach(m => {
            const mG = this.add.graphics().setDepth(3);
            mG.fillStyle(0xf1f5f9, 0.9);
            mG.fillRect(m.x + 2, m.y, 3, 6);
            mG.fillStyle(m.col, 1);
            mG.fillCircle(m.x + 3.5, m.y, 6);
            mG.fillStyle(0xffffff, 0.9);
            mG.fillCircle(m.x + 2, m.y - 1.5, 1.2);
            mG.fillCircle(m.x + 5.5, m.y - 1.5, 1.2);

            const mGlow = this.add.circle(m.x + 3.5, m.y, 14, m.glow, 0.25).setDepth(3);
            this.tweens.add({
                targets: mGlow,
                alpha: { from: 0.1, to: 0.4 },
                scale: { from: 0.85, to: 1.25 },
                duration: Phaser.Math.Between(1500, 2600),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 9. AMBIENT MANA SPORES & FIREFLIES (Depth: 3)
        for (let i = 0; i < 26; i++) {
            const fx = Phaser.Math.Between(20, 780);
            const fy = Phaser.Math.Between(60, 395);
            const col = Phaser.Math.RND.pick([0xc084fc, 0x5eead4, 0xfde047, 0xa7f3d0, 0xe879f9]);
            const wisp = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), col, 0.85).setDepth(3);

            this.tweens.add({
                targets: wisp,
                x: fx + Phaser.Math.Between(-35, 35),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.95 },
                scale: { from: 0.7, to: 1.4 },
                duration: Phaser.Math.Between(2000, 4200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 4: WITCH COTTAGE INTERIOR
// -------------------------------------------------------------
