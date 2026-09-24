/**
 * HDDialogueManager.js
 * High-definition HTML Overlay for Dialogues & NPC conversations.
 * Symmetrically centered, crisp vector typography, elegant portrait framing,
 * and 100% immune to camera zoom distortions.
 */
import { GameAudio } from '../audio/GameAudio.js';
import { isMobileDevice } from './gameState.js';

export class HDDialogueManager {
    static init() {
        if (typeof document === 'undefined') return;
        if (this._initialized) return;
        this._initialized = true;

        this._portraitMap = {
            'Rachael': '/assets/karakter_rachael.png',
            'Nenek': '/assets/karakter_nenek.png',
            'Nenek Linda': '/assets/karakter_nenek.png',
            'Linda': '/assets/karakter_nenek.png',
            'Grandma Linda': '/assets/karakter_nenek.png',
            'Aksel': '/assets/karakter_aksel.png',
            'Aksel (Goblin)': '/assets/karakter_aksel_goblin.png',
            'Aksel (Dalam Hati)': '/assets/karakter_aksel.png',
            'Madam Joanne': '/assets/karakter_penyihir.png',
            'Madam Joanne (Penyihir)': '/assets/karakter_penyihir.png',
            'Penyihir': '/assets/karakter_penyihir.png',
            'Grandma Mary': '/assets/karakter_nenekmary.png',
            'Nenek Mary': '/assets/karakter_nenekmary.png',
            'Mr. Heinreich': '/assets/karakter_mrheinreich.png',
            'Heinreich': '/assets/karakter_mrheinreich.png',
            'Mr. Breado': '/assets/karakter_mrbreado.png',
            'Breado': '/assets/karakter_mrbreado.png',
            'Pemburu Desa': '/assets/karakter_pemburu_npc.png',
            'Pemburu': '/assets/karakter_pemburu_npc.png',
            'Hunter': '/assets/karakter_pemburu_npc.png',
            'Pak Thomas': '/assets/karakter_pakthomas_npc.png',
            'Thomas': '/assets/karakter_pakthomas_npc.png',
            'Ibu Sarah': '/assets/karakter_ibusarah_npc.png',
            'Sarah': '/assets/karakter_ibusarah_npc.png',
            'Paman Bob': '/assets/karakter_pamanbob_npc.png',
            'Bob': '/assets/karakter_pamanbob_npc.png',
            'Rachael (Sembuh)': '/assets/karakter_rachael_sembuh.png'
        };

        this._textureKeyMap = {
            'portrait_rachael': '/assets/karakter_rachael.png',
            'portrait_nenek': '/assets/karakter_nenek.png',
            'portrait_linda': '/assets/karakter_nenek.png',
            'portrait_aksel': '/assets/karakter_aksel.png',
            'portrait_aksel_goblin': '/assets/karakter_aksel_goblin.png',
            'portrait_penyihir': '/assets/karakter_penyihir.png',
            'portrait_mary': '/assets/karakter_nenekmary.png',
            'portrait_heinreich': '/assets/karakter_mrheinreich.png',
            'portrait_breado': '/assets/karakter_mrbreado.png',
            'portrait_hunter': '/assets/karakter_pemburu_npc.png',
            'portrait_thomas': '/assets/karakter_pakthomas_npc.png',
            'portrait_sarah': '/assets/karakter_ibusarah_npc.png',
            'portrait_bob': '/assets/karakter_pamanbob_npc.png',
            'portrait_rachael_sembuh': '/assets/karakter_rachael_sembuh.png'
        };

        this._activeScene = null;
        this._dialogueList = [];
        this._currentIndex = 0;
        this._onComplete = null;
        this._isTalking = false;
        this._isTyping = false;
        this._currentText = '';
        this._charIndex = 0;
        this._typeInterval = null;
        this._prevSpeaker = null;

        this.injectStyles();
        this.createDOM();
        this.bindEvents();
    }

    static createDOM() {
        let overlay = document.getElementById('game-hd-dialogue-root');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'game-hd-dialogue-root';
            overlay.className = 'hd-dialogue-root';
            overlay.innerHTML = `
                <div id="hd-dialogue-dimmer" class="hd-dialogue-dimmer"></div>
                
                <div id="hd-dialogue-stage" class="hd-dialogue-stage">
                    <!-- Character Portrait Area (BEHIND the dialogue box!) -->
                    <div id="hd-portrait-wrapper" class="hd-portrait-wrapper">
                        <div class="hd-portrait-shadow"></div>
                        <img id="hd-portrait-img" class="hd-portrait-img" src="" alt="Portrait" />
                        <div id="hd-portrait-fallback" class="hd-portrait-fallback" style="display: none;">💬</div>
                    </div>

                    <!-- Main Dialogue Container (In front of portrait) -->
                    <div id="hd-dialogue-container" class="hd-dialogue-container">
                        <!-- 4 Golden Diamond Corner Ornaments -->
                        <div class="hd-dialogue-corner hd-corner-tl"></div>
                        <div class="hd-dialogue-corner hd-corner-tr"></div>
                        <div class="hd-dialogue-corner hd-corner-bl"></div>
                        <div class="hd-dialogue-corner hd-corner-br"></div>

                        <!-- Speaker Name Badge (Top Center) -->
                        <div class="hd-dialogue-name-wrapper">
                            <span class="hd-dialogue-name-orn">◆</span>
                            <div id="hd-dialogue-name" class="hd-dialogue-name">Aksel</div>
                            <span class="hd-dialogue-name-orn">◆</span>
                        </div>

                        <!-- Skip Button (Top Right) -->
                        <button id="hd-dialogue-skip" class="hd-dialogue-skip" title="Lewati Percakapan (S / ESC)">
                            <span id="hd-skip-label">⏩ SKIP [S]</span>
                        </button>

                        <!-- Dialogue Body Content Area -->
                        <div id="hd-dialogue-body-wrapper" class="hd-dialogue-body-wrapper">
                            <div id="hd-dialogue-text" class="hd-dialogue-text"></div>
                        </div>

                        <!-- Continue Prompt (Bottom) -->
                        <div id="hd-continue-prompt" class="hd-continue-prompt">
                            <span id="hd-continue-label">▼ Sentuh Layar / [E] / [SPASI]</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        this.root = overlay;
        this.dimmer = document.getElementById('hd-dialogue-dimmer');
        this.stage = document.getElementById('hd-dialogue-stage');
        this.container = document.getElementById('hd-dialogue-container');
        this.nameEl = document.getElementById('hd-dialogue-name');
        this.skipBtn = document.getElementById('hd-dialogue-skip');
        this.skipLabel = document.getElementById('hd-skip-label');
        this.portraitWrapper = document.getElementById('hd-portrait-wrapper');
        this.portraitImg = document.getElementById('hd-portrait-img');
        this.portraitFallback = document.getElementById('hd-portrait-fallback');
        this.bodyWrapper = document.getElementById('hd-dialogue-body-wrapper');
        this.textEl = document.getElementById('hd-dialogue-text');
        this.continuePrompt = document.getElementById('hd-continue-prompt');
        this.continueLabel = document.getElementById('hd-continue-label');

        this.updatePlatformLabels();
    }

    static updatePlatformLabels() {
        if (this.skipLabel) {
            this.skipLabel.textContent = isMobileDevice() ? '⏩ LEWATI' : '⏩ SKIP [S]';
        }
        if (this.continueLabel) {
            this.continueLabel.textContent = isMobileDevice() ? '▼ Sentuh Layar untuk Lanjut' : '▼ Sentuh Layar / [E] / [SPASI]';
        }
    }

    static bindEvents() {
        if (this._eventsBound) return;
        this._eventsBound = true;

        // Advance on box click
        if (this.container) {
            this.container.addEventListener('pointerdown', (e) => {
                if (e.target.closest('#hd-dialogue-skip')) return;
                e.stopPropagation();
                this.advance();
            });
        }

        // Skip button click
        if (this.skipBtn) {
            this.skipBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                GameAudio.playClick();
                this.skip();
            });
            this.skipBtn.addEventListener('pointerenter', () => GameAudio.playHover());
        }

        // Global keyboard listener
        window.addEventListener('keydown', (e) => {
            if (!this._isTalking) return;
            const code = e.code;
            if (code === 'Space' || code === 'KeyE' || code === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                this.advance();
            } else if (code === 'KeyS' || code === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.skip();
            }
        }, { capture: true });
    }

    static injectStyles() {
        if (document.getElementById('hd-dialogue-styles')) return;
        const style = document.createElement('style');
        style.id = 'hd-dialogue-styles';
        style.textContent = `
            .hd-dialogue-root {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 1000;
                overflow: hidden;
                display: none;
                font-family: 'Fredoka', 'Segoe UI', Tahoma, sans-serif;
                user-select: none;
                -webkit-user-select: none;
            }

            .hd-dialogue-root.active {
                display: block;
            }

            /* Dim background overlay with cinematic soft vignette */
            .hd-dialogue-dimmer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at 50% 45%, rgba(0, 0, 0, 0.12) 0%, rgba(3, 7, 18, 0.45) 70%, rgba(2, 6, 23, 0.72) 100%),
                            linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, transparent 18%, transparent 70%, rgba(0, 0, 0, 0.55) 100%);
                opacity: 0;
                transition: opacity 0.35s ease;
                pointer-events: auto;
            }

            .hd-dialogue-root.active .hd-dialogue-dimmer {
                opacity: 1;
            }

            /* Dialogue Stage Wrapper (Anchors both portrait and dialogue box symmetrically) */
            .hd-dialogue-stage {
                position: absolute;
                bottom: 22px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                width: min(94vw, 940px);
                pointer-events: none;
                opacity: 0;
                transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease;
            }

            .hd-dialogue-root.active .hd-dialogue-stage {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }

            /* Main Dialogue Container (Layered in FRONT of portrait) */
            .hd-dialogue-container {
                position: relative;
                width: 100%;
                min-height: 148px;
                background: linear-gradient(180deg, rgba(14, 20, 52, 0.98) 0%, rgba(8, 12, 34, 0.98) 100%);
                border: 2px solid #b8941f;
                outline: 3px solid #8b6914;
                outline-offset: -1px;
                border-radius: 8px;
                box-shadow: 0 14px 40px rgba(0, 0, 0, 0.88), inset 0 0 20px rgba(212, 160, 23, 0.16);
                box-sizing: border-box;
                pointer-events: auto;
                cursor: pointer;
                z-index: 10;
            }

            /* Golden Diamond Corner Ornaments */
            .hd-dialogue-corner {
                position: absolute;
                width: 12px;
                height: 12px;
                background: #f5c842;
                border: 1.5px solid #8b6914;
                transform: rotate(45deg);
                z-index: 15;
                box-shadow: 0 0 8px rgba(245, 200, 66, 0.65);
            }

            .hd-corner-tl { top: -7px; left: -7px; }
            .hd-corner-tr { top: -7px; right: -7px; }
            .hd-corner-bl { bottom: -7px; left: -7px; }
            .hd-corner-br { bottom: -7px; right: -7px; }

            /* Speaker Name Badge */
            .hd-dialogue-name-wrapper {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 9px;
                background: linear-gradient(180deg, #241a54 0%, #130f33 100%);
                border: 2px solid #d4a017;
                border-radius: 5px;
                padding: 4px 26px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7), 0 0 10px rgba(212, 160, 23, 0.35);
                z-index: 15;
            }

            .hd-dialogue-name {
                color: #fce166;
                font-size: 15.5px;
                font-weight: 800;
                letter-spacing: 0.6px;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                white-space: nowrap;
            }

            .hd-dialogue-name-orn {
                color: #f5c842;
                font-size: 9px;
                line-height: 1;
            }

            /* Skip Button */
            .hd-dialogue-skip {
                position: absolute;
                top: -15px;
                right: 22px;
                background: rgba(26, 20, 64, 0.95);
                border: 1.5px solid #d4a017;
                border-radius: 5px;
                color: #f5c842;
                font-size: 11.5px;
                font-weight: 700;
                padding: 5px 16px;
                cursor: pointer;
                transition: all 0.15s ease;
                z-index: 15;
                box-shadow: 0 3px 12px rgba(0, 0, 0, 0.55);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .hd-dialogue-skip:hover {
                background: #342878;
                border-color: #fde047;
                color: #ffffff;
                transform: scale(1.05);
                box-shadow: 0 4px 14px rgba(245, 200, 66, 0.4);
            }

            .hd-dialogue-skip:active {
                transform: scale(0.97);
            }

            /* Character Portrait Area (BEHIND the dialogue box!) */
            .hd-portrait-wrapper {
                position: absolute;
                bottom: 65px;
                left: 18px;
                width: 250px;
                height: 330px;
                pointer-events: none;
                z-index: 5;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                overflow: visible;
            }

            .hd-portrait-shadow {
                position: absolute;
                bottom: 4px;
                left: 50%;
                transform: translateX(-50%);
                width: 150px;
                height: 18px;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 70%);
                border-radius: 50%;
                z-index: 1;
            }

            .hd-portrait-img {
                max-height: 330px;
                width: auto;
                max-width: 250px;
                object-fit: contain;
                object-position: bottom center;
                filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.85));
                z-index: 2;
                transform-origin: bottom center;
                transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease;
            }

            .hd-portrait-fallback {
                font-size: 48px;
                margin-bottom: 60px;
                z-index: 2;
            }

            /* Dialogue Body Content (Centered symmetrically!) */
            .hd-dialogue-body-wrapper {
                box-sizing: border-box;
                padding: 26px 60px 32px 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 148px;
            }

            .hd-dialogue-container.no-portrait .hd-dialogue-body-wrapper {
                padding: 26px 60px 32px 60px;
            }

            .hd-dialogue-text {
                color: #f8fafc;
                font-size: 17.5px;
                line-height: 1.65;
                font-weight: 500;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
                text-align: center;
                max-width: 780px;
                margin: 0 auto;
                word-break: break-word;
            }

            /* Continue Indicator Prompt */
            .hd-continue-prompt {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                color: #d4a017;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.4px;
                pointer-events: none;
                z-index: 10;
                animation: hd-prompt-pulse 1.2s ease-in-out infinite alternate;
            }

            @keyframes hd-prompt-pulse {
                0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0.35; transform: translateX(-50%) translateY(1px); }
            }

            /* Mobile & Small Screen Adaptation */
            @media (max-width: 768px) {
                .hd-dialogue-stage {
                    bottom: 10px;
                    width: 96vw;
                }
                .hd-dialogue-container {
                    min-height: 126px;
                }
                .hd-portrait-wrapper {
                    width: 160px;
                    height: 230px;
                    bottom: 45px;
                    left: 6px;
                }
                .hd-portrait-img {
                    max-height: 230px;
                    max-width: 160px;
                }
                .hd-dialogue-body-wrapper {
                    padding: 22px 20px 26px 20px;
                    min-height: 126px;
                }
                .hd-dialogue-text {
                    font-size: 14.5px;
                    line-height: 1.55;
                }
                .hd-dialogue-skip {
                    padding: 4px 12px;
                    font-size: 10.5px;
                    right: 14px;
                }
                .hd-dialogue-name {
                    font-size: 13.5px;
                    padding: 3px 18px;
                }
            }

            @media (max-width: 480px) {
                .hd-portrait-wrapper {
                    display: none;
                }
                .hd-dialogue-body-wrapper {
                    padding: 20px 18px 24px 18px !important;
                }
                .hd-dialogue-text {
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    static start(scene, dialogueList, onComplete = null) {
        this.init();
        if (!dialogueList || dialogueList.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        this._activeScene = scene;
        this._dialogueList = dialogueList;
        this._currentIndex = 0;
        this._onComplete = onComplete;
        this._isTalking = true;
        this._prevSpeaker = null;

        GameAudio.playDialogue();

        if (this._activeScene && this._activeScene.player && this._activeScene.player.body) {
            this._activeScene.player.setVelocityX(0);
        }
        if (this._activeScene && typeof this._activeScene.updateMobileControlsVisibility === 'function') {
            this._activeScene.updateMobileControlsVisibility();
        }

        this.updatePlatformLabels();
        this.root.classList.add('active');

        this.displayCurrent();
    }

    static displayCurrent() {
        if (!this._isTalking) return;
        const currentData = this._dialogueList[this._currentIndex];
        if (!currentData) {
            this.end();
            return;
        }

        const speakerName = currentData.speaker || '';
        this.nameEl.textContent = speakerName;

        this.updatePortrait(speakerName, currentData.portrait);

        // Notify active scene of current dialogue line & index
        if (this._activeScene) {
            this._activeScene.currentDialogueIndex = this._currentIndex;
            if (typeof this._activeScene.onDialogueLine === 'function') {
                this._activeScene.onDialogueLine(this._currentIndex, currentData);
            }
        }

        // Typewriter effect
        this._currentText = currentData.text || '';
        this._charIndex = 0;
        this._isTyping = true;
        this.textEl.textContent = '';

        if (this._typeInterval) {
            clearInterval(this._typeInterval);
            this._typeInterval = null;
        }

        this._typeInterval = setInterval(() => {
            if (!this._isTyping) {
                clearInterval(this._typeInterval);
                this._typeInterval = null;
                return;
            }

            this._charIndex++;
            this.textEl.textContent = this._currentText.substring(0, this._charIndex);

            if (this._charIndex >= this._currentText.length) {
                this._isTyping = false;
                clearInterval(this._typeInterval);
                this._typeInterval = null;
            }
        }, 22);
    }

    static updatePortrait(speakerName, explicitPortrait = null) {
        let portraitUrl = null;

        // 1. Cek explicit portrait texture key
        if (explicitPortrait) {
            portraitUrl = this._textureKeyMap[explicitPortrait] || explicitPortrait;
        }

        // 2. Cek status Rachael sembuh
        if (!portraitUrl && speakerName === 'Rachael' && this._activeScene && this._activeScene.registry && this._activeScene.registry.get('rachaelHealed')) {
            portraitUrl = '/assets/karakter_rachael_sembuh.png';
        }

        // 3. Cek mapping pembicara
        if (!portraitUrl) {
            portraitUrl = this._portraitMap[speakerName];
        }

        // 4. Fuzzy fallback matching
        if (!portraitUrl && speakerName) {
            if (speakerName.includes('Madam Joanne') || speakerName.includes('Penyihir')) {
                portraitUrl = '/assets/karakter_penyihir.png';
            } else if (speakerName.startsWith('Aksel')) {
                portraitUrl = '/assets/karakter_aksel.png';
            } else if (speakerName.startsWith('Rachael')) {
                portraitUrl = (this._activeScene && this._activeScene.registry && this._activeScene.registry.get('rachaelHealed'))
                    ? '/assets/karakter_rachael_sembuh.png'
                    : '/assets/karakter_rachael.png';
            }
        }

        const isSameSpeaker = (this._prevSpeaker === (explicitPortrait ? `${speakerName}_${explicitPortrait}` : speakerName));
        this._prevSpeaker = (explicitPortrait ? `${speakerName}_${explicitPortrait}` : speakerName);

        if (portraitUrl) {
            this.portraitWrapper.style.display = 'flex';
            this.container.classList.remove('no-portrait');
            this.portraitImg.style.display = 'block';
            this.portraitFallback.style.display = 'none';

            if (this.portraitImg.src !== window.location.origin + portraitUrl && !this.portraitImg.src.endsWith(portraitUrl)) {
                this.portraitImg.src = portraitUrl;
            }

            if (!isSameSpeaker) {
                this.portraitImg.style.transform = 'scale(0.92) translateY(12px)';
                this.portraitImg.style.opacity = '0';
                requestAnimationFrame(() => {
                    this.portraitImg.style.transform = 'scale(1) translateY(0)';
                    this.portraitImg.style.opacity = '1';
                });
            }
        } else {
            // Speaker tanpa avatar (Narator, dsb.)
            this.portraitWrapper.style.display = 'none';
            this.container.classList.add('no-portrait');
        }
    }

    static advance() {
        if (!this._isTalking) return;

        // Jika teks sedang diketik, langsung selesaikan ketikan teks
        if (this._isTyping) {
            this._isTyping = false;
            if (this._typeInterval) {
                clearInterval(this._typeInterval);
                this._typeInterval = null;
            }
            this.textEl.textContent = this._currentText;
            return;
        }

        // Lanjut ke indeks berikutnya
        this._currentIndex++;
        if (this._currentIndex < this._dialogueList.length) {
            GameAudio.playDialogue();
            this.displayCurrent();
        } else {
            this.end();
        }
    }

    static next() {
        this.advance();
    }

    static skip() {
        if (!this._isTalking) return;
        this.end();
    }

    static end() {
        if (!this._isTalking) return;
        this._isTalking = false;
        this._isTyping = false;
        this._prevSpeaker = null;

        if (this._typeInterval) {
            clearInterval(this._typeInterval);
            this._typeInterval = null;
        }

        if (this.root) {
            this.root.classList.remove('active');
        }

        if (this._activeScene && typeof this._activeScene.updateMobileControlsVisibility === 'function') {
            this._activeScene.updateMobileControlsVisibility();
        }

        if (this._onComplete) {
            const cb = this._onComplete;
            this._onComplete = null;
            cb();
        }
    }

    static hide() {
        this.end();
    }

    static isTalking() {
        return !!this._isTalking;
    }
}
