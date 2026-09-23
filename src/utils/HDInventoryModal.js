/**
 * HDInventoryModal.js
 * Modern HTML/CSS Glassmorphic Inventory Modal (5x4 Grid, 20 Slots).
 */
import { GameAudio } from '../audio/GameAudio.js';
import { getInventory } from './gameState.js';

export class HDInventoryModal {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;
        this.injectStyles();
        this.createDOM();
    }

    static injectStyles() {
        if (document.getElementById('hd-inventory-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-inventory-styles';
        style.textContent = `
            #hd-inv-overlay {
                position: fixed; inset: 0; width: 100vw; height: 100vh;
                background: rgba(4, 8, 18, 0.72);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                display: flex; justify-content: center; align-items: center;
                z-index: 999998; opacity: 0; pointer-events: none;
                transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                padding: 16px; box-sizing: border-box;
                user-select: none; -webkit-user-select: none;
                font-family: 'Fredoka', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            #hd-inv-overlay.active { opacity: 1; pointer-events: all; }
            #hd-inv-modal {
                position: relative; width: 100%; max-width: 440px; max-height: 94vh;
                overflow-y: auto;
                background: linear-gradient(180deg, #0f1c34 0%, #070d1a 100%);
                border: 2px solid #0284c7; border-radius: 18px;
                box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 35px rgba(2,132,199,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
                display: flex; flex-direction: column;
                transform: scale(0.93) translateY(8px);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                color: #f8fafc; scrollbar-width: thin; scrollbar-color: #1e3a8a transparent;
            }
            #hd-inv-overlay.active #hd-inv-modal { transform: scale(1) translateY(0); }
            #hd-inv-modal::-webkit-scrollbar { width: 6px; }
            #hd-inv-modal::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 3px; }
            .hd-inv-header {
                position: relative; padding: 14px 20px;
                background: linear-gradient(90deg, #0c4a6e 0%, #0369a1 50%, #0c4a6e 100%);
                border-bottom: 1.5px solid rgba(56,189,248,0.4);
                border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center;
            }
            .hd-inv-title {
                font-size: 17px; font-weight: 800; letter-spacing: 0.8px; color: #fff;
                text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(56,189,248,0.5);
                display: flex; align-items: center; gap: 8px;
            }
            .hd-inv-close {
                position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                width: 30px; height: 30px; border-radius: 50%;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
                display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
            }
            .hd-inv-close:hover { background: #dc2626; border-color: #ef4444; transform: translateY(-50%) scale(1.08); }
            .hd-inv-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 16px; }
            .hd-inv-grid {
                display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 6px;
                background: rgba(3,7,18,0.5); border-radius: 14px; border: 1px solid rgba(30,58,138,0.5);
            }
            .hd-inv-slot {
                position: relative; aspect-ratio: 1 / 1; min-height: 56px;
                background: linear-gradient(145deg, #050b17 0%, #09152b 100%);
                border: 2px solid #142a47; border-radius: 10px;
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.3);
                display: flex; align-items: center; justify-content: center; cursor: pointer;
                transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .hd-inv-slot:hover {
                border-color: #38bdf8;
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.8), 0 0 14px rgba(56,189,248,0.45);
                transform: translateY(-2px) scale(1.04);
                background: linear-gradient(145deg, #0c1c38 0%, #10274d 100%);
            }
            .hd-inv-slot.active-item { border-color: #0284c7; background: linear-gradient(145deg, #081426 0%, #0e2444 100%); }
            .hd-inv-slot.selected { border-color: #f59e0b; box-shadow: inset 0 2px 6px rgba(0,0,0,0.8), 0 0 16px rgba(245,158,11,0.55); transform: translateY(-2px) scale(1.05); }
            .hd-slot-icon { font-size: 26px; line-height: 1; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7)); transition: transform 0.15s ease; }
            .hd-inv-slot:hover .hd-slot-icon { transform: scale(1.15); }
            .hd-slot-img { max-width: 36px; max-height: 36px; image-rendering: pixelated; image-rendering: crisp-edges; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7)); transition: transform 0.15s ease; }
            .hd-inv-slot:hover .hd-slot-img { transform: scale(1.15); }
            .hd-inv-detail-card {
                background: rgba(10,20,40,0.85); border: 1.5px solid rgba(56,189,248,0.4);
                border-radius: 12px; padding: 12px 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
                display: flex; flex-direction: column; gap: 5px; min-height: 68px;
            }
            .hd-inv-detail-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
            .hd-inv-detail-title { font-size: 13.5px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }
            .hd-inv-detail-capacity { font-size: 11px; font-weight: 700; color: #94a3b8; background: rgba(15,23,42,0.8); border: 1px solid rgba(148,163,184,0.3); border-radius: 6px; padding: 2px 7px; }
            .hd-inv-detail-desc { font-size: 12px; color: #cbd5e1; line-height: 1.4; font-style: italic; }
            .hd-inv-hint { text-align: center; font-size: 11px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 6px; padding-bottom: 2px; }
            .hd-inv-hint kbd { background: #1e293b; border: 1px solid #475569; color: #93c5fd; font-family: inherit; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
        `;
        document.head.appendChild(style);
    }

    static createDOM() {
        let overlay = document.getElementById('hd-inv-overlay');
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'hd-inv-overlay';
        overlay.innerHTML = `
            <div id="hd-inv-modal" role="dialog" aria-modal="true">
                <div class="hd-inv-header">
                    <div class="hd-inv-title"><span>&#127890;</span> INVENTARIS</div>
                    <button class="hd-inv-close" id="hd-inv-close-btn" title="Tutup (ESC / 1 / I)">&#10006;</button>
                </div>
                <div class="hd-inv-body">
                    <div class="hd-inv-grid" id="hd-inv-grid"></div>
                    <div class="hd-inv-detail-card" id="hd-inv-detail-card">
                        <div class="hd-inv-detail-header">
                            <div class="hd-inv-detail-title" id="hd-inv-detail-title"><span>&#128230;</span> INVENTARIS</div>
                            <div class="hd-inv-detail-capacity" id="hd-inv-detail-capacity">0 / 20 Slot</div>
                        </div>
                        <div class="hd-inv-detail-desc" id="hd-inv-detail-desc">Sorot atau ketuk kotak untuk melihat informasi barang.</div>
                    </div>
                    <div class="hd-inv-hint">Tekan <kbd>1</kbd> / <kbd>I</kbd> / <kbd>ESC</kbd> untuk menutup</div>
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
        const closeBtn = document.getElementById('hd-inv-close-btn');
        if (closeBtn) closeBtn.onclick = () => this.hide();
    }

    static getItemFallbackEmoji(item) {
        if (!item) return '';
        const name = (typeof item === 'string' ? item : item.id || '').toLowerCase();
        if (name.includes('ramuan') || name.includes('potion')) return '[RMN]';
        if (name.includes('kunci') || name.includes('key')) return '[KEY]';
        if (name.includes('gem') || name.includes('permata')) return '[GEM]';
        if (name.includes('pisau') || name.includes('dagger') || name.includes('belati')) return '[PSU]';
        if (name.includes('roti') || name.includes('bread')) return '[RTI]';
        if (name.includes('madu') || name.includes('honey')) return '[MDU]';
        if (name.includes('kayu') || name.includes('firewood')) return '[KYU]';
        if (name.includes('asap') || name.includes('smoker')) return '[ASP]';
        if (name.includes('tepung') || name.includes('flour')) return '[TPG]';
        return '[ITM]';
    }

    static getItemTextureKey(item) {
        if (!item) return null;
        const name = (typeof item === 'string' ? item : item.id || '').toLowerCase();
        if (name.includes('ramuan') || name.includes('cure') || name.includes('potion') || name.includes('obat')) return 'item_potion';
        if (name.includes('kunci') || name.includes('key')) return 'item_key';
        if (name.includes('seed') || name.includes('permata') || name.includes('gem') || name.includes('kristal') || name.includes('diamond')) return 'item_gem';
        if (name.includes('pisau') || name.includes('belati') || name.includes('dagger') || name.includes('pedang')) return 'belati_pixel';
        if (name.includes('magic bread') || name.includes('roti magis')) return 'item_magic_bread';
        if (name.includes('roti') || name.includes('bread')) return 'item_bread';
        if (name.includes('madu') || name.includes('honey')) return 'item_honey';
        if (name.includes('smoker') || name.includes('asap')) return 'item_smoker';
        if (name.includes('tepung') || name.includes('flour')) return 'item_flour';
        if (name.includes('kayu') || name.includes('firewood')) return 'special_firewood';
        return null;
    }

    static renderGrid() {
        const grid = document.getElementById('hd-inv-grid');
        if (!grid || !this._currentScene) return;
        const inv = getInventory(this._currentScene.registry) || [];
        grid.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'hd-inv-slot';
            slot.dataset.index = i;

            if (i < inv.length) {
                const item = inv[i];
                slot.classList.add('active-item');
                const texKey = this.getItemTextureKey(item);
                let renderedIcon = false;

                if (texKey && this._currentScene.textures && this._currentScene.textures.exists(texKey)) {
                    try {
                        const imgSource = this._currentScene.textures.get(texKey).getSourceImage();
                        if (imgSource && imgSource.src) {
                            const img = document.createElement('img');
                            img.className = 'hd-slot-img';
                            img.src = imgSource.src;
                            img.alt = typeof item === 'string' ? item : item.id;
                            slot.appendChild(img);
                            renderedIcon = true;
                        }
                    } catch (e) {}
                }

                if (!renderedIcon) {
                    const icon = document.createElement('span');
                    icon.className = 'hd-slot-icon';
                    icon.textContent = this.getItemFallbackEmoji(item);
                    slot.appendChild(icon);
                }

                slot.onmouseenter = () => { GameAudio.playHover(); this.showDetail(item, i); };
                slot.onclick = () => { GameAudio.playClick(); this.showDetail(item, i); };
            } else {
                slot.onmouseenter = () => this.showDetail(null);
                slot.onclick = () => this.showDetail(null);
            }
            grid.appendChild(slot);
        }
        this.showDetail(null);
    }

    static showDetail(item, index = null) {
        const titleEl = document.getElementById('hd-inv-detail-title');
        const descEl = document.getElementById('hd-inv-detail-desc');
        const capEl = document.getElementById('hd-inv-detail-capacity');
        const inv = (this._currentScene && this._currentScene.registry) ? getInventory(this._currentScene.registry) : [];
        if (capEl) capEl.textContent = `${inv.length} / 20 Slot`;
        const allSlots = document.querySelectorAll('.hd-inv-slot');
        allSlots.forEach(s => s.classList.remove('selected'));
        if (index !== null && allSlots[index]) allSlots[index].classList.add('selected');

        if (item) {
            const displayName = typeof item === 'string' ? item : item.id;
            const desc = (typeof item === 'object' && item.desc) ? item.desc : 'Item penting dalam perjalanan petualangan Aksel.';
            const label = this.getItemFallbackEmoji(item);
            if (titleEl) { titleEl.innerHTML = `<span>${label}</span> ${displayName.toUpperCase()}`; titleEl.style.color = '#38bdf8'; }
            if (descEl) { descEl.textContent = `"${desc}"`; descEl.style.color = '#f1f5f9'; }
        } else {
            if (titleEl) { titleEl.innerHTML = `<span>&#128230;</span> INVENTARIS`; titleEl.style.color = '#94a3b8'; }
            if (descEl) { descEl.textContent = 'Sorot atau ketuk kotak untuk melihat informasi barang.'; descEl.style.color = '#94a3b8'; }
        }
    }

    static show(scene) {
        this.init();
        this._currentScene = scene;
        this.isOpen = true;
        if (this.overlay) this.overlay.classList.add('active');
        this.renderGrid();
    }

    static hide() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.overlay) this.overlay.classList.remove('active');
        GameAudio.playClick();
        if (this._currentScene) {
            this._currentScene.isInvOpen = false;
            this._currentScene.updateMobileControlsVisibility();
        }
    }

    static toggle(scene) {
        if (this.isOpen) this.hide(); else this.show(scene);
    }
}