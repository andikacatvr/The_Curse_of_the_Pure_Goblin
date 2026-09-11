import Phaser from 'phaser';
import { FONT_TITLE, FONT_BODY, isMobileDevice } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';
import { DisplayManager } from '../utils/DisplayManager.js';

export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Unlock Web Audio context on user pointer interaction
        this.input.once('pointerdown', () => {
            GameAudio.init();
            GameAudio.resume();
            if (GameAudio.bgmEnabled) {
                GameAudio.startAmbientBGM();
            }
        });

        // 1. Blurred fantasy game background
        const bgKey = this.textures.exists('menu_bg_blurred') ? 'menu_bg_blurred' : 'menu_bg';
        this.bg = this.add.image(400, 225, bgKey).setDisplaySize(800, 450);

        // Breathing living-world camera tween
        this.tweens.add({
            targets: this.bg,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 6000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Vignette & Dark contrast overlay
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(0x020617, 0x020617, 0x020617, 0x020617, 0.45, 0.45, 0.75, 0.75);
        vignette.fillRect(0, 0, 800, 450);

        // Ambient Magical Fireflies / Glowing Particles
        this.createParticles();

        // 2. Title Banner (The uploaded user image)
        // Golden glowing halo behind the scroll
        this.glowHalo = this.add.graphics();
        this.glowHalo.fillStyle(0xf59e0b, 0.16);
        this.glowHalo.fillCircle(400, 135, 130);
        this.glowHalo.fillStyle(0x38bdf8, 0.1);
        this.glowHalo.fillCircle(400, 135, 170);

        this.tweens.add({
            targets: this.glowHalo,
            alpha: 0.6,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // The banner itself
        this.banner = this.add.image(400, 138, 'title_banner')
            .setOrigin(0.5, 0.5)
            .setScale(1.15);

        // Floating Bobbing Animation
        this.tweens.add({
            targets: this.banner,
            y: 146,
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle badge
        const badgeBg = this.add.rectangle(400, 236, 360, 24, 0x0f172a, 0.85)
            .setStrokeStyle(1.5, 0xf59e0b);
        const subText = this.add.text(400, 236, "✦ A BROTHER'S TRIUMPH ✦", {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#fbbf24',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // 3. Interactive Buttons (Play & Settings)
        this.createMenuButtons();

        // 4. Settings Modal
        this.createSettingsModal();

        // Bottom guide text
        const guideText = isMobileDevice()
            ? '📱 Sentuh Layar / Klik Tombol [MULAI] untuk Petualanganmu'
            : 'Gunakan Keyboard & Mouse untuk Petualanganmu • Tekan [SPASI] / Klik untuk Mulai';
        this.add.text(400, 432, guideText, {
            fontSize: '11px',
            fill: '#94a3b8',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Keyboard navigation
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isSettingsOpen) this.startGame();
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            if (!this.isSettingsOpen) this.startGame();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isSettingsOpen) this.toggleSettings(false);
        });

        // Camera Fade In
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    createParticles() {
        this.particles = [];
        const colors = [0x86efac, 0xfde047, 0x67e8f9, 0xa78bfa, 0x4ade80];
        for (let i = 0; i < 24; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(20, 780),
                Phaser.Math.Between(40, 420),
                Phaser.Math.Between(1.5, 3.5),
                Phaser.Utils.Array.GetRandom(colors),
                Phaser.Math.FloatBetween(0.3, 0.85)
            );
            p.speedY = Phaser.Math.FloatBetween(0.2, 0.55);
            p.sway = Phaser.Math.FloatBetween(0.01, 0.03);
            p.swayOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.particles.push(p);
        }
    }

    update(time) {
        if (this.particles && this.registry.get('particlesEnabled') !== false) {
            this.particles.forEach(p => {
                p.y -= p.speedY;
                p.x += Math.sin(time * 0.002 + p.swayOffset) * 0.45;
                if (p.y < -10) {
                    p.y = 460;
                    p.x = Phaser.Math.Between(20, 780);
                }
            });
        }
    }

    createMenuButtons() {
        const btnContainer = this.add.container(400, 315);

        // === PLAY BUTTON ===
        const playBtnBg = this.add.rectangle(0, 0, 260, 48, 0x15803d, 0.95)
            .setStrokeStyle(2.5, 0xf59e0b)
            .setInteractive({ useHandCursor: true });
        
        const playSheen = this.add.rectangle(0, -11, 248, 10, 0xffffff, 0.15);
        
        const playIcon = this.add.text(-85, 0, '▶', {
            fontSize: '18px', fill: '#fef08a'
        }).setOrigin(0.5);

        const playText = this.add.text(12, 0, 'MULAI PETUALANGAN', {
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const playGroup = this.add.container(0, -16, [playBtnBg, playSheen, playIcon, playText]);

        playBtnBg.on('pointerover', () => {
            playBtnBg.setFillStyle(0x16a34a, 1);
            playBtnBg.setStrokeStyle(3, 0xfde047);
            this.tweens.add({ targets: playGroup, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        playBtnBg.on('pointerout', () => {
            playBtnBg.setFillStyle(0x15803d, 0.95);
            playBtnBg.setStrokeStyle(2.5, 0xf59e0b);
            this.tweens.add({ targets: playGroup, scaleX: 1, scaleY: 1, duration: 150, ease: 'Sine.easeOut' });
        });

        playBtnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: playGroup,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 80,
                yoyo: true,
                onComplete: () => this.startGame()
            });
        });

        // === SETTINGS BUTTON ===
        const setBtnBg = this.add.rectangle(0, 0, 260, 42, 0x1e293b, 0.92)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });
        
        const setIcon = this.add.text(-80, 0, '⚙️', {
            fontSize: '15px', fill: '#cbd5e1'
        }).setOrigin(0.5);

        const setText = this.add.text(12, 0, 'PENGATURAN', {
            fontSize: '14px',
            fontStyle: 'bold',
            fill: '#e2e8f0',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const setGroup = this.add.container(0, 42, [setBtnBg, setIcon, setText]);

        setBtnBg.on('pointerover', () => {
            setBtnBg.setFillStyle(0x334155, 1);
            setBtnBg.setStrokeStyle(2, 0x94a3b8);
            this.tweens.add({ targets: setGroup, scaleX: 1.04, scaleY: 1.04, duration: 150, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        setBtnBg.on('pointerout', () => {
            setBtnBg.setFillStyle(0x1e293b, 0.92);
            setBtnBg.setStrokeStyle(2, 0x64748b);
            this.tweens.add({ targets: setGroup, scaleX: 1, scaleY: 1, duration: 150, ease: 'Sine.easeOut' });
        });

        setBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettings(true);
        });

        btnContainer.add([playGroup, setGroup]);
    }

    startGame() {
        GameAudio.playStart();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(450, () => {
            this.scene.start('HomeScene');
        });
    }

    createSettingsModal() {
        this.isSettingsOpen = false;
        this.settingsOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.72)
            .setDepth(50)
            .setVisible(false)
            .setInteractive();

        this.settingsBox = this.add.container(400, 225).setDepth(51).setVisible(false);

        // Modal Frame
        const modalBg = this.add.rectangle(0, 0, 560, 420, 0x0f172a, 0.98)
            .setStrokeStyle(3, 0xf59e0b);
        const headerBg = this.add.rectangle(0, -180, 560, 44, 0x1e1b4b, 1)
            .setStrokeStyle(1.5, 0x6366f1);
        const title = this.add.text(0, -180, '⚙️ PENGATURAN PERMAINAN', {
            fontSize: '17px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // 1. Audio BGM
        const bgmLabel = this.add.text(-240, -135, '🎵 Musik Latar (BGM):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const bgmBtn = this.add.rectangle(45, -126, 75, 26, GameAudio.bgmEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const bgmText = this.add.text(45, -126, GameAudio.bgmEnabled ? 'ON' : 'OFF', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const bgmMinusBtn = this.add.rectangle(105, -126, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const bgmMinusText = this.add.text(105, -126, '➖', { fontSize: '10px' }).setOrigin(0.5);

        const bgmVolText = this.add.text(152, -126, `${Math.round(GameAudio.bgmVolume * 100)}%`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#38bdf8', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const bgmPlusBtn = this.add.rectangle(200, -126, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const bgmPlusText = this.add.text(200, -126, '➕', { fontSize: '10px' }).setOrigin(0.5);

        bgmMinusBtn.on('pointerdown', () => {
            GameAudio.setBGMVolume(GameAudio.bgmVolume - 0.1);
            bgmVolText.setText(`${Math.round(GameAudio.bgmVolume * 100)}%`);
            GameAudio.playClick();
        });

        bgmPlusBtn.on('pointerdown', () => {
            GameAudio.setBGMVolume(GameAudio.bgmVolume + 0.1);
            bgmVolText.setText(`${Math.round(GameAudio.bgmVolume * 100)}%`);
            GameAudio.playClick();
        });

        bgmBtn.on('pointerdown', () => {
            GameAudio.bgmEnabled = !GameAudio.bgmEnabled;
            if (GameAudio.bgmEnabled) {
                GameAudio.startAmbientBGM();
                bgmBtn.setFillStyle(0x16a34a, 0.9);
                bgmText.setText('ON');
            } else {
                GameAudio.stopAmbientBGM();
                bgmBtn.setFillStyle(0xdc2626, 0.9);
                bgmText.setText('OFF');
            }
            GameAudio.updateGainValues();
            GameAudio.playClick();
        });

        // 2. Audio SFX
        const sfxLabel = this.add.text(-240, -97, '🔊 Efek Suara (SFX):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const sfxBtn = this.add.rectangle(45, -88, 75, 26, GameAudio.sfxEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const sfxText = this.add.text(45, -88, GameAudio.sfxEnabled ? 'ON' : 'OFF', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const sfxMinusBtn = this.add.rectangle(105, -88, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const sfxMinusText = this.add.text(105, -88, '➖', { fontSize: '10px' }).setOrigin(0.5);

        const sfxVolText = this.add.text(152, -88, `${Math.round(GameAudio.sfxVolume * 100)}%`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#4ade80', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const sfxPlusBtn = this.add.rectangle(200, -88, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const sfxPlusText = this.add.text(200, -88, '➕', { fontSize: '10px' }).setOrigin(0.5);

        sfxMinusBtn.on('pointerdown', () => {
            GameAudio.setSFXVolume(GameAudio.sfxVolume - 0.1);
            sfxVolText.setText(`${Math.round(GameAudio.sfxVolume * 100)}%`);
            GameAudio.playClick();
        });

        sfxPlusBtn.on('pointerdown', () => {
            GameAudio.setSFXVolume(GameAudio.sfxVolume + 0.1);
            sfxVolText.setText(`${Math.round(GameAudio.sfxVolume * 100)}%`);
            GameAudio.playClick();
        });

        sfxBtn.on('pointerdown', () => {
            GameAudio.sfxEnabled = !GameAudio.sfxEnabled;
            if (GameAudio.sfxEnabled) {
                sfxBtn.setFillStyle(0x16a34a, 0.9);
                sfxText.setText('ON');
                GameAudio.playClick();
            } else {
                sfxBtn.setFillStyle(0xdc2626, 0.9);
                sfxText.setText('OFF');
            }
            GameAudio.updateGainValues();
        });

        // 3. Ukuran Layar / Resolusi
        const resLabel = this.add.text(-240, -59, '🖥️ Resolusi Layar:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const resBtn = this.add.rectangle(110, -50, 190, 26, 0x1e3a8a, 0.95)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setInteractive({ useHandCursor: true });
        const resText = this.add.text(110, -50, DisplayManager.current.label, {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resBtn.on('pointerdown', () => {
            DisplayManager.cycleMode(this.scale);
            resText.setText(DisplayManager.current.label);
            GameAudio.playClick();
        });

        // Fullscreen Icon Button (Square)
        const fsBtn = this.add.rectangle(220, -50, 26, 26, 0x0f172a, 0.95)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setInteractive({ useHandCursor: true });
        const fsIcon = this.add.text(220, -50, '⛶', {
            fontSize: '14px', fill: '#38bdf8'
        }).setOrigin(0.5);

        fsBtn.on('pointerdown', () => {
            DisplayManager.toggleFullscreen(this.scale);
            GameAudio.playClick();
        });

        const isMobile = isMobileDevice();
        const modalHeight = isMobile ? 415 : 390;
        const dividerY = isMobile ? 7 : -21;
        const ctrlTitleY = isMobile ? 20 : -7;
        const ctrlListY = isMobile ? 35 : 8;
        const partY = isMobile ? 138 : 125;
        const closeY = isMobile ? 180 : 165;

        const elements = [
            modalBg, headerBg, title,
            bgmLabel, bgmBtn, bgmText, bgmMinusBtn, bgmMinusText, bgmVolText, bgmPlusBtn, bgmPlusText,
            sfxLabel, sfxBtn, sfxText, sfxMinusBtn, sfxMinusText, sfxVolText, sfxPlusBtn, sfxPlusText,
            resLabel, resBtn, resText, fsBtn, fsIcon
        ];

        modalBg.setSize(560, modalHeight);

        if (isMobile) {
            // 4. Tombol Layar HP (Touch Controls)
            const mobLabel = this.add.text(-240, -21, '📱 Tombol Layar HP (Touch):', {
                fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
            });
            const getSavedMob = () => {
                const s = localStorage.getItem('touchControlsEnabled');
                return s !== null ? s === 'true' : true;
            };
            let mobOn = getSavedMob();
            const mobBtn = this.add.rectangle(150, -12, 130, 26, mobOn ? 0x16a34a : 0xdc2626, 0.9)
                .setStrokeStyle(1.5, 0xffffff)
                .setInteractive({ useHandCursor: true });
            const mobText = this.add.text(150, -12, mobOn ? 'AKTIF [ON]' : 'MATI [OFF]', {
                fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
            }).setOrigin(0.5);

            mobBtn.on('pointerdown', () => {
                mobOn = !mobOn;
                this.registry.set('touchControlsEnabled', mobOn);
                try { localStorage.setItem('touchControlsEnabled', mobOn ? 'true' : 'false'); } catch (e) {}
                mobBtn.setFillStyle(mobOn ? 0x16a34a : 0xdc2626, 0.9);
                mobText.setText(mobOn ? 'AKTIF [ON]' : 'MATI [OFF]');
                GameAudio.playClick();
            });

            elements.push(mobLabel, mobBtn, mobText);
        }

        // 5. Visual Particles
        const partLabel = this.add.text(-240, partY, '✨ Partikel Kunang-kunang:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        let particlesOn = this.registry.get('particlesEnabled') !== false;
        const partBtn = this.add.rectangle(150, partY + 9, 130, 26, particlesOn ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const partText = this.add.text(150, partY + 9, particlesOn ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        partBtn.on('pointerdown', () => {
            particlesOn = !particlesOn;
            this.registry.set('particlesEnabled', particlesOn);
            this.particles.forEach(p => p.setVisible(particlesOn));
            partBtn.setFillStyle(particlesOn ? 0x16a34a : 0xdc2626, 0.9);
            partText.setText(particlesOn ? 'AKTIF [ON]' : 'MATI [OFF]');
            GameAudio.playClick();
        });

        // Controls Box
        const divider = this.add.rectangle(0, dividerY, 500, 1, 0x334155);
        const ctrlTitle = this.add.text(0, ctrlTitleY, '🎮 PANDUAN KONTROL & TOMBOL PERMAINAN', {
            fontSize: '12px', fontStyle: 'bold', fill: '#93c5fd', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        const ctrlListStr = isMobile
            ? '▶ [A] / [D] / [◀] [▶] : Bergerak ke Kiri / Kanan\n' +
              '▶ [W] / [SPASI] / [▲] : Melompat\n' +
              '▶ [E] / [⚡ AKSI]     : Berinteraksi / Ambil Barang / Dialog\n' +
              '▶ [I] / [Icon Tas]    : Buka / Tutup Tas Inventory\n' +
              '▶ [Q] / [Quest Bar]   : Buka Catatan Misi / Quest\n' +
              '▶ [📱 Icon HP]        : Tombol Sentuh On-Screen Pengguna Ponsel'
            : '▶ [A] / [D]        : Bergerak ke Kiri / Kanan\n' +
              '▶ [W] / [SPASI]    : Melompat\n' +
              '▶ [E]              : Berinteraksi dengan Karakter / Ambil Barang\n' +
              '▶ [I]              : Buka / Tutup Tas Inventory\n' +
              '▶ [Q]              : Buka Catatan Misi / Quest\n' +
              '▶ [ESC] / [S]      : Lewati Dialog Cerita';

        const ctrlList = this.add.text(-240, ctrlListY, ctrlListStr, {
            fontSize: '11px', fill: '#cbd5e1', fontFamily: FONT_BODY, lineSpacing: 3
        });

        // Close Button
        const closeBtn = this.add.rectangle(0, closeY, 180, 32, 0x2563eb, 0.95)
            .setStrokeStyle(2, 0x93c5fd)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(0, closeY, 'SIMPAN & TUTUP', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x3b82f6, 1));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x2563eb, 0.95));
        closeBtn.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettings(false);
        });

        elements.push(
            partLabel, partBtn, partText,
            divider, ctrlTitle, ctrlList,
            closeBtn, closeText
        );

        this.settingsBox.add(elements);
    }

    toggleSettings(open) {
        this.isSettingsOpen = open;
        this.settingsOverlay.setVisible(open);
        this.settingsBox.setVisible(open);
        if (open) {
            this.settingsBox.setScale(0.9);
            this.tweens.add({
                targets: this.settingsBox,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Back.out'
            });
        }
    }
}

// UI Base Helper for Scenes
