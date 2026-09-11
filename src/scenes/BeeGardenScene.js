import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';

export class BeeGardenScene extends BaseScene {
    constructor() {
        super({ key: 'BeeGardenScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e293b');
        this.createBeeGardenAtmosphere();

        this.currentLocationName = 'Kebun Lebah Magis & Sarang Lebah (Grandma Mary)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setVisible(false);

        const groundSprite = this.add.image(0, 418, 'tanah_home').setDepth(1);
        groundSprite.setOrigin(0, 117 / 250);
        groundSprite.setScale(800 / 770);

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const playerTexture = (qState.chapter !== 'PROLOG' && !hasCure) ? 'player_goblin' : 'player_human';
        this.player = this.physics.add.sprite(740, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Beehive at Ancient Tree (Coordinates matching background art)
        this.beehive = { x: 611, y: 135 };
        this.beehiveLabel = this.add.text(611, 78, '🐝 Sarang Lebah Magis', {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#fef08a',
            backgroundColor: '#0f172acc',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(20);

        this.weedsGroup = this.physics.add.staticGroup();
        this.weedCount = this.registry.get('weedCount') || 0;

        if (this.weedCount < 5) {
            const weedPositions = [150, 260, 370, 480, 570];
            for (let i = this.weedCount; i < 5; i++) {
                const weed = this.weedsGroup.create(weedPositions[i], 412, 'weed_node');
                weed.type = 'weed';
                weed.setDepth(4);
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(780, 65, 'Ke Halaman Grandma Mary ➔', {
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
            if (this.nearTarget.type === 'weed') {
                if (!this.registry.get('talkedToMary')) {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Aku harus bicara dulu dengan Grandma Mary di halaman sebelum membersihkan rumput liar di kebun ini!' }
                    ]);
                } else {
                    this.cleanWeed(this.nearTarget.sprite);
                }
            } else if (this.nearTarget.type === 'beehive') {
                this.harvestHoney();
            }
        }
    }

    cleanWeed(weedSprite) {
        this.weedCount++;
        this.registry.set('weedCount', this.weedCount);
        GameAudio.playCollect();
        
        const notice = this.add.text(weedSprite.x, weedSprite.y - 25, `✨ Rumput Liar Bersih! (${this.weedCount}/5)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#4ade80', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        weedSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (this.weedCount >= 5) {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Quest 2: Beli Bee Smoker (Mr. Heinreich)',
                objective: 'Rumput liar selesai! Beli Bee Smoker dari Mr. Heinreich di bengkel kayu (Timur).',
                questNumber: 2,
                completedQuests: ['Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary']
            });

            this.time.delayedCall(800, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 5 rumput liar dan hama di Kebun Lebah sudah kubersihkan!' },
                    { speaker: 'Aksel (Goblin)', text: 'Sekarang aku perlu [Bee Smoker] dari Mr. Heinreich si tukang kayu agar lebahnya tidak menyengat saat dipanen!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Quest 1: Bersihkan 5 Rumput Liar',
                objective: `Bersihkan rumput liar di Kebun Lebah (Progress: ${this.weedCount}/5).`
            });
        }
        this.updateQuestHUD();
    }

    harvestHoney() {
        const inv = getInventory(this.registry);
        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');

        if (hasHoney) {
            this.startDialogue([{ speaker: 'Aksel (Goblin)', text: 'Madu Murni dari sarang lebah ini sudah berhasil kupanen!' }]);
            return;
        }

        if (!hasSmoker) {
            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Aduuh! Lebah-lebahnya marah dan menyengat! Aku harus mendapatkan [Bee Smoker] dulu dari Mr. Heinreich!' }
            ]);
            return;
        }

        // Bee smoker smoke puff rising to beehive
        const smoke = this.add.circle(this.beehive.x, this.beehive.y, 16, 0x94a3b8, 0.75).setDepth(15);
        this.tweens.add({ targets: smoke, scaleX: 5, scaleY: 5, alpha: 0, duration: 2000, onComplete: () => smoke.destroy() });

        // Calm down the bees
        this.calmDownBees();

        inv.push({ id: 'Bahan 1: Madu Murni', desc: 'Madu emas murni penetral racun & penyembuh penyakit.' });
        this.registry.set('inventory', inv);
        GameAudio.playCollect();

        const rewardText = this.add.text(this.beehive.x, 210, '✨ + [Bahan 1: Madu Murni]!', {
            fontSize: '14px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25);

        this.tweens.add({
            targets: rewardText,
            y: 180,
            alpha: { from: 1, to: 0 },
            duration: 2500,
            onComplete: () => rewardText.destroy()
        });

        this.renderInventorySlots();

        setQuestState(this.registry, {
            chapter: 'BAB 2',
            title: 'Bab 2: Berburu Mythical Seed',
            objective: 'Madu Murni dikumpulkan! Pergi ke Mr. Heinreich di Bengkel Kayu untuk Bahan 2 (Mythical Seed).',
            questNumber: 4,
            completedQuests: [
                'Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary',
                'Quest 2: Dapatkan Bee Smoker dari Mr. Heinreich',
                'Quest 3: Panen Bahan 1 (Madu Murni) dari Sarang Lebah'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! Asapnya menenangkan lebah dan aku mendapatkan [Bahan 1: Madu Murni]!' },
            { speaker: 'Aksel (Goblin)', text: 'Aku harus segera kembali ke halaman rumah Nenek Mary untuk memberitahunya dan menanyakan petunjuk Bahan ke-2!' }
        ]);
    }

    update() {
        let found = null;

        // Check if player stands under/near the ancient tree beehive (X: ~611)
        if (Math.abs(this.player.x - this.beehive.x) < 70) {
            found = { type: 'beehive', x: this.beehive.x, y: 320, prompt: 'Tekan [E] Panen Madu Murni' };
        }

        this.weedsGroup.children.iterate((weed) => {
            if (weed && weed.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, weed.x, weed.y) < 45) {
                const promptMsg = this.registry.get('talkedToMary') ? 'Tekan [E] Bersihkan Rumput Liar' : 'Bicara Dulu dengan Nenek Mary!';
                found = { type: 'weed', sprite: weed, x: weed.x, y: weed.y - 25, prompt: promptMsg };
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
            canExitLeft: false,
            minX: 20,
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('GrandmaGardenScene', { from: 'BeeGardenScene' });
            }
        });
    }

    createBeeGardenAtmosphere() {
        // 1. High-fidelity Pixel Art Ladang Grandma Mary Background
        this.add.image(400, 225, 'bee_garden_bg').setDisplaySize(800, 450).setDepth(0);

        // 2. Drifting atmospheric morning mist across the meadow
        for (let m = 0; m < 3; m++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(80, 720),
                Phaser.Math.Between(260, 360),
                Phaser.Math.Between(260, 400),
                Phaser.Math.Between(45, 80),
                0xe2e8f0,
                0.08
            ).setDepth(1);
            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 30, to: mist.x + 30 },
                alpha: { from: 0.04, to: 0.12 },
                duration: Phaser.Math.Between(4500, 7500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 3. Lively Animated Magic Bees & Golden Hive Aura
        this.createBeehiveEffects();
    }

    createBeehiveEffects() {
        const hiveX = 611;
        const hiveY = 135;

        // A. Golden Magical Honey Glow pulsing at the hive
        const honeyGlow = this.add.circle(hiveX, hiveY + 12, 34, 0xfbbf24, 0.25).setDepth(2);
        this.tweens.add({
            targets: honeyGlow,
            scale: { from: 0.85, to: 1.25 },
            alpha: { from: 0.15, to: 0.38 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // B. Falling Golden Honey Pollen Sparkles
        for (let p = 0; p < 8; p++) {
            const sparkle = this.add.circle(
                hiveX + Phaser.Math.Between(-25, 25),
                hiveY + Phaser.Math.Between(10, 35),
                Phaser.Math.FloatBetween(1, 2.5),
                0xfef08a,
                0.8
            ).setDepth(3);

            this.tweens.add({
                targets: sparkle,
                y: sparkle.y + Phaser.Math.Between(60, 140),
                x: sparkle.x + Phaser.Math.Between(-30, 20),
                alpha: { from: 0.85, to: 0 },
                scale: { from: 1, to: 0.3 },
                duration: Phaser.Math.Between(1800, 3200),
                delay: p * 380,
                repeat: -1,
                ease: 'Sine.easeIn'
            });
        }

        // C. Animated Flying Bees
        this.beesList = [];
        const beeCount = 14;

        for (let i = 0; i < beeCount; i++) {
            const isForager = i >= 6; // 6 tight orbiters, 8 wider foragers
            const startX = hiveX + Phaser.Math.Between(-20, 20);
            const startY = hiveY + Phaser.Math.Between(-15, 25);

            const bee = this.add.sprite(startX, startY, 'magic_bee')
                .setDepth(6)
                .setScale(Phaser.Math.FloatBetween(0.85, 1.15));

            this.beesList.push(bee);

            // Wing flutter vibration
            this.tweens.add({
                targets: bee,
                scaleY: bee.scaleY * 0.75,
                duration: Phaser.Math.Between(55, 85),
                yoyo: true,
                repeat: -1,
                ease: 'Linear'
            });

            if (!isForager) {
                // Tight buzzing orbit around the hive
                const radiusX = Phaser.Math.Between(22, 50);
                const radiusY = Phaser.Math.Between(15, 34);
                const speed = Phaser.Math.Between(1900, 3200);
                const angleOffset = (i / 6) * Math.PI * 2;
                const progress = { angle: angleOffset };

                this.tweens.add({
                    targets: progress,
                    angle: angleOffset + Math.PI * 2,
                    duration: speed,
                    repeat: -1,
                    ease: 'Linear',
                    onUpdate: () => {
                        const cur = progress.angle;
                        bee.x = hiveX + Math.cos(cur) * radiusX;
                        bee.y = hiveY + Math.sin(cur) * radiusY;
                        bee.flipX = Math.cos(cur) > 0;
                    }
                });
            } else {
                // Wide foraging flight path into the flower meadow
                const flightDuration = Phaser.Math.Between(4000, 7000);
                const destX = hiveX - Phaser.Math.Between(90, 280);
                const destY = hiveY + Phaser.Math.Between(50, 180);

                this.tweens.add({
                    targets: bee,
                    x: destX,
                    y: destY,
                    duration: flightDuration,
                    delay: (i - 6) * 400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onYoyo: () => { bee.flipX = true; },
                    onRepeat: () => { bee.flipX = false; }
                });
            }
        }

        // D. 3 Ground Pollinator Bees hovering over the wildflower patches
        for (let g = 0; g < 3; g++) {
            const gx = [220, 360, 470][g];
            const gy = 405;
            const flowerBee = this.add.sprite(gx, gy, 'magic_bee').setDepth(4).setScale(0.8);
            this.beesList.push(flowerBee);

            // Wing flutter
            this.tweens.add({
                targets: flowerBee,
                scaleY: 0.6,
                duration: 65,
                yoyo: true,
                repeat: -1,
                ease: 'Linear'
            });

            // Gentle flower hover
            this.tweens.add({
                targets: flowerBee,
                x: gx + Phaser.Math.Between(-15, 15),
                y: gy - Phaser.Math.Between(8, 20),
                duration: Phaser.Math.Between(1500, 2400),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                onYoyo: () => { flowerBee.flipX = !flowerBee.flipX; }
            });
        }
    }

    calmDownBees() {
        if (!this.beesList) return;
        this.beesList.forEach(bee => {
            if (bee && bee.active) {
                this.tweens.killTweensOf(bee);
                // Wing flutter stays
                this.tweens.add({
                    targets: bee,
                    scaleY: bee.scaleY * 0.8,
                    duration: 120,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Linear'
                });
                // Gentle calm hover
                this.tweens.add({
                    targets: bee,
                    y: bee.y + Phaser.Math.Between(-5, 5),
                    alpha: 0.75,
                    duration: 2200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 6: WOODSHOP SCENE (BENGKEL KAYU MR. HEINREICH - BAB 2)
// -------------------------------------------------------------
