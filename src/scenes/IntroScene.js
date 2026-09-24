import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { GameAudio } from '../audio/GameAudio.js';

export class IntroScene extends BaseScene {
    constructor() {
        super({ key: 'IntroScene' });
        this.currentSlide = 0;
        this.isTyping = false;
        this.typingInterval = null;
    }

    create() {
        this.currentSlide = 0;
        this.isTyping = false;
        this.cameras.main.setBackgroundColor('#090d16');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        GameAudio.init();
        if (GameAudio.bgmEnabled && !GameAudio.bgmPlaying) {
            GameAudio.startAmbientBGM();
        }

        // 1. Dreamy Atmosphere Background
        this.createAtmosphere();

        // 2. Vintage Scroll Paper Storybook UI
        this.createStorybookUI();

        // 3. Keyboard Shortcuts
        this.input.keyboard.on('keydown-SPACE', () => this.handleProceed());
        this.input.keyboard.on('keydown-ENTER', () => this.handleProceed());
        this.input.keyboard.on('keydown-ESC', () => this.finishIntro());
    }

    createAtmosphere() {
        if (this.textures.exists('home_parallax_sky')) {
            const bg = this.add.image(400, 225, 'home_parallax_sky').setDisplaySize(1000, 450);
            this.tweens.add({
                targets: bg,
                scaleX: 1.06,
                scaleY: 1.06,
                duration: 10000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Dark Vignette
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(0x020617, 0x020617, 0x020617, 0x020617, 0.5, 0.5, 0.85, 0.85);
        vignette.fillRect(-100, 0, 1000, 450);

        // Golden & Magical floating dust
        for (let i = 0; i < 30; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(20, 780),
                Phaser.Math.Between(30, 420),
                Phaser.Math.FloatBetween(1.2, 3),
                Phaser.Utils.Array.GetRandom([0xfef08a, 0xfbbf24, 0x38bdf8, 0xa78bfa]),
                Phaser.Math.FloatBetween(0.25, 0.8)
            );
            this.tweens.add({
                targets: p,
                y: p.y - Phaser.Math.Between(30, 65),
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
                badge: '✦ BAB PROLOG: LEMBAH PEGUNUNGAN ✦',
                badgeColor: '#92400e',
                icon: '🏡',
                title: 'Pondok Sunyi di Kaki Gunung',
                text: 'Jauh di pedalaman lereng pegunungan yang sunyi dan damai, hiduplah seorang pemuda berhati tulus bernama <strong style="color:#b45309; font-weight:700;">Aksel</strong>. Bersama <strong style="color:#92400e; font-weight:700;">Nenek Linda</strong>, ia mengurus sebuah pondok kecil dan merawat adik tercintanya, <strong style="color:#be123c; font-weight:700;">Rachael</strong>.'
            },
            {
                badge: '✦ KASIH SEORANG KAKAK ✦',
                badgeColor: '#be123c',
                icon: '🌸',
                title: 'Senyum Lembut Rachael',
                text: 'Sejak kecil, tubuh <strong style="color:#be123c; font-weight:700;">Rachael</strong> sangat rentan dan sering didera sakit parah. Bagi <strong style="color:#b45309; font-weight:700;">Aksel</strong>, tiada hal yang lebih berharga selain melihat senyum adiknya tetap bersinar. Apapun rintangannya, ia berjanji akan selalu melindungi keluarganya.'
            },
            {
                badge: '✦ SENJA YANG DINGIN ✦',
                badgeColor: '#1e3a8a',
                icon: '❄️',
                title: 'Udara Beku Menjelang Malam',
                text: 'Sore ini, hawa dingin pegunungan menusuk tulang lebih tajam dari biasanya, sementara perapian di rumah hampir kehabisan kayu bakar. Dari teras depan, <strong style="color:#92400e; font-weight:700;">Nenek Linda</strong> memanggil <strong style="color:#b45309; font-weight:700;">Aksel</strong>...'
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
        overlay.style.padding = '20px';
        // Dreamy Cinematic Blur Backdrop
        overlay.style.background = 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.45) 0%, rgba(2, 6, 23, 0.88) 100%)';
        overlay.style.backdropFilter = 'blur(16px) saturate(1.2)';
        overlay.style.webkitBackdropFilter = 'blur(16px) saturate(1.2)';
        overlay.style.fontFamily = "'Fredoka', 'Georgia', serif, sans-serif";
        overlay.style.color = '#381e05';
        overlay.style.animation = 'introFadeIn 0.8s ease-out forwards';

        const style = document.createElement('style');
        style.textContent = `
            @keyframes introFadeIn {
                from { opacity: 0; transform: scale(0.96); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes scrollUnroll {
                from { opacity: 0; transform: scaleY(0.85); }
                to { opacity: 1; transform: scaleY(1); }
            }
            @keyframes cursorBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }

            /* Scroll Wrapper Container */
            .scroll-wrapper {
                position: relative;
                max-width: 660px;
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.85));
                animation: scrollUnroll 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Top and Bottom Wooden Rollers */
            .scroll-roller {
                width: calc(100% + 40px);
                height: 24px;
                background: linear-gradient(90deg, #3f1d0b 0%, #78350f 18%, #b45309 50%, #78350f 82%, #3f1d0b 100%);
                border-radius: 12px;
                box-shadow: 0 5px 12px rgba(0, 0, 0, 0.7), inset 0 2px 2px rgba(254, 240, 138, 0.4);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 4px;
                position: relative;
                z-index: 3;
                box-sizing: border-box;
            }
            .scroll-finial {
                width: 14px;
                height: 26px;
                background: radial-gradient(circle at 35% 35%, #fde047 0%, #d97706 60%, #451a03 100%);
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
            }

            /* Ancient Parchment Paper Body */
            .scroll-paper {
                width: 100%;
                background: linear-gradient(180deg, #fef3c7 0%, #fae8b4 10%, #fef3c7 50%, #f8e1a0 90%, #ecd083 100%);
                box-shadow: inset 0 0 45px rgba(180, 83, 9, 0.3), inset 0 0 12px rgba(69, 26, 3, 0.18);
                border-left: 3px solid #b45309;
                border-right: 3px solid #b45309;
                padding: 26px 32px 30px 32px;
                position: relative;
                z-index: 2;
                box-sizing: border-box;
                margin: -2px 0;
            }

            /* Ornamental Inner Border on Paper */
            .scroll-inner-frame {
                border: 2px dashed rgba(180, 83, 9, 0.45);
                border-radius: 10px;
                padding: 22px 20px;
                background: rgba(255, 251, 235, 0.45);
                text-align: center;
                position: relative;
            }

            /* Typewriter Cursor */
            .type-cursor {
                display: inline-block;
                color: #b45309;
                font-weight: 800;
                margin-left: 2px;
                animation: cursorBlink 0.7s infinite;
            }

            /* Buttons */
            .intro-next-btn {
                background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                color: #ffffff;
                font-weight: 700;
                font-size: 15px;
                padding: 12px 32px;
                border-radius: 9999px;
                border: 1px solid rgba(254, 240, 138, 0.6);
                box-shadow: 0 4px 15px rgba(180, 83, 9, 0.5);
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .intro-next-btn:hover {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                transform: scale(1.04);
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
            }
            .intro-skip-btn {
                background: rgba(30, 41, 59, 0.6);
                color: #f1f5f9;
                font-weight: 600;
                font-size: 13px;
                padding: 8px 18px;
                border-radius: 9999px;
                border: 1px solid rgba(251, 191, 36, 0.35);
                backdrop-filter: blur(8px);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .intro-skip-btn:hover {
                color: #ffffff;
                border-color: rgba(251, 191, 36, 0.7);
                background: rgba(51, 65, 85, 0.8);
                transform: scale(1.03);
            }
            .intro-dot {
                width: 10px;
                height: 10px;
                border-radius: 9999px;
                background: rgba(254, 243, 199, 0.35);
                border: 1px solid rgba(180, 83, 9, 0.4);
                transition: all 0.3s ease;
            }
            .intro-dot.active {
                width: 26px;
                background: #f59e0b;
                box-shadow: 0 0 10px rgba(245, 158, 11, 0.7);
                border-color: #fef08a;
            }
        `;
        overlay.appendChild(style);

        // Header Tag
        const headerTag = document.createElement('div');
        headerTag.style.marginBottom = '18px';
        headerTag.innerHTML = `
            <div style="display: inline-block; padding: 5px 18px; background: rgba(15, 23, 42, 0.6); border: 1.5px solid rgba(245, 158, 11, 0.6); border-radius: 9999px; color: #fbbf24; font-size: 11px; font-weight: 700; letter-spacing: 2px; backdrop-filter: blur(6px); box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                📜 KISAH AWAL SANG GOBLIN MURNI 📜
            </div>
        `;
        overlay.appendChild(headerTag);

        // Scroll Parchment Wrapper
        const scrollWrapper = document.createElement('div');
        scrollWrapper.className = 'scroll-wrapper';
        scrollWrapper.innerHTML = `
            <!-- Top Roller -->
            <div class="scroll-roller">
                <div class="scroll-finial"></div>
                <div style="flex:1; height:4px; background:rgba(254,240,138,0.25); margin:0 12px; border-radius:2px;"></div>
                <div class="scroll-finial"></div>
            </div>

            <!-- Paper Body -->
            <div class="scroll-paper">
                <div class="scroll-inner-frame" id="scroll-frame-content">
                    <!-- Dynamic Slide Content -->
                </div>
            </div>

            <!-- Bottom Roller -->
            <div class="scroll-roller">
                <div class="scroll-finial"></div>
                <div style="flex:1; height:4px; background:rgba(254,240,138,0.25); margin:0 12px; border-radius:2px;"></div>
                <div class="scroll-finial"></div>
            </div>
        `;
        overlay.appendChild(scrollWrapper);

        // Navigation Footer
        const footer = document.createElement('div');
        footer.style.marginTop = '22px';
        footer.style.display = 'flex';
        footer.style.flexDirection = 'column';
        footer.style.alignItems = 'center';
        footer.style.gap = '14px';
        footer.style.width = '100%';
        footer.style.maxWidth = '660px';

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
            this.handleProceed();
        };

        btnRow.appendChild(skipBtn);
        btnRow.appendChild(nextBtn);
        footer.appendChild(btnRow);
        overlay.appendChild(footer);

        document.body.appendChild(overlay);
        this.introOverlay = overlay;

        this.renderCurrentSlide();

        this.events.once('shutdown', () => {
            this.clearTyping();
            if (this.introOverlay) {
                this.introOverlay.remove();
                this.introOverlay = null;
            }
        });
    }

    renderCurrentSlide() {
        this.clearTyping();

        const slide = this.slides[this.currentSlide];
        const frame = document.getElementById('scroll-frame-content');
        const dotsBox = document.getElementById('intro-dots');
        const nextBtn = document.getElementById('intro-next-btn');

        if (!frame || !slide) return;

        // Render Slide Header (Icon, Badge, Title)
        frame.innerHTML = `
            <div style="font-size: 34px; margin-bottom: 6px;">${slide.icon}</div>
            <div style="display: inline-block; padding: 4px 14px; background: rgba(180, 83, 9, 0.12); border-radius: 9999px; color: ${slide.badgeColor}; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 10px; border: 1px solid rgba(180, 83, 9, 0.3);">
                ${slide.badge}
            </div>
            <h2 style="font-size: 24px; font-weight: 800; color: #78350f; margin: 0 0 14px 0; text-shadow: 0 1px 2px rgba(254, 240, 138, 0.8); font-family: 'Fredoka', 'Cinzel', serif;">
                ${slide.title}
            </h2>
            <div id="typewriter-text-target" style="font-size: 16.5px; color: #381e05; line-height: 1.75; min-height: 72px; max-width: 560px; margin: 0 auto; text-align: center;">
            </div>
        `;

        // Render Dots
        if (dotsBox) {
            dotsBox.innerHTML = '';
            for (let i = 0; i < this.slides.length; i++) {
                const dot = document.createElement('div');
                dot.className = `intro-dot ${i === this.currentSlide ? 'active' : ''}`;
                dotsBox.appendChild(dot);
            }
        }

        // Update button text
        if (nextBtn) {
            if (this.currentSlide === this.slides.length - 1) {
                nextBtn.innerHTML = `Mulai Petualangan ✦ [Spasi]`;
            } else {
                nextBtn.innerHTML = `Lanjut ➔ [Spasi]`;
            }
        }

        // Start Typewriter on the target element
        const targetEl = document.getElementById('typewriter-text-target');
        if (targetEl) {
            this.startTypewriter(targetEl, slide.text);
        }
    }

    startTypewriter(container, htmlContent) {
        this.clearTyping();
        this.isTyping = true;
        this.typingContainer = container;

        // Populate HTML in container
        container.innerHTML = htmlContent;

        // Wrap each character inside all text nodes with a transparent span
        const textNodes = [];
        const walkNodes = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.nodeValue.length > 0) textNodes.push(node);
            } else {
                for (let child of Array.from(node.childNodes)) {
                    walkNodes(child);
                }
            }
        };
        walkNodes(container);

        this.charSpans = [];
        textNodes.forEach(textNode => {
            const str = textNode.nodeValue;
            const frag = document.createDocumentFragment();
            for (let i = 0; i < str.length; i++) {
                const sp = document.createElement('span');
                sp.textContent = str[i];
                sp.style.opacity = '0';
                sp.style.transition = 'opacity 0.04s ease';
                frag.appendChild(sp);
                this.charSpans.push(sp);
            }
            textNode.parentNode.replaceChild(frag, textNode);
        });

        // Add trailing blinking typewriter cursor
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';
        cursor.textContent = '|';
        container.appendChild(cursor);
        this.typeCursor = cursor;

        let charIdx = 0;
        const totalChars = this.charSpans.length;

        this.typingInterval = setInterval(() => {
            if (charIdx >= totalChars) {
                this.completeTyping();
                return;
            }

            const curSpan = this.charSpans[charIdx];
            if (curSpan) {
                curSpan.style.opacity = '1';
                // Move cursor after current span
                curSpan.after(cursor);
            }

            charIdx++;
        }, 22);
    }

    completeTyping() {
        this.clearTyping();
        this.isTyping = false;
        if (this.charSpans) {
            this.charSpans.forEach(sp => {
                sp.style.opacity = '1';
            });
        }
        if (this.typeCursor) {
            this.typeCursor.style.opacity = '0';
        }
    }

    clearTyping() {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
    }

    handleProceed() {
        GameAudio.playClick();
        if (this.isTyping) {
            // First click skips the typing animation to show the full text instantly
            this.completeTyping();
        } else {
            // Second click proceeds to the next slide
            this.nextSlide();
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

        this.clearTyping();

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
