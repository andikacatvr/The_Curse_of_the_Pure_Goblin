import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { GameAudio } from '../audio/GameAudio.js';

export class IntroScene extends BaseScene {
    constructor() {
        super({ key: 'IntroScene' });
        this.currentSlide = 0;
    }

    create() {
        this.currentSlide = 0;
        this.cameras.main.setBackgroundColor('#0b1120');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        GameAudio.init();
        if (GameAudio.bgmEnabled && !GameAudio.bgmPlaying) {
            GameAudio.startAmbientBGM();
        }

        // 1. Atmosphere Background
        this.createAtmosphere();

        // 2. Storybook UI
        this.createStorybookUI();

        // 3. Keyboard Shortcuts
        this.input.keyboard.on('keydown-SPACE', () => this.nextSlide());
        this.input.keyboard.on('keydown-ENTER', () => this.nextSlide());
        this.input.keyboard.on('keydown-ESC', () => this.finishIntro());
    }

    createAtmosphere() {
        if (this.textures.exists('home_parallax_sky')) {
            const bg = this.add.image(400, 225, 'home_parallax_sky').setDisplaySize(1000, 450);
            this.tweens.add({
                targets: bg,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 9000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Dark Vignette
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(0x020617, 0x020617, 0x020617, 0x020617, 0.6, 0.6, 0.9, 0.9);
        vignette.fillRect(-100, 0, 1000, 450);

        // Golden floating dust
        for (let i = 0; i < 28; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(20, 780),
                Phaser.Math.Between(30, 420),
                Phaser.Math.FloatBetween(1.2, 3),
                Phaser.Utils.Array.GetRandom([0xfef08a, 0xfbbf24, 0x38bdf8, 0x6ee7b7]),
                Phaser.Math.FloatBetween(0.3, 0.8)
            );
            this.tweens.add({
                targets: p,
                y: p.y - Phaser.Math.Between(30, 60),
                x: p.x + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.8, to: 0.15 },
                duration: Phaser.Math.Between(3500, 6500),
                repeat: -1,
                yoyo: true,
                delay: i * 110,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createStorybookUI() {
        const old = document.getElementById('intro-storybook-overlay');
        if (old) old.remove();

        this.slides = [
            {
                badge: 'LEMBAH PEGUNUNGAN',
                badgeColor: '#f59e0b',
                icon: '🏡',
                title: 'Pondok Sunyi di Kaki Gunung',
                text: 'Jauh di pedalaman lereng pegunungan yang sunyi dan damai, hiduplah seorang pemuda berhati tulus bernama <strong style="color:#fef08a;">Aksel</strong>. Bersama Nenek Mary, ia mengurus sebuah pondok kecil dan merawat adik tercintanya, <strong style="color:#f472b6;">Rachael</strong>.'
            },
            {
                badge: 'KASIH SEORANG KAKAK',
                badgeColor: '#ec4899',
                icon: '🌸',
                title: 'Senyum Lembut Rachael',
                text: 'Sejak kecil, tubuh Rachael sangat rentan dan sering didera sakit parah. Bagi Aksel, tiada hal yang lebih berharga selain melihat senyum adiknya tetap bersinar. Apapun rintangannya, Aksel selalu siap melindungi keluarganya.'
            },
            {
                badge: 'SENJA YANG MENYENGAT',
                badgeColor: '#38bdf8',
                icon: '❄️',
                title: 'Udara Dingin Menjelang Malam',
                text: 'Sore ini, hawa dingin pegunungan menusuk tulang lebih tajam dari biasanya, sementara perapian di rumah hampir kehabisan kayu bakar. Dari teras depan, <strong style="color:#fbbf24;">Nenek Mary</strong> memanggil Aksel...'
            }
        ];

        const overlay = document.createElement('div');
        overlay.id = 'intro-storybook-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '24px 20px';
        overlay.style.background = 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.75) 0%, rgba(2, 6, 23, 0.92) 100%)';
        overlay.style.backdropFilter = 'blur(8px)';
        overlay.style.webkitBackdropFilter = 'blur(8px)';
        overlay.style.fontFamily = "'Fredoka', 'Outfit', sans-serif";
        overlay.style.color = '#f8fafc';
        overlay.style.animation = 'introFadeIn 0.8s ease-out forwards';

        const style = document.createElement('style');
        style.textContent = `
            @keyframes introFadeIn {
                from { opacity: 0; transform: scale(0.97); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes cardSlideIn {
                from { opacity: 0; transform: translateY(14px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .intro-card-box {
                background: rgba(30, 41, 59, 0.75);
                border: 1.5px solid rgba(251, 191, 36, 0.35);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 32px 28px;
                max-width: 640px;
                width: 100%;
                text-align: center;
                animation: cardSlideIn 0.5s ease-out;
            }
            .intro-next-btn {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #ffffff;
                font-weight: 700;
                font-size: 15px;
                padding: 12px 32px;
                border-radius: 9999px;
                border: 1px solid rgba(254, 240, 138, 0.5);
                box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .intro-next-btn:hover {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                transform: scale(1.04);
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
            }
            .intro-skip-btn {
                background: transparent;
                color: #94a3b8;
                font-weight: 600;
                font-size: 13px;
                padding: 8px 18px;
                border-radius: 9999px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .intro-skip-btn:hover {
                color: #f8fafc;
                border-color: rgba(251, 191, 36, 0.5);
                background: rgba(51, 65, 85, 0.5);
            }
            .intro-dot {
                width: 10px;
                height: 10px;
                border-radius: 9999px;
                background: rgba(148, 163, 184, 0.3);
                transition: all 0.3s ease;
            }
            .intro-dot.active {
                width: 26px;
                background: #fbbf24;
                box-shadow: 0 0 10px rgba(251, 191, 36, 0.6);
            }
        `;
        overlay.appendChild(style);

        // Header Title Tag
        const headerTag = document.createElement('div');
        headerTag.style.marginBottom = '20px';
        headerTag.innerHTML = `
            <div style="display: inline-block; padding: 5px 16px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.5); border-radius: 9999px; color: #fbbf24; font-size: 11px; font-weight: 700; letter-spacing: 2px;">
                ✦ PROLOG: AWAL SEBUAH PENGORBANAN ✦
            </div>
        `;
        overlay.appendChild(headerTag);

        // Card Container
        const cardBox = document.createElement('div');
        cardBox.className = 'intro-card-box';
        cardBox.id = 'intro-card-content';
        overlay.appendChild(cardBox);

        // Navigation Footer (Dots + Buttons)
        const footer = document.createElement('div');
        footer.style.marginTop = '24px';
        footer.style.display = 'flex';
        footer.style.flexDirection = 'column';
        footer.style.alignItems = 'center';
        footer.style.gap = '16px';
        footer.style.width = '100%';
        footer.style.maxWidth = '640px';

        // Dots Container
        const dotsBox = document.createElement('div');
        dotsBox.id = 'intro-dots';
        dotsBox.style.display = 'flex';
        dotsBox.style.gap = '8px';
        dotsBox.style.justifyContent = 'center';
        footer.appendChild(dotsBox);

        // Buttons Row
        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'space-between';
        btnRow.style.alignItems = 'center';
        btnRow.style.width = '100%';
        btnRow.style.padding = '0 10px';

        const skipBtn = document.createElement('button');
        skipBtn.className = 'intro-skip-btn';
        skipBtn.innerHTML = `Lewati ⏩ [ESC]`;
        skipBtn.onclick = () => {
            GameAudio.playClick();
            this.finishIntro();
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'intro-next-btn';
        nextBtn.id = 'intro-next-btn';
        nextBtn.innerHTML = `Lanjut ➔ [Spasi]`;
        nextBtn.onclick = () => {
            GameAudio.playClick();
            this.nextSlide();
        };

        btnRow.appendChild(skipBtn);
        btnRow.appendChild(nextBtn);
        footer.appendChild(btnRow);
        overlay.appendChild(footer);

        document.body.appendChild(overlay);
        this.introOverlay = overlay;

        this.renderCurrentSlide();

        this.events.once('shutdown', () => {
            if (this.introOverlay) {
                this.introOverlay.remove();
                this.introOverlay = null;
            }
        });
    }

    renderCurrentSlide() {
        const slide = this.slides[this.currentSlide];
        const cardBox = document.getElementById('intro-card-content');
        const dotsBox = document.getElementById('intro-dots');
        const nextBtn = document.getElementById('intro-next-btn');

        if (!cardBox || !slide) return;

        // Render card
        cardBox.style.animation = 'none';
        void cardBox.offsetWidth; // trigger reflow
        cardBox.style.animation = 'cardSlideIn 0.4s ease-out';

        cardBox.innerHTML = `
            <div style="font-size: 38px; margin-bottom: 8px;">${slide.icon}</div>
            <div style="display: inline-block; padding: 4px 14px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; color: ${slide.badgeColor}; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 12px; border: 1px solid ${slide.badgeColor}55;">
                ${slide.badge}
            </div>
            <h2 style="font-size: 24px; font-weight: 800; color: #fef08a; margin: 0 0 14px 0; text-shadow: 0 2px 8px rgba(254, 240, 138, 0.25);">
                ${slide.title}
            </h2>
            <p style="font-size: 16px; color: #e2e8f0; line-height: 1.7; margin: 0; max-width: 560px; margin-left: auto; margin-right: auto;">
                ${slide.text}
            </p>
        `;

        // Render dots
        if (dotsBox) {
            dotsBox.innerHTML = '';
            for (let i = 0; i < this.slides.length; i++) {
                const dot = document.createElement('div');
                dot.className = `intro-dot ${i === this.currentSlide ? 'active' : ''}`;
                dotsBox.appendChild(dot);
            }
        }

        // Update button text on last slide
        if (nextBtn) {
            if (this.currentSlide === this.slides.length - 1) {
                nextBtn.innerHTML = `Mulai Petualangan ✦ [Spasi]`;
            } else {
                nextBtn.innerHTML = `Lanjut ➔ [Spasi]`;
            }
        }
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.renderCurrentSlide();
        } else {
            this.finishIntro();
        }
    }

    finishIntro() {
        if (this.isFinishing) return;
        this.isFinishing = true;

        if (this.introOverlay) {
            this.introOverlay.style.transition = 'opacity 0.6s ease';
            this.introOverlay.style.opacity = '0';
        }

        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.time.delayedCall(750, () => {
            if (this.introOverlay) {
                this.introOverlay.remove();
                this.introOverlay = null;
            }
            this.scene.start('HomeScene', { introCutscene: true });
        });
    }
}
