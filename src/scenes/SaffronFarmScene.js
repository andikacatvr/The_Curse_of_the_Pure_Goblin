import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState, isMobileDevice } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';
import { HDNoticeManager } from '../utils/HDNoticeManager.js';

export class SaffronFarmScene extends BaseScene {
    constructor() {
        super({ key: 'SaffronFarmScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#7c3aed');
        this.createSaffronFarmAtmosphere();

        this.currentLocationName = 'Kebun Bunga Saffron (Lembah Ungu Sunset)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(4.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        let startX = 60;
        if (data && data.from === 'EastForestScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Farm elements & Monster setup
        this.createFarmInteractives();
        this.createSaffronAndMonster();

        this.createLeftNavHint('◀ Pemukiman Desa', true);
        this.createRightNavHint('Hutan Timur ➔', true);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(20).setVisible(false);

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

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTalking) {
                this.nextDialogue();
            } else {
                this.attackMonster();
            }
        });
        this.input.keyboard.on('keydown-F', () => this.attackMonster());
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });

        this.events.once('shutdown', () => {
            if (isMobileDevice()) {
                this.hideMobileCombatButton();
            }
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();
    }

    createFarmInteractives() {
        // Farm Sign & Drying Stall Zone (Left side near the wooden stall in the art)
        this.farmSign = this.add.zone(130, 390, 80, 80);
        this.physics.add.existing(this.farmSign, true);

        // Barrel Zone (Right side near the wooden barrels in the art)
        this.saffronBarrel = this.add.zone(720, 390, 80, 80);
        this.physics.add.existing(this.saffronBarrel, true);
    }

    createSaffronAndMonster() {
        const inv = getInventory(this.registry);
        this.hasSaffron = inv.some(i => i.id === 'Bunga Saffron Langka');
        this.isMonsterDefeated = !!this.registry.get('saffronMonsterDefeated');

        // 1. Rare Saffron Flower (x: 620, y: 405)
        if (!this.hasSaffron) {
            this.saffronFlower = this.add.container(620, 405).setDepth(4);

            const plantG = this.add.graphics();
            // Stems & leaves
            plantG.fillStyle(0x15803d, 1);
            plantG.fillTriangle(-8, 12, 0, -4, 8, 12);
            plantG.fillTriangle(-12, 12, -4, 2, 0, 12);
            plantG.fillTriangle(0, 12, 4, 2, 12, 12);
            // Purple Saffron Petals
            plantG.fillStyle(0x7e22ce, 1);
            plantG.fillCircle(-4, -6, 6);
            plantG.fillCircle(4, -6, 6);
            plantG.fillCircle(0, -10, 6.5);
            // Glowing Golden Stigma / Saffron threads
            plantG.fillStyle(0xfbbf24, 1);
            plantG.fillCircle(0, -7, 4);
            plantG.fillStyle(0xef4444, 1);
            plantG.fillRect(-1.5, -12, 3, 7);
            this.saffronFlower.add(plantG);

            // Shimmering Golden Aura
            const aura = this.add.circle(620, 398, 16, 0xfbbf24, 0.4).setDepth(3);
            this.tweens.add({
                targets: aura,
                scale: { from: 0.8, to: 1.35 },
                alpha: { from: 0.2, to: 0.6 },
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.saffronFlower.aura = aura;
        }

        // 2. Guard Monster (Forest Shadow Beast at x: 520, y: 365)
        if (!this.isMonsterDefeated) {
            this.monsterHP = 3;
            this.monster = this.physics.add.sprite(520, 365, 'monster_shadow').setDepth(5);
            this.monster.setScale(0.18);
            this.monster.setFlipX(true);
            this.monster.body.setAllowGravity(false);
            this.monster.body.setImmovable(true);
            this.monster.body.setSize(380, 420);
            this.monster.body.setOffset(60, 60);

            // Menacing dark purple glow aura
            const mGlow = this.add.circle(520, 365, 30, 0x581c87, 0.45).setDepth(4);
            this.tweens.add({
                targets: mGlow,
                scale: { from: 0.9, to: 1.25 },
                alpha: { from: 0.25, to: 0.6 },
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.monster.glow = mGlow;

            // Animasi melayang monster
            this.tweens.add({
                targets: [this.monster, mGlow],
                y: '-=10',
                duration: 1100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.hpText = this.add.text(520, 305, '❤️ MONSTER HUTAN HP: 3/3', {
                fontSize: '11px',
                fontStyle: 'bold',
                fill: '#ef4444',
                backgroundColor: '#000000bb',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5).setDepth(20);

            this.monster.setInteractive({ useHandCursor: true });
            this.monster.on('pointerdown', () => this.attackMonster());

            if (isMobileDevice()) {
                this.showMobileCombatButton(() => this.attackMonster());
            }

            const hintText = isMobileDevice()
                ? 'Dekati & ketuk monster untuk menebasnya!'
                : 'Tekan [F] / [SPACE] di dekat monster untuk menyerang!';
            HDNoticeManager.showBattleHint(hintText, '⚔️ PERTEMPURAN MONSTER');
        }
    }

    attackMonster() {
        if (this.isMonsterDefeated || !this.monster || !this.monster.active || this.isTalking) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y);
        if (dist < 90) {
            this.monsterHP--;

            // Slash FX
            const slash = this.add.rectangle(this.monster.x, this.monster.y, 45, 45, 0xf59e0b, 0.85).setDepth(15);
            this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 250, onComplete: () => slash.destroy() });

            this.monster.setTint(0xffffff);
            this.time.delayedCall(150, () => this.monster.clearTint());

            if (this.monsterHP > 0) {
                this.hpText.setText(`❤️ MONSTER HUTAN HP: ${this.monsterHP}/3`);
            } else {
                this.isMonsterDefeated = true;
                this.registry.set('saffronMonsterDefeated', true);
                if (this.hpText) this.hpText.destroy();
                if (this.monster.glow) this.monster.glow.destroy();
                if (isMobileDevice()) {
                    this.hideMobileCombatButton();
                }

                this.tweens.add({
                    targets: this.monster,
                    alpha: 0,
                    scale: 0,
                    duration: 600,
                    onComplete: () => {
                        this.monster.destroy();
                        HDNoticeManager.showSuccess('Monster Hutan dikalahkan! Petik Bunga Saffron di depanmu!', '⚔️ MONSTER KALAH!');
                    }
                });
            }
        }
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'saffron') {
                this.harvestSaffron();
            } else if (this.nearTarget.type === 'sign') {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Pondok kayu ini tertulis "Saffron Farm". Di sinilah para petani lembah biasanya memetik dan mengeringkan rempah saffron terbaik.' },
                    { speaker: 'Aksel (Goblin)', text: 'Pemandangan kebun bunga ungu dengan matahari terbenam di balik pegunungan ini sungguh luar biasa indah!' }
                ]);
            } else if (this.nearTarget.type === 'barrel') {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Tong kayu ini berisi panen helai saffron merah-keemasan yang sudah kering. Aromanya sangat semerbak dan harum.' }
                ]);
            }
        }
    }

    harvestSaffron() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Bunga Saffron Langka')) return;

        inv.push({
            id: 'Bunga Saffron Langka',
            desc: 'Bunga rempah emas langka bernilai tinggi yang berhasil dipetik dari Kebun Saffron.'
        });
        this.registry.set('inventory', inv);
        this.renderInventorySlots();
        GameAudio.playCollect();

        if (this.saffronFlower) {
            if (this.saffronFlower.aura) this.saffronFlower.aura.destroy();
            this.saffronFlower.destroy();
        }
        this.hasSaffron = true;

        const notice = this.add.text(620, 380, '✨ + Bunga Saffron Langka!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 5, y: 3 }
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1500, onComplete: () => notice.destroy() });

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! [Bunga Saffron Langka] dengan tangkai emas berkilau sudah berhasil kupetik!' },
            { speaker: 'Aksel (Goblin)', text: 'Semua 3 roti warga sudah kuantar, dan kedua rempah (Lada Hitam & Bunga Saffron) sudah lengkap!' },
            { speaker: 'Aksel (Goblin)', text: 'Aku harus segera kembali ke Toko Roti Mr. Breado di sebelah barat [◀] untuk memanggang Magic Bread!' }
        ]);

        setQuestState(this.registry, {
            chapter: 'BAB 3',
            title: 'Bab 3: Panggang Magic Bread di Toko Roti',
            objective: 'Pesanan roti warga selesai & rempah lengkap! Kembali ke Toko Roti Mr. Breado [◀] untuk memanggang Magic Bread.',
            questNumber: 9
        });
        this.updateQuestHUD();
    }

    createSaffronFarmAtmosphere() {
        // High-Fidelity Sunset Saffron Farm Panorama
        this.createSeamlessBackground('saffron_farm_bg', 0, 1125, 450);

        // Sunset Sunburst Radiant Glow (Sun is located at upper right horizon ~665, 150)
        const sunGlow = this.add.circle(665, 150, 48, 0xfef08a, 0.35).setDepth(1);
        this.tweens.add({
            targets: sunGlow,
            scale: { from: 0.95, to: 1.25 },
            alpha: { from: 0.25, to: 0.45 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Floating Saffron / Lavender Petals drifting in the warm evening breeze
        const petalColors = [0xd8b4fe, 0xc084fc, 0xa855f7, 0xfbbf24];
        for (let p = 0; p < 18; p++) {
            const px = Phaser.Math.Between(0, 800);
            const py = Phaser.Math.Between(150, 420);
            const pColor = Phaser.Utils.Array.GetRandom(petalColors);
            const petal = this.add.circle(px, py, Phaser.Math.Between(1.5, 3), pColor, Phaser.Math.FloatBetween(0.4, 0.75)).setDepth(2);

            this.tweens.add({
                targets: petal,
                x: petal.x + Phaser.Math.Between(-80, 80),
                y: petal.y - Phaser.Math.Between(25, 60),
                alpha: { from: 0.7, to: 0.1 },
                duration: Phaser.Math.Between(2500, 5000),
                delay: p * 180,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        let found = null;

        if (!this.isMonsterDefeated && this.monster && this.monster.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y);
            if (dist < 90) {
                found = { type: 'monster', x: this.monster.x, y: this.monster.y - 45, prompt: 'Tekan [F] / [SPACE] Serang Monster Hutan!' };
            }
        } else if (!this.hasSaffron && this.saffronFlower) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, 620, 405);
            if (dist < 60) {
                found = { type: 'saffron', x: 620, y: 370, prompt: 'Tekan [E] Petik Bunga Saffron Langka' };
            }
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, 130, 390) < 65) {
            found = { type: 'sign', x: 130, y: 345, prompt: 'Tekan [E] Periksa Pondok & Papan Saffron' };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, 720, 390) < 60) {
            found = { type: 'barrel', x: 720, y: 345, prompt: 'Tekan [E] Periksa Tong Hasil Panen' };
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
                this.scene.start('VillageResidentialScene', { from: 'SaffronFarmScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('EastForestScene', { from: 'SaffronFarmScene' });
            }
        });
    }
}
