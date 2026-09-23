/**
 * HDSettingsModal.js
 * Modern, high-definition HTML/CSS Glassmorphic Settings & Pause Modal.
 */
import { GameAudio } from '../audio/GameAudio.js';
import { DisplayManager } from './DisplayManager.js';
import { isMobileDevice } from './gameState.js';

export class HDSettingsModal {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;
        this.injectStyles();
        this.createDOM();
    }

    static injectStyles() {
        if (document.getElementById('hd-settings-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-settings-styles';
        style.textContent = `
            #hd-settings-overlay {
                position: fixed; inset: 0; width: 100vw; height: 100vh;
                background: rgba(4, 8, 18, 0.72);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                display: flex; justify-content: center; align-items: center;
                z-index: 999999; opacity: 0; pointer-events: none;
                transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                padding: 16px; box-sizing: border-box;
                user-select: none; -webkit-user-select: none;
                font-family: 'Fredoka', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            #hd-settings-overlay.active { opacity: 1; pointer-events: all; }
            #hd-settings-modal {
                position: relative; width: 100%; max-width: 580px; max-height: 92vh;
                overflow-y: auto;
                background: linear-gradient(180deg, #101a30 0%, #0a1120 100%);
                border: 2px solid rgba(245, 158, 11, 0.85); border-radius: 18px;
                box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 35px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.12);
                display: flex; flex-direction: column;
                transform: scale(0.93) translateY(8px);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                color: #f8fafc; scrollbar-width: thin; scrollbar-color: #334155 transparent;
            }
            #hd-settings-overlay.active #hd-settings-modal { transform: scale(1) translateY(0); }
            #hd-settings-modal::-webkit-scrollbar { width: 6px; }
            #hd-settings-modal::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
            .hd-set-header {
                position: relative; padding: 14px 20px;
                background: linear-gradient(90deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%);
                border-bottom: 1.5px solid rgba(99,102,241,0.5);
                border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center;
            }
            .hd-set-title {
                font-size: 17px; font-weight: 800; letter-spacing: 0.8px; color: #fbbf24;
                text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(251,191,36,0.4);
                display: flex; align-items: center; gap: 8px;
            }
            .hd-set-close {
                position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                width: 30px; height: 30px; border-radius: 50%;
                background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
                color: #cbd5e1; font-size: 15px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
            }
            .hd-set-close:hover { background: #dc2626; color: #fff; border-color: #ef4444; transform: translateY(-50%) scale(1.08); }
            .hd-set-body { padding: 16px 22px; display: flex; flex-direction: column; gap: 12px; }
            .hd-set-row {
                display: flex; align-items: center; justify-content: space-between;
                background: rgba(15,23,42,0.65); border: 1px solid rgba(51,65,85,0.6);
                border-radius: 12px; padding: 9px 14px; transition: all 0.18s ease;
            }
            .hd-set-row:hover { background: rgba(30,41,59,0.7); border-color: rgba(100,116,139,0.8); }
            .hd-set-label { font-size: 13.5px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }
            .hd-set-controls { display: flex; align-items: center; gap: 8px; }
            .hd-btn-toggle {
                min-width: 68px; height: 30px; padding: 0 12px; border-radius: 8px;
                font-size: 11.5px; font-weight: 800; letter-spacing: 0.5px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 5px;
                border: 1.5px solid rgba(255,255,255,0.25); transition: all 0.15s ease;
            }
            .hd-btn-toggle.on { background: linear-gradient(135deg,#15803d,#16a34a); color: #fff; box-shadow: 0 2px 8px rgba(22,163,74,0.35); }
            .hd-btn-toggle.on:hover { filter: brightness(1.12); transform: scale(1.03); }
            .hd-btn-toggle.off { background: linear-gradient(135deg,#991b1b,#dc2626); color: #fecaca; box-shadow: 0 2px 8px rgba(220,38,38,0.35); }
            .hd-btn-toggle.off:hover { filter: brightness(1.12); transform: scale(1.03); }
            .hd-btn-icon {
                width: 30px; height: 30px; border-radius: 8px; background: #1e293b;
                border: 1px solid #475569; color: #f8fafc; font-size: 13px; font-weight: 700;
                cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
            }
            .hd-btn-icon:hover { background: #334155; border-color: #94a3b8; color: #38bdf8; transform: scale(1.06); }
            .hd-btn-icon:active { transform: scale(0.96); }
            .hd-val-badge {
                min-width: 46px; height: 30px; padding: 0 8px; border-radius: 8px;
                background: rgba(15,23,42,0.85); border: 1px solid rgba(56,189,248,0.3);
                color: #38bdf8; font-size: 12.5px; font-weight: 800; display: flex; align-items: center; justify-content: center;
            }
            .hd-val-badge.sfx { color: #4ade80; border-color: rgba(74,222,128,0.3); }
            .hd-btn-reset {
                height: 30px; padding: 0 12px; border-radius: 8px; background: #1e3a8a;
                border: 1px solid #38bdf8; color: #fff; font-size: 11px; font-weight: 800;
                letter-spacing: 0.5px; cursor: pointer; transition: all 0.15s ease;
            }
            .hd-btn-reset:hover { background: #2563eb; box-shadow: 0 0 10px rgba(56,189,248,0.4); transform: scale(1.04); }
            .hd-res-pill {
                height: 30px; padding: 0 12px; border-radius: 8px;
                background: linear-gradient(135deg,#1e3a8a,#172554); border: 1px solid #38bdf8;
                color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 6px;
                max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: all 0.15s ease;
            }
            .hd-res-pill:hover { background: #2563eb; box-shadow: 0 0 12px rgba(56,189,248,0.35); }
            .hd-set-divider { height: 1px; background: linear-gradient(90deg,transparent,#334155,transparent); margin: 4px 0; }
            .hd-ctrl-section {
                background: rgba(10,16,30,0.7); border: 1px solid rgba(51,65,85,0.5);
                border-radius: 12px; padding: 12px 14px;
            }
            .hd-ctrl-title {
                font-size: 12px; font-weight: 800; letter-spacing: 0.6px; color: #93c5fd;
                text-align: center; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 6px;
            }
            .hd-ctrl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 14px; }
            @media (max-width: 520px) { .hd-ctrl-grid { grid-template-columns: 1fr; } }
            .hd-ctrl-item { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #cbd5e1; }
            .hd-ctrl-item kbd {
                background: #1e293b; border: 1px solid #475569; border-bottom: 2px solid #334155;
                color: #fde047; font-family: inherit; font-size: 10.5px; font-weight: 700;
                padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.4); white-space: nowrap;
            }
            .hd-set-actions { display: flex; gap: 12px; margin-top: 4px; }
            .hd-btn-action {
                flex: 1; height: 42px; border-radius: 10px; font-size: 13.5px; font-weight: 800;
                letter-spacing: 0.5px; cursor: pointer; display: flex; align-items: center;
                justify-content: center; gap: 8px; transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
                box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            }
            .hd-btn-resume {
                background: linear-gradient(135deg,#2563eb,#1d4ed8); border: 1.5px solid #60a5fa;
                color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.4);
            }
            .hd-btn-resume:hover { background: linear-gradient(135deg,#3b82f6,#2563eb); box-shadow: 0 6px 20px rgba(37,99,235,0.6); transform: translateY(-1.5px); }
            .hd-btn-quit {
                background: linear-gradient(135deg,#991b1b,#7f1d1d); border: 1.5px solid #f87171;
                color: #fff; box-shadow: 0 4px 14px rgba(153,27,27,0.4);
            }
            .hd-btn-quit:hover { background: linear-gradient(135deg,#b91c1c,#991b1b); box-shadow: 0 6px 20px rgba(220,38,38,0.6); transform: translateY(-1.5px); }
            .hd-set-location {
                padding: 7px 14px; border-radius: 8px; background: #060f1e; border: 1px solid #1e3a8a;
                font-size: 12px; font-weight: 700; color: #4ade80; text-align: center;
                display: flex; align-items: center; justify-content: center; gap: 6px;
            }
        `;
        document.head.appendChild(style);
    }

    static createDOM() {
        let overlay = document.getElementById('hd-settings-overlay');
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'hd-settings-overlay';
        overlay.innerHTML = `
            <div id="hd-settings-modal" role="dialog" aria-modal="true">
                <div class="hd-set-header">
                    <div class="hd-set-title"><span>&#9881;</span> PENGATURAN &amp; JEDA PERMAINAN</div>
                    <button class="hd-set-close" id="hd-set-close-btn" title="Tutup (ESC)">&#10006;</button>
                </div>
                <div class="hd-set-body">
                    <div class="hd-set-row">
                        <div class="hd-set-label"><span>&#127925;</span> Musik Latar (BGM):</div>
                        <div class="hd-set-controls">
                            <button class="hd-btn-toggle on" id="hd-bgm-toggle">ON</button>
                            <button class="hd-btn-icon" id="hd-bgm-minus">-</button>
                            <div class="hd-val-badge" id="hd-bgm-val">80%</div>
                            <button class="hd-btn-icon" id="hd-bgm-plus">+</button>
                        </div>
                    </div>
                    <div class="hd-set-row">
                        <div class="hd-set-label"><span>&#128266;</span> Efek Suara (SFX):</div>
                        <div class="hd-set-controls">
                            <button class="hd-btn-toggle on" id="hd-sfx-toggle">ON</button>
                            <button class="hd-btn-icon" id="hd-sfx-minus">-</button>
                            <div class="hd-val-badge sfx" id="hd-sfx-val">80%</div>
                            <button class="hd-btn-icon" id="hd-sfx-plus">+</button>
                        </div>
                    </div>
                    <div class="hd-set-row" id="hd-zoom-row">
                        <div class="hd-set-label"><span>&#128269;</span> Zoom Kamera:</div>
                        <div class="hd-set-controls">
                            <button class="hd-btn-icon" id="hd-zoom-minus">-</button>
                            <div class="hd-val-badge" id="hd-zoom-val">1.00x</div>
                            <button class="hd-btn-icon" id="hd-zoom-plus">+</button>
                            <button class="hd-btn-reset" id="hd-zoom-reset">RESET</button>
                        </div>
                    </div>
                    <div class="hd-set-row">
                        <div class="hd-set-label"><span>&#128421;</span> Resolusi Layar (px):</div>
                        <div class="hd-set-controls">
                            <button class="hd-btn-icon" id="hd-res-prev">&#9664;</button>
                            <div class="hd-res-pill" id="hd-res-current">LAYAR PENUH (AUTO-FIT)</div>
                            <button class="hd-btn-icon" id="hd-res-next">&#9654;</button>
                            <button class="hd-btn-icon" id="hd-res-fs">FS</button>
                        </div>
                    </div>
                    <div class="hd-set-row" id="hd-mobile-row" style="display:none;">
                        <div class="hd-set-label"><span>&#128241;</span> Tombol Layar HP:</div>
                        <div class="hd-set-controls">
                            <button class="hd-btn-toggle on" id="hd-mobile-toggle">AKTIF [ON]</button>
                        </div>
                    </div>
                    <div class="hd-set-divider"></div>
                    <div class="hd-ctrl-section">
                        <div class="hd-ctrl-title"><span>&#127918;</span> PANDUAN KONTROL PERMAINAN</div>
                        <div class="hd-ctrl-grid">
                            <div class="hd-ctrl-item"><kbd>A</kbd> / <kbd>D</kbd> : Bergerak Kiri / Kanan</div>
                            <div class="hd-ctrl-item"><kbd>W</kbd> / <kbd>SPASI</kbd> : Melompat</div>
                            <div class="hd-ctrl-item"><kbd>E</kbd> : Berinteraksi</div>
                            <div class="hd-ctrl-item"><kbd>Pinch / Scroll</kbd> : Zoom</div>
                            <div class="hd-ctrl-item"><kbd>1</kbd> / <kbd>I</kbd> : Inventory</div>
                            <div class="hd-ctrl-item"><kbd>Q</kbd> : Quest</div>
                            <div class="hd-ctrl-item"><kbd>Menu</kbd> / <kbd>ESC</kbd> : Pengaturan</div>
                            <div class="hd-ctrl-item"><kbd>S</kbd> : Skip Dialog</div>
                        </div>
                    </div>
                    <div class="hd-set-actions">
                        <button class="hd-btn-action hd-btn-resume" id="hd-action-resume">&#9654; LANJUTKAN [ESC]</button>
                        <button class="hd-btn-action hd-btn-quit" id="hd-action-quit">&#128682; KELUAR KE MENU</button>
                    </div>
                    <div class="hd-set-location" id="hd-location-text">Lokasi: Rumah Aksel &amp; Rachael</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.bindEvents();
    }

    static bindEvents() {
        if (!this.overlay) return;
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.hide(); });
        const closeBtn = document.getElementById('hd-set-close-btn');
        if (closeBtn) closeBtn.onclick = () => this.hide();
        const resumeBtn = document.getElementById('hd-action-resume');
        if (resumeBtn) resumeBtn.onclick = () => this.hide();
        const quitBtn = document.getElementById('hd-action-quit');
        if (quitBtn) {
            quitBtn.onclick = () => {
                GameAudio.playClick();
                this.hide();
                if (this._currentScene) {
                    this._currentScene.cameras.main.fadeOut(350, 0, 0, 0);
                    this._currentScene.time.delayedCall(400, () => { this._currentScene.scene.start('TitleScene'); });
                }
            };
        }
        const bgmToggle = document.getElementById('hd-bgm-toggle');
        if (bgmToggle) bgmToggle.onclick = () => { GameAudio.bgmEnabled = !GameAudio.bgmEnabled; if (GameAudio.bgmEnabled) GameAudio.startAmbientBGM(); else GameAudio.stopAmbientBGM(); GameAudio.updateGainValues(); GameAudio.playClick(); this.updateUI(); };
        const bgmMinus = document.getElementById('hd-bgm-minus');
        if (bgmMinus) bgmMinus.onclick = () => { GameAudio.setBGMVolume(GameAudio.bgmVolume - 0.1); GameAudio.playClick(); this.updateUI(); };
        const bgmPlus = document.getElementById('hd-bgm-plus');
        if (bgmPlus) bgmPlus.onclick = () => { GameAudio.setBGMVolume(GameAudio.bgmVolume + 0.1); GameAudio.playClick(); this.updateUI(); };
        const sfxToggle = document.getElementById('hd-sfx-toggle');
        if (sfxToggle) sfxToggle.onclick = () => { GameAudio.sfxEnabled = !GameAudio.sfxEnabled; GameAudio.updateGainValues(); if (GameAudio.sfxEnabled) GameAudio.playClick(); this.updateUI(); };
        const sfxMinus = document.getElementById('hd-sfx-minus');
        if (sfxMinus) sfxMinus.onclick = () => { GameAudio.setSFXVolume(GameAudio.sfxVolume - 0.1); GameAudio.playClick(); this.updateUI(); };
        const sfxPlus = document.getElementById('hd-sfx-plus');
        if (sfxPlus) sfxPlus.onclick = () => { GameAudio.setSFXVolume(GameAudio.sfxVolume + 0.1); GameAudio.playClick(); this.updateUI(); };
        const zoomMinus = document.getElementById('hd-zoom-minus');
        if (zoomMinus) zoomMinus.onclick = () => { if (this._currentScene) { this._currentScene.setCameraZoom(this._currentScene.currentZoom - 0.1, true); GameAudio.playClick(); this.updateUI(); } };
        const zoomPlus = document.getElementById('hd-zoom-plus');
        if (zoomPlus) zoomPlus.onclick = () => { if (this._currentScene) { this._currentScene.setCameraZoom(this._currentScene.currentZoom + 0.1, true); GameAudio.playClick(); this.updateUI(); } };
        const zoomReset = document.getElementById('hd-zoom-reset');
        if (zoomReset) zoomReset.onclick = () => { if (this._currentScene) { this._currentScene.setCameraZoom(1.0, true); GameAudio.playClick(); this.updateUI(); } };
        const resPrev = document.getElementById('hd-res-prev');
        if (resPrev) resPrev.onclick = () => { if (this._currentScene) { DisplayManager.cyclePrev(this._currentScene.game); GameAudio.playClick(); this.updateUI(); } };
        const resNext = document.getElementById('hd-res-next');
        if (resNext) resNext.onclick = () => { if (this._currentScene) { DisplayManager.cycleNext(this._currentScene.game); GameAudio.playClick(); this.updateUI(); } };
        const resCurrent = document.getElementById('hd-res-current');
        if (resCurrent) resCurrent.onclick = () => { if (this._currentScene) { DisplayManager.cycleNext(this._currentScene.game); GameAudio.playClick(); this.updateUI(); } };
        const resFs = document.getElementById('hd-res-fs');
        if (resFs) resFs.onclick = () => { if (this._currentScene) { DisplayManager.toggleFullscreen(this._currentScene); GameAudio.playClick(); } };
        const mobToggle = document.getElementById('hd-mobile-toggle');
        if (mobToggle) mobToggle.onclick = () => { if (this._currentScene) { const next = !this._currentScene.isMobileControlsEnabled(); this._currentScene.setMobileControlsEnabled(next); GameAudio.playClick(); this.updateUI(); } };
    }

    static show(scene) {
        this.init();
        this._currentScene = scene;
        this.isOpen = true;
        if (this.overlay) this.overlay.classList.add('active');
        this.updateUI();
    }

    static hide() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.overlay) this.overlay.classList.remove('active');
        GameAudio.playClick();
        if (this._currentScene) {
            this._currentScene.isSettingsOpen = false;
            if (typeof this._currentScene.updateMobileControlsVisibility === 'function') {
                this._currentScene.updateMobileControlsVisibility();
            }
        }
    }

    static toggle(scene) {
        if (this.isOpen) this.hide(); else this.show(scene);
    }

    static updateUI() {
        if (!this.isOpen) return;
        const isTitleScene = this._currentScene && (this._currentScene.scene?.key === 'TitleScene' || this._currentScene.constructor?.name === 'TitleScene');

        const bgmToggle = document.getElementById('hd-bgm-toggle');
        if (bgmToggle) { bgmToggle.className = `hd-btn-toggle ${GameAudio.bgmEnabled ? 'on' : 'off'}`; bgmToggle.textContent = GameAudio.bgmEnabled ? 'ON' : 'OFF'; }
        const bgmVal = document.getElementById('hd-bgm-val');
        if (bgmVal) bgmVal.textContent = `${Math.round(GameAudio.bgmVolume * 100)}%`;
        const sfxToggle = document.getElementById('hd-sfx-toggle');
        if (sfxToggle) { sfxToggle.className = `hd-btn-toggle ${GameAudio.sfxEnabled ? 'on' : 'off'}`; sfxToggle.textContent = GameAudio.sfxEnabled ? 'ON' : 'OFF'; }
        const sfxVal = document.getElementById('hd-sfx-val');
        if (sfxVal) sfxVal.textContent = `${Math.round(GameAudio.sfxVolume * 100)}%`;
        
        const zoomRow = document.getElementById('hd-zoom-row');
        if (zoomRow) zoomRow.style.display = isTitleScene ? 'none' : 'flex';
        const zoomVal = document.getElementById('hd-zoom-val');
        if (zoomVal && this._currentScene) zoomVal.textContent = `${(this._currentScene.currentZoom || 1.0).toFixed(2)}x`;
        
        const resCurrent = document.getElementById('hd-res-current');
        if (resCurrent) resCurrent.textContent = DisplayManager.current.label;
        
        const mobRow = document.getElementById('hd-mobile-row');
        const mobToggle = document.getElementById('hd-mobile-toggle');
        if (isMobileDevice() && this._currentScene && typeof this._currentScene.isMobileControlsEnabled === 'function') {
            if (mobRow) mobRow.style.display = 'flex';
            if (mobToggle) { const active = this._currentScene.isMobileControlsEnabled(); mobToggle.className = `hd-btn-toggle ${active ? 'on' : 'off'}`; mobToggle.textContent = active ? 'AKTIF [ON]' : 'MATI [OFF]'; }
        } else if (mobRow) { mobRow.style.display = 'none'; }
        
        const quitBtn = document.getElementById('hd-action-quit');
        if (quitBtn) quitBtn.style.display = isTitleScene ? 'none' : 'flex';

        const resumeBtn = document.getElementById('hd-action-resume');
        if (resumeBtn) {
            resumeBtn.innerHTML = isTitleScene ? '&#10006; TUTUP [ESC]' : '&#9654; LANJUTKAN [ESC]';
        }

        const locText = document.getElementById('hd-location-text');
        if (locText && this._currentScene) {
            const loc = isTitleScene ? 'Menu Utama' : (this._currentScene.currentLocationName || (this._currentScene.registry ? this._currentScene.registry.get('currentLocationName') : '') || 'Dunia Petualangan Goblin');
            locText.textContent = `Lokasi: ${loc}`;
        }
    }
}