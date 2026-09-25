import Phaser from 'phaser';
import { FONT_TITLE, FONT_BODY, isMobileDevice } from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';
import { DisplayManager } from '../utils/DisplayManager.js';
import { HDHudManager } from '../utils/HDHudManager.js';
import { HDSettingsModal } from '../utils/HDSettingsModal.js';
import { HDMenuButtons } from '../utils/HDMenuButtons.js';

export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        HDHudManager.hideTopHUD();
        this.isSettingsOpen = false;
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
        this.bg = this.add.image(400, 225, bgKey).setDisplaySize(1100, 450);

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
        vignette.fillRect(-200, 0, 1200, 450);

        // Ambient Magical Fireflies / Glowing Particles
        this.createParticles();

        // 2. Title Banner (The uploaded user image)
        // Golden glowing halo behind the scroll
        this.glowHalo = this.add.graphics();
        this.glowHalo.fillStyle(0xf59e0b, 0.16);
        this.glowHalo.fillCircle(400, 110, 120);
        this.glowHalo.fillStyle(0x38bdf8, 0.1);
        this.glowHalo.fillCircle(400, 110, 150);

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
        this.banner = this.add.image(400, 110, 'title_banner')
            .setOrigin(0.5, 0.5)
            .setScale(1.05);

        // Floating Bobbing Animation
        this.tweens.add({
            targets: this.banner,
            y: 116,
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Interactive HTML Buttons (Play & Settings)
        HDMenuButtons.show({
            onPlay: () => {
                if (!this.isSettingsOpen) this.startGame();
            },
            onSettings: () => {
                this.toggleSettingsModal(true);
            }
        });

        // Keyboard navigation
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isSettingsOpen) this.startGame();
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            if (!this.isSettingsOpen) this.startGame();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isSettingsOpen) this.toggleSettingsModal(false);
        });

        // Camera Fade In
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Cleanup HTML buttons when leaving this scene
        this.events.on('shutdown', () => {
            HDMenuButtons.hide();
        });
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

    startGame() {
        if (this.isSettingsOpen) this.toggleSettingsModal(false);
        HDMenuButtons.fadeOut(400);
        GameAudio.playStart();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(450, () => {
            HDMenuButtons.hide();
            this.scene.start('IntroScene');
        });
    }

    toggleSettingsModal(forceState = null) {
        const nextState = forceState !== null ? forceState : !this.isSettingsOpen;
        this.isSettingsOpen = nextState;
        if (nextState) {
            HDSettingsModal.show(this);
        } else {
            HDSettingsModal.hide();
        }
    }
}

// UI Base Helper for Scenes
