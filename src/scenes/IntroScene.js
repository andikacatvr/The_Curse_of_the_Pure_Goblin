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

        // 1. Atmosphere: Aksel & Rachael's Cottage House + Glowing Fireflies
        this.createAtmosphere();

        // 2. Vintage Scroll Paper Storybook UI with Backdrop Blur
        this.createStorybookUI();

        // 3. Keyboard Shortcuts
        this.input.keyboard.on('keydown-SPACE', () => this.handleProceed());
        this.input.keyboard.on('keydown-ENTER', () => this.handleProceed());
        this.input.keyboard.on('keydown-ESC', () => this.finishIntro());
    }

    createAtmosphere() {
        // Multi-Layer Cottage Background
        // Layer 0: Sky & Mountains
        if (this.textures.exists('home_parallax_sky')) {
            const sky = this.add.image(400, 215, 'home_parallax_sky').setDisplaySize(1000, 460);
            this.tweens.add({
                targets: sky,
                scaleX: 1.04,
                scaleY: 1.04,
                duration: 9000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Layer 1: Midground Rolling Pine Forests
        if (this.textures.exists('home_parallax_mid')) {
            this.add.image(400, 215, 'home_parallax_mid').setDisplaySize(1000, 460);
        }

        // Layer 2: Framing Forest Trees
        if (this.textures.exists('home_parallax_trees')) {
            this.add.image(400, 215, 'home_parallax_trees').setDisplaySize(1000, 460);
        }

        // Ground Sprites across width
        if (this.textures.exists('tanah_home')) {
            for (let gx = -100; gx <= 900; gx += 385) {
                const groundSprite = this.add.image(gx, 418, 'tanah_home');
                groundSprite.setOrigin(0, 117 / 250);
                groundSprite.setScale(386 / 770);
            }
        }

        // Aksel & Rachael's Cottage House (Centered)
        if (this.textures.exists('building_rumah')) {
            const house = this.add.image(400, 418, 'building_rumah');
            house.setOrigin(0.5, 1);
            const scale = 360 / house.width;
            house.setScale(scale);

            // Gentle Chimney Smoke Puffs
            const smokeX = 400 - (house.displayWidth / 2) + (60 * scale);
            const smokeY = 418 - house.displayHeight + (18 * scale);
            for (let i = 0; i < 4; i++) {
                const smoke = this.add.circle(smokeX, smokeY, 6 + i * 2, 0xe2e8f0, 0.4);
                this.tweens.add({
                    targets: smoke,
                    x: { from: smokeX, to: smokeX + 26 + i * 15 },
                    y: { from: smokeY, to: smokeY - 56 },
                    scale: { from: 0.8, to: 2.2 },
                    alpha: { from: 0.45, to: 0 },
                    duration: 3200 + i * 600,
                    delay: i * 900,
                    repeat: -1,
                    ease: 'Sine.easeOut'
                });
            }

            // Warm Window Glow
            const winGlow = this.add.circle(320, 350, 32, 0xfbbf24, 0.16);
            this.tweens.add({
                targets: winGlow,
                alpha: { from: 0.12, to: 0.28 },
                duration: 2200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Ambient Dark Vignette
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(0x020617, 0x020617, 0x020617, 0x020617, 0.4, 0.4, 0.8, 0.8);
        vignette.fillRect(-100, 0, 1000, 450);

        // Canvas Level Fireflies (Kunang-Kunang Lembah)
        for (let i = 0; i < 26; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(60, 420);
            const firefly = this.add.circle(fx, fy, Phaser.Math.FloatBetween(2, 3.5), 0xfef08a, 0.95);
            const glow = this.add.circle(fx, fy, Phaser.Math.Between(8, 14), 0xa3e635, 0.35);

            this.tweens.add({
                targets: [firefly, glow],
                x: fx + Phaser.Math.Between(-35, 35),
                y: fy + Phaser.Math.Between(-30, 30),
                alpha: { from: 0.25, to: 1 },
                scale: { from: 0.7, to: 1.35 },
                duration: Phaser.Math.Between(2200, 4000),
                repeat: -1,
                yoyo: true,
                delay: i * 140,
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
        overlay.style.padding = '14px';
        overlay.style.overflowX = 'hidden';
        overlay.style.overflowY = 'auto';
        overlay.style.webkitOverflowScrolling = 'touch';
        // Cinematic Depth of Field: Soft Blur showing the house behind!
        overlay.style.background = 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.4) 0%, rgba(3, 7, 18, 0.8) 100%)';
        overlay.style.backdropFilter = 'blur(7px) saturate(1.15)';
        overlay.style.webkitBackdropFilter = 'blur(7px) saturate(1.15)';
        overlay.style.fontFamily = "'Fredoka', 'Georgia', serif, sans-serif";
        overlay.style.color = '#381e05';
        overlay.style.animation = 'introFadeIn 0.8s ease-out forwards';
        overlay.style.boxSizing = 'border-box';

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
            @keyframes fireflyFloat {
                0% {
                    transform: translate(0, 0) scale(0.8);
                    opacity: 0.2;
                }
                50% {
                    transform: translate(var(--dx), var(--dy)) scale(1.3);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--dx2), var(--dy2)) scale(0.65);
                    opacity: 0.15;
                }
            }

            /* Floating Fireflies (Kunang-Kunang) in Overlay */
            .dom-firefly {
                position: absolute;
                border-radius: 50%;
                background: #fef08a;
                box-shadow: 0 0 8px #facc15, 0 0 16px #84cc16;
                pointer-events: none;
                z-index: 99;
                animation: fireflyFloat var(--dur) ease-in-out infinite alternate;
            }

            .intro-header-tag {
                margin-bottom: 12px;
                display: inline-block;
                padding: 4px 16px;
                background: rgba(15, 23, 42, 0.65);
                border: 1.5px solid rgba(245, 158, 11, 0.6);
                border-radius: 9999px;
                color: #fbbf24;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 2px;
                backdrop-filter: blur(6px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            }

            /* Scroll Wrapper Container */
            .scroll-wrapper {
                position: relative;
                max-width: 640px;
                width: 95%;
                display: flex;
                flex-direction: column;
                align-items: center;
                filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.85));
                animation: scrollUnroll 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 10;
                margin: auto 0;
            }

            /* Top and Bottom Wooden Rollers */
            .scroll-roller {
                width: calc(100% + 30px);
                height: 20px;
                background: linear-gradient(90deg, #3f1d0b 0%, #78350f 18%, #b45309 50%, #78350f 82%, #3f1d0b 100%);
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.7), inset 0 2px 2px rgba(254, 240, 138, 0.4);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 4px;
                position: relative;
                z-index: 12;
                box-sizing: border-box;
            }
            .scroll-finial {
                width: 12px;
                height: 22px;
                background: radial-gradient(circle at 35% 35%, #fde047 0%, #d97706 60%, #451a03 100%);
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
            }
            .scroll-roller-bar {
                flex: 1;
                height: 3px;
                background: rgba(254,240,138,0.25);
                margin: 0 10px;
                border-radius: 2px;
            }

            /* Ancient Parchment Paper Body */
            .scroll-paper {
                width: 100%;
                background: linear-gradient(180deg, #fef3c7 0%, #fae8b4 10%, #fef3c7 50%, #f8e1a0 90%, #ecd083 100%);
                box-shadow: inset 0 0 35px rgba(180, 83, 9, 0.28), inset 0 0 10px rgba(69, 26, 3, 0.16);
                border-left: 3px solid #b45309;
                border-right: 3px solid #b45309;
                padding: 18px 24px 20px 24px;
                position: relative;
                z-index: 11;
                box-sizing: border-box;
                margin: -2px 0;
            }

            /* Ornamental Inner Border on Paper */
            .scroll-inner-frame {
                border: 1.5px dashed rgba(180, 83, 9, 0.45);
                border-radius: 8px;
                padding: 14px 16px;
                background: rgba(255, 251, 235, 0.45);
                text-align: center;
                position: relative;
            }

            .slide-icon {
                font-size: 28px;
                margin-bottom: 4px;
                line-height: 1;
            }
            .slide-badge {
                display: inline-block;
                padding: 3px 12px;
                background: rgba(180, 83, 9, 0.12);
                border-radius: 9999px;
                font-size: 10.5px;
                font-weight: 800;
                letter-spacing: 1.2px;
                margin-bottom: 8px;
                border: 1px solid rgba(180, 83, 9, 0.3);
            }
            .slide-title {
                font-size: 20px;
                font-weight: 800;
                color: #78350f;
                margin: 0 0 10px 0;
                text-shadow: 0 1px 2px rgba(254, 240, 138, 0.8);
                font-family: 'Fredoka', 'Cinzel', serif;
            }
            .slide-text {
                font-size: 15px;
                color: #381e05;
                line-height: 1.6;
                min-height: 56px;
                max-width: 540px;
                margin: 0 auto;
                text-align: center;
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
            .intro-footer {
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                width: 100%;
                max-width: 640px;
                z-index: 20;
            }
            .intro-dots {
                display: flex;
                gap: 7px;
                justify-content: center;
            }
            .intro-btn-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                padding: 0 6px;
                box-sizing: border-box;
            }
            .intro-next-btn {
                background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                color: #ffffff;
                font-weight: 700;
                font-size: 14px;
                padding: 9px 24px;
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
                font-size: 12.5px;
                padding: 7px 16px;
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
                width: 9px;
                height: 9px;
                border-radius: 9999px;
                background: rgba(254, 243, 199, 0.35);
                border: 1px solid rgba(180, 83, 9, 0.4);
                transition: all 0.3s ease;
            }
            .intro-dot.active {
                width: 22px;
                background: #f59e0b;
                box-shadow: 0 0 10px rgba(245, 158, 11, 0.7);
                border-color: #fef08a;
            }

            /* === MOBILE LANDSCAPE ADAPTATION (Height <= 480px, e.g. Phone Landscape) === */
            @media (max-height: 480px) {
                #intro-storybook-overlay {
                    padding: 4px 10px !important;
                    justify-content: center !important;
                }
                .intro-header-tag {
                    display: none !important;
                }
                .scroll-wrapper {
                    max-width: 580px !important;
                    width: 98% !important;
                }
                .scroll-roller {
                    height: 12px !important;
                    width: calc(100% + 16px) !important;
                    border-radius: 6px !important;
                }
                .scroll-finial {
                    width: 8px !important;
                    height: 14px !important;
                    border-radius: 3px !important;
                }
                .scroll-paper {
                    padding: 6px 14px 6px 14px !important;
                }
                .scroll-inner-frame {
                    padding: 5px 10px !important;
                    border-width: 1px !important;
                }
                .slide-icon {
                    font-size: 18px !important;
                    margin-bottom: 1px !important;
                }
                .slide-badge {
                    font-size: 9px !important;
                    padding: 1.5px 8px !important;
                    margin-bottom: 3px !important;
                    letter-spacing: 0.8px !important;
                }
                .slide-title {
                    font-size: 14px !important;
                    margin: 0 0 3px 0 !important;
                }
                .slide-text {
                    font-size: 12px !important;
                    line-height: 1.35 !important;
                    min-height: 38px !important;
                    max-width: 530px !important;
                }
                .intro-footer {
                    margin-top: 5px !important;
                    gap: 4px !important;
                    max-width: 580px !important;
                }
                .intro-dot {
                    width: 6px !important;
                    height: 6px !important;
                }
                .intro-dot.active {
                    width: 16px !important;
                }
                .intro-next-btn {
                    font-size: 11px !important;
                    padding: 5px 16px !important;
                    gap: 5px !important;
                }
                .intro-skip-btn {
                    font-size: 10.5px !important;
                    padding: 4px 12px !important;
                }
            }

            /* === MOBILE PORTRAIT ADAPTATION (Width <= 520px) === */
            @media (max-width: 520px) and (min-height: 481px) {
                #intro-storybook-overlay {
                    padding: 14px 10px !important;
                }
                .intro-header-tag {
                    font-size: 10px !important;
                    letter-spacing: 1px !important;
                    padding: 4px 12px !important;
                }
                .scroll-wrapper {
                    width: 98% !important;
                }
                .scroll-roller {
                    width: calc(100% + 14px) !important;
                }
                .scroll-paper {
                    padding: 16px 14px 18px 14px !important;
                }
                .scroll-inner-frame {
                    padding: 14px 10px !important;
                }
                .slide-icon {
                    font-size: 26px !important;
                }
                .slide-title {
                    font-size: 17px !important;
                }
                .slide-text {
                    font-size: 13.5px !important;
                    line-height: 1.5 !important;
                }
                .intro-next-btn {
                    font-size: 12.5px !important;
                    padding: 8px 18px !important;
                }
                .intro-skip-btn {
                    font-size: 11.5px !important;
                }
            }
        `;
        overlay.appendChild(style);

        // Spawn Magical Fireflies in the DOM Overlay around the screen
        for (let f = 0; f < 20; f++) {
            const fly = document.createElement('div');
            fly.className = 'dom-firefly';
            const size = Math.random() * 3 + 3.5;
            fly.style.width = `${size}px`;
            fly.style.height = `${size}px`;
            fly.style.left = `${Math.random() * 94 + 3}%`;
            fly.style.top = `${Math.random() * 90 + 5}%`;
            fly.style.setProperty('--dx', `${(Math.random() - 0.5) * 70}px`);
            fly.style.setProperty('--dy', `${(Math.random() - 0.5) * 60}px`);
            fly.style.setProperty('--dx2', `${(Math.random() - 0.5) * 90}px`);
            fly.style.setProperty('--dy2', `${(Math.random() - 0.5) * 80}px`);
            fly.style.setProperty('--dur', `${Math.random() * 3 + 2.5}s`);
            fly.style.animationDelay = `${Math.random() * 2}s`;
            overlay.appendChild(fly);
        }

        // Header Tag
        const headerTag = document.createElement('div');
        headerTag.className = 'intro-header-tag';
        headerTag.innerHTML = `📜 KISAH AWAL SANG GOBLIN MURNI 📜`;
        overlay.appendChild(headerTag);

        // Scroll Parchment Wrapper
        const scrollWrapper = document.createElement('div');
        scrollWrapper.className = 'scroll-wrapper';
        scrollWrapper.innerHTML = `
            <!-- Top Roller -->
            <div class="scroll-roller">
                <div class="scroll-finial"></div>
                <div class="scroll-roller-bar"></div>
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
                <div class="scroll-roller-bar"></div>
                <div class="scroll-finial"></div>
            </div>
        `;
        overlay.appendChild(scrollWrapper);

        // Navigation Footer
        const footer = document.createElement('div');
        footer.className = 'intro-footer';

        // Dots Container
        const dotsBox = document.createElement('div');
        dotsBox.id = 'intro-dots';
        dotsBox.className = 'intro-dots';
        footer.appendChild(dotsBox);

        // Buttons Row
        const btnRow = document.createElement('div');
        btnRow.className = 'intro-btn-row';

        const skipBtn = document.createElement('button');
        skipBtn.className = 'intro-skip-btn';
        skipBtn.innerHTML = `Lewati ⏩`;
        skipBtn.onclick = () => {
            GameAudio.playClick();
            this.finishIntro();
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'intro-next-btn';
        nextBtn.id = 'intro-next-btn';
        nextBtn.innerHTML = `Lanjut ➔`;
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

        // Render Slide Header (Icon, Badge, Title) using responsive classes
        frame.innerHTML = `
            <div class="slide-icon">${slide.icon}</div>
            <div class="slide-badge" style="color: ${slide.badgeColor};">
                ${slide.badge}
            </div>
            <h2 class="slide-title">
                ${slide.title}
            </h2>
            <div id="typewriter-text-target" class="slide-text">
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
                nextBtn.innerHTML = `Mulai Petualangan ✦`;
            } else {
                nextBtn.innerHTML = `Lanjut ➔`;
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
            this.completeTyping();
        } else {
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
