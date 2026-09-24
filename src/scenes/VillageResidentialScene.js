import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class VillageResidentialScene extends BaseScene {
    constructor() {
        super({ key: 'VillageResidentialScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#38bdf8');
        this.createVillageResidentialAtmosphere();

        this.currentLocationName = 'Pemukiman Desa (3 Rumah Pemesan Roti)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(4.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        this.createSeamlessGround('tanah_home', 1);

        let startX = 60;
        if (data && (data.from === 'EastForestScene' || data.from === 'SaffronFarmScene')) {
            startX = 740;
        } else if (data && data.from === 'BakeryMillScene') {
            startX = 60;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // House 1: Pak Thomas
        this.house1 = this.physics.add.staticSprite(200, 370, 'village_house1').setDepth(4);
        this.npc1 = this.physics.add.staticSprite(240, 395, 'npc_thomas').setDepth(5);
        this.add.text(200, 305, 'Rumah 1\nPak Thomas', {
            fontSize: '11px', fontStyle: 'bold', fill: '#fef08a', align: 'center', backgroundColor: '#0f172acc', padding: { x: 8, y: 3 }
        }).setOrigin(0.5).setDepth(20);

        // House 2: Ibu Sarah
        this.house2 = this.physics.add.staticSprite(420, 370, 'village_house2').setDepth(4);
        this.npc2 = this.physics.add.staticSprite(460, 395, 'npc_sarah').setDepth(5);
        this.add.text(420, 305, 'Rumah 2\nIbu Sarah', {
            fontSize: '11px', fontStyle: 'bold', fill: '#fef08a', align: 'center', backgroundColor: '#0f172acc', padding: { x: 8, y: 3 }
        }).setOrigin(0.5).setDepth(20);

        // House 3: Paman Bob
        this.house3 = this.physics.add.staticSprite(640, 370, 'village_house3').setDepth(4);
        this.npc3 = this.physics.add.staticSprite(680, 395, 'npc_bob').setDepth(5);
        this.add.text(640, 305, 'Rumah 3\nPaman Bob', {
            fontSize: '11px', fontStyle: 'bold', fill: '#fef08a', align: 'center', backgroundColor: '#0f172acc', padding: { x: 8, y: 3 }
        }).setOrigin(0.5).setDepth(20);

        this.createLeftNavHint('◀ Toko Roti Mr. Breado', true);
        this.createRightNavHint('Kebun Saffron ➔', true);

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
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'house1') {
                this.deliverToHouse('thomas', 'Pak Thomas', this.house1);
            } else if (this.nearTarget.type === 'house2') {
                this.deliverToHouse('sarah', 'Ibu Sarah', this.house2);
            } else if (this.nearTarget.type === 'house3') {
                this.deliverToHouse('bob', 'Paman Bob', this.house3);
            }
        }
    }

    deliverToHouse(houseKey, name, sprite) {
        const inv = getInventory(this.registry);
        const hasPepper = inv.some(i => i.id === 'Lada Hitam Pilihan');
        const hasSaffron = inv.some(i => i.id === 'Bunga Saffron Langka');
        const isDeliveryActive = !!this.registry.get('breadDeliveryActive');
        let delivered = this.registry.get('deliveredHouses') || [];

        if (delivered.includes(houseKey)) {
            let message = '';
            if (houseKey === 'thomas') message = 'Pak Thomas: "Rotinya masih mengepul hangat dan lezat sekali! Terima kasih ya, Goblin kecil yang baik hati!"';
            if (houseKey === 'sarah') message = 'Ibu Sarah: "Semoga bumbu Lada Hitam dariku membuat resep roti Mr. Breado semakin nikmat dan berkhasiat ya, Nak!"';
            if (houseKey === 'bob') message = 'Paman Bob: "Hati-hati ya jika mau melanjutkan ke Kebun Saffron di sebelah kanan [➔]!"';

            this.startDialogue([
                { speaker: name, text: message }
            ]);
            return;
        }

        if (!isDeliveryActive) {
            this.startDialogue([
                { speaker: name, text: 'Halo Goblin kecil! Kami sedang menunggu pesanan roti pagi hangat dari Toko Roti Mr. Breado di sebelah barat [◀].' }
            ]);
            return;
        }

        delivered.push(houseKey);
        this.registry.set('deliveredHouses', delivered);
        const count = delivered.length;
        this.registry.set('breadDeliverCount', count);

        // Update inventory item Keranjang Roti Pagi jika ada
        const basketIndex = inv.findIndex(i => i.id === 'Keranjang Roti Pagi');
        if (count >= 3) {
            if (basketIndex !== -1) {
                inv.splice(basketIndex, 1);
            }
        } else if (basketIndex !== -1) {
            inv[basketIndex].desc = `Keranjang roti gandum hangat untuk warga desa (Sisa ${3 - count} keranjang lagi).`;
        }

        let noticeText = `✨ Roti Terantar! (${count}/3)`;

        // Special handling for Ibu Sarah: gives Lada Hitam Pilihan in this SAME visit!
        if (houseKey === 'sarah' && !hasPepper) {
            inv.push({
                id: 'Lada Hitam Pilihan',
                desc: 'Rempah lada hitam pedas-hangat berkualitas tinggi untuk bumbu roti magis Mr. Breado.'
            });
            noticeText = `✨ Roti Terantar + Lada Hitam! (${count}/3)`;
        }

        this.registry.set('inventory', inv);
        this.renderInventorySlots();
        GameAudio.playCollect();

        const notice = this.add.text(sprite.x, sprite.y - 40, noticeText, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        if (houseKey === 'sarah') {
            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Permisi Bu Sarah, ini kiriman roti sarapan hangat dari Mr. Breado! Sekalian, apakah Ibu punya simpanan rempah Lada Hitam untuk resep Magic Bread?' },
                { speaker: 'Ibu Sarah', text: 'Ohoho! Selamat pagi Goblin kecil yang manis! Rotinya pas sekali untuk sarapan. Kebetulan sekali, ini ambillah [Lada Hitam Pilihan] terbaik dari simpanan dapurku!' },
                { speaker: 'Aksel (Goblin)', text: 'Terima kasih banyak Ibu Sarah! Roti terantar dan rempah Lada Hitam berhasil kudapatkan!' }
            ]);
        } else if (houseKey === 'thomas') {
            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Permisi Pak Thomas! Ini kiriman keranjang roti sarapan hangat dari Mr. Breado.' },
                { speaker: 'Pak Thomas', text: 'Wah, aromanya masih harum dan mengepul hangat! Terima kasih banyak ya, Goblin kecil yang ramah dan rajin!' },
                { speaker: 'Aksel (Goblin)', text: 'Sama-sama Pak Thomas! Selamat menikmati sarapannya.' }
            ]);
        } else if (houseKey === 'bob') {
            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Permisi Paman Bob! Ini keranjang roti pagi buatan Mr. Breado untuk Paman.' },
                { speaker: 'Paman Bob', text: 'Terima kasih banyak Goblin kecil! Kamu makhluk kecil yang berhati emas. Hati-hati ya jika mau melanjutkan perjalanan ke Kebun Saffron di sebelah kanan [➔], kudengar ada monster bayangan buas di sana!' },
                { speaker: 'Aksel (Goblin)', text: 'Terima kasih atas peringatannya, Paman Bob! Aku akan waspada.' }
            ]);
        }

        if (count >= 3) {
            if (hasSaffron) {
                setQuestState(this.registry, {
                    chapter: 'BAB 3',
                    title: 'Bab 3: Panggang Magic Bread di Toko Roti',
                    objective: '3 Roti Terantar & Bahan Lengkap! Kembali ke Toko Roti Mr. Breado [◀] untuk memanggang Magic Bread.',
                    questNumber: 9
                });
            } else {
                setQuestState(this.registry, {
                    chapter: 'BAB 3',
                    title: 'Bab 3: Petik Bunga Saffron di Kebun',
                    objective: '3 Roti Terantar & Lada Hitam Didapat! Lanjutkan ke timur [➔] menuju Kebun Saffron untuk memetik Bunga Saffron Langka.',
                    questNumber: 8
                });
            }
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;
        let delivered = this.registry.get('deliveredHouses') || [];
        const isDeliveryActive = !!this.registry.get('breadDeliveryActive');

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house1.x, this.house1.y) < 70) {
            const prompt = isDeliveryActive && !delivered.includes('thomas') ? 'Tekan [E] Antar Roti (Rumah Pak Thomas)' : 'Tekan [E] Bicara Pak Thomas';
            found = { type: 'house1', x: this.house1.x, y: this.house1.y - 45, prompt: prompt };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house2.x, this.house2.y) < 70) {
            const prompt = isDeliveryActive && !delivered.includes('sarah') ? 'Tekan [E] Antar Roti & Minta Lada (Ibu Sarah)' : 'Tekan [E] Bicara Ibu Sarah';
            found = { type: 'house2', x: this.house2.x, y: this.house2.y - 45, prompt: prompt };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house3.x, this.house3.y) < 70) {
            const prompt = isDeliveryActive && !delivered.includes('bob') ? 'Tekan [E] Antar Roti (Rumah Paman Bob)' : 'Tekan [E] Bicara Paman Bob';
            found = { type: 'house3', x: this.house3.x, y: this.house3.y - 45, prompt: prompt };
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
                this.scene.start('BakeryMillScene', { from: 'VillageResidentialScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const delivered = this.registry.get('deliveredHouses') || [];
                const isDeliveryActive = !!this.registry.get('breadDeliveryActive');

                // Jika sedang dalam quest antar roti dan belum selesai 3 rumah
                if (isDeliveryActive && delivered.length < 3) {
                    this.showMapLockedNotice('Antarkan dulu 3 keranjang roti ke seluruh rumah warga sebelum lanjut ke Kebun Saffron di kanan [➔]!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                    return;
                }

                this.scene.start('SaffronFarmScene', { from: 'VillageResidentialScene' });
            }
        });
    }

    createVillageResidentialAtmosphere() {
        // 1. High-fidelity Pixel Art Village Background
        this.createSeamlessBackground('village_residential_bg', 0, 1100, 450);

        // 2. Sunrise Sunburst & Light Rays at horizon (Sun position in art is around X: 565, Y: 145)
        const sunGlow = this.add.circle(565, 145, 48, 0xfef08a, 0.28).setDepth(1);
        this.tweens.add({
            targets: sunGlow,
            scale: { from: 0.9, to: 1.25 },
            alpha: { from: 0.18, to: 0.35 },
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const sunRays = this.add.graphics().setDepth(1);
        sunRays.fillStyle(0xfef08a, 0.04);
        sunRays.fillTriangle(565, 145, 300, 0, 460, 0);
        sunRays.fillTriangle(565, 145, 680, 0, 800, 0);
        sunRays.fillTriangle(565, 145, 220, 420, 360, 420);
        sunRays.fillTriangle(565, 145, 420, 420, 580, 420);

        // 3. Gentle River Shimmer along the river bend (X: 520 - 750, Y: 290 - 400)
        for (let r = 0; r < 6; r++) {
            const rx = Phaser.Math.Between(520, 750);
            const ry = Phaser.Math.Between(290, 400);
            const gleam = this.add.ellipse(rx, ry, Phaser.Math.Between(6, 12), 2, 0xe0f2fe, 0.5).setDepth(1);
            this.tweens.add({
                targets: gleam,
                alpha: { from: 0.1, to: 0.65 },
                scaleX: { from: 0.7, to: 1.3 },
                duration: Phaser.Math.Between(1500, 2500),
                yoyo: true,
                repeat: -1,
                delay: r * 300,
                ease: 'Sine.easeInOut'
            });
        }

        // 4. Chimney Breakfast Smoke for the 3 Houses
        // House 1 (Pak Thomas) at X: 200, House 2 (Ibu Sarah) at X: 420, House 3 (Paman Bob) at X: 640
        const chimneyPositions = [
            { x: 185, y: 318 },
            { x: 405, y: 318 },
            { x: 625, y: 318 }
        ];

        chimneyPositions.forEach((pos) => {
            for (let i = 0; i < 3; i++) {
                const smoke = this.add.circle(pos.x, pos.y, Phaser.Math.Between(3, 5), 0xf1f5f9, 0.55).setDepth(3);
                this.tweens.add({
                    targets: smoke,
                    x: pos.x + Phaser.Math.Between(8, 22),
                    y: pos.y - Phaser.Math.Between(30, 55),
                    scale: { from: 0.8, to: 2.2 },
                    alpha: { from: 0.55, to: 0 },
                    duration: 2200 + i * 400,
                    delay: i * 650,
                    repeat: -1,
                    ease: 'Sine.easeOut'
                });
            }
        });

        // 5. Morning Birds Gliding across the Sky
        for (let b = 0; b < 4; b++) {
            const bird = this.add.text(-40 - b * 70, Phaser.Math.Between(40, 120), 'v', {
                fontSize: `${Phaser.Math.Between(8, 12)}px`,
                fontStyle: 'bold',
                fill: '#1e293b'
            }).setDepth(1).setAlpha(0.65);

            this.tweens.add({
                targets: bird,
                x: 840,
                y: bird.y + Phaser.Math.Between(-15, 15),
                duration: Phaser.Math.Between(14000, 19000),
                delay: b * 3200,
                repeat: -1
            });
        }

        // 6. Floating Morning Dew & Golden Sun Motes
        for (let f = 0; f < 18; f++) {
            const mote = this.add.circle(
                Phaser.Math.Between(40, 760),
                Phaser.Math.Between(260, 420),
                Phaser.Math.FloatBetween(1, 2.2),
                0xfef3c7,
                0.7
            ).setDepth(3);

            this.tweens.add({
                targets: mote,
                x: mote.x + Phaser.Math.Between(-25, 25),
                y: mote.y - Phaser.Math.Between(15, 35),
                alpha: { from: 0.75, to: 0.15 },
                duration: Phaser.Math.Between(2200, 4500),
                delay: f * 180,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        // 7. Charming Garden Picket Fences & Morning Wildflowers beside the houses
        const decG = this.add.graphics().setDepth(3);
        const houseBases = [200, 420, 640];
        houseBases.forEach(hx => {
            // Little wooden picket fences
            decG.fillStyle(0x78350f, 0.9);
            decG.fillRect(hx - 62, 404, 18, 14);
            decG.fillRect(hx + 44, 404, 18, 14);
            decG.fillStyle(0x92400e, 1);
            // fence palings
            for (let px = hx - 62; px <= hx - 46; px += 5) {
                decG.fillRect(px, 398, 3, 20);
                decG.fillTriangle(px - 1, 398, px + 1.5, 394, px + 4, 398);
            }
            for (let px = hx + 44; px <= hx + 60; px += 5) {
                decG.fillRect(px, 398, 3, 20);
                decG.fillTriangle(px - 1, 398, px + 1.5, 394, px + 4, 398);
            }
            // Flower clusters near entrance
            const flowerColors = [0xf43f5e, 0xfbbf24, 0x38bdf8, 0xa855f7];
            for (let fl = 0; fl < 4; fl++) {
                const fx = hx - 40 + fl * 6;
                decG.fillStyle(0x15803d, 1);
                decG.fillRect(fx, 412, 1.5, 6);
                decG.fillStyle(flowerColors[fl % flowerColors.length], 1);
                decG.fillCircle(fx + 0.7, 411, 2);
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 11: EAST FOREST SCENE (HUTAN LEBAT TIMUR / JALUR KE RUMAH PENYIHIR)
// -------------------------------------------------------------
