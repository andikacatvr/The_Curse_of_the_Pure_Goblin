/**
 * HDHudManager.js
 * Renders crisp, high-definition HTML overlay badges and HUD controls.
 * Always edge-pinned, immune to camera zoom blurring, and responsive across all screen sizes.
 */
import { GameAudio } from '../audio/GameAudio.js';
import { isMobileDevice } from './gameState.js';

export class HDNavBadgeHandle {
    constructor(direction, initialText, initialVisible = true) {
        this.direction = direction;
        this._text = initialText || '';
        this._visible = initialVisible;
        this.update();
    }

    setText(text) {
        this._text = text || '';
        this.update();
        return this;
    }

    setVisible(visible) {
        this._visible = !!visible;
        this.update();
        return this;
    }

    setOrigin() { return this; }
    setDepth() { return this; }
    setPosition() { return this; }
    setScale() { return this; }

    destroy() {
        this.setVisible(false);
    }

    update() {
        if (this.direction === 'left') {
            HDHudManager.setLeft(this._text, this._visible);
        } else {
            HDHudManager.setRight(this._text, this._visible);
        }
    }
}

export class HDHudManager {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;

        this._currentHP = 3;
        this._maxHP = 3;

        this.injectStyles();
        this.createDOM();

        if (typeof window !== 'undefined') {
            window.addEventListener('questStateChanged', (e) => {
                if (e && e.detail) {
                    this.updateQuestTracker(e.detail);
                }
            });
        }

        window.addEventListener('resize', () => this.updateBadgePositioning());
    }

    static createDOM() {
        let overlay = document.getElementById('game-hd-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'game-hd-overlay';
            document.body.appendChild(overlay);
        }
        this.overlay = overlay;

        // 1. Top-Left HUD Container (HP & Quest & Objective Tracker)
        let topLeft = document.getElementById('hd-top-hud-left');
        if (!topLeft) {
            topLeft = document.createElement('div');
            topLeft.id = 'hd-top-hud-left';
            topLeft.className = 'hd-hud-group hd-top-left';
            topLeft.innerHTML = `
                <div class="hd-top-left-row">
                    <div id="hd-hp-pill" class="hd-hud-pill hd-hp-pill" title="Kesehatan Aksel (Klik untuk info)">
                        <span class="hd-hp-tag">HP</span>
                        <div id="hd-hp-hearts" class="hd-hp-hearts">
                            <span class="hd-heart">❤️</span>
                            <span class="hd-heart">❤️</span>
                            <span class="hd-heart">❤️</span>
                        </div>
                        <span id="hd-hp-num" class="hd-hp-num">3/3</span>
                    </div>
                    <button id="hd-btn-quest" class="hd-hud-btn hd-btn-quest" title="Buka Catatan Quest & Objektif (Q)">
                        <span class="hd-btn-icon">📜</span>
                        <span class="hd-btn-label">Catatan Quest</span>
                    </button>
                </div>
                <!-- ON-SCREEN QUEST OBJECTIVE TRACKER WIDGET -->
                <div id="hd-quest-tracker" class="hd-quest-tracker" title="Klik untuk membuka detail quest lengkap (Q)">
                    <div class="hd-qt-header">
                        <div class="hd-qt-tag">
                            <span class="hd-qt-dot"></span>
                            <span class="hd-qt-icon">🎯</span>
                            <span id="hd-qt-chapter">MISI AKTIF</span>
                        </div>
                        <button id="hd-qt-toggle" class="hd-qt-toggle-btn" title="Kecilkan / Perbesar Tampilan Objektif" type="button">
                            <span id="hd-qt-toggle-icon">−</span>
                        </button>
                    </div>
                    <div id="hd-qt-body" class="hd-qt-body">
                        <div id="hd-qt-title" class="hd-qt-title">Mencari Kayu Bakar di Hutan Danau</div>
                        <div id="hd-qt-objective" class="hd-qt-objective">Jalan ke arah barat [◀] melintasi Hutan Danau hingga Ujung Danau Kaki Gunung untuk mencari 4 kayu bakar suruhan Nenek.</div>
                    </div>
                </div>
            `;
            overlay.appendChild(topLeft);
        }
        this.topLeftContainer = topLeft;
        this.questTracker = document.getElementById('hd-quest-tracker');

        // 2. Top-Right HUD Container (Zoom, Bag, Menu, Mobile)
        let topRight = document.getElementById('hd-top-hud-right');
        if (!topRight) {
            topRight = document.createElement('div');
            topRight.id = 'hd-top-hud-right';
            topRight.className = 'hd-hud-group hd-top-right';
            topRight.innerHTML = `
                <button id="hd-btn-zoom" class="hd-hud-btn hd-btn-zoom" title="Ubah Zoom Kamera (Klik untuk ganti)">
                    <span id="hd-zoom-label" class="hd-btn-label">🔍 0.85x</span>
                </button>
                <button id="hd-btn-bag" class="hd-hud-btn hd-btn-bag" title="Buka Tas / Inventaris (I / 1)">
                    <svg class="hd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span id="hd-bag-badge" class="hd-badge" style="display: none;">0</span>
                </button>
                <button id="hd-btn-mobile" class="hd-hud-btn hd-btn-mobile" title="Tombol Kontrol Sentuh HP" style="display: none;">
                    <span class="hd-btn-icon">📱</span>
                    <span id="hd-mob-dot" class="hd-status-dot"></span>
                </button>
                <button id="hd-btn-menu" class="hd-hud-btn hd-btn-menu" title="Pengaturan & Menu Jeda (ESC / P)">
                    <svg class="hd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                        <line x1="4" y1="18" x2="20" y2="18"></line>
                    </svg>
                </button>
            `;
            overlay.appendChild(topRight);
        }
        this.topRightContainer = topRight;

        // 3. Navigation Badges (Left & Right)
        let leftBadge = document.getElementById('hd-nav-left');
        if (!leftBadge) {
            leftBadge = document.createElement('div');
            leftBadge.id = 'hd-nav-left';
            leftBadge.className = 'hd-nav-badge hd-nav-left';
            overlay.appendChild(leftBadge);
        }
        this.leftBadge = leftBadge;

        let rightBadge = document.getElementById('hd-nav-right');
        if (!rightBadge) {
            rightBadge = document.createElement('div');
            rightBadge.id = 'hd-nav-right';
            rightBadge.className = 'hd-nav-badge hd-nav-right';
            overlay.appendChild(rightBadge);
        }
        this.rightBadge = rightBadge;

        this.bindEvents();
        this.updateBadgePositioning();
    }

    static bindEvents() {
        const hpPill = document.getElementById('hd-hp-pill');
        if (hpPill) {
            hpPill.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                if (this.activeScene && this.activeScene.showToastNotice) {
                    this.activeScene.showToastNotice(`❤️ Kesehatan Aksel: ${this._currentHP}/${this._maxHP} HP`);
                }
            });
        }

        const questBtn = document.getElementById('hd-btn-quest');
        if (questBtn) {
            questBtn.addEventListener('pointerenter', () => GameAudio.playHover());
            questBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                if (this.activeScene && this.activeScene.toggleQuestModal) {
                    this.activeScene.toggleQuestModal();
                }
            });
        }

        const zoomBtn = document.getElementById('hd-btn-zoom');
        if (zoomBtn) {
            zoomBtn.addEventListener('pointerenter', () => GameAudio.playHover());
            zoomBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                if (this.activeScene && this.activeScene.cycleCameraZoom) {
                    this.activeScene.cycleCameraZoom();
                }
            });
        }

        const bagBtn = document.getElementById('hd-btn-bag');
        if (bagBtn) {
            bagBtn.addEventListener('pointerenter', () => GameAudio.playHover());
            bagBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                if (this.activeScene && this.activeScene.toggleInventoryModal) {
                    this.activeScene.toggleInventoryModal();
                }
            });
        }

        const mobBtn = document.getElementById('hd-btn-mobile');
        if (mobBtn) {
            mobBtn.addEventListener('pointerenter', () => GameAudio.playHover());
            mobBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                if (this.activeScene) {
                    const current = this.activeScene.isMobileControlsEnabled();
                    this.activeScene.setMobileControlsEnabled(!current);
                    this.updateMobile(!current);
                }
            });
        }

        const menuBtn = document.getElementById('hd-btn-menu');
        if (menuBtn) {
            menuBtn.addEventListener('pointerenter', () => GameAudio.playHover());
            menuBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                if (this.activeScene && this.activeScene.toggleSettingsModal) {
                    this.activeScene.toggleSettingsModal();
                }
            });
        }

        // Quest Tracker Widget Interactions
        const tracker = document.getElementById('hd-quest-tracker');
        const toggleBtn = document.getElementById('hd-qt-toggle');
        const toggleIcon = document.getElementById('hd-qt-toggle-icon');

        // Check saved collapsed preference
        try {
            const isCollapsedSaved = localStorage.getItem('hd_quest_tracker_collapsed') === 'true';
            if (isCollapsedSaved && tracker && toggleIcon) {
                tracker.classList.add('collapsed');
                toggleIcon.textContent = '＋';
            }
        } catch (err) {}

        if (toggleBtn) {
            toggleBtn.addEventListener('pointerenter', () => {
                if (GameAudio && GameAudio.playHover) GameAudio.playHover();
            });
            toggleBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (!tracker) return;
                const isCollapsed = tracker.classList.toggle('collapsed');
                if (toggleIcon) toggleIcon.textContent = isCollapsed ? '＋' : '−';
                try {
                    localStorage.setItem('hd_quest_tracker_collapsed', isCollapsed ? 'true' : 'false');
                } catch (err) {}
                if (GameAudio && GameAudio.playClick) GameAudio.playClick();
                this.updateBadgePositioning();
            });
        }

        if (tracker) {
            tracker.addEventListener('pointerenter', () => {
                if (GameAudio && GameAudio.playHover) GameAudio.playHover();
            });
            tracker.addEventListener('pointerdown', (e) => {
                // If clicking toggle button, let toggleBtn handle it
                if (e.target && e.target.closest('#hd-qt-toggle')) return;
                e.stopPropagation();
                if (GameAudio && GameAudio.playClick) GameAudio.playClick();
                if (this.activeScene && this.activeScene.toggleQuestModal) {
                    this.activeScene.toggleQuestModal();
                }
            });
        }
    }

    static updateBadgePositioning() {
        if (!this.leftBadge || !this.rightBadge) return;
        const canvas = document.querySelector('#game-container canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const padX = Math.max(16, Math.round(rect.left + 16));
            const padRight = Math.max(16, Math.round(window.innerWidth - rect.right + 16));

            let leftTop = Math.max(66, Math.round(rect.top + 60));
            if (this.topLeftContainer) {
                const b = this.topLeftContainer.getBoundingClientRect();
                if (b.bottom > 0) {
                    leftTop = Math.max(leftTop, Math.round(b.bottom + 8));
                }
            }

            this.leftBadge.style.left = `${padX}px`;
            this.leftBadge.style.top = `${leftTop}px`;

            const rightTop = Math.max(66, Math.round(rect.top + 60));
            this.rightBadge.style.right = `${padRight}px`;
            this.rightBadge.style.top = `${rightTop}px`;
        } else {
            let leftTop = 135;
            if (this.topLeftContainer) {
                const b = this.topLeftContainer.getBoundingClientRect();
                if (b.bottom > 0) leftTop = Math.max(leftTop, Math.round(b.bottom + 8));
            }
            this.leftBadge.style.left = '18px';
            this.leftBadge.style.top = `${leftTop}px`;
            this.rightBadge.style.right = '18px';
            this.rightBadge.style.top = '66px';
        }
    }

    static injectStyles() {
        if (document.getElementById('hd-hud-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-hud-styles';
        style.textContent = `
            #game-hd-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 100;
                overflow: hidden;
                box-sizing: border-box;
                font-family: 'Fredoka', 'Segoe UI', Tahoma, sans-serif;
            }

            /* --- TOP HUD GROUPS --- */
            .hd-hud-group {
                position: fixed;
                top: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 150;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }

            .hd-top-left {
                left: 16px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
                pointer-events: none;
            }
            .hd-top-left > * {
                pointer-events: auto;
            }

            .hd-top-left-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .hd-top-right {
                right: 16px;
            }

            /* --- QUEST OBJECTIVE TRACKER ON SCREEN --- */
            .hd-quest-tracker {
                position: relative;
                width: auto;
                min-width: 250px;
                max-width: 330px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1.5px solid rgba(245, 158, 11, 0.5);
                border-radius: 12px;
                padding: 7px 12px 9px 12px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.55), 0 0 12px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12);
                cursor: pointer;
                transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
            }

            .hd-quest-tracker:hover {
                border-color: #f59e0b;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.65), 0 0 16px rgba(245, 158, 11, 0.32);
            }

            .hd-quest-tracker.quest-flash {
                animation: hdQuestFlash 1.2s ease-out;
            }

            @keyframes hdQuestFlash {
                0% {
                    border-color: #fde047;
                    box-shadow: 0 0 24px rgba(253, 224, 71, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6);
                    transform: scale(1.03);
                }
                50% {
                    border-color: #f59e0b;
                    box-shadow: 0 0 16px rgba(245, 158, 11, 0.5), 0 4px 16px rgba(0, 0, 0, 0.6);
                }
                100% {
                    border-color: rgba(245, 158, 11, 0.5);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.55), 0 0 12px rgba(245, 158, 11, 0.15);
                    transform: scale(1);
                }
            }

            .hd-qt-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                margin-bottom: 3px;
            }

            .hd-qt-tag {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 10px;
                font-weight: 800;
                color: #38bdf8;
                text-transform: uppercase;
                letter-spacing: 0.6px;
            }

            .hd-qt-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #10b981;
                box-shadow: 0 0 6px #10b981;
                animation: hdQtPulse 2s infinite ease-in-out;
            }

            @keyframes hdQtPulse {
                0%, 100% { opacity: 0.6; transform: scale(0.9); }
                50% { opacity: 1; transform: scale(1.2); }
            }

            .hd-qt-icon {
                font-size: 12px;
            }

            .hd-qt-toggle-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 4px;
                width: 19px;
                height: 19px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #cbd5e1;
                font-size: 12px;
                font-weight: 800;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: all 0.15s ease;
            }

            .hd-qt-toggle-btn:hover {
                background: rgba(245, 158, 11, 0.25);
                border-color: #f59e0b;
                color: #fde047;
            }

            .hd-qt-body {
                display: flex;
                flex-direction: column;
                gap: 2px;
                transition: all 0.2s ease;
            }

            .hd-qt-title {
                font-size: 12px;
                font-weight: 800;
                color: #fde047;
                line-height: 1.3;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            }

            .hd-qt-objective {
                font-size: 11.5px;
                font-weight: 500;
                color: #e2e8f0;
                line-height: 1.35;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            }

            /* Collapsed state */
            .hd-quest-tracker.collapsed {
                padding-bottom: 7px;
            }
            .hd-quest-tracker.collapsed .hd-qt-objective {
                display: none;
            }
            .hd-quest-tracker.collapsed .hd-qt-title {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 250px;
            }

            /* --- HP PILL --- */
            .hd-hp-pill {
                display: flex;
                align-items: center;
                gap: 7px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.90) 0%, rgba(30, 41, 59, 0.88) 100%);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 1.5px solid rgba(100, 116, 139, 0.55);
                border-radius: 999px;
                padding: 5px 14px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
                cursor: pointer;
                transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
            }

            .hd-hp-pill:hover {
                border-color: #f43f5e;
                transform: translateY(-1px);
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(244, 63, 94, 0.35);
            }

            .hd-hp-pill:active {
                transform: scale(0.97);
            }

            .hd-hp-tag {
                font-size: 11px;
                font-weight: 800;
                color: #f43f5e;
                letter-spacing: 0.5px;
            }

            .hd-hp-hearts {
                display: flex;
                align-items: center;
                gap: 3px;
                font-size: 14px;
                line-height: 1;
            }

            .hd-heart {
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .hd-hp-pill:hover .hd-heart {
                transform: scale(1.15);
            }

            .hd-hp-num {
                font-size: 11.5px;
                font-weight: 700;
                color: #fda4af;
                margin-left: 2px;
            }

            /* --- HUD BUTTONS --- */
            .hd-hud-btn {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.90) 0%, rgba(30, 41, 59, 0.88) 100%);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 1.5px solid rgba(100, 116, 139, 0.6);
                border-radius: 9px;
                color: #f8fafc;
                padding: 7px 12px;
                font-family: inherit;
                font-size: 12.5px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
                transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
                outline: none;
            }

            .hd-hud-btn:hover {
                border-color: #38bdf8;
                color: #38bdf8;
                transform: translateY(-1.5px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(56, 189, 248, 0.35);
            }

            .hd-hud-btn:active {
                transform: scale(0.95);
            }

            .hd-btn-quest:hover {
                border-color: #f59e0b;
                color: #fde047;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(245, 158, 11, 0.35);
            }

            .hd-btn-bag, .hd-btn-menu, .hd-btn-mobile {
                padding: 7px 9px;
                width: 36px;
                height: 36px;
                box-sizing: border-box;
            }

            .hd-svg-icon {
                width: 18px;
                height: 18px;
                display: block;
            }

            .hd-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #10b981;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                padding: 1px 5px;
                border-radius: 999px;
                border: 1.5px solid #0f172a;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            }

            .hd-status-dot {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 7px;
                height: 7px;
                background: #10b981;
                border-radius: 50%;
                box-shadow: 0 0 6px #10b981;
            }

            /* --- NAVIGATION BADGES --- */
            /* --- NAVIGATION BADGES --- */
            .hd-nav-badge {
                position: fixed;
                top: 66px;
                display: none;
                flex-direction: column;
                max-width: 320px;
                padding: 7px 14px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 10px;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                opacity: 0;
                transform: translateY(-4px);
                transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: none;
                user-select: none;
                -webkit-user-select: none;
                z-index: 120;
            }

            .hd-nav-badge.visible {
                display: flex !important;
                opacity: 1 !important;
                transform: translateY(0) !important;
            }

            .hd-nav-left {
                left: 18px;
                border: 1.5px solid rgba(56, 189, 248, 0.55);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                text-align: left;
                align-items: flex-start;
            }

            .hd-nav-right {
                right: 18px;
                border: 1.5px solid rgba(96, 165, 250, 0.55);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(96, 165, 250, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                text-align: right;
                align-items: flex-end;
            }

            .hd-nav-title {
                font-size: 12.5px;
                font-weight: 700;
                letter-spacing: 0.3px;
                line-height: 1.35;
                color: #f8fafc;
                display: flex;
                align-items: center;
                gap: 6px;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
            }

            .hd-nav-left .hd-nav-title {
                color: #38bdf8;
            }

            .hd-nav-right .hd-nav-title {
                color: #60a5fa;
            }

            .hd-nav-sub {
                font-size: 11px;
                font-weight: 500;
                color: #cbd5e1;
                line-height: 1.3;
                margin-top: 2px;
                opacity: 0.92;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            }

            @keyframes pulseArrowLeft {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(-3px); }
            }
            @keyframes pulseArrowRight {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(3px); }
            }
            @keyframes pulseArrowUp {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            .hd-nav-arrow-left {
                display: inline-block;
                animation: pulseArrowLeft 1.4s ease-in-out infinite;
                margin-right: 4px;
            }
            .hd-nav-arrow-right {
                display: inline-block;
                animation: pulseArrowRight 1.4s ease-in-out infinite;
                margin-left: 4px;
            }
            .hd-nav-arrow-up {
                display: inline-block;
                animation: pulseArrowUp 1.4s ease-in-out infinite;
                margin-right: 4px;
            }

            @media (max-width: 640px) {
                .hd-hud-group { top: 8px; gap: 6px; }
                .hd-top-left { left: 8px; }
                .hd-top-right { right: 8px; }
                .hd-hp-pill { padding: 4px 10px; gap: 5px; }
                .hd-hp-tag { font-size: 9.5px; }
                .hd-hp-hearts { font-size: 12px; }
                .hd-hp-num { font-size: 10px; }
                .hd-hud-btn { padding: 5px 8px; font-size: 11px; }
                .hd-btn-bag, .hd-btn-menu, .hd-btn-mobile { width: 32px; height: 32px; padding: 6px; }
                .hd-svg-icon { width: 15px; height: 15px; }
                .hd-nav-badge { padding: 5px 10px; max-width: 220px; }
                .hd-nav-title { font-size: 11px; }
                .hd-nav-sub { font-size: 9.5px; }
                .hd-quest-tracker {
                    min-width: 190px;
                    max-width: 250px;
                    padding: 5px 9px 7px 9px;
                }
                .hd-qt-tag { font-size: 9px; }
                .hd-qt-title { font-size: 11px; }
                .hd-qt-objective { font-size: 10px; }
            }
        `;
        document.head.appendChild(style);
    }

    static attachScene(scene) {
        this.init();
        this.activeScene = scene;
        this.showTopHUD();

        if (isMobileDevice()) {
            const mobBtn = document.getElementById('hd-btn-mobile');
            if (mobBtn) {
                mobBtn.style.display = 'flex';
                const enabled = scene.isMobileControlsEnabled ? scene.isMobileControlsEnabled() : true;
                this.updateMobile(enabled);
            }
        }

        // Sync initial values from scene
        if (scene.registry) {
            const hp = scene.registry.get('playerHP') !== undefined ? scene.registry.get('playerHP') : 3;
            this.updateHealth(hp, 3);
            const inv = scene.registry.get('inventory') || [];
            this.updateBagCount(inv.length);
            const qState = scene.registry.get('questState');
            if (qState) {
                this.updateQuestTracker(qState);
            }
            if (scene.registry.events) {
                scene.registry.events.on('changedata-questState', (parent, val) => {
                    this.updateQuestTracker(val);
                });
                scene.registry.events.on('setdata', (parent, key, data) => {
                    if (key === 'questState') this.updateQuestTracker(data);
                });
            }
        }
        if (scene.currentZoom) {
            this.updateZoom(scene.currentZoom);
        }

        this.updateBadgePositioning();
    }

    static updateQuestTracker(qState) {
        this.init();
        if (!qState) return;
        const chapterEl = document.getElementById('hd-qt-chapter');
        const titleEl = document.getElementById('hd-qt-title');
        const objEl = document.getElementById('hd-qt-objective');
        const tracker = document.getElementById('hd-quest-tracker');

        const chText = qState.chapter ? `MISI ${qState.chapter}` : 'MISI AKTIF';
        if (chapterEl) chapterEl.textContent = chText;
        if (titleEl) titleEl.textContent = qState.title || 'Petualangan Baru';
        if (objEl) objEl.textContent = qState.objective || 'Jelajahi area dan bicaralah dengan penduduk desa.';

        // Glow flash & collect sound when objective actually updates
        if (tracker && this._lastObjective && this._lastObjective !== qState.objective) {
            tracker.classList.remove('quest-flash');
            void tracker.offsetWidth; // trigger reflow
            tracker.classList.add('quest-flash');
            if (GameAudio && GameAudio.playCollect) {
                GameAudio.playCollect();
            }
        }
        this._lastObjective = qState.objective;
        this.updateBadgePositioning();
    }

    static updateHealth(hp, maxHP = 3) {
        this.init();
        this._currentHP = hp;
        this._maxHP = maxHP;
        const heartsCont = document.getElementById('hd-hp-hearts');
        const numText = document.getElementById('hd-hp-num');
        if (heartsCont) {
            let hHtml = '';
            for (let i = 0; i < maxHP; i++) {
                hHtml += (i < hp) ? '<span class="hd-heart">❤️</span>' : '<span class="hd-heart" style="opacity: 0.35;">🖤</span>';
            }
            heartsCont.innerHTML = hHtml;
        }
        if (numText) {
            numText.textContent = `${hp}/${maxHP}`;
            numText.style.color = (hp <= 1) ? '#ef4444' : '#fda4af';
        }
    }

    static updateZoom(zoomVal) {
        this.init();
        const zoomLabel = document.getElementById('hd-zoom-label');
        if (zoomLabel) {
            const z = zoomVal || 0.85;
            const label = (z % 1 === 0) ? `${z.toFixed(1)}x` : `${z.toFixed(2)}x`;
            zoomLabel.textContent = `🔍 ${label}`;
        }
    }

    static updateBagCount(count) {
        this.init();
        const badge = document.getElementById('hd-bag-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    static updateMobile(enabled) {
        this.init();
        const dot = document.getElementById('hd-mob-dot');
        if (dot) {
            dot.style.background = enabled ? '#10b981' : '#64748b';
            dot.style.boxShadow = enabled ? '0 0 6px #10b981' : 'none';
        }
    }

    static showTopHUD() {
        this.init();
        if (this.topLeftContainer) this.topLeftContainer.style.display = 'flex';
        if (this.topRightContainer) this.topRightContainer.style.display = 'flex';
    }

    static hideTopHUD() {
        if (this.topLeftContainer) this.topLeftContainer.style.display = 'none';
        if (this.topRightContainer) this.topRightContainer.style.display = 'none';
    }

    static formatHTML(rawText) {
        if (!rawText) return '';
        let processed = rawText
            .replace(/[◀◄]/g, '<span class="hd-nav-arrow-left">◀</span>')
            .replace(/[➔►]/g, '<span class="hd-nav-arrow-right">➔</span>')
            .replace(/[▲]/g, '<span class="hd-nav-arrow-up">▲</span>');

        const lines = processed.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return '';
        if (lines.length === 1) {
            return `<span class="hd-nav-title">${lines[0]}</span>`;
        }
        return `
            <span class="hd-nav-title">${lines[0]}</span>
            <span class="hd-nav-sub">${lines.slice(1).join(' ')}</span>
        `;
    }

    static setLeft(text, visible = true) {
        this.init();
        if (!this.leftBadge) return;
        this.updateBadgePositioning();
        if (text && visible) {
            this.leftBadge.innerHTML = this.formatHTML(text);
            this.leftBadge.classList.add('visible');
            this.leftBadge.style.display = 'flex';
        } else {
            this.leftBadge.classList.remove('visible');
            this.leftBadge.style.display = 'none';
        }
    }

    static setRight(text, visible = true) {
        this.init();
        if (!this.rightBadge) return;
        this.updateBadgePositioning();
        if (text && visible) {
            this.rightBadge.innerHTML = this.formatHTML(text);
            this.rightBadge.classList.add('visible');
            this.rightBadge.style.display = 'flex';
        } else {
            this.rightBadge.classList.remove('visible');
            this.rightBadge.style.display = 'none';
        }
    }

    static clear() {
        this.setLeft('', false);
        this.setRight('', false);
    }

    static createBadge(direction, initialText, initialVisible = true) {
        this.init();
        return new HDNavBadgeHandle(direction, initialText, initialVisible);
    }
}