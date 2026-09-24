import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { GameAudio } from '../audio/GameAudio.js';
import { getInventory, resetGameState } from '../utils/gameState.js';

export class EndingScene extends BaseScene {
    constructor() {
        super({ key: 'EndingScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#090d16');
        this.cameras.main.fadeIn(1500, 0, 0, 0);

        // Warm ambient audio
        GameAudio.init();
        if (GameAudio.bgmEnabled && !GameAudio.bgmPlaying) {
            GameAudio.startAmbientBGM();
        }

        // Atmospheric background with evening stars & fireflies
        this.createEndingAtmosphere();

        // High-Definition Ending Credits Overlay
        this.createCreditsOverlay();
    }

    createEndingAtmosphere() {
        // Deep twilight mountain panorama
        if (this.textures.exists('home_village_bg')) {
            this.createSeamlessBackground('home_village_bg', 0, 1100, 450);
        }

        // Dark gradient cinematic tint
        const tint = this.add.rectangle(400, 225, 800, 450, 0x050814, 0.72).setDepth(1);

        // Golden floating stardust & fireflies
        for (let i = 0; i < 35; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(20, 780),
                Phaser.Math.Between(30, 420),
                Phaser.Math.FloatBetween(1.2, 3),
                Phaser.Utils.Array.GetRandom([0xfef08a, 0xfbbf24, 0xa855f7, 0x67e8f9]),
                Phaser.Math.FloatBetween(0.3, 0.85)
            ).setDepth(2);

            this.tweens.add({
                targets: p,
                y: p.y - Phaser.Math.Between(30, 70),
                x: p.x + Phaser.Math.Between(-30, 30),
                alpha: { from: 0.8, to: 0.15 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                yoyo: true,
                delay: i * 120,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createCreditsOverlay() {
        // Remove existing overlay if any
        const oldOverlay = document.getElementById('ending-credits-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'ending-credits-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'flex-start';
        overlay.style.overflowY = 'auto';
        overlay.style.padding = '40px 20px 60px 20px';
        overlay.style.background = 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.85) 0%, rgba(5, 8, 20, 0.95) 100%)';
        overlay.style.backdropFilter = 'blur(10px)';
        overlay.style.webkitBackdropFilter = 'blur(10px)';
        overlay.style.fontFamily = "'Fredoka', 'Outfit', sans-serif";
        overlay.style.color = '#f8fafc';
        overlay.style.animation = 'fadeInEnding 1.2s ease-out forwards';

        // Add Keyframe Style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInEnding {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .ending-card {
                background: rgba(30, 41, 59, 0.65);
                border: 1px solid rgba(251, 191, 36, 0.3);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 20px;
                width: 100%;
                max-width: 680px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                transition: transform 0.3s ease, border-color 0.3s ease;
            }
            .ending-card:hover {
                transform: translateY(-2px);
                border-color: rgba(251, 191, 36, 0.6);
            }
            .ending-btn {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #ffffff;
                font-weight: 700;
                font-size: 15px;
                padding: 12px 28px;
                border-radius: 9999px;
                border: 1px solid rgba(254, 240, 138, 0.5);
                box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                cursor: pointer;
                transition: all 0.25s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .ending-btn:hover {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
            }
            .ending-btn-secondary {
                background: rgba(51, 65, 85, 0.8);
                color: #e2e8f0;
                font-weight: 600;
                font-size: 14px;
                padding: 12px 24px;
                border-radius: 9999px;
                border: 1px solid rgba(148, 163, 184, 0.3);
                cursor: pointer;
                transition: all 0.25s ease;
            }
            .ending-btn-secondary:hover {
                background: rgba(71, 85, 105, 0.9);
                border-color: rgba(251, 191, 36, 0.5);
                color: #ffffff;
                transform: scale(1.03);
            }
        `;
        overlay.appendChild(style);

        // Header Title
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.marginBottom = '32px';
        header.innerHTML = `
            <div style="display: inline-block; padding: 6px 18px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 9999px; color: #fbbf24; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
                🎉 TAMAT - THE CURSE OF THE PURE GOBLIN 🎉
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #fef08a; margin: 0 0 8px 0; text-shadow: 0 2px 10px rgba(254, 240, 138, 0.3); font-family: 'Fredoka', cursive, sans-serif;">
                Cinta & Ketulusan Sang Kakak
            </h1>
            <p style="font-size: 15px; color: #94a3b8; max-width: 540px; margin: 0 auto; line-height: 1.5;">
                Kutukan telah terangkat, Rachael telah sembuh total, dan kasih sayang keluarga kembali bersemi di lembah pegunungan.
            </p>
        `;
        overlay.appendChild(header);

        // Story Cards Container
        const cardsData = [
            {
                badge: 'PROLOG',
                badgeCol: '#ef4444',
                title: 'Pengorbanan & Janji di Tengah Badai',
                text: 'Melihat adik perempuannya Rachael terbaring lemah sakit parah, Aksel memberanikan diri menembus jurang air terjun terlarang menuju kediaman Madam Joanne. Meski ditipu dan dikutuk menjadi sosok Goblin yang buruk rupa, Aksel tak pernah menyerah demi menepati janjinya.'
            },
            {
                badge: 'BAB 1 - 3',
                badgeCol: '#3b82f6',
                title: 'Jejak Kebaikan Sang Goblin Murni',
                text: 'Berbekal hati yang tulus, Aksel membuktikan bahwa wujud monster tidak menentukan siapa dirinya. Ia membersihkan sarang lebah untuk Nenek Mary (Madu Murni), mengumpulkan kayu dan memperbaiki mesin Heinrich (Mythical Seed), serta menaklukkan monster saffron dan mengantar roti pagi Mr. Breado (Magic Bread).'
            },
            {
                badge: 'EPILOG',
                badgeCol: '#10b981',
                title: 'Mukjizat Kesembuhan & Kebebasan',
                text: 'Ketiga bahan magis lengkap diserahkan ke kuali Madam Joanne. Sang penyihir mengakui keluhuran budi Aksel dan meracikkan [Ramuan Kesembuhan Asli]. Kutukan terangkat, Aksel kembali berwujud manusia, dan senyum ceria Rachael kembali menghangatkan rumah mereka.'
            }
        ];

        cardsData.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'ending-card';
            cardEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 11px; font-weight: 800; color: #ffffff; background: ${card.badgeCol}; padding: 3px 10px; border-radius: 9999px; letter-spacing: 1px;">
                        ${card.badge}
                    </span>
                    <h3 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0;">${card.title}</h3>
                </div>
                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0;">${card.text}</p>
            `;
            overlay.appendChild(cardEl);
        });

        // Moral Message Box
        const quoteBox = document.createElement('div');
        quoteBox.style.maxWidth = '680px';
        quoteBox.style.width = '100%';
        quoteBox.style.padding = '22px';
        quoteBox.style.marginBottom = '28px';
        quoteBox.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)';
        quoteBox.style.border = '1px solid rgba(251, 191, 36, 0.4)';
        quoteBox.style.borderRadius = '16px';
        quoteBox.style.textAlign = 'center';
        quoteBox.innerHTML = `
            <div style="font-size: 20px; color: #fbbf24; margin-bottom: 6px;">✨</div>
            <blockquote style="font-size: 16px; font-weight: 600; font-style: italic; color: #fef08a; margin: 0 0 8px 0; line-height: 1.5;">
                "Kebaikan sejati terpancar bukan dari rupa lahiriah, melainkan dari ketulusan hati dalam mengasihi dan menolong sesama."
            </blockquote>
            <span style="font-size: 12px; color: #94a3b8; letter-spacing: 1px;">— PESAN MORAL THE GOOD GOBLIN —</span>
        `;
        overlay.appendChild(quoteBox);

        // Credits Box
        const creditsBox = document.createElement('div');
        creditsBox.style.maxWidth = '680px';
        creditsBox.style.width = '100%';
        creditsBox.style.padding = '18px';
        creditsBox.style.marginBottom = '32px';
        creditsBox.style.textAlign = 'center';
        creditsBox.style.fontSize = '12px';
        creditsBox.style.color = '#64748b';
        creditsBox.innerHTML = `
            <div style="color: #94a3b8; font-weight: 700; margin-bottom: 6px;">KREDIT & PENGEMBANGAN</div>
            <div>Cerita, Desain Level & Logika: <strong>The Good Goblin Team</strong></div>
            <div>Aset Pixel Art & Musik: <strong>Curated Fantasy Game Assets</strong></div>
            <div style="margin-top: 6px; color: #fbbf24;">❤️ Terima kasih telah memainkan game ini dari awal hingga akhir! ❤️</div>
        `;
        overlay.appendChild(creditsBox);

        // Action Buttons Row
        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '16px';
        btnRow.style.flexWrap = 'wrap';
        btnRow.style.justifyContent = 'center';
        btnRow.style.marginBottom = '30px';

        const returnTitleBtn = document.createElement('button');
        returnTitleBtn.className = 'ending-btn';
        returnTitleBtn.innerHTML = `<span>🔄</span> Main Lagi (Menu Utama)`;
        returnTitleBtn.onclick = () => {
            GameAudio.playClick();
            overlay.remove();
            resetGameState(this.registry);
            this.scene.start('TitleScene');
        };

        const freeRoamBtn = document.createElement('button');
        freeRoamBtn.className = 'ending-btn-secondary';
        freeRoamBtn.innerHTML = `<span>🏡</span> Kembali ke Rumah (Free Roam)`;
        freeRoamBtn.onclick = () => {
            GameAudio.playClick();
            overlay.remove();
            this.scene.start('HomeScene', { endingDone: true });
        };

        btnRow.appendChild(returnTitleBtn);
        btnRow.appendChild(freeRoamBtn);
        overlay.appendChild(btnRow);

        document.body.appendChild(overlay);
        this.creditsOverlay = overlay;

        // Cleanup on scene shutdown
        this.events.once('shutdown', () => {
            if (this.creditsOverlay) {
                this.creditsOverlay.remove();
                this.creditsOverlay = null;
            }
        });
    }
}
