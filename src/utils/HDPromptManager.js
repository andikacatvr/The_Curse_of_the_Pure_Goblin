/**
 * HDPromptManager.js
 * Renders crystal-clear, high-definition HTML overlay interaction prompts
 * (e.g. "Tekan [E] Bicara dengan Rachael", "Ambil Kayu Bakar", etc.)
 * Replaces blurry, pixelated Phaser canvas text with tactile 3D keycaps and glassmorphism styling.
 */
import { GameAudio } from '../audio/GameAudio.js';
import { isMobileDevice } from './gameState.js';

export class HDPromptManager {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;

        this._visible = false;
        this._worldX = 0;
        this._worldY = 0;
        this._currentText = '';
        this.activeScene = null;

        this.injectStyles();
        this.createDOM();

        window.addEventListener('resize', () => this.updatePosition());
    }

    static createDOM() {
        let overlay = document.getElementById('game-hd-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'game-hd-overlay';
            document.body.appendChild(overlay);
        }

        let container = document.getElementById('hd-world-prompt');
        if (!container) {
            container = document.createElement('div');
            container.id = 'hd-world-prompt';
            container.className = 'hd-world-prompt hd-prompt-hidden';
            container.innerHTML = `
                <div class="hd-prompt-bubble" id="hd-prompt-bubble">
                    <div class="hd-prompt-key" id="hd-prompt-key">
                        <span class="hd-prompt-key-inner" id="hd-prompt-key-inner">E</span>
                    </div>
                    <span class="hd-prompt-label" id="hd-prompt-label">Bicara</span>
                </div>
                <div class="hd-prompt-caret"></div>
            `;
            overlay.appendChild(container);
        }

        this.container = container;
        this.bubble = document.getElementById('hd-prompt-bubble');
        this.keyElem = document.getElementById('hd-prompt-key');
        this.keyInner = document.getElementById('hd-prompt-key-inner');
        this.labelElem = document.getElementById('hd-prompt-label');

        this.bindEvents();
    }

    static bindEvents() {
        if (!this.bubble) return;

        this.bubble.addEventListener('pointerenter', () => {
            GameAudio.playHover();
        });

        this.bubble.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            GameAudio.playClick();

            if (this.activeScene) {
                if (this.activeScene.isTalking && this.activeScene.nextDialogue) {
                    this.activeScene.nextDialogue();
                } else if (this.activeScene.handleActionKey) {
                    this.activeScene.handleActionKey();
                }
            }
        });
    }

    static attachScene(scene) {
        this.init();
        this.activeScene = scene;

        scene.events.once('shutdown', () => {
            this.hide();
            if (this.activeScene === scene) {
                this.activeScene = null;
            }
        });

        scene.events.once('destroy', () => {
            this.hide();
            if (this.activeScene === scene) {
                this.activeScene = null;
            }
        });
    }

    static parsePrompt(rawText) {
        if (!rawText) return { key: 'E', label: '' };
        let text = rawText.trim();
        const mobile = isMobileDevice();

        if (mobile) {
            if (text.includes('💬')) {
                return { key: '💬', label: text.replace(/💬\s*Ketuk\s*/i, '').trim(), isIcon: true };
            }
            if (text.includes('⚔️')) {
                return { key: '⚔️', label: text.replace(/⚔️\s*Ketuk\s*/i, '').trim(), isIcon: true };
            }
            const clean = text.replace(/Tekan\s*\[.*?\]\s*/i, '').replace(/\[.*?\]/g, '').trim();
            return { key: '👆', label: clean, isIcon: true };
        }

        // Desktop extraction
        const match = text.match(/Tekan\s*\[(.*?)\]\s*(.*)/i);
        if (match) {
            let key = match[1].trim();
            if (key.includes('/')) {
                key = key.split('/')[0].replace(/[\[\]]/g, '').trim();
            }
            return { key, label: match[2].trim(), isIcon: false };
        }

        // Check if there's any bracketed key like [E]
        const bracketMatch = text.match(/\[(.*?)\]/);
        if (bracketMatch) {
            return {
                key: bracketMatch[1].trim(),
                label: text.replace(/\[.*?\]/, '').trim(),
                isIcon: false
            };
        }

        // Plain notices (e.g. "Bicara Dulu dengan Nenek Mary!")
        return { key: '!', label: text, isIcon: true };
    }

    static show(worldX, worldY, rawText, scene) {
        this.init();
        if (scene) this.activeScene = scene;

        this._worldX = worldX;
        this._worldY = worldY;
        this._currentText = rawText;
        this._visible = true;

        const parsed = this.parsePrompt(rawText);
        if (this.keyInner) {
            this.keyInner.textContent = parsed.key;
            if (parsed.isIcon) {
                this.keyElem.classList.add('hd-key-icon');
            } else {
                this.keyElem.classList.remove('hd-key-icon');
            }
        }

        if (this.labelElem) {
            this.labelElem.textContent = parsed.label || '';
        }

        if (this.container) {
            this.container.classList.remove('hd-prompt-hidden');
            this.container.classList.add('hd-prompt-visible');
        }

        this.updatePosition();
    }

    static updateTarget(worldX, worldY) {
        this._worldX = worldX;
        this._worldY = worldY;
        if (this._visible) {
            this.updatePosition();
        }
    }

    static setText(rawText) {
        this._currentText = rawText;
        const parsed = this.parsePrompt(rawText);
        if (this.keyInner) {
            this.keyInner.textContent = parsed.key;
            if (parsed.isIcon) {
                this.keyElem.classList.add('hd-key-icon');
            } else {
                this.keyElem.classList.remove('hd-key-icon');
            }
        }
        if (this.labelElem) {
            this.labelElem.textContent = parsed.label || '';
        }
    }

    static hide() {
        this._visible = false;
        if (this.container) {
            this.container.classList.remove('hd-prompt-visible');
            this.container.classList.add('hd-prompt-hidden');
        }
    }

    static updatePosition() {
        if (!this._visible || !this.activeScene || !this.container) return;
        const scene = this.activeScene;
        if (!scene.cameras || !scene.cameras.main || !scene.game || !scene.game.canvas) return;

        const cam = scene.cameras.main;
        const canvas = scene.game.canvas;
        const rect = canvas.getBoundingClientRect();

        // Project world coordinates (worldX, worldY) into canvas pixel coordinates
        const mat = (cam.matrixCombined && cam.matrixCombined.matrix)
            ? cam.matrixCombined.matrix
            : (cam.matrix ? cam.matrix.matrix : null);

        let canvasX, canvasY;
        if (mat) {
            canvasX = this._worldX * mat[0] + this._worldY * mat[2] + mat[4];
            canvasY = this._worldX * mat[1] + this._worldY * mat[3] + mat[5];
        } else {
            canvasX = (this._worldX - (cam.scrollX + cam.width * 0.5)) * cam.zoom + cam.width * 0.5;
            canvasY = (this._worldY - (cam.scrollY + cam.height * 0.5)) * cam.zoom + cam.height * 0.5;
        }

        const scaleX = rect.width / (canvas.width || 800);
        const scaleY = rect.height / (canvas.height || 600);

        let screenX = rect.left + canvasX * scaleX;
        let screenY = rect.top + canvasY * scaleY;

        // Ensure prompt stays within view boundaries
        const padX = 90;
        const padTop = 36;
        const padBottom = 24;

        screenX = Math.max(rect.left + padX, Math.min(rect.right - padX, screenX));
        screenY = Math.max(rect.top + padTop, Math.min(rect.bottom - padBottom, screenY));

        this.container.style.left = `${Math.round(screenX)}px`;
        this.container.style.top = `${Math.round(screenY)}px`;
    }

    static injectStyles() {
        if (document.getElementById('hd-prompt-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-prompt-styles';
        style.textContent = `
            .hd-world-prompt {
                position: fixed;
                top: 0;
                left: 0;
                transform: translate(-50%, -100%);
                z-index: 95;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                transition: opacity 0.16s cubic-bezier(0.2, 0.9, 0.3, 1),
                            transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1);
                will-change: left, top, opacity, transform;
            }

            .hd-prompt-hidden {
                opacity: 0;
                transform: translate(-50%, -85%) scale(0.92);
                pointer-events: none;
            }

            .hd-prompt-visible {
                opacity: 1;
                transform: translate(-50%, -100%) scale(1);
                pointer-events: auto;
            }

            .hd-prompt-bubble {
                display: inline-flex;
                align-items: center;
                gap: 9px;
                padding: 6px 16px 6px 8px;
                border-radius: 999px;
                background: linear-gradient(135deg, rgba(14, 21, 37, 0.94) 0%, rgba(24, 32, 54, 0.96) 100%);
                border: 1.5px solid rgba(245, 197, 24, 0.85);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.65),
                            0 0 12px rgba(245, 197, 24, 0.3),
                            inset 0 1px 1px rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                cursor: pointer;
                transition: transform 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease;
            }

            .hd-prompt-bubble:hover {
                border-color: #fde047;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75),
                            0 0 18px rgba(250, 204, 21, 0.45),
                            inset 0 1px 2px rgba(255, 255, 255, 0.35);
                transform: translateY(-2px) scale(1.02);
            }

            .hd-prompt-bubble:active {
                transform: translateY(1px) scale(0.98);
            }

            .hd-prompt-key {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 26px;
                height: 26px;
                padding: 0 7px;
                border-radius: 6px;
                background: linear-gradient(180deg, #2b364e 0%, #151c2a 100%);
                border: 1.5px solid #eab308;
                box-shadow: 0 2.5px 0 #854d0e, 0 3px 6px rgba(0, 0, 0, 0.6);
                flex-shrink: 0;
                transition: transform 0.1s ease, box-shadow 0.1s ease;
            }

            .hd-prompt-key.hd-key-icon {
                min-width: 26px;
                background: linear-gradient(180deg, #3d4a66 0%, #1c2436 100%);
                border-color: #facc15;
            }

            .hd-prompt-bubble:active .hd-prompt-key {
                transform: translateY(1.5px);
                box-shadow: 0 1px 0 #854d0e, 0 1px 3px rgba(0, 0, 0, 0.6);
            }

            .hd-prompt-key-inner {
                color: #fef08a;
                font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                font-size: 12.5px;
                font-weight: 800;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
                line-height: 1;
            }

            .hd-prompt-label {
                color: #f8fafc;
                font-family: 'Outfit', 'Inter', system-ui, sans-serif;
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 0.3px;
                white-space: nowrap;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95);
            }

            .hd-prompt-caret {
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid rgba(245, 197, 24, 0.85);
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }
}
