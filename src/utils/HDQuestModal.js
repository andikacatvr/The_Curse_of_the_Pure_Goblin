/**
 * HDQuestModal.js
 * Modern HTML/CSS Glassmorphic Quest & Objective Modal.
 */
import { GameAudio } from '../audio/GameAudio.js';
import { getQuestState } from './gameState.js';

export class HDQuestModal {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;
        this.injectStyles();
        this.createDOM();
    }

    static injectStyles() {
        if (document.getElementById('hd-quest-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-quest-styles';
        style.textContent = `
            #hd-quest-overlay {
                position: fixed; inset: 0; width: 100vw; height: 100vh;
                background: rgba(4, 8, 18, 0.72);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                display: flex; justify-content: center; align-items: center;
                z-index: 999997; opacity: 0; pointer-events: none;
                transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                padding: 16px; box-sizing: border-box;
                user-select: none; -webkit-user-select: none;
                font-family: 'Fredoka', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            #hd-quest-overlay.active { opacity: 1; pointer-events: all; }
            #hd-quest-modal {
                position: relative; width: 100%; max-width: 500px; max-height: 92vh;
                overflow-y: auto;
                background: linear-gradient(180deg, #0e172a 0%, #080d1a 100%);
                border: 2px solid #f59e0b; border-radius: 18px;
                box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 35px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
                display: flex; flex-direction: column;
                transform: scale(0.93) translateY(8px);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                color: #f8fafc; scrollbar-width: thin; scrollbar-color: #3b2c12 transparent;
            }
            #hd-quest-overlay.active #hd-quest-modal { transform: scale(1) translateY(0); }
            #hd-quest-modal::-webkit-scrollbar { width: 6px; }
            #hd-quest-modal::-webkit-scrollbar-thumb { background: #d97706; border-radius: 3px; }
            
            .hd-quest-header {
                position: relative; padding: 14px 20px;
                background: linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
                border-bottom: 1.5px solid rgba(245,158,11,0.45);
                border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center;
            }
            .hd-quest-title {
                font-size: 17px; font-weight: 800; letter-spacing: 0.8px; color: #fde047;
                text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 14px rgba(245,158,11,0.5);
                display: flex; align-items: center; gap: 8px;
            }
            .hd-quest-close {
                position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                width: 30px; height: 30px; border-radius: 50%;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
                display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
            }
            .hd-quest-close:hover { background: #dc2626; border-color: #ef4444; transform: translateY(-50%) scale(1.08); }
            
            .hd-quest-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
            
            .hd-quest-meta-bar {
                display: flex; align-items: center; justify-content: space-between; gap: 8px;
            }
            .hd-quest-chapter-badge {
                display: inline-flex; align-items: center; gap: 6px;
                background: rgba(245,158,11,0.15); border: 1.5px solid rgba(245,158,11,0.5);
                color: #fde047; font-size: 12px; font-weight: 800; padding: 4px 12px;
                border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .hd-quest-status-badge {
                display: inline-flex; align-items: center; gap: 5px;
                background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.45);
                color: #6ee7b7; font-size: 11px; font-weight: 700; padding: 3px 10px;
                border-radius: 999px;
            }
            .hd-quest-status-dot {
                width: 7px; height: 7px; background: #10b981; border-radius: 50%;
                box-shadow: 0 0 8px #10b981;
            }
            
            /* Active Quest Card */
            .hd-active-quest-card {
                background: linear-gradient(145deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%);
                border: 1.5px solid rgba(56,189,248,0.5);
                border-radius: 14px; padding: 14px 16px;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.4);
                display: flex; flex-direction: column; gap: 8px;
            }
            .hd-active-quest-tag {
                font-size: 11px; font-weight: 800; color: #38bdf8;
                text-transform: uppercase; letter-spacing: 0.8px;
                display: flex; align-items: center; gap: 6px;
            }
            .hd-active-quest-title {
                font-size: 15px; font-weight: 800; color: #f8fafc;
                line-height: 1.35;
            }
            .hd-active-objective-box {
                background: rgba(3,7,18,0.45);
                border: 1px solid rgba(56,189,248,0.25);
                border-radius: 10px; padding: 10px 12px;
                display: flex; flex-direction: column; gap: 4px;
            }
            .hd-active-objective-label {
                font-size: 10.5px; font-weight: 800; color: #94a3b8;
                letter-spacing: 0.5px;
            }
            .hd-active-objective-text {
                font-size: 13px; color: #e2e8f0; line-height: 1.5;
            }
            
            /* Completed Quests Section */
            .hd-completed-section {
                display: flex; flex-direction: column; gap: 8px;
            }
            .hd-completed-header {
                font-size: 12px; font-weight: 800; color: #34d399;
                text-transform: uppercase; letter-spacing: 0.8px;
                display: flex; align-items: center; gap: 6px;
            }
            .hd-completed-list {
                display: flex; flex-direction: column; gap: 6px;
                max-height: 160px; overflow-y: auto; padding-right: 4px;
            }
            .hd-completed-item {
                display: flex; align-items: center; gap: 9px;
                background: rgba(6,78,59,0.25); border: 1px solid rgba(16,185,129,0.3);
                border-radius: 8px; padding: 7px 12px; font-size: 12.5px; color: #d1fae5;
            }
            .hd-completed-icon {
                color: #34d399; font-weight: 800; font-size: 13px; flex-shrink: 0;
            }
            .hd-completed-empty {
                background: rgba(15,23,42,0.5); border: 1px dashed rgba(100,116,139,0.35);
                border-radius: 10px; padding: 12px 14px; font-size: 12px; color: #94a3b8;
                text-align: center; line-height: 1.4;
            }
            
            .hd-quest-hint {
                text-align: center; font-size: 11px; color: #64748b;
                display: flex; align-items: center; justify-content: center; gap: 6px;
                padding-top: 4px;
            }
            .hd-quest-hint kbd {
                background: #1e293b; border: 1px solid #475569; color: #fde047;
                font-family: inherit; font-size: 10px; font-weight: 700;
                padding: 1px 6px; border-radius: 4px;
            }
            
            @media (max-width: 600px) {
                #hd-quest-modal { max-width: 95vw; }
                .hd-quest-body { padding: 14px; gap: 10px; }
                .hd-active-quest-title { font-size: 13.5px; }
                .hd-active-objective-text { font-size: 12px; }
            }
        `;
        document.head.appendChild(style);
    }

    static createDOM() {
        let overlay = document.getElementById('hd-quest-overlay');
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'hd-quest-overlay';
        overlay.innerHTML = `
            <div id="hd-quest-modal" role="dialog" aria-modal="true">
                <div class="hd-quest-header">
                    <div class="hd-quest-title"><span>📜</span> CATATAN QUEST & OBJEKTIF</div>
                    <button class="hd-quest-close" id="hd-quest-close-btn" title="Tutup (Q / ESC)">&#10006;</button>
                </div>
                <div class="hd-quest-body">
                    <div class="hd-quest-meta-bar">
                        <div class="hd-quest-chapter-badge" id="hd-quest-chapter-badge">BAB 1</div>
                        <div class="hd-quest-status-badge">
                            <span class="hd-quest-status-dot"></span>
                            <span>Misi Aktif</span>
                        </div>
                    </div>
                    
                    <div class="hd-active-quest-card">
                        <div class="hd-active-quest-tag"><span>📌</span> Misi Berjalan</div>
                        <div class="hd-active-quest-title" id="hd-active-quest-title">-</div>
                        <div class="hd-active-objective-box">
                            <div class="hd-active-objective-label">OBJEKTIF UTAMA:</div>
                            <div class="hd-active-objective-text" id="hd-active-objective-text">-</div>
                        </div>
                    </div>
                    
                    <div class="hd-completed-section">
                        <div class="hd-completed-header"><span>✅</span> Riwayat Quest Selesai</div>
                        <div class="hd-completed-list" id="hd-completed-list"></div>
                    </div>
                    
                    <div class="hd-quest-hint">Tekan <kbd>Q</kbd> / <kbd>ESC</kbd> untuk menutup</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.bindEvents();
    }

    static bindEvents() {
        if (!this.overlay) return;
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });
        const closeBtn = document.getElementById('hd-quest-close-btn');
        if (closeBtn) closeBtn.onclick = () => this.hide();

        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
                e.stopPropagation();
                this.hide();
            }
        });
    }

    static renderContent() {
        if (!this._currentScene || !this._currentScene.registry) return;
        const qState = getQuestState(this._currentScene.registry);

        const chapterEl = document.getElementById('hd-quest-chapter-badge');
        if (chapterEl) {
            chapterEl.textContent = qState.chapter || 'PETUALANGAN';
        }

        const titleEl = document.getElementById('hd-active-quest-title');
        if (titleEl) {
            titleEl.textContent = qState.title || 'Menjelajahi Dunia';
        }

        const objectiveEl = document.getElementById('hd-active-objective-text');
        if (objectiveEl) {
            objectiveEl.textContent = qState.objective || 'Bicaralah dengan NPC atau jelajahi area sekitar.';
        }

        const compList = document.getElementById('hd-completed-list');
        if (compList) {
            compList.innerHTML = '';
            const completed = qState.completedQuests || [];
            if (completed.length > 0) {
                completed.forEach(q => {
                    const item = document.createElement('div');
                    item.className = 'hd-completed-item';
                    item.innerHTML = `<span class="hd-completed-icon">✔</span><span>${q}</span>`;
                    compList.appendChild(item);
                });
            } else {
                const empty = document.createElement('div');
                empty.className = 'hd-completed-empty';
                empty.innerHTML = `💡 Belum ada quest yang terselesaikan.<br>Ikuti alur cerita & bicaralah dengan NPC di sekitar!`;
                compList.appendChild(empty);
            }
        }
    }

    static show(scene) {
        this.init();
        this._currentScene = scene;
        this.isOpen = true;
        if (this.overlay) this.overlay.classList.add('active');
        this.renderContent();
    }

    static hide() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.overlay) this.overlay.classList.remove('active');
        GameAudio.playClick();
        if (this._currentScene) {
            this._currentScene.isQuestModalOpen = false;
            if (typeof this._currentScene.updateMobileControlsVisibility === 'function') {
                this._currentScene.updateMobileControlsVisibility();
            }
        }
    }

    static toggle(scene) {
        if (this.isOpen) this.hide(); else this.show(scene);
    }
}
