/**
 * HDNoticeManager.js
 * High-definition HTML Overlay for in-game alerts, map locked warnings, victory banners, and combat hints.
 * Replaces blurry, pixelated Phaser canvas banners with crisp glassmorphism cards.
 */

import { GameAudio } from '../audio/GameAudio.js';

export class HDNoticeManager {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;

        this._hideTimer = null;
        this.injectStyles();
        this.createDOM();
    }

    static injectStyles() {
        if (document.getElementById('hd-notice-styles')) return;

        const style = document.createElement('style');
        style.id = 'hd-notice-styles';
        style.textContent = `
            .hd-notice-container {
                position: fixed;
                top: 22px;
                left: 50%;
                transform: translateX(-50%) translateY(-35px);
                opacity: 0;
                pointer-events: none;
                z-index: 9999;
                transition: transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease;
                font-family: 'Fredoka', 'Outfit', 'Segoe UI', system-ui, sans-serif;
                user-select: none;
                -webkit-user-select: none;
            }

            .hd-notice-container.active {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }

            .hd-notice-container.shake {
                animation: hdNoticeShake 0.4s ease-in-out;
            }

            @keyframes hdNoticeShake {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                20% { transform: translateX(calc(-50% - 6px)) translateY(0); }
                40% { transform: translateX(calc(-50% + 6px)) translateY(0); }
                60% { transform: translateX(calc(-50% - 3px)) translateY(0); }
                80% { transform: translateX(calc(-50% + 3px)) translateY(0); }
            }

            .hd-notice-card {
                border-radius: 8px;
                padding: 10px 24px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                min-width: 320px;
                max-width: min(92vw, 600px);
                box-sizing: border-box;
                transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            }

            /* --- TYPE: LOCKED / WARNING (Crimson Ruby) --- */
            .hd-notice-card.type-locked {
                background: linear-gradient(135deg, rgba(88, 14, 23, 0.95) 0%, rgba(45, 6, 12, 0.96) 100%);
                border: 1.5px solid rgba(248, 113, 113, 0.75);
                outline: 1px solid rgba(239, 68, 68, 0.35);
                box-shadow: 0 10px 32px rgba(220, 38, 38, 0.38), 0 3px 12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            .hd-notice-card.type-locked .hd-notice-title {
                color: #fca5a5;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
            }
            .hd-notice-card.type-locked .hd-notice-message {
                color: #fee2e2;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
            }

            /* --- TYPE: SUCCESS / VICTORY (Emerald Jade) --- */
            .hd-notice-card.type-success {
                background: linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(4, 47, 46, 0.96) 100%);
                border: 1.5px solid rgba(52, 211, 153, 0.8);
                outline: 1px solid rgba(16, 185, 129, 0.4);
                box-shadow: 0 10px 32px rgba(16, 185, 129, 0.4), 0 3px 12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.25);
            }
            .hd-notice-card.type-success .hd-notice-title {
                color: #6ee7b7;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
            }
            .hd-notice-card.type-success .hd-notice-message {
                color: #d1fae5;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
            }

            /* --- TYPE: BATTLE (Amber Gold) --- */
            .hd-notice-card.type-battle {
                background: linear-gradient(135deg, rgba(120, 53, 15, 0.95) 0%, rgba(67, 20, 7, 0.96) 100%);
                border: 1.5px solid rgba(251, 191, 36, 0.8);
                outline: 1px solid rgba(245, 158, 11, 0.4);
                box-shadow: 0 10px 32px rgba(245, 158, 11, 0.38), 0 3px 12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.25);
            }
            .hd-notice-card.type-battle .hd-notice-title {
                color: #fde047;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
            }
            .hd-notice-card.type-battle .hd-notice-message {
                color: #fef3c7;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
            }

            .hd-notice-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 3px;
            }

            .hd-notice-icon {
                font-size: 15px;
                line-height: 1;
                filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
            }

            .hd-notice-title {
                font-size: 13.5px;
                font-weight: 800;
                letter-spacing: 0.6px;
                text-transform: uppercase;
            }

            .hd-notice-message {
                font-size: 12.5px;
                font-weight: 500;
                line-height: 1.45;
            }

            @media (max-width: 480px) {
                .hd-notice-card {
                    min-width: 280px;
                    padding: 8px 16px;
                }
                .hd-notice-title {
                    font-size: 12px;
                }
                .hd-notice-message {
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    static createDOM() {
        let container = document.getElementById('hd-notice-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'hd-notice-container';
            container.className = 'hd-notice-container';
            container.innerHTML = `
                <div class="hd-notice-card type-locked" id="hd-notice-card">
                    <div class="hd-notice-header">
                        <span class="hd-notice-icon" id="hd-notice-icon">🔒</span>
                        <span class="hd-notice-title" id="hd-notice-title">MAP TERKUNCI! QUEST BELUM SELESAI</span>
                    </div>
                    <div class="hd-notice-message" id="hd-notice-message">Selesaikan quest di map ini terlebih dahulu!</div>
                </div>
            `;
            document.body.appendChild(container);
        }

        this.container = container;
        this.card = document.getElementById('hd-notice-card');
        this.iconEl = document.getElementById('hd-notice-icon');
        this.titleEl = document.getElementById('hd-notice-title');
        this.messageEl = document.getElementById('hd-notice-message');
    }

    /**
     * Tampilkan peringatan map terkunci
     * @param {string} message Pesan detail penyebab map terkunci
     * @param {number} duration Durasi tampil (default 2600ms)
     */
    static showLocked(message, duration = 2600) {
        this.show({
            title: 'MAP TERKUNCI! QUEST BELUM SELESAI',
            icon: '🔒',
            message: message || 'Selesaikan quest di map ini terlebih dahulu!',
            type: 'locked',
            duration
        });
    }

    /**
     * Tampilkan notifikasi keberhasilan / kemenangan monster
     * @param {string} message Pesan detail
     * @param {string} title Judul (default "MONSTER DIKALAHKAN!")
     * @param {number} duration Durasi tampil (default 5000ms)
     */
    static showSuccess(message, title = 'MONSTER DIKALAHKAN!', duration = 5000) {
        this.show({
            title,
            icon: '✨',
            message,
            type: 'success',
            duration
        });
    }

    /**
     * Tampilkan instruksi pertempuran
     * @param {string} message Pesan instruksi serang
     * @param {string} title Judul (default "PERTEMPURAN!")
     * @param {number} duration Durasi tampil (0 = menetap hingga diubah/selesai)
     */
    static showBattleHint(message, title = 'PERTEMPURAN!', duration = 0) {
        this.show({
            title,
            icon: '⚔️',
            message,
            type: 'battle',
            duration
        });
    }

    /**
     * Tampilkan notifikasi umum
     */
    static show({ title = 'PERHATIAN', icon = '⚠️', message = '', type = 'locked', duration = 2600 } = {}) {
        this.init();

        try {
            if (type === 'success') {
                GameAudio.playQuestComplete();
            } else if (type === 'battle') {
                GameAudio.playStart();
            } else {
                GameAudio.playHover();
            }
        } catch (e) {}

        this.titleEl.textContent = title;
        this.iconEl.textContent = icon;
        this.messageEl.textContent = message;

        // Atur tipe class
        if (this.card) {
            this.card.className = `hd-notice-card type-${type}`;
        }

        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        // Trigger shake jika sudah sedang aktif
        if (this.container.classList.contains('active')) {
            this.container.classList.remove('shake');
            void this.container.offsetWidth; // Force reflow
            this.container.classList.add('shake');
        } else {
            this.container.classList.add('active');
        }

        if (duration > 0) {
            this._hideTimer = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    static hide() {
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        if (this.container) {
            this.container.classList.remove('active');
            this.container.classList.remove('shake');
        }
    }
}
