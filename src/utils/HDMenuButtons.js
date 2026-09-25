/**
 * HDMenuButtons.js
 * Premium HTML/CSS Main Menu Buttons for TitleScene.
 * Replaces canvas-drawn buttons with crisp, animated HTML overlay.
 */
import { GameAudio } from '../audio/GameAudio.js';

export class HDMenuButtons {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;
        this.injectStyles();
        this.createDOM();
    }

    static injectStyles() {
        if (document.getElementById('hd-menu-btn-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-menu-btn-styles';
        style.textContent = `
            #hd-menu-buttons {
                position: fixed;
                left: 50%; top: 74%;
                transform: translate(-50%, -50%);
                display: flex; flex-direction: column; align-items: center; gap: 11px;
                z-index: 99990;
                opacity: 0; pointer-events: none;
                transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'Fredoka', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                user-select: none; -webkit-user-select: none;
            }
            #hd-menu-buttons.active {
                opacity: 1; pointer-events: all;
            }

            /* === SHARED BUTTON BASE === */
            .hd-menu-btn {
                position: relative; overflow: hidden;
                min-width: 250px; padding: 11px 32px;
                border-radius: 12px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 10px;
                font-weight: 800; letter-spacing: 1.2px;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                text-shadow: 0 2px 8px rgba(0,0,0,0.5);
                outline: none;
            }
            .hd-menu-btn:active { transform: scale(0.95) !important; }

            /* === PLAY BUTTON === */
            .hd-menu-btn-play {
                background: linear-gradient(135deg, #15803d 0%, #16a34a 40%, #22c55e 100%);
                border: 2.5px solid rgba(245, 158, 11, 0.9);
                color: #fff; font-size: 17px;
                box-shadow:
                    0 8px 28px rgba(22,163,74,0.5),
                    0 0 22px rgba(245,158,11,0.18),
                    inset 0 1px 0 rgba(255,255,255,0.22);
            }
            /* Shimmer sweep */
            .hd-menu-btn-play::before {
                content: ''; position: absolute;
                top: 0; left: -120%; width: 60%; height: 100%;
                background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%);
                transform: skewX(-18deg);
                transition: none;
            }
            .hd-menu-btn-play:hover::before {
                animation: hd-shimmer 0.6s ease forwards;
            }
            @keyframes hd-shimmer {
                from { left: -120%; }
                to   { left: 120%; }
            }
            .hd-menu-btn-play:hover {
                transform: scale(1.06) translateY(-2px);
                border-color: #fde047;
                box-shadow:
                    0 12px 36px rgba(22,163,74,0.6),
                    0 0 35px rgba(253,224,71,0.25),
                    inset 0 1px 0 rgba(255,255,255,0.3);
                filter: brightness(1.08);
            }
            .hd-menu-btn-play .hd-menu-icon {
                color: #fef08a;
                filter: drop-shadow(0 0 6px rgba(254,240,138,0.6));
            }

            /* === SETTINGS BUTTON === */
            .hd-menu-btn-settings {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 2px solid rgba(100, 116, 139, 0.7);
                color: #e2e8f0; font-size: 15px;
                box-shadow:
                    0 4px 18px rgba(0,0,0,0.45),
                    inset 0 1px 0 rgba(255,255,255,0.08);
            }
            .hd-menu-btn-settings:hover {
                transform: scale(1.05) translateY(-1px);
                background: linear-gradient(135deg, #334155 0%, #475569 100%);
                border-color: #94a3b8;
                box-shadow:
                    0 8px 26px rgba(0,0,0,0.55),
                    0 0 18px rgba(148,163,184,0.12),
                    inset 0 1px 0 rgba(255,255,255,0.12);
            }
            .hd-menu-btn-settings .hd-menu-icon {
                transition: transform 0.4s ease;
            }
            .hd-menu-btn-settings:hover .hd-menu-icon {
                transform: rotate(90deg);
            }

            /* Icon shared */
            .hd-menu-icon {
                font-size: 19px;
                line-height: 1;
                filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
            }

            /* Subtle idle pulse on play button */
            @keyframes hd-pulse-glow {
                0%, 100% { box-shadow: 0 8px 28px rgba(22,163,74,0.5), 0 0 22px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.22); }
                50%      { box-shadow: 0 8px 28px rgba(22,163,74,0.65), 0 0 32px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.22); }
            }
            .hd-menu-btn-play { animation: hd-pulse-glow 2.5s ease-in-out infinite; }
            .hd-menu-btn-play:hover { animation: none; }
        `;
        document.head.appendChild(style);
    }

    static createDOM() {
        let container = document.getElementById('hd-menu-buttons');
        if (container) return;
        container = document.createElement('div');
        container.id = 'hd-menu-buttons';
        container.innerHTML = `
            <button class="hd-menu-btn hd-menu-btn-play" id="hd-btn-play">
                <span class="hd-menu-icon">▶</span> START
            </button>
            <button class="hd-menu-btn hd-menu-btn-settings" id="hd-btn-settings">
                <span class="hd-menu-icon">&#9881;</span> SETTINGS
            </button>
        `;
        document.body.appendChild(container);
        this.container = container;
    }

    static show(callbacks = {}) {
        this.init();
        this._callbacks = callbacks;
        if (this.container) {
            this.container.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            this.container.classList.add('active');
        }

        const playBtn = document.getElementById('hd-btn-play');
        const setBtn = document.getElementById('hd-btn-settings');

        if (playBtn) {
            playBtn.onclick = () => {
                GameAudio.playClick();
                if (this._callbacks.onPlay) this._callbacks.onPlay();
            };
            playBtn.onmouseenter = () => GameAudio.playHover();
        }
        if (setBtn) {
            setBtn.onclick = () => {
                GameAudio.playClick();
                if (this._callbacks.onSettings) this._callbacks.onSettings();
            };
            setBtn.onmouseenter = () => GameAudio.playHover();
        }
    }

    static hide() {
        if (this.container) {
            this.container.classList.remove('active');
        }
    }

    static fadeOut(durationMs = 400) {
        if (this.container) {
            this.container.style.transition = `opacity ${durationMs}ms ease`;
            this.container.classList.remove('active');
        }
    }
}
