import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { getInventory, getQuestState, setQuestState, isMobileDevice } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';
import { HDNoticeManager } from '../utils/HDNoticeManager.js';

export class EastForestScene extends BaseScene {
    constructor() {
        super({ key: 'EastForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e1b4b');
        this.createEastForestAtmosphere();

        this.currentLocationName = 'Hutan Belantara Timur (Sarang Monster & Bunga Saffron)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(4.5, 1).refreshBody();
        mainPlatform.setVisible(false);

        this.createSeamlessGround('tanah_home', 1);

        let startX = 60;
        if (data && data.from === 'WitchYardScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Directional Signpost
        this.createSignpost();

        // Saffron Plant & Guard Monster setup
        this.createSaffronAndMonster();

        this.createLeftNavHint('◀ Pemukiman Desa', true);
        this.createRightNavHint('Halaman Madam Joanne ➔', true);

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

    createSignpost() {
        const signG = this.add.graphics().setDepth(4);
        signG.fillStyle(0x3b1d11, 1);
        signG.fillRect(296, 350, 8, 70);
        signG.fillStyle(0x5c2b16, 1);
        signG.fillRoundedRect(210, 362, 180, 26, 4);
        signG.fillStyle(0x854d0e, 1);
        signG.strokeRoundedRect(210, 362, 180, 26, 4);

        this.add.text(300, 375, '◄ Pemukiman | Kediaman Joanne ➔', {
            fontSize: '9.5px',
            fontStyle: 'bold',
            fill: '#fef08a',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(4);

        signG.fillStyle(0x0f172a, 1);
        signG.fillRect(288, 342, 24, 3);
        signG.fillRect(289, 345, 2, 8);
        signG.fillRect(286, 352, 8, 10);
        signG.fillStyle(0xc084fc, 1);
        signG.fillCircle(290, 357, 3);

        const lanternGlow = this.add.circle(290, 357, 18, 0xa855f7, 0.35).setDepth(3);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.2, to: 0.55 },
            scale: { from: 0.85, to: 1.2 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createSaffronAndMonster() {
        const inv = getInventory(this.registry);
        this.hasSaffron = inv.some(i => i.id === 'Bunga Saffron Langka');
        this.isMonsterDefeated = !!this.registry.get('saffronMonsterDefeated');

        // 1. Saffron Plant (Golden Magical Flower Patch at x: 620, y: 405)
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
            this.monster.setScale(0.18); // Ukuran proporsional mengintimidasi
            this.monster.setFlipX(true);
            this.monster.body.setAllowGravity(false); // Menonaktifkan gravitasi agar monster bayangan tidak jatuh menembus tanah!
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

            // Animasi melayang / bernapas monster bayangan
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

            // Jadikan monster interaktif (bisa diklik/tap di PC maupun mobile)
            this.monster.setInteractive({ useHandCursor: true });
            this.monster.on('pointerdown', () => this.attackMonster());

            // Tampilkan tombol serangan mobile jika perangkat sentuh
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
            }
        }
    }

    harvestSaffron() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Bunga Saffron Langka')) return;

        inv.push({
            id: 'Bunga Saffron Langka',
            desc: 'Bunga rempah emas langka bernilai tinggi yang berhasil dipetik dari Hutan Timur.'
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
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! [Bunga Saffron Langka] ini akhirnya berhasil kupetik setelah mengalahkan monster hutan tadi!' },
            { speaker: 'Aksel (Goblin)', text: 'Bunga ini beraroma manis dan berkilau emas... Mr. Breado pasti sangat senang. Aku harus segera kembali ke toko roti!' }
        ]);
    }

    createEastForestAtmosphere() {
        // 1. High-fidelity Misty Birch Forest Background Asset
        this.createSeamlessBackground('east_forest_bg', 0, 1100, 450);

        // 2. Cold Violet/Indigo Witchcraft Ambient Tint
        const ambG = this.add.graphics().setDepth(1);
        ambG.fillStyle(0x2e1065, 0.1);
        ambG.fillRect(-200, 0, 1200, 450);

        // 3. Drifting Eerie Forest Fog Layers
        for (let m = 0; m < 5; m++) {
            const mist = this.add.ellipse(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(260, 410),
                Phaser.Math.Between(240, 420),
                Phaser.Math.Between(35, 65),
                0xe0e7ff,
                Phaser.Math.FloatBetween(0.06, 0.14)
            ).setDepth(1);

            this.tweens.add({
                targets: mist,
                x: { from: mist.x - 35, to: mist.x + 35 },
                alpha: { from: 0.05, to: 0.18 },
                duration: Phaser.Math.Between(5000, 8500),
                yoyo: true,
                repeat: -1,
                delay: m * 500,
                ease: 'Sine.easeInOut'
            });
        }

        // 4. Ancient Runic Monolith Stone (Near X: 170)
        const runeG = this.add.graphics().setDepth(2);
        runeG.fillStyle(0x1e1b4b, 1);
        runeG.fillRoundedRect(155, 275, 32, 143, 6);
        runeG.fillStyle(0x312e81, 0.8);
        runeG.fillRect(157, 277, 4, 139);

        const runeChars = [
            { text: 'ᚱ', y: 300, color: '#38bdf8' },
            { text: 'ᚦ', y: 330, color: '#c084fc' },
            { text: 'ᚨ', y: 360, color: '#2dd4bf' },
            { text: '⚡', y: 390, color: '#fde047' }
        ];

        runeChars.forEach(r => {
            const glyph = this.add.text(171, r.y, r.text, {
                fontSize: '13px',
                fontStyle: 'bold',
                fill: r.color
            }).setOrigin(0.5).setDepth(2);

            this.tweens.add({
                targets: glyph,
                alpha: { from: 0.25, to: 1 },
                scale: { from: 0.9, to: 1.15 },
                duration: Phaser.Math.Between(1600, 2400),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 5. Floating Witchcraft Will-o'-the-Wisps & Forest Spores
        for (let s = 0; s < 22; s++) {
            const isCyan = s % 2 === 0;
            const spore = this.add.circle(
                Phaser.Math.Between(30, 770),
                Phaser.Math.Between(180, 420),
                Phaser.Math.FloatBetween(1.2, 2.5),
                isCyan ? 0x67e8f9 : 0xd8b4fe,
                0.75
            ).setDepth(3);

            this.tweens.add({
                targets: spore,
                x: spore.x + Phaser.Math.Between(-35, 35),
                y: spore.y - Phaser.Math.Between(20, 50),
                alpha: { from: 0.8, to: 0.1 },
                duration: Phaser.Math.Between(2600, 5200),
                delay: s * 160,
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
                this.scene.start('VillageResidentialScene', { from: 'EastForestScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (!hasHoney || !hasSeed || !hasBread) {
                    this.showMapLockedNotice('Kumpulkan ketiga Bahan Magis (termasuk Magic Bread) dulu sebelum kembali ke Madam Joanne!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('WitchYardScene', { from: 'EastForestScene' });
                }
            }
        });
    }
}


