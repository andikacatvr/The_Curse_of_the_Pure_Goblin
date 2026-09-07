import Phaser from 'phaser';

// Typography System (Google Fonts: Pirata One for Headings 1/2/3, Fredoka for Body Text)
const FONT_TITLE = '"Pirata One", cursive, serif';
const FONT_BODY = '"Fredoka", "Segoe UI", sans-serif';

// Configure Phaser text defaults to Fredoka & High-DPI Super-Sampling (Razor-sharp HD Text)
if (Phaser && Phaser.GameObjects && Phaser.GameObjects.Text) {
    const origSetStyle = Phaser.GameObjects.Text.prototype.setStyle;
    Phaser.GameObjects.Text.prototype.setStyle = function (style, updateText, setDefaults) {
        if (!style) style = {};
        if (!style.fontFamily) style.fontFamily = FONT_BODY;
        // High-DPI supersampling (renders text at 3x canvas resolution for crispness)
        if (style.resolution === undefined) {
            style.resolution = Math.max(3, (window.devicePixelRatio || 1) * 2);
        }
        return origSetStyle.call(this, style, updateText, setDefaults);
    };
}

// Shared Helpers
function getInventory(registry) {
    if (!registry.get('inventory')) {
        registry.set('inventory', []);
    }
    return registry.get('inventory');
}

function getQuestState(registry) {
    if (!registry.get('questState')) {
        registry.set('questState', {
            chapter: 'PROLOG',
            title: 'Mencari Kayu Bakar di Hutan Danau',
            objective: 'Jalan ke arah barat [◀] menuju Hutan Danau & Pegunungan untuk mencari 3 kayu bakar suruhan Nenek.',
            questNumber: 0,
            completedQuests: []
        });
    }
    return registry.get('questState');
}

function setQuestState(registry, newQuestObj) {
    const currentState = getQuestState(registry);
    const updated = { ...currentState, ...newQuestObj };
    registry.set('questState', updated);
}

// -------------------------------------------------------------
// WEB AUDIO SYNTHESIZER (ZERO-DEPENDENCY SFX & BGM)
// -------------------------------------------------------------
class GameAudio {
    static init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.bgmGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.bgmGain.connect(this.ctx.destination);
            this.sfxGain.connect(this.ctx.destination);
            this.bgmGain.gain.value = 0.25;
            this.sfxGain.gain.value = 0.4;
            this.bgmEnabled = true;
            this.sfxEnabled = true;
        } catch (e) {
            console.warn('Web Audio not supported', e);
        }
    }

    static resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    static playHover() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
            gain.gain.setValueAtTime(0.08 * this.sfxGain.gain.value, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }

    static playClick() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const startTime = now + idx * 0.04;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.18 * this.sfxGain.gain.value, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.16);
            });
        } catch (e) {}
    }

    static playStart() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const t = now + idx * 0.07;
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.22 * this.sfxGain.gain.value, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.28);
            });
        } catch (e) {}
    }

    static startAmbientBGM() {
        this.init();
        this.resume();
        if (!this.bgmEnabled || !this.ctx || this.bgmPlaying) return;
        try {
            const chords = [
                [220, 261.63, 329.63], // Am
                [174.61, 220, 261.63], // F
                [196, 246.94, 293.66], // G
                [220, 277.18, 329.63]  // A
            ];
            let chordIdx = 0;
            this.bgmPlaying = true;
            this.bgmGain.gain.value = 0.12;

            const playChord = () => {
                if (!this.bgmPlaying || !this.bgmEnabled || !this.ctx) return;
                const notes = chords[chordIdx % chords.length];
                chordIdx++;
                const now = this.ctx.currentTime;
                notes.forEach(f => {
                    const osc = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, now);
                    g.gain.setValueAtTime(0.001, now);
                    g.gain.linearRampToValueAtTime(0.02, now + 1.2);
                    g.gain.linearRampToValueAtTime(0.001, now + 3.8);
                    osc.connect(g);
                    g.connect(this.bgmGain);
                    osc.start(now);
                    osc.stop(now + 4.0);
                });
                this.bgmTimer = setTimeout(playChord, 3800);
            };
            playChord();
        } catch (e) {}
    }

    static stopAmbientBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}


// -------------------------------------------------------------
// DISPLAY & RESOLUTION MANAGER
// -------------------------------------------------------------
class DisplayManager {
    static init() {
        if (this._initialized) return;
        this._initialized = true;
        this.resolutions = [
            { id: 'fit', label: '📺 LAYAR PAS (AUTO-FIT 16:9)', desc: 'Menyesuaikan layar browser otomatis' },
            { id: '1280x720', label: '1280 x 720 (BESAR HD)', width: 1280, height: 720 },
            { id: '960x540', label: '960 x 540 (SEDANG)', width: 960, height: 540 },
            { id: '800x450', label: '800 x 450 (KECIL ASLI)', width: 800, height: 450 }
        ];
        this.currentIdx = 0; // Default to Auto-Fit for large immersive view!
        try {
            const saved = localStorage.getItem('game_resolution');
            if (saved) {
                const foundIdx = this.resolutions.findIndex(r => r.id === saved);
                if (foundIdx !== -1) this.currentIdx = foundIdx;
            }
        } catch (e) {}

        this.applyResolution();
        window.addEventListener('resize', () => {
            if (this.resolutions[this.currentIdx].id === 'fit') {
                this.applyResolution();
            }
        });
    }

    static get current() {
        this.init();
        return this.resolutions[this.currentIdx];
    }

    static cycleNext() {
        this.init();
        this.currentIdx = (this.currentIdx + 1) % this.resolutions.length;
        try {
            localStorage.setItem('game_resolution', this.resolutions[this.currentIdx].id);
        } catch (e) {}
        this.applyResolution();
        return this.resolutions[this.currentIdx];
    }

    static applyResolution() {
        const container = document.getElementById('game-container');
        if (!container) return;
        const res = this.resolutions[this.currentIdx];
        if (res.id === 'fit') {
            const availW = window.innerWidth;
            const availH = window.innerHeight;
            let targetW = availW;
            let targetH = availW * 9 / 16;
            if (targetH > availH) {
                targetH = availH;
                targetW = availH * 16 / 9;
            }
            container.style.width = `${Math.floor(targetW)}px`;
            container.style.height = `${Math.floor(targetH)}px`;
        } else {
            const maxW = window.innerWidth - 20;
            const maxH = window.innerHeight - 20;
            let w = res.width;
            let h = res.height;
            if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.floor(w * ratio);
                h = Math.floor(h * ratio);
            }
            container.style.width = `${w}px`;
            container.style.height = `${h}px`;
        }
    }

    static toggleFullscreen(scene) {
        if (scene && scene.scale) {
            if (scene.scale.isFullscreen) {
                scene.scale.stopFullscreen();
            } else {
                scene.scale.startFullscreen();
            }
        } else {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        }
    }
}

DisplayManager.init();

// -------------------------------------------------------------
// BOOT SCENE (PRELOAD & GENERATE ALL GAME TEXTURES ONCE)
// -------------------------------------------------------------
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.image('title_banner', '/assets/title_banner.png');
        this.load.image('menu_bg', '/assets/menu_bg.jpg');
        this.generateAllTextures();
    }

    generateAllTextures() {
        // 1. Player Human (Aksel Manusia) - 34 x 44
        const humanG = this.make.graphics({ x: 0, y: 0, add: false });
        // Body & Blue Tunic
        humanG.fillStyle(0x2563eb, 1);
        humanG.fillRoundedRect(5, 20, 24, 16, 4);
        // Belt & Buckle
        humanG.fillStyle(0x78350f, 1);
        humanG.fillRect(5, 29, 24, 4);
        humanG.fillStyle(0xf59e0b, 1);
        humanG.fillRect(14, 28, 6, 6);
        // Legs & Boots
        humanG.fillStyle(0x334155, 1);
        humanG.fillRect(7, 36, 8, 6);
        humanG.fillRect(19, 36, 8, 6);
        humanG.fillStyle(0x1e293b, 1);
        humanG.fillRect(6, 40, 10, 4);
        humanG.fillRect(18, 40, 10, 4);
        // Head / Face
        humanG.fillStyle(0xfed7aa, 1);
        humanG.fillRoundedRect(6, 6, 22, 17, 5);
        // Brown Hair & Bangs
        humanG.fillStyle(0x78350f, 1);
        humanG.fillRoundedRect(5, 2, 24, 9, 4);
        humanG.fillRect(5, 8, 6, 5);
        humanG.fillRect(23, 8, 6, 5);
        humanG.fillRect(12, 8, 4, 3);
        // Eyebrows
        humanG.fillStyle(0x451a03, 1);
        humanG.fillRect(9, 10, 5, 2);
        humanG.fillRect(20, 10, 5, 2);
        // Eyes (Whites)
        humanG.fillStyle(0xffffff, 1);
        humanG.fillRect(9, 13, 5, 5);
        humanG.fillRect(20, 13, 5, 5);
        // Pupils (Dark)
        humanG.fillStyle(0x0f172a, 1);
        humanG.fillRect(11, 14, 3, 4);
        humanG.fillRect(22, 14, 3, 4);
        // Eye Shine (Sparkle)
        humanG.fillStyle(0xffffff, 1);
        humanG.fillRect(12, 14, 2, 2);
        humanG.fillRect(23, 14, 2, 2);
        // Nose
        humanG.fillStyle(0xf97316, 1);
        humanG.fillRect(16, 17, 2, 2);
        // Cheeks Blush
        humanG.fillStyle(0xfca5a5, 0.7);
        humanG.fillRect(7, 17, 3, 2);
        humanG.fillRect(24, 17, 3, 2);
        // Mouth (Warm Smile)
        humanG.fillStyle(0x991b1b, 1);
        humanG.fillRect(14, 20, 6, 2);
        humanG.fillRect(15, 21, 4, 1);
        humanG.generateTexture('player_human', 34, 44);

        // 2. Player Goblin (Aksel Goblin - Si Goblin Baik Hati) - 36 x 44
        const goblinG = this.make.graphics({ x: 0, y: 0, add: false });
        // Goblin Pointy Ears
        goblinG.fillStyle(0x15803d, 1);
        goblinG.fillTriangle(6, 10, 0, 15, 6, 20);
        goblinG.fillTriangle(30, 10, 36, 15, 30, 20);
        goblinG.fillStyle(0x86efac, 1);
        goblinG.fillTriangle(6, 12, 2, 15, 6, 18);
        goblinG.fillTriangle(30, 12, 34, 15, 30, 18);
        // Goblin Body & Tattered Blue Shirt
        goblinG.fillStyle(0x3b82f6, 1);
        goblinG.fillRoundedRect(7, 21, 22, 15, 3);
        // Tattered Patches & Belt
        goblinG.fillStyle(0x1d4ed8, 1);
        goblinG.fillRect(9, 29, 6, 5);
        goblinG.fillStyle(0x92400e, 1);
        goblinG.fillRect(7, 30, 22, 3);
        goblinG.fillStyle(0xf59e0b, 1);
        goblinG.fillRect(16, 29, 4, 5);
        // Goblin Legs & Feet
        goblinG.fillStyle(0x15803d, 1);
        goblinG.fillRect(9, 36, 7, 5);
        goblinG.fillRect(20, 36, 7, 5);
        goblinG.fillStyle(0x166534, 1);
        goblinG.fillRect(8, 40, 9, 4);
        goblinG.fillRect(19, 40, 9, 4);
        // Goblin Head (Green Skin)
        goblinG.fillStyle(0x22c55e, 1);
        goblinG.fillRoundedRect(6, 6, 24, 17, 6);
        // Friendly Eyebrows
        goblinG.fillStyle(0x14532d, 1);
        goblinG.fillRect(9, 9, 5, 2);
        goblinG.fillRect(22, 9, 5, 2);
        // Big Expressive Eyes (Whites)
        goblinG.fillStyle(0xffffff, 1);
        goblinG.fillRect(9, 11, 6, 6);
        goblinG.fillRect(21, 11, 6, 6);
        // Dark Pupils
        goblinG.fillStyle(0x0f172a, 1);
        goblinG.fillRect(11, 12, 4, 5);
        goblinG.fillRect(23, 12, 4, 5);
        // Eye Sparkle (Kindness)
        goblinG.fillStyle(0xffffff, 1);
        goblinG.fillRect(12, 12, 2, 2);
        goblinG.fillRect(24, 12, 2, 2);
        // Cute Goblin Nose
        goblinG.fillStyle(0x15803d, 1);
        goblinG.fillCircle(18, 18, 2.5);
        // Cheerful Smiling Mouth (The Good Goblin) with cute tiny tooth
        goblinG.fillStyle(0x881337, 1);
        goblinG.fillRect(14, 20, 8, 2);
        goblinG.fillRect(15, 21, 6, 2);
        goblinG.fillStyle(0xffffff, 1);
        goblinG.fillRect(19, 20, 2, 2); // Tiny friendly fang/tooth
        goblinG.generateTexture('player_goblin', 36, 44);

        // 3. NPC Rachael (Adik Aksel yang Lembut) - 34 x 42
        const rachaelG = this.make.graphics({ x: 0, y: 0, add: false });
        // Soft Lavender Dress
        rachaelG.fillStyle(0xa855f7, 1);
        rachaelG.fillRoundedRect(6, 18, 22, 20, 4);
        // Dress Collar & Cozy Shawl
        rachaelG.fillStyle(0xf3e8ff, 1);
        rachaelG.fillRect(11, 18, 12, 4);
        rachaelG.fillStyle(0xc084fc, 1);
        rachaelG.fillRect(6, 32, 22, 6);
        // Delicate Feet / Slippers
        rachaelG.fillStyle(0xddd6fe, 1);
        rachaelG.fillRect(9, 38, 6, 4);
        rachaelG.fillRect(19, 38, 6, 4);
        // Long Chestnut Hair (Back)
        rachaelG.fillStyle(0x6b3b1e, 1);
        rachaelG.fillRoundedRect(4, 4, 26, 24, 6);
        // Gentle Pale Face
        rachaelG.fillStyle(0xffedd5, 1);
        rachaelG.fillRoundedRect(7, 7, 20, 16, 5);
        // Front Hair Strands
        rachaelG.fillStyle(0x854d0e, 1);
        rachaelG.fillRect(5, 4, 8, 16);
        rachaelG.fillRect(21, 4, 8, 16);
        rachaelG.fillRect(10, 3, 14, 5);
        // Soft Eyebrows
        rachaelG.fillStyle(0x5c2b09, 1);
        rachaelG.fillRect(10, 10, 4, 1);
        rachaelG.fillRect(20, 10, 4, 1);
        // Gentle Expressive Eyes
        rachaelG.fillStyle(0xffffff, 1);
        rachaelG.fillRect(9, 12, 5, 4);
        rachaelG.fillRect(20, 12, 5, 4);
        // Warm Hazel Pupils
        rachaelG.fillStyle(0x3f1d0b, 1);
        rachaelG.fillRect(11, 12, 3, 4);
        rachaelG.fillRect(22, 12, 3, 4);
        // Soft Highlights
        rachaelG.fillStyle(0xffffff, 1);
        rachaelG.fillRect(12, 12, 2, 2);
        rachaelG.fillRect(23, 12, 2, 2);
        // Soft Cheeks
        rachaelG.fillStyle(0xfecdd3, 0.7);
        rachaelG.fillRect(8, 16, 3, 2);
        rachaelG.fillRect(23, 16, 3, 2);
        // Cute Small Nose
        rachaelG.fillStyle(0xfb923c, 1);
        rachaelG.fillRect(16, 16, 2, 1);
        // Sweet Gentle Smile
        rachaelG.fillStyle(0xe11d48, 1);
        rachaelG.fillRect(14, 19, 6, 2);
        rachaelG.generateTexture('npc_rachael', 34, 42);

        // 3b. NPC Nenek Aksel & Rachael (Nenek Penyayang di Rumah) - 34 x 44
        const grandmaHomeG = this.make.graphics({ x: 0, y: 0, add: false });
        // Cozy Indigo/Purple Dress
        grandmaHomeG.fillStyle(0x4338ca, 1);
        grandmaHomeG.fillRoundedRect(5, 18, 24, 20, 4);
        // Warm Maroon Shawl around shoulders
        grandmaHomeG.fillStyle(0x991b1b, 1);
        grandmaHomeG.fillRect(6, 18, 22, 9);
        grandmaHomeG.fillStyle(0xb91c1c, 1);
        grandmaHomeG.fillRect(10, 24, 14, 5);
        // Shoes
        grandmaHomeG.fillStyle(0x1e293b, 1);
        grandmaHomeG.fillRect(8, 38, 7, 4);
        grandmaHomeG.fillRect(19, 38, 7, 4);
        // Silver-Grey Hair Bun on Top
        grandmaHomeG.fillStyle(0x94a3b8, 1);
        grandmaHomeG.fillCircle(17, 4, 6);
        grandmaHomeG.fillStyle(0xe2e8f0, 1);
        grandmaHomeG.fillCircle(17, 4, 4);
        // Silver Hair Around Head
        grandmaHomeG.fillStyle(0xcbd5e1, 1);
        grandmaHomeG.fillRoundedRect(5, 5, 24, 13, 5);
        // Kind Elderly Face
        grandmaHomeG.fillStyle(0xfed7aa, 1);
        grandmaHomeG.fillRoundedRect(7, 8, 20, 15, 4);
        // Rosy Cheeks
        grandmaHomeG.fillStyle(0xfca5a5, 0.8);
        grandmaHomeG.fillRect(8, 16, 4, 3);
        grandmaHomeG.fillRect(22, 16, 4, 3);
        // Kind Caring Eyes
        grandmaHomeG.fillStyle(0xffffff, 1);
        grandmaHomeG.fillRect(9, 13, 4, 3);
        grandmaHomeG.fillRect(21, 13, 4, 3);
        grandmaHomeG.fillStyle(0x1e293b, 1);
        grandmaHomeG.fillRect(10, 13, 3, 3);
        grandmaHomeG.fillRect(22, 13, 3, 3);
        // Warm Caring Smile
        grandmaHomeG.fillStyle(0xb91c1c, 1);
        grandmaHomeG.fillRect(13, 19, 8, 2);
        grandmaHomeG.generateTexture('npc_grandma_home', 34, 44);

        // 4. NPC Madam Joanne (Sang Penyihir Misterius) - 38 x 48
        const joanneG = this.make.graphics({ x: 0, y: 0, add: false });
        // Flowing Witch Robe
        joanneG.fillStyle(0x3b0764, 1);
        joanneG.fillTriangle(19, 18, 2, 48, 36, 48);
        joanneG.fillStyle(0x6b21a8, 1);
        joanneG.fillRect(15, 28, 8, 20);
        // Golden Brooch & Ruby Crystal
        joanneG.fillStyle(0xf59e0b, 1);
        joanneG.fillCircle(19, 28, 4);
        joanneG.fillStyle(0xef4444, 1);
        joanneG.fillCircle(19, 28, 2);
        // Silver-Violet Mystic Hair
        joanneG.fillStyle(0xc4b5fd, 1);
        joanneG.fillRoundedRect(7, 14, 24, 20, 4);
        joanneG.fillRect(6, 18, 6, 16);
        joanneG.fillRect(26, 18, 6, 16);
        // Elegant Face
        joanneG.fillStyle(0xfef3c7, 1);
        joanneG.fillRoundedRect(10, 16, 18, 15, 4);
        // Arched Witch Eyebrows
        joanneG.fillStyle(0x4c1d95, 1);
        joanneG.fillRect(12, 18, 5, 2);
        joanneG.fillRect(21, 18, 5, 2);
        // Mystical Sharp Eyes (Whites)
        joanneG.fillStyle(0xffffff, 1);
        joanneG.fillRect(12, 20, 5, 4);
        joanneG.fillRect(21, 20, 5, 4);
        // Glowing Violet Pupils
        joanneG.fillStyle(0x7c3aed, 1);
        joanneG.fillRect(14, 20, 3, 4);
        joanneG.fillRect(23, 20, 3, 4);
        // Magical Eye Sparkle
        joanneG.fillStyle(0x38bdf8, 1);
        joanneG.fillRect(15, 20, 2, 2);
        joanneG.fillRect(24, 20, 2, 2);
        // Nose
        joanneG.fillStyle(0xd97706, 1);
        joanneG.fillRect(18, 24, 2, 2);
        // Mysterious Smirk / Lipstick
        joanneG.fillStyle(0x9f1239, 1);
        joanneG.fillRect(15, 27, 7, 2);
        joanneG.fillRect(20, 26, 3, 2); // Smug curve
        // Grand Witch Hat Brim
        joanneG.fillStyle(0x2e1065, 1);
        joanneG.fillRoundedRect(2, 12, 34, 6, 2);
        // Pointed Hat Cone
        joanneG.fillTriangle(19, 0, 8, 14, 30, 14);
        // Gold Hat Band & Buckle
        joanneG.fillStyle(0x9333ea, 1);
        joanneG.fillRect(10, 10, 18, 4);
        joanneG.fillStyle(0xfbbf24, 1);
        joanneG.fillRect(16, 9, 6, 6);
        joanneG.fillStyle(0x2e1065, 1);
        joanneG.fillRect(18, 10, 2, 4);
        joanneG.generateTexture('npc_joanne', 38, 48);

        // 5. NPC Hunter (Pemburu Hutan Desa) - 34 x 46
        const hunterG = this.make.graphics({ x: 0, y: 0, add: false });
        // Hunter Green Tunic
        hunterG.fillStyle(0x15803d, 1);
        hunterG.fillRoundedRect(5, 20, 24, 17, 4);
        // Leather Cross-Strap & Buckle
        hunterG.fillStyle(0x78350f, 1);
        hunterG.fillTriangle(7, 20, 27, 36, 24, 37);
        hunterG.fillStyle(0xf59e0b, 1);
        hunterG.fillRect(15, 26, 4, 4);
        // Belt & Pants
        hunterG.fillStyle(0x451a03, 1);
        hunterG.fillRect(5, 33, 24, 4);
        hunterG.fillStyle(0x1f2937, 1);
        hunterG.fillRect(7, 37, 8, 5);
        hunterG.fillRect(19, 37, 8, 5);
        hunterG.fillStyle(0x111827, 1);
        hunterG.fillRect(6, 41, 10, 5);
        hunterG.fillRect(18, 41, 10, 5);
        // Head / Face
        hunterG.fillStyle(0xfed7aa, 1);
        hunterG.fillRoundedRect(6, 8, 22, 16, 4);
        // Brown Hair on Sides
        hunterG.fillStyle(0x451a03, 1);
        hunterG.fillRect(5, 10, 3, 10);
        hunterG.fillRect(26, 10, 3, 10);
        // Determined Eyebrows
        hunterG.fillStyle(0x292524, 1);
        hunterG.fillRect(9, 12, 5, 2);
        hunterG.fillRect(20, 12, 5, 2);
        // Keen Hunter Eyes (Whites)
        hunterG.fillStyle(0xffffff, 1);
        hunterG.fillRect(9, 14, 5, 4);
        hunterG.fillRect(20, 14, 5, 4);
        // Dark Pupils
        hunterG.fillStyle(0x1c1917, 1);
        hunterG.fillRect(11, 14, 3, 4);
        hunterG.fillRect(22, 14, 3, 4);
        // Eye Sparkle
        hunterG.fillStyle(0xffffff, 1);
        hunterG.fillRect(12, 14, 2, 2);
        hunterG.fillRect(23, 14, 2, 2);
        // Nose
        hunterG.fillStyle(0xd97706, 1);
        hunterG.fillRect(16, 17, 2, 2);
        // Stubble / Chin Beard
        hunterG.fillStyle(0x78350f, 0.6);
        hunterG.fillRect(12, 22, 10, 2);
        // Confident Friendly Smile
        hunterG.fillStyle(0x991b1b, 1);
        hunterG.fillRect(14, 20, 6, 2);
        // Forest Ranger Cap
        hunterG.fillStyle(0x166534, 1);
        hunterG.fillRoundedRect(4, 2, 26, 9, 3);
        hunterG.fillRect(3, 7, 28, 4);
        // Orange Feather on Cap
        hunterG.fillStyle(0xf97316, 1);
        hunterG.fillTriangle(26, 1, 23, 7, 28, 7);
        hunterG.fillStyle(0xfef08a, 1);
        hunterG.fillRect(24, 3, 2, 4);
        hunterG.generateTexture('npc_hunter', 34, 46);

        // 6. NPC Grandma Mary (Nenek Ramah Pemilik Kebun) - 34 x 44
        const maryG = this.make.graphics({ x: 0, y: 0, add: false });
        // Cozy Orange Dress
        maryG.fillStyle(0xe67e22, 1);
        maryG.fillRoundedRect(5, 18, 24, 20, 4);
        // Gardening Apron (Pale Cream) with Pocket
        maryG.fillStyle(0xfef9c3, 1);
        maryG.fillRect(9, 22, 16, 16);
        maryG.fillStyle(0xd97706, 1);
        maryG.fillRect(12, 27, 10, 7); // Apron pocket
        // Shoes
        maryG.fillStyle(0x451a03, 1);
        maryG.fillRect(8, 38, 7, 4);
        maryG.fillRect(19, 38, 7, 4);
        // Silver-Grey Hair Bun on Top
        maryG.fillStyle(0x94a3b8, 1);
        maryG.fillCircle(17, 4, 6);
        maryG.fillStyle(0xe2e8f0, 1);
        maryG.fillCircle(17, 4, 4);
        // Silver Hair Around Head
        maryG.fillStyle(0xcbd5e1, 1);
        maryG.fillRoundedRect(5, 5, 24, 13, 5);
        // Kind Elderly Face
        maryG.fillStyle(0xfed7aa, 1);
        maryG.fillRoundedRect(7, 8, 20, 15, 4);
        // Rosy Warm Cheeks
        maryG.fillStyle(0xfca5a5, 0.8);
        maryG.fillRect(8, 16, 4, 3);
        maryG.fillRect(22, 16, 4, 3);
        // Golden Spectacles / Round Glasses
        maryG.lineStyle(2, 0xf59e0b, 1);
        maryG.strokeCircle(11, 14, 4);
        maryG.strokeCircle(23, 14, 4);
        maryG.beginPath();
        maryG.moveTo(15, 14);
        maryG.lineTo(19, 14);
        maryG.strokePath();
        // Kind Eyes behind Glasses
        maryG.fillStyle(0xffffff, 1);
        maryG.fillRect(9, 13, 4, 3);
        maryG.fillRect(21, 13, 4, 3);
        maryG.fillStyle(0x1e293b, 1);
        maryG.fillRect(10, 13, 3, 3);
        maryG.fillRect(22, 13, 3, 3);
        // Eyebrows
        maryG.fillStyle(0x64748b, 1);
        maryG.fillRect(9, 9, 5, 1);
        maryG.fillRect(20, 9, 5, 1);
        // Sweet Rounded Nose
        maryG.fillStyle(0xf97316, 1);
        maryG.fillRect(16, 16, 2, 2);
        // Sweet Grandmotherly Warm Smile
        maryG.fillStyle(0xb91c1c, 1);
        maryG.fillRect(13, 19, 8, 2);
        maryG.fillRect(14, 20, 6, 1);
        maryG.generateTexture('npc_mary', 34, 44);

        // 7. NPC Mr. Heinreich (Tukang Kayu Berjanggut Lebat) - 38 x 48
        const heinreichG = this.make.graphics({ x: 0, y: 0, add: false });
        // Heavy Lumberjack Shirt (Orange/Flannel)
        heinreichG.fillStyle(0xd97706, 1);
        heinreichG.fillRoundedRect(4, 18, 30, 20, 4);
        // Heavy Leather Carpenter Apron
        heinreichG.fillStyle(0x78350f, 1);
        heinreichG.fillRect(8, 22, 22, 18);
        // Leather Apron Straps & Brass Buckles
        heinreichG.fillStyle(0x451a03, 1);
        heinreichG.fillRect(8, 18, 4, 8);
        heinreichG.fillRect(26, 18, 4, 8);
        heinreichG.fillStyle(0xf59e0b, 1);
        heinreichG.fillRect(8, 22, 4, 3);
        heinreichG.fillRect(26, 22, 4, 3);
        // Tool Pouch & Hammer Handle
        heinreichG.fillStyle(0xb45309, 1);
        heinreichG.fillRect(12, 30, 14, 8);
        heinreichG.fillStyle(0x94a3b8, 1);
        heinreichG.fillRect(24, 26, 6, 4); // Hammer metal head
        heinreichG.fillStyle(0x78350f, 1);
        heinreichG.fillRect(26, 29, 2, 8); // Hammer wood handle
        // Sturdy Legs & Work Boots
        heinreichG.fillStyle(0x1e293b, 1);
        heinreichG.fillRect(8, 38, 8, 6);
        heinreichG.fillRect(22, 38, 8, 6);
        heinreichG.fillStyle(0x0f172a, 1);
        heinreichG.fillRect(7, 43, 10, 5);
        heinreichG.fillRect(21, 43, 10, 5);
        // Head / Strong Face
        heinreichG.fillStyle(0xfed7aa, 1);
        heinreichG.fillRoundedRect(7, 6, 24, 18, 4);
        // Rugged Brown Hair
        heinreichG.fillStyle(0x451a03, 1);
        heinreichG.fillRoundedRect(6, 2, 26, 8, 3);
        heinreichG.fillRect(5, 6, 5, 8);
        heinreichG.fillRect(28, 6, 5, 8);
        // Bushy Eyebrows
        heinreichG.fillStyle(0x291505, 1);
        heinreichG.fillRect(10, 9, 6, 2);
        heinreichG.fillRect(22, 9, 6, 2);
        // Honest Hardworking Eyes (Whites)
        heinreichG.fillStyle(0xffffff, 1);
        heinreichG.fillRect(10, 12, 5, 4);
        heinreichG.fillRect(23, 12, 5, 4);
        // Dark Pupils
        heinreichG.fillStyle(0x1c1917, 1);
        heinreichG.fillRect(12, 12, 3, 4);
        heinreichG.fillRect(24, 12, 3, 4);
        // Eye Sparkle
        heinreichG.fillStyle(0xffffff, 1);
        heinreichG.fillRect(13, 12, 2, 2);
        heinreichG.fillRect(25, 12, 2, 2);
        // Sturdy Carpenter Nose
        heinreichG.fillStyle(0xd97706, 1);
        heinreichG.fillRect(18, 15, 3, 3);
        // Bushy Lumberjack Mustache & Full Beard
        heinreichG.fillStyle(0x5c2b09, 1);
        heinreichG.fillRoundedRect(7, 17, 24, 11, 4);
        heinreichG.fillStyle(0x78350f, 1);
        heinreichG.fillRect(9, 17, 20, 5); // Mustache layer
        // Hearty Open Craftsman Smile (With Teeth)
        heinreichG.fillStyle(0x000000, 1);
        heinreichG.fillRect(14, 19, 10, 4);
        heinreichG.fillStyle(0xffffff, 1);
        heinreichG.fillRect(15, 19, 8, 2); // White teeth
        heinreichG.fillStyle(0xef4444, 1);
        heinreichG.fillRect(16, 21, 6, 2); // Red tongue
        heinreichG.generateTexture('npc_heinreich', 38, 48);

        // 8. Item Dagger
        const daggerG = this.make.graphics({ x: 0, y: 0, add: false });
        daggerG.fillStyle(0xbdc3c7, 1);
        daggerG.fillRect(8, 0, 4, 18);
        daggerG.fillStyle(0xe74c3c, 1);
        daggerG.fillRect(4, 14, 12, 4);
        daggerG.generateTexture('item_dagger', 20, 20);

        // 9. Item Bread
        const breadG = this.make.graphics({ x: 0, y: 0, add: false });
        breadG.fillStyle(0xd35400, 1);
        breadG.fillRoundedRect(0, 2, 22, 16, 4);
        breadG.generateTexture('item_bread', 22, 20);

        // 10. Item Bee Smoker
        const smokerG = this.make.graphics({ x: 0, y: 0, add: false });
        smokerG.fillStyle(0x94a3b8, 1);
        smokerG.fillRoundedRect(2, 4, 18, 18, 4);
        smokerG.fillStyle(0x475569, 1);
        smokerG.fillRect(8, 0, 6, 6);
        smokerG.generateTexture('item_smoker', 22, 24);

        // 11. Item Madu Murni
        const honeyG = this.make.graphics({ x: 0, y: 0, add: false });
        honeyG.fillStyle(0xeab308, 1);
        honeyG.fillCircle(12, 14, 10);
        honeyG.fillStyle(0xa16207, 1);
        honeyG.fillRect(6, 2, 12, 4);
        honeyG.generateTexture('item_honey', 24, 26);

        // 12. Item Mythical Seed (Glowing Runes)
        const seedG = this.make.graphics({ x: 0, y: 0, add: false });
        seedG.fillStyle(0xa855f7, 1);
        seedG.fillCircle(12, 12, 11);
        seedG.fillStyle(0x38bdf8, 1);
        seedG.fillRect(8, 8, 8, 8);
        seedG.generateTexture('item_seed', 24, 24);

        // 13. Fertilizer Bag (Karung Pupuk)
        const bagG = this.make.graphics({ x: 0, y: 0, add: false });
        bagG.fillStyle(0x78350f, 1);
        bagG.fillRoundedRect(0, 0, 26, 32, 4);
        bagG.fillStyle(0xf59e0b, 1);
        bagG.fillRect(4, 8, 18, 16);
        bagG.generateTexture('fertilizer_bag', 26, 32);

        // 14. Special Firewood Log (Kayu Bakar Khusus)
        const firewoodG = this.make.graphics({ x: 0, y: 0, add: false });
        firewoodG.fillStyle(0x92400e, 1);
        firewoodG.fillRoundedRect(0, 4, 30, 14, 3);
        firewoodG.fillStyle(0xf59e0b, 1);
        firewoodG.fillCircle(24, 11, 4);
        firewoodG.generateTexture('special_firewood', 30, 20);

        // 15. Platform / Ground
        const groundG = this.make.graphics({ x: 0, y: 0, add: false });
        groundG.fillStyle(0x2d3748, 1);
        groundG.fillRect(0, 0, 400, 32);
        groundG.fillStyle(0x27ae60, 1);
        groundG.fillRect(0, 0, 400, 6);
        groundG.generateTexture('platform', 400, 32);

        // 16. Monster Shadow (Monster Bayangan Penjaga Rumah Penyihir) - 44 x 50
        const monsterG = this.make.graphics({ x: 0, y: 0, add: false });
        // Dark Void Shadow Body
        monsterG.fillStyle(0x450a0a, 1);
        monsterG.fillRoundedRect(2, 6, 40, 42, 8);
        // Jagged Shadow Horns
        monsterG.fillTriangle(6, 6, 2, 0, 14, 6);
        monsterG.fillTriangle(30, 6, 42, 0, 38, 6);
        // Inner Dark Purple-Red Shading
        monsterG.fillStyle(0x1f172a, 1);
        monsterG.fillRoundedRect(6, 12, 32, 32, 6);
        // Menacing Fiery Eyes (Crimson + Yellow Glow)
        monsterG.fillStyle(0xef4444, 1);
        monsterG.fillTriangle(8, 16, 18, 18, 10, 24);
        monsterG.fillTriangle(36, 16, 26, 18, 34, 24);
        monsterG.fillStyle(0xfef08a, 1);
        monsterG.fillRect(11, 18, 4, 3);
        monsterG.fillRect(29, 18, 4, 3);
        // Snarl Nose / Snout
        monsterG.fillStyle(0x7f1d1d, 1);
        monsterG.fillRect(20, 24, 4, 3);
        // Menacing Open Maw & Fangs
        monsterG.fillStyle(0x000000, 1);
        monsterG.fillRoundedRect(10, 29, 24, 12, 3);
        monsterG.fillStyle(0x991b1b, 1);
        monsterG.fillRect(12, 32, 20, 6);
        // Sharp White Fangs
        monsterG.fillStyle(0xffffff, 1);
        monsterG.fillTriangle(13, 29, 16, 29, 14.5, 34);
        monsterG.fillTriangle(19, 29, 22, 29, 20.5, 34);
        monsterG.fillTriangle(25, 29, 28, 29, 26.5, 34);
        // Bottom Fangs
        monsterG.fillTriangle(16, 41, 19, 41, 17.5, 36);
        monsterG.fillTriangle(22, 41, 25, 41, 23.5, 36);
        monsterG.generateTexture('monster_shadow', 44, 50);

        // 17. Witch Door
        const doorG = this.make.graphics({ x: 0, y: 0, add: false });
        doorG.fillStyle(0x451a03, 1);
        doorG.fillRect(0, 0, 40, 65);
        doorG.fillStyle(0xf59e0b, 1);
        doorG.fillCircle(30, 35, 4);
        doorG.generateTexture('witch_door', 40, 65);

        // 18. Potion Shelf
        const shelfG = this.make.graphics({ x: 0, y: 0, add: false });
        shelfG.fillStyle(0x581c87, 1);
        shelfG.fillRect(0, 0, 30, 45);
        shelfG.fillStyle(0x22c55e, 1);
        shelfG.fillCircle(15, 20, 6);
        shelfG.generateTexture('potion_shelf', 30, 45);

        // 19. Weed Node
        const weedG = this.make.graphics({ x: 0, y: 0, add: false });
        weedG.fillStyle(0x16a34a, 1);
        weedG.fillTriangle(12, 0, 0, 24, 24, 24);
        weedG.fillStyle(0x15803d, 1);
        weedG.fillTriangle(20, 4, 10, 24, 30, 24);
        weedG.generateTexture('weed_node', 30, 24);

        // 20. Beehive
        const beehiveG = this.make.graphics({ x: 0, y: 0, add: false });
        beehiveG.fillStyle(0xeab308, 1);
        beehiveG.fillCircle(18, 18, 16);
        beehiveG.fillStyle(0xca8a04, 1);
        beehiveG.fillRect(6, 14, 24, 8);
        beehiveG.generateTexture('beehive', 36, 36);

        // 21. NPC Mr. Breado
        // 21. NPC Mr. Breado (Koki Pembuat Roti yang Ceria) - 38 x 48
        const breadoG = this.make.graphics({ x: 0, y: 0, add: false });
        // Baker's Jacket (Warm Orange/Brown)
        breadoG.fillStyle(0xd97706, 1);
        breadoG.fillRoundedRect(4, 20, 30, 18, 4);
        // Crisp White Baker's Apron
        breadoG.fillStyle(0xf8fafc, 1);
        breadoG.fillRect(8, 24, 22, 16);
        // Apron Pocket with Tiny Wheat/Bread Icon
        breadoG.fillStyle(0xfef08a, 1);
        breadoG.fillRect(14, 30, 10, 6);
        breadoG.fillStyle(0xd97706, 1);
        breadoG.fillRect(16, 32, 6, 2);
        // Legs & Baker Shoes
        breadoG.fillStyle(0x334155, 1);
        breadoG.fillRect(8, 38, 8, 5);
        breadoG.fillRect(22, 38, 8, 5);
        breadoG.fillStyle(0x1e293b, 1);
        breadoG.fillRect(7, 43, 10, 5);
        breadoG.fillRect(21, 43, 10, 5);
        // Plump Round Face
        breadoG.fillStyle(0xfed7aa, 1);
        breadoG.fillRoundedRect(6, 10, 26, 17, 5);
        // Rosy Chubby Cheeks
        breadoG.fillStyle(0xf87171, 0.7);
        breadoG.fillRect(7, 18, 4, 3);
        breadoG.fillRect(27, 18, 4, 3);
        // Cheerful Eyebrows
        breadoG.fillStyle(0x5c2b09, 1);
        breadoG.fillRect(10, 12, 5, 2);
        breadoG.fillRect(23, 12, 5, 2);
        // Bright Happy Eyes (Whites)
        breadoG.fillStyle(0xffffff, 1);
        breadoG.fillRect(10, 14, 5, 4);
        breadoG.fillRect(23, 14, 5, 4);
        // Dark Pupils
        breadoG.fillStyle(0x1c1917, 1);
        breadoG.fillRect(12, 14, 3, 4);
        breadoG.fillRect(25, 14, 3, 4);
        // Eye Sparkle
        breadoG.fillStyle(0xffffff, 1);
        breadoG.fillRect(13, 14, 2, 2);
        breadoG.fillRect(25, 14, 2, 2);
        // Round Baker Nose
        breadoG.fillStyle(0xf97316, 1);
        breadoG.fillCircle(19, 18, 2.5);
        // Curled Baker's Mustache (Iconic!)
        breadoG.fillStyle(0x78350f, 1);
        breadoG.fillRect(12, 20, 14, 3);
        breadoG.fillRect(10, 19, 3, 3); // Left curl up
        breadoG.fillRect(25, 19, 3, 3); // Right curl up
        // Big Jolly Smile (Open mouth)
        breadoG.fillStyle(0x000000, 1);
        breadoG.fillRect(15, 23, 8, 3);
        breadoG.fillStyle(0xef4444, 1);
        breadoG.fillRect(16, 24, 6, 2); // Tongue
        // Puffy Tall Chef's Hat (Toque)
        breadoG.fillStyle(0xf8fafc, 1);
        breadoG.fillRoundedRect(6, 0, 26, 12, 4);
        breadoG.fillCircle(10, 3, 5);
        breadoG.fillCircle(19, 2, 6);
        breadoG.fillCircle(28, 3, 5);
        // Hat Pleat Shading
        breadoG.fillStyle(0xcbd5e1, 1);
        breadoG.fillRect(14, 3, 2, 7);
        breadoG.fillRect(22, 3, 2, 7);
        // Hat Base Band
        breadoG.fillStyle(0xe2e8f0, 1);
        breadoG.fillRect(7, 9, 24, 3);
        breadoG.generateTexture('npc_breado', 38, 48);

        // 22. Stone Mill
        const millG = this.make.graphics({ x: 0, y: 0, add: false });
        millG.fillStyle(0x64748b, 1);
        millG.fillCircle(25, 25, 24);
        millG.fillStyle(0x334155, 1);
        millG.fillCircle(25, 25, 12);
        millG.fillStyle(0xf59e0b, 1);
        millG.fillRect(20, 5, 10, 8);
        millG.generateTexture('stone_mill', 50, 50);

        // 23. Bread Basket
        const basketG = this.make.graphics({ x: 0, y: 0, add: false });
        basketG.fillStyle(0x78350f, 1);
        basketG.fillRoundedRect(0, 8, 32, 22, 4);
        basketG.fillStyle(0xf59e0b, 1);
        basketG.fillCircle(10, 8, 6);
        basketG.fillCircle(22, 8, 6);
        basketG.generateTexture('bread_basket', 32, 30);

        // 24. Magic Oven
        const ovenG = this.make.graphics({ x: 0, y: 0, add: false });
        ovenG.fillStyle(0x334155, 1);
        ovenG.fillRect(0, 0, 48, 55);
        ovenG.fillStyle(0xf97316, 1);
        ovenG.fillRoundedRect(8, 15, 32, 28, 6);
        ovenG.fillStyle(0xfef08a, 1);
        ovenG.fillCircle(24, 29, 8);
        ovenG.generateTexture('magic_oven', 48, 55);

        // 25. Magic Flour Item
        const flourG = this.make.graphics({ x: 0, y: 0, add: false });
        flourG.fillStyle(0xf8fafc, 1);
        flourG.fillRoundedRect(0, 0, 22, 24, 4);
        flourG.fillStyle(0xf59e0b, 1);
        flourG.fillRect(4, 4, 14, 4);
        flourG.generateTexture('item_flour', 22, 24);

        // 26. Magic Bread Item (Bahan 3)
        const magicBreadG = this.make.graphics({ x: 0, y: 0, add: false });
        magicBreadG.fillStyle(0xd97706, 1);
        magicBreadG.fillRoundedRect(0, 2, 26, 20, 6);
        magicBreadG.fillStyle(0xfef08a, 1);
        magicBreadG.fillRect(6, 8, 14, 8);
        magicBreadG.generateTexture('item_magic_bread', 26, 22);

        // 27. Red Potion Bottle (Flask with Cork & Liquid - matches pixel RPG reference)
        const potionG = this.make.graphics({ x: 0, y: 0, add: false });
        // Glass lip & main body outline
        potionG.fillStyle(0x0f172a, 1);
        potionG.fillRoundedRect(7, 7, 14, 5, 1);
        potionG.fillRoundedRect(4, 11, 20, 18, 5);
        
        // Cork stopper at top
        potionG.fillStyle(0x92400e, 1);
        potionG.fillRect(10, 2, 8, 6);
        potionG.fillStyle(0xd97706, 1);
        potionG.fillRect(11, 3, 6, 5);
        potionG.fillStyle(0xfde68a, 1);
        potionG.fillRect(11, 3, 3, 2);

        // Glass neck
        potionG.fillStyle(0xe2e8f0, 0.9);
        potionG.fillRect(9, 8, 10, 4);

        // Bottle interior (empty glass top)
        potionG.fillStyle(0x1e293b, 0.7);
        potionG.fillRect(6, 12, 16, 5);

        // Red Potion Liquid
        potionG.fillStyle(0x7f1d1d, 1); // liquid shadow bottom
        potionG.fillRoundedRect(6, 17, 16, 11, 4);
        potionG.fillStyle(0xb91c1c, 1); // rich ruby red liquid
        potionG.fillRoundedRect(7, 16, 14, 10, 3);
        potionG.fillStyle(0xef4444, 1); // bright crimson middle
        potionG.fillRect(8, 17, 12, 6);

        // Liquid surface meniscus line
        potionG.fillStyle(0xfca5a5, 0.9);
        potionG.fillRect(9, 16, 10, 2);

        // Glass specular highlight reflection (top left)
        potionG.fillStyle(0xffffff, 0.9);
        potionG.fillRect(7, 14, 2, 8);
        potionG.fillRect(9, 13, 3, 1);

        // Tiny bubble / sparkle in liquid
        potionG.fillStyle(0xffffff, 0.85);
        potionG.fillRect(16, 21, 2, 2);

        potionG.generateTexture('item_potion', 28, 32);
        potionG.generateTexture('item_real_cure', 28, 32);

        // 27b. Golden Vintage Skeleton Key (matches pixel RPG reference)
        const keyG = this.make.graphics({ x: 0, y: 0, add: false });
        keyG.fillStyle(0x451a03, 1); // dark outline
        keyG.fillCircle(14, 8, 7);
        keyG.fillRect(12, 14, 4, 16);
        keyG.fillRect(8, 23, 6, 6);

        // Loop inner hole
        keyG.fillStyle(0x050a14, 1);
        keyG.fillCircle(14, 8, 3.5);

        // Gold base body
        keyG.fillStyle(0xd97706, 1);
        keyG.lineStyle(2, 0xf59e0b, 1);
        keyG.strokeCircle(14, 8, 5);
        keyG.fillStyle(0xf59e0b, 1);
        keyG.fillRect(13, 14, 2, 15);

        // Teeth (bits)
        keyG.fillRect(9, 24, 4, 2);
        keyG.fillRect(9, 27, 5, 2);

        // Golden highlights
        keyG.fillStyle(0xfef08a, 1);
        keyG.fillRect(12, 4, 3, 2);
        keyG.fillRect(13, 15, 1, 10);
        keyG.fillRect(10, 24, 2, 1);

        // Loop ring connector / collar
        keyG.fillStyle(0xf59e0b, 1);
        keyG.fillRect(11, 14, 6, 2);

        keyG.generateTexture('item_key', 28, 32);

        // 27c. Glowing Blue Crystal Gem (matches pixel RPG reference)
        const gemG = this.make.graphics({ x: 0, y: 0, add: false });
        // Dark outline
        gemG.fillStyle(0x0c1e3d, 1);
        gemG.beginPath();
        gemG.moveTo(14, 3);
        gemG.lineTo(24, 14);
        gemG.lineTo(14, 25);
        gemG.lineTo(4, 14);
        gemG.closePath();
        gemG.fillPath();

        // Facets: Top highlight
        gemG.fillStyle(0x7dd3fc, 1);
        gemG.beginPath();
        gemG.moveTo(14, 5);
        gemG.lineTo(22, 14);
        gemG.lineTo(14, 14);
        gemG.closePath();
        gemG.fillPath();

        // Left facet
        gemG.fillStyle(0x38bdf8, 1);
        gemG.beginPath();
        gemG.moveTo(14, 5);
        gemG.lineTo(14, 14);
        gemG.lineTo(6, 14);
        gemG.closePath();
        gemG.fillPath();

        // Bottom-left facet
        gemG.fillStyle(0x2563eb, 1);
        gemG.beginPath();
        gemG.moveTo(6, 14);
        gemG.lineTo(14, 14);
        gemG.lineTo(14, 23);
        gemG.closePath();
        gemG.fillPath();

        // Bottom-right facet
        gemG.fillStyle(0x1d4ed8, 1);
        gemG.beginPath();
        gemG.moveTo(14, 14);
        gemG.lineTo(22, 14);
        gemG.lineTo(14, 23);
        gemG.closePath();
        gemG.fillPath();

        // Center jewel sparkle
        gemG.fillStyle(0xffffff, 0.95);
        gemG.fillRect(13, 7, 2, 3);
        gemG.fillRect(12, 8, 4, 1);

        // 3 Detached glowing blue specks / sparkles around the gem
        gemG.fillStyle(0x0c1e3d, 1);
        gemG.fillRect(1, 16, 4, 4);
        gemG.fillStyle(0x38bdf8, 1);
        gemG.fillRect(2, 17, 2, 2);

        gemG.fillStyle(0x0c1e3d, 1);
        gemG.fillRect(5, 23, 4, 4);
        gemG.fillStyle(0x60a5fa, 1);
        gemG.fillRect(6, 24, 2, 2);

        gemG.fillStyle(0x0c1e3d, 1);
        gemG.fillRect(23, 17, 4, 4);
        gemG.fillStyle(0x38bdf8, 1);
        gemG.fillRect(24, 18, 2, 2);

        gemG.generateTexture('item_gem', 28, 32);

        // 28. Village Houses
        // House 1: Red Roof (Pak Thomas)
        const h1G = this.make.graphics({ x: 0, y: 0, add: false });
        h1G.fillStyle(0xb91c1c, 1); // Red Roof
        h1G.fillTriangle(50, 0, 0, 45, 100, 45);
        h1G.fillStyle(0xfef3c7, 1); // Wall
        h1G.fillRect(10, 45, 80, 55);
        h1G.fillStyle(0x78350f, 1); // Door
        h1G.fillRect(40, 65, 20, 35);
        h1G.fillStyle(0x38bdf8, 1); // Window
        h1G.fillRect(20, 55, 14, 14);
        h1G.fillRect(66, 55, 14, 14);
        h1G.generateTexture('village_house1', 100, 100);

        // House 2: Blue Roof (Ibu Sarah)
        const h2G = this.make.graphics({ x: 0, y: 0, add: false });
        h2G.fillStyle(0x1d4ed8, 1); // Blue Roof
        h2G.fillTriangle(50, 0, 0, 45, 100, 45);
        h2G.fillStyle(0xffedd5, 1); // Wall
        h2G.fillRect(10, 45, 80, 55);
        h2G.fillStyle(0x92400e, 1); // Door
        h2G.fillRect(40, 65, 20, 35);
        h2G.fillStyle(0xfef08a, 1); // Window
        h2G.fillRect(20, 55, 14, 14);
        h2G.fillRect(66, 55, 14, 14);
        h2G.generateTexture('village_house2', 100, 100);

        // House 3: Green Roof (Paman Bob)
        const h3G = this.make.graphics({ x: 0, y: 0, add: false });
        h3G.fillStyle(0x15803d, 1); // Green Roof
        h3G.fillTriangle(50, 0, 0, 45, 100, 45);
        h3G.fillStyle(0xfae8ff, 1); // Wall
        h3G.fillRect(10, 45, 80, 55);
        h3G.fillStyle(0x78350f, 1); // Door
        h3G.fillRect(40, 65, 20, 35);
        h3G.fillStyle(0x60a5fa, 1); // Window
        h3G.fillRect(20, 55, 14, 14);
        h3G.fillRect(66, 55, 14, 14);
        h3G.generateTexture('village_house3', 100, 100);

        // 29. Villagers (Warga Desa yang Ramah) - 32 x 44
        // Pak Thomas (Warga Rumah 1)
        const thomasG = this.make.graphics({ x: 0, y: 0, add: false });
        // Blue Vest & Shirt
        thomasG.fillStyle(0x0284c7, 1);
        thomasG.fillRoundedRect(4, 18, 24, 16, 4);
        thomasG.fillStyle(0xf8fafc, 1);
        thomasG.fillRect(12, 18, 8, 8); // Shirt collar
        // Pants & Shoes
        thomasG.fillStyle(0x334155, 1);
        thomasG.fillRect(6, 34, 8, 6);
        thomasG.fillRect(18, 34, 8, 6);
        thomasG.fillStyle(0x0f172a, 1);
        thomasG.fillRect(5, 40, 10, 4);
        thomasG.fillRect(17, 40, 10, 4);
        // Face
        thomasG.fillStyle(0xfed7aa, 1);
        thomasG.fillRoundedRect(6, 6, 20, 15, 4);
        // Flat Newsboy Cap (Slate)
        thomasG.fillStyle(0x475569, 1);
        thomasG.fillRoundedRect(4, 2, 24, 8, 3);
        thomasG.fillRect(3, 7, 26, 3); // Brim
        // Eyebrows
        thomasG.fillStyle(0x451a03, 1);
        thomasG.fillRect(9, 9, 4, 1);
        thomasG.fillRect(19, 9, 4, 1);
        // Friendly Eyes
        thomasG.fillStyle(0xffffff, 1);
        thomasG.fillRect(9, 11, 4, 3);
        thomasG.fillRect(19, 11, 4, 3);
        thomasG.fillStyle(0x0f172a, 1);
        thomasG.fillRect(10, 11, 2, 3);
        thomasG.fillRect(20, 11, 2, 3);
        // Sparkle
        thomasG.fillStyle(0xffffff, 1);
        thomasG.fillRect(11, 11, 1, 1);
        thomasG.fillRect(21, 11, 1, 1);
        // Nose
        thomasG.fillStyle(0xd97706, 1);
        thomasG.fillRect(15, 14, 2, 2);
        // Neat Trimmed Mustache
        thomasG.fillStyle(0x451a03, 1);
        thomasG.fillRect(12, 16, 8, 2);
        // Friendly Smile
        thomasG.fillStyle(0x991b1b, 1);
        thomasG.fillRect(13, 18, 6, 2);
        thomasG.generateTexture('npc_thomas', 32, 44);

        // Ibu Sarah (Warga Rumah 2)
        const sarahG = this.make.graphics({ x: 0, y: 0, add: false });
        // Rose/Pink Country Dress & White Apron
        sarahG.fillStyle(0xec4899, 1);
        sarahG.fillRoundedRect(4, 18, 24, 18, 4);
        sarahG.fillStyle(0xfdf2f8, 1);
        sarahG.fillRect(8, 22, 16, 14); // Apron
        // Shoes
        sarahG.fillStyle(0x831843, 1);
        sarahG.fillRect(7, 39, 7, 4);
        sarahG.fillRect(18, 39, 7, 4);
        // Auburn Hair (Back & Framing)
        sarahG.fillStyle(0x92400e, 1);
        sarahG.fillRoundedRect(4, 3, 24, 18, 5);
        // Pretty Pale Face
        sarahG.fillStyle(0xffedd5, 1);
        sarahG.fillRoundedRect(6, 6, 20, 15, 4);
        // Front Hair Curls
        sarahG.fillStyle(0xb45309, 1);
        sarahG.fillRect(5, 4, 6, 12);
        sarahG.fillRect(21, 4, 6, 12);
        sarahG.fillRect(8, 2, 16, 5);
        // Soft Arched Eyebrows
        sarahG.fillStyle(0x78350f, 1);
        sarahG.fillRect(9, 9, 4, 1);
        sarahG.fillRect(19, 9, 4, 1);
        // Pretty Eyes with Eyelashes
        sarahG.fillStyle(0xffffff, 1);
        sarahG.fillRect(9, 11, 4, 3);
        sarahG.fillRect(19, 11, 4, 3);
        sarahG.fillStyle(0x1e293b, 1);
        sarahG.fillRect(10, 11, 2, 3);
        sarahG.fillRect(20, 11, 2, 3);
        // Sparkle
        sarahG.fillStyle(0xffffff, 1);
        sarahG.fillRect(11, 11, 1, 1);
        sarahG.fillRect(21, 11, 1, 1);
        // Rosy Cheeks
        sarahG.fillStyle(0xfb7185, 0.7);
        sarahG.fillRect(6, 14, 3, 2);
        sarahG.fillRect(23, 14, 3, 2);
        // Small Nose
        sarahG.fillStyle(0xf97316, 1);
        sarahG.fillRect(15, 14, 2, 1);
        // Sweet Pink Smiling Lips
        sarahG.fillStyle(0xdb2777, 1);
        sarahG.fillRect(13, 17, 6, 2);
        sarahG.generateTexture('npc_sarah', 32, 44);

        // Paman Bob (Warga Rumah 3)
        const bobG = this.make.graphics({ x: 0, y: 0, add: false });
        // Forest Green Vest & Earthy Shirt
        bobG.fillStyle(0x16a34a, 1);
        bobG.fillRoundedRect(4, 18, 24, 16, 4);
        bobG.fillStyle(0xd97706, 1);
        bobG.fillRect(11, 18, 10, 6); // Shirt collar
        // Pants & Shoes
        bobG.fillStyle(0x475569, 1);
        bobG.fillRect(6, 34, 8, 6);
        bobG.fillRect(18, 34, 8, 6);
        bobG.fillStyle(0x1e293b, 1);
        bobG.fillRect(5, 40, 10, 4);
        bobG.fillRect(17, 40, 10, 4);
        // Cheerful Round Face
        bobG.fillStyle(0xfed7aa, 1);
        bobG.fillRoundedRect(6, 6, 20, 15, 4);
        // Green Cap / Beret
        bobG.fillStyle(0x15803d, 1);
        bobG.fillRoundedRect(4, 2, 24, 8, 3);
        bobG.fillCircle(16, 2, 3);
        // Eyebrows
        bobG.fillStyle(0x5c2b09, 1);
        bobG.fillRect(9, 9, 4, 1);
        bobG.fillRect(19, 9, 4, 1);
        // Cheerful Smiling Eyes
        bobG.fillStyle(0xffffff, 1);
        bobG.fillRect(9, 11, 4, 3);
        bobG.fillRect(19, 11, 4, 3);
        bobG.fillStyle(0x0f172a, 1);
        bobG.fillRect(10, 11, 2, 3);
        bobG.fillRect(20, 11, 2, 3);
        bobG.fillStyle(0xffffff, 1);
        bobG.fillRect(11, 11, 1, 1);
        bobG.fillRect(21, 11, 1, 1);
        // Round Nose
        bobG.fillStyle(0xf97316, 1);
        bobG.fillCircle(16, 15, 1.5);
        // Big Jolly Wide Open Smile (Showing Teeth)
        bobG.fillStyle(0x000000, 1);
        bobG.fillRect(12, 17, 8, 3);
        bobG.fillStyle(0xffffff, 1);
        bobG.fillRect(13, 17, 6, 1); // Teeth
        bobG.fillStyle(0xef4444, 1);
        bobG.fillRect(14, 18, 4, 2); // Tongue
        bobG.generateTexture('npc_bob', 32, 44);
    }

    generateBlurredBackground() {
        if (this.textures.exists('menu_bg_blurred')) return;
        try {
            const srcImg = this.textures.get('menu_bg').getSourceImage();
            const canvas = this.textures.createCanvas('menu_bg_blurred', 800, 450);
            const ctx = canvas.getContext();
            ctx.filter = 'blur(6px) brightness(0.65) saturate(1.2)';
            ctx.drawImage(srcImg, -20, -15, 840, 480);
            canvas.refresh();
        } catch (e) {
            console.warn('Canvas blur fallback', e);
        }
    }

    create() {
        this.generateBlurredBackground();
        this.scene.start('TitleScene');
    }
}

// -------------------------------------------------------------
// TITLE SCENE (MAIN MENU WITH PLAY & SETTINGS)
// -------------------------------------------------------------
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Unlock Web Audio context on user pointer interaction
        this.input.once('pointerdown', () => {
            GameAudio.init();
            GameAudio.resume();
            if (GameAudio.bgmEnabled) {
                GameAudio.startAmbientBGM();
            }
        });

        // 1. Blurred fantasy game background
        const bgKey = this.textures.exists('menu_bg_blurred') ? 'menu_bg_blurred' : 'menu_bg';
        this.bg = this.add.image(400, 225, bgKey).setDisplaySize(800, 450);

        // Breathing living-world camera tween
        this.tweens.add({
            targets: this.bg,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 6000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Vignette & Dark contrast overlay
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(0x020617, 0x020617, 0x020617, 0x020617, 0.45, 0.45, 0.75, 0.75);
        vignette.fillRect(0, 0, 800, 450);

        // Ambient Magical Fireflies / Glowing Particles
        this.createParticles();

        // 2. Title Banner (The uploaded user image)
        // Golden glowing halo behind the scroll
        this.glowHalo = this.add.graphics();
        this.glowHalo.fillStyle(0xf59e0b, 0.16);
        this.glowHalo.fillCircle(400, 135, 130);
        this.glowHalo.fillStyle(0x38bdf8, 0.1);
        this.glowHalo.fillCircle(400, 135, 170);

        this.tweens.add({
            targets: this.glowHalo,
            alpha: 0.6,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // The banner itself
        this.banner = this.add.image(400, 138, 'title_banner')
            .setOrigin(0.5, 0.5)
            .setScale(0.85);

        // Floating Bobbing Animation
        this.tweens.add({
            targets: this.banner,
            y: 146,
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle badge
        const badgeBg = this.add.rectangle(400, 236, 360, 24, 0x0f172a, 0.85)
            .setStrokeStyle(1.5, 0xf59e0b);
        const subText = this.add.text(400, 236, '✦ PETUALANGAN FANTASI 2D • SI GOBLIN BAIK ✦', {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#fbbf24',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // 3. Interactive Buttons (Play & Settings)
        this.createMenuButtons();

        // 4. Settings Modal
        this.createSettingsModal();

        // Bottom guide text
        this.add.text(400, 432, 'Gunakan Keyboard & Mouse untuk Petualanganmu • Tekan [SPASI] / Klik untuk Mulai', {
            fontSize: '11px',
            fill: '#94a3b8',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // Keyboard navigation
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isSettingsOpen) this.startGame();
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            if (!this.isSettingsOpen) this.startGame();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isSettingsOpen) this.toggleSettings(false);
        });

        // Camera Fade In
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    createParticles() {
        this.particles = [];
        const colors = [0x86efac, 0xfde047, 0x67e8f9, 0xa78bfa, 0x4ade80];
        for (let i = 0; i < 24; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(20, 780),
                Phaser.Math.Between(40, 420),
                Phaser.Math.Between(1.5, 3.5),
                Phaser.Utils.Array.GetRandom(colors),
                Phaser.Math.FloatBetween(0.3, 0.85)
            );
            p.speedY = Phaser.Math.FloatBetween(0.2, 0.55);
            p.sway = Phaser.Math.FloatBetween(0.01, 0.03);
            p.swayOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.particles.push(p);
        }
    }

    update(time) {
        if (this.particles && this.registry.get('particlesEnabled') !== false) {
            this.particles.forEach(p => {
                p.y -= p.speedY;
                p.x += Math.sin(time * 0.002 + p.swayOffset) * 0.45;
                if (p.y < -10) {
                    p.y = 460;
                    p.x = Phaser.Math.Between(20, 780);
                }
            });
        }
    }

    createMenuButtons() {
        const btnContainer = this.add.container(400, 315);

        // === PLAY BUTTON ===
        const playBtnBg = this.add.rectangle(0, 0, 260, 48, 0x15803d, 0.95)
            .setStrokeStyle(2.5, 0xf59e0b)
            .setInteractive({ useHandCursor: true });
        
        const playSheen = this.add.rectangle(0, -11, 248, 10, 0xffffff, 0.15);
        
        const playIcon = this.add.text(-85, 0, '▶', {
            fontSize: '18px', fill: '#fef08a'
        }).setOrigin(0.5);

        const playText = this.add.text(12, 0, 'MULAI PETUALANGAN', {
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const playGroup = this.add.container(0, -16, [playBtnBg, playSheen, playIcon, playText]);

        playBtnBg.on('pointerover', () => {
            playBtnBg.setFillStyle(0x16a34a, 1);
            playBtnBg.setStrokeStyle(3, 0xfde047);
            this.tweens.add({ targets: playGroup, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        playBtnBg.on('pointerout', () => {
            playBtnBg.setFillStyle(0x15803d, 0.95);
            playBtnBg.setStrokeStyle(2.5, 0xf59e0b);
            this.tweens.add({ targets: playGroup, scaleX: 1, scaleY: 1, duration: 150, ease: 'Sine.easeOut' });
        });

        playBtnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: playGroup,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 80,
                yoyo: true,
                onComplete: () => this.startGame()
            });
        });

        // === SETTINGS BUTTON ===
        const setBtnBg = this.add.rectangle(0, 0, 260, 42, 0x1e293b, 0.92)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });
        
        const setIcon = this.add.text(-80, 0, '⚙️', {
            fontSize: '15px', fill: '#cbd5e1'
        }).setOrigin(0.5);

        const setText = this.add.text(12, 0, 'PENGATURAN', {
            fontSize: '14px',
            fontStyle: 'bold',
            fill: '#e2e8f0',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const setGroup = this.add.container(0, 42, [setBtnBg, setIcon, setText]);

        setBtnBg.on('pointerover', () => {
            setBtnBg.setFillStyle(0x334155, 1);
            setBtnBg.setStrokeStyle(2, 0x94a3b8);
            this.tweens.add({ targets: setGroup, scaleX: 1.04, scaleY: 1.04, duration: 150, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        setBtnBg.on('pointerout', () => {
            setBtnBg.setFillStyle(0x1e293b, 0.92);
            setBtnBg.setStrokeStyle(2, 0x64748b);
            this.tweens.add({ targets: setGroup, scaleX: 1, scaleY: 1, duration: 150, ease: 'Sine.easeOut' });
        });

        setBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettings(true);
        });

        btnContainer.add([playGroup, setGroup]);
    }

    startGame() {
        GameAudio.playStart();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(450, () => {
            this.scene.start('HomeScene');
        });
    }

    createSettingsModal() {
        this.isSettingsOpen = false;
        this.settingsOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.72)
            .setDepth(50)
            .setVisible(false)
            .setInteractive();

        this.settingsBox = this.add.container(400, 225).setDepth(51).setVisible(false);

        // Modal Frame
        const modalBg = this.add.rectangle(0, 0, 560, 360, 0x0f172a, 0.98)
            .setStrokeStyle(3, 0xf59e0b);
        const headerBg = this.add.rectangle(0, -150, 560, 44, 0x1e1b4b, 1)
            .setStrokeStyle(1.5, 0x6366f1);
        const title = this.add.text(0, -150, '⚙️ PENGATURAN PERMAINAN', {
            fontSize: '17px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        // 1. Audio BGM
        const bgmLabel = this.add.text(-240, -105, '🎵 Musik Latar (BGM):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const bgmBtn = this.add.rectangle(160, -96, 130, 26, GameAudio.bgmEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const bgmText = this.add.text(160, -96, GameAudio.bgmEnabled ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        bgmBtn.on('pointerdown', () => {
            GameAudio.bgmEnabled = !GameAudio.bgmEnabled;
            if (GameAudio.bgmEnabled) {
                GameAudio.startAmbientBGM();
                bgmBtn.setFillStyle(0x16a34a, 0.9);
                bgmText.setText('AKTIF [ON]');
            } else {
                GameAudio.stopAmbientBGM();
                bgmBtn.setFillStyle(0xdc2626, 0.9);
                bgmText.setText('MATI [OFF]');
            }
            GameAudio.playClick();
        });

        // 2. Audio SFX
        const sfxLabel = this.add.text(-240, -65, '🔊 Efek Suara (SFX):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const sfxBtn = this.add.rectangle(160, -56, 130, 26, GameAudio.sfxEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const sfxText = this.add.text(160, -56, GameAudio.sfxEnabled ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        sfxBtn.on('pointerdown', () => {
            GameAudio.sfxEnabled = !GameAudio.sfxEnabled;
            if (GameAudio.sfxEnabled) {
                sfxBtn.setFillStyle(0x16a34a, 0.9);
                sfxText.setText('AKTIF [ON]');
                GameAudio.playClick();
            } else {
                sfxBtn.setFillStyle(0xdc2626, 0.9);
                sfxText.setText('MATI [OFF]');
            }
        });

        // 3. Ukuran Layar / Resolusi
        const resLabel = this.add.text(-240, -25, '🖥️ Resolusi Layar:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const resBtn = this.add.rectangle(115, -16, 200, 26, 0x1e3a8a, 0.95)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setInteractive({ useHandCursor: true });
        const resText = this.add.text(115, -16, DisplayManager.current.label, {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resBtn.on('pointerover', () => resBtn.setFillStyle(0x2563eb, 1));
        resBtn.on('pointerout', () => resBtn.setFillStyle(0x1e3a8a, 0.95));
        resBtn.on('pointerdown', () => {
            const nextRes = DisplayManager.cycleNext();
            resText.setText(nextRes.label);
            GameAudio.playClick();
        });

        // Fullscreen Icon Button
        const fsBtn = this.add.rectangle(235, -16, 32, 26, 0x334155, 0.9)
            .setStrokeStyle(1.5, 0x94a3b8)
            .setInteractive({ useHandCursor: true });
        const fsIcon = this.add.text(235, -16, '⛶', {
            fontSize: '13px', fill: '#ffffff'
        }).setOrigin(0.5);

        fsBtn.on('pointerover', () => fsBtn.setFillStyle(0x475569, 1));
        fsBtn.on('pointerout', () => fsBtn.setFillStyle(0x334155, 0.9));
        fsBtn.on('pointerdown', () => {
            DisplayManager.toggleFullscreen(this);
            GameAudio.playClick();
        });

        // 4. Visual Particles
        const partLabel = this.add.text(-240, 10, '✨ Partikel Kunang-kunang:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        let particlesOn = this.registry.get('particlesEnabled') !== false;
        const partBtn = this.add.rectangle(150, 19, 130, 26, particlesOn ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const partText = this.add.text(150, 19, particlesOn ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        partBtn.on('pointerdown', () => {
            particlesOn = !particlesOn;
            this.registry.set('particlesEnabled', particlesOn);
            this.particles.forEach(p => p.setVisible(particlesOn));
            partBtn.setFillStyle(particlesOn ? 0x16a34a : 0xdc2626, 0.9);
            partText.setText(particlesOn ? 'AKTIF [ON]' : 'MATI [OFF]');
            GameAudio.playClick();
        });

        // Controls Box
        const divider = this.add.rectangle(0, 42, 500, 1, 0x334155);
        const ctrlTitle = this.add.text(0, 56, '🎮 PANDUAN KONTROL & TOMBOL PERMAINAN', {
            fontSize: '12px', fontStyle: 'bold', fill: '#93c5fd', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        const ctrlList = this.add.text(-240, 72,
            '▶ [A] / [D]        : Bergerak ke Kiri / Kanan\n' +
            '▶ [W] / [SPASI]    : Melompat\n' +
            '▶ [E]              : Berinteraksi dengan Karakter / Ambil Barang\n' +
            '▶ [I]              : Buka / Tutup Tas Inventory\n' +
            '▶ [Q]              : Buka Catatan Misi / Quest\n' +
            '▶ [ESC] / [S]      : Lewati Dialog Cerita',
            { fontSize: '11px', fill: '#cbd5e1', fontFamily: FONT_BODY, lineSpacing: 3 }
        );

        // Close Button
        const closeBtn = this.add.rectangle(0, 145, 180, 34, 0x2563eb, 0.95)
            .setStrokeStyle(2, 0x93c5fd)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(0, 145, 'SIMPAN & TUTUP', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x3b82f6, 1));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x2563eb, 0.95));
        closeBtn.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettings(false);
        });

        this.settingsBox.add([
            modalBg, headerBg, title,
            bgmLabel, bgmBtn, bgmText,
            sfxLabel, sfxBtn, sfxText,
            partLabel, partBtn, partText,
            divider, ctrlTitle, ctrlList,
            closeBtn, closeText
        ]);
    }

    toggleSettings(open) {
        this.isSettingsOpen = open;
        this.settingsOverlay.setVisible(open);
        this.settingsBox.setVisible(open);
        if (open) {
            this.settingsBox.setScale(0.9);
            this.tweens.add({
                targets: this.settingsBox,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Back.out'
            });
        }
    }
}

// UI Base Helper for Scenes
class BaseScene extends Phaser.Scene {
    createVisualInventoryUI() {
        // Hamburger Menu Button (Top Right HUD - Clean, compact & modern)
        this.menuBtnContainer = this.add.container(765, 26).setDepth(25);

        const menuBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        // Vector 3 lines of hamburger menu
        const line1 = this.add.rectangle(0, -6, 18, 2.5, 0xf8fafc, 1);
        const line2 = this.add.rectangle(0, 0, 18, 2.5, 0xf8fafc, 1);
        const line3 = this.add.rectangle(0, 6, 18, 2.5, 0xf8fafc, 1);

        this.menuBtnContainer.add([menuBtnBg, line1, line2, line3]);

        menuBtnBg.on('pointerover', () => {
            menuBtnBg.setFillStyle(0x1e293b, 1);
            menuBtnBg.setStrokeStyle(2, 0xf59e0b);
            line1.setFillStyle(0xfde047);
            line2.setFillStyle(0xfde047);
            line3.setFillStyle(0xfde047);
            this.tweens.add({ targets: this.menuBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        menuBtnBg.on('pointerout', () => {
            menuBtnBg.setFillStyle(0x0f172a, 0.9);
            menuBtnBg.setStrokeStyle(2, 0x64748b);
            line1.setFillStyle(0xf8fafc);
            line2.setFillStyle(0xf8fafc);
            line3.setFillStyle(0xf8fafc);
            this.tweens.add({ targets: this.menuBtnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        menuBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettingsModal();
        });

        // Bag / Inventory Button (Top Right HUD - Next to Settings, Pure White Vector Style)
        this.bagBtnContainer = this.add.container(720, 26).setDepth(25);

        const bagBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        // Plain minimalist white bag icon (Vector Graphics)
        const bagGraphics = this.add.graphics();
        const drawBagIcon = (color = 0xf8fafc) => {
            bagGraphics.clear();
            bagGraphics.lineStyle(2, color, 1);
            // Top handle / loop
            bagGraphics.beginPath();
            bagGraphics.arc(0, -6.5, 3.5, Math.PI, 0, false);
            bagGraphics.strokePath();
            // Bag main body (rounded rectangle)
            bagGraphics.strokeRoundedRect(-8.5, -5.5, 17, 16, 2.5);
            // Horizontal flap line
            bagGraphics.beginPath();
            bagGraphics.moveTo(-8.5, 0);
            bagGraphics.lineTo(8.5, 0);
            bagGraphics.strokePath();
            // Center latch / buckle
            bagGraphics.fillStyle(color, 1);
            bagGraphics.fillRect(-2, -2, 4, 4);
        };
        drawBagIcon(0xf8fafc);

        // Small indicator badge for item count
        this.bagBadgeBg = this.add.circle(13, -12, 7, 0x10b981, 1).setVisible(false);
        this.bagBadgeText = this.add.text(13, -12, '0', {
            fontSize: '9px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5).setVisible(false);

        this.bagBtnContainer.add([bagBtnBg, bagGraphics, this.bagBadgeBg, this.bagBadgeText]);

        bagBtnBg.on('pointerover', () => {
            bagBtnBg.setFillStyle(0x1e293b, 1);
            bagBtnBg.setStrokeStyle(2, 0xf59e0b);
            drawBagIcon(0xfde047);
            this.tweens.add({ targets: this.bagBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        bagBtnBg.on('pointerout', () => {
            bagBtnBg.setFillStyle(0x0f172a, 0.9);
            bagBtnBg.setStrokeStyle(2, 0x64748b);
            drawBagIcon(0xf8fafc);
            this.tweens.add({ targets: this.bagBtnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        bagBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleInventoryModal();
        });

        // Slot sprites kept hidden in memory for compatibility with any existing calls
        this.slotSprites = [];
        this.slotTexts = [];
        for (let i = 0; i < 4; i++) {
            const dummyBox = this.add.rectangle(0, 0, 1, 1, 0x000000, 0).setVisible(false);
            const dummyText = this.add.text(0, 0, '', { fontSize: '1px' }).setVisible(false);
            this.slotSprites.push(dummyBox);
            this.slotTexts.push(dummyText);
        }

        // Full Inventory Modal Container (5x4 Grid Pixel RPG Style matching user screenshot)
        this.invModalOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.65)
            .setDepth(30).setVisible(false).setInteractive();
        this.invModalOverlay.on('pointerdown', () => this.toggleInventoryModal(false));

        this.invModalContainer = this.add.container(400, 225).setDepth(31).setVisible(false);

        // Window Base Dimensions: 318 x 350
        // Window Graphics: Dark Navy background + mottled diagonal pixel bands + cyan-blue border
        const invBgGraphics = this.add.graphics();
        // Base dark navy fill
        invBgGraphics.fillStyle(0x0b1a32, 0.98);
        invBgGraphics.fillRoundedRect(-159, -175, 318, 350, 4);

        // Diagonal painterly streaks matching user screenshot
        invBgGraphics.fillStyle(0x0e2444, 0.45);
        invBgGraphics.beginPath();
        invBgGraphics.moveTo(-159, -60);
        invBgGraphics.lineTo(-40, -175);
        invBgGraphics.lineTo(20, -175);
        invBgGraphics.lineTo(-159, 0);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        invBgGraphics.beginPath();
        invBgGraphics.moveTo(-159, 60);
        invBgGraphics.lineTo(80, -175);
        invBgGraphics.lineTo(140, -175);
        invBgGraphics.lineTo(-159, 120);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        invBgGraphics.beginPath();
        invBgGraphics.moveTo(-90, 175);
        invBgGraphics.lineTo(159, -70);
        invBgGraphics.lineTo(159, -10);
        invBgGraphics.lineTo(-30, 175);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        invBgGraphics.beginPath();
        invBgGraphics.moveTo(30, 175);
        invBgGraphics.lineTo(159, 50);
        invBgGraphics.lineTo(159, 100);
        invBgGraphics.lineTo(80, 175);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        // Outer Dark Border
        invBgGraphics.lineStyle(2, 0x050c18, 1);
        invBgGraphics.strokeRoundedRect(-159, -175, 318, 350, 4);

        // Inner Vibrant Steel/Cyan Blue Border (classic pixel RPG window frame)
        invBgGraphics.lineStyle(3, 0x0d5683, 1);
        invBgGraphics.strokeRoundedRect(-157, -173, 314, 346, 3);

        // Header Title: "Inventory" on left
        const invTitle = this.add.text(-136, -145, 'Inventory', {
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", Consolas, "Courier New", monospace'
        }).setOrigin(0, 0.5);

        // Header Close Button: "X" on right
        this.invCloseX = this.add.text(136, -145, 'X', {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", Consolas, "Courier New", monospace'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.invCloseX.on('pointerover', () => this.invCloseX.setFill('#f87171'));
        this.invCloseX.on('pointerout', () => this.invCloseX.setFill('#ffffff'));
        this.invCloseX.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleInventoryModal(false);
        });

        // Add background and header first so slots appear on top!
        this.invModalContainer.add([invBgGraphics, invTitle, this.invCloseX]);

        // 5x4 Grid (20 Slot Boxes)
        this.invSlotBoxes = [];
        this.invSlotImages = [];
        this.invSlotTexts = [];

        const cols = 5;
        const rows = 4;
        const colStartX = -108;
        const colStep = 54;
        const rowStartY = -88;
        const rowStep = 54;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                const slotX = colStartX + (c * colStep);
                const slotY = rowStartY + (r * rowStep);

                const slotCont = this.add.container(slotX, slotY);

                // Recessed black slot box (48 x 48)
                const box = this.add.rectangle(0, 0, 48, 48, 0x04070e, 0.98)
                    .setStrokeStyle(2.5, 0x153154)
                    .setInteractive({ useHandCursor: true });

                // Inner bevel highlight top-left
                const bevelTL = this.add.graphics();
                bevelTL.lineStyle(1.5, 0x1a3a63, 0.7);
                bevelTL.beginPath();
                bevelTL.moveTo(-22, 22);
                bevelTL.lineTo(-22, -22);
                bevelTL.lineTo(22, -22);
                bevelTL.strokePath();

                // Inner bevel shadow bottom-right
                const bevelBR = this.add.graphics();
                bevelBR.lineStyle(1.5, 0x020408, 0.7);
                bevelBR.beginPath();
                bevelBR.moveTo(22, -22);
                bevelBR.lineTo(22, 22);
                bevelBR.lineTo(-22, 22);
                bevelBR.strokePath();

                // Sprite image holder
                const img = this.add.image(0, 0, 'item_potion')
                    .setScale(1.35)
                    .setVisible(false);

                // Text fallback holder
                const txt = this.add.text(0, 0, '', {
                    fontSize: '20px'
                }).setOrigin(0.5).setVisible(false);

                slotCont.add([box, bevelTL, bevelBR, img, txt]);
                this.invModalContainer.add(slotCont);

                this.invSlotBoxes.push(box);
                this.invSlotImages.push(img);
                this.invSlotTexts.push(txt);

                // Hover & click interaction on slot
                box.on('pointerover', () => {
                    box.setStrokeStyle(2.5, 0x38bdf8);
                    const inv = getInventory(this.registry);
                    if (idx < inv.length) {
                        img.setScale(1.5);
                        this.showItemDetail(inv[idx]);
                        GameAudio.playHover();
                    } else {
                        this.showItemDetail(null);
                    }
                });

                box.on('pointerout', () => {
                    img.setScale(1.35);
                    this.renderInventorySlots();
                    this.showItemDetail(null);
                });

                box.on('pointerdown', () => {
                    const inv = getInventory(this.registry);
                    if (idx < inv.length) {
                        GameAudio.playClick();
                        this.showItemDetail(inv[idx]);
                    }
                });
            }
        }

        // Bottom Item Detail Bar (compact & neat, underneath row 4)
        const detailBarBg = this.add.rectangle(0, 136, 274, 40, 0x060f1e, 0.95)
            .setStrokeStyle(1.5, 0x142b47);

        this.invDetailTitle = this.add.text(0, 126, 'INVENTARIS GOBLIN (0/20)', {
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#38bdf8',
            fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        this.invDetailText = this.add.text(0, 143, 'Sorot kotak untuk melihat informasi barang.', {
            fontSize: '11px',
            fill: '#94a3b8',
            fontFamily: FONT_BODY,
            align: 'center',
            wordWrap: { width: 265 }
        }).setOrigin(0.5);

        this.invModalContainer.add([detailBarBg, this.invDetailTitle, this.invDetailText]);
        this.isInvOpen = false;

        // Keyboard triggers: Key '1' and 'I' to toggle full inventory
        this.input.keyboard.on('keydown-ONE', () => {
            if (!this.isTalking) this.toggleInventoryModal();
        });
        this.input.keyboard.on('keydown-NUMPAD_ONE', () => {
            if (!this.isTalking) this.toggleInventoryModal();
        });
        this.input.keyboard.on('keydown-I', () => {
            if (!this.isTalking) this.toggleInventoryModal();
        });

        this.renderInventorySlots();
        this.createSettingsUI();
    }

    createSettingsUI() {
        this.isSettingsOpen = false;

        // Dark modal backdrop
        this.settingsModalOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.75)
            .setDepth(50)
            .setVisible(false)
            .setInteractive();

        this.settingsModalOverlay.on('pointerdown', () => this.toggleSettingsModal(false));

        // Settings Container
        this.settingsModalBox = this.add.container(400, 225).setDepth(51).setVisible(false);

        // Modal Frame (Height 390 for comfortable spacing)
        const modalBg = this.add.rectangle(0, 0, 560, 390, 0x0f172a, 0.98)
            .setStrokeStyle(3, 0xf59e0b);
        const headerBg = this.add.rectangle(0, -165, 560, 42, 0x1e1b4b, 1)
            .setStrokeStyle(1.5, 0x6366f1);
        const title = this.add.text(0, -165, '⚙️ PENGATURAN & JEDA PERMAINAN', {
            fontSize: '18px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        // 1. Audio BGM
        const bgmLabel = this.add.text(-240, -125, '🎵 Musik Latar (BGM):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const bgmBtn = this.add.rectangle(160, -117, 130, 26, GameAudio.bgmEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const bgmText = this.add.text(160, -117, GameAudio.bgmEnabled ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        bgmBtn.on('pointerdown', () => {
            GameAudio.bgmEnabled = !GameAudio.bgmEnabled;
            if (GameAudio.bgmEnabled) {
                GameAudio.startAmbientBGM();
                bgmBtn.setFillStyle(0x16a34a, 0.9);
                bgmText.setText('AKTIF [ON]');
            } else {
                GameAudio.stopAmbientBGM();
                bgmBtn.setFillStyle(0xdc2626, 0.9);
                bgmText.setText('MATI [OFF]');
            }
            GameAudio.playClick();
        });

        // 2. Audio SFX
        const sfxLabel = this.add.text(-240, -89, '🔊 Efek Suara (SFX):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const sfxBtn = this.add.rectangle(160, -81, 130, 26, GameAudio.sfxEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const sfxText = this.add.text(160, -81, GameAudio.sfxEnabled ? 'AKTIF [ON]' : 'MATI [OFF]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        sfxBtn.on('pointerdown', () => {
            GameAudio.sfxEnabled = !GameAudio.sfxEnabled;
            if (GameAudio.sfxEnabled) {
                sfxBtn.setFillStyle(0x16a34a, 0.9);
                sfxText.setText('AKTIF [ON]');
                GameAudio.playClick();
            } else {
                sfxBtn.setFillStyle(0xdc2626, 0.9);
                sfxText.setText('MATI [OFF]');
            }
        });

        // 3. Ukuran Layar / Resolusi
        const resLabel = this.add.text(-240, -53, '🖥️ Resolusi Layar:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const resBtn = this.add.rectangle(115, -45, 200, 26, 0x1e3a8a, 0.95)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setInteractive({ useHandCursor: true });
        const resText = this.add.text(115, -45, DisplayManager.current.label, {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resBtn.on('pointerover', () => resBtn.setFillStyle(0x2563eb, 1));
        resBtn.on('pointerout', () => resBtn.setFillStyle(0x1e3a8a, 0.95));
        resBtn.on('pointerdown', () => {
            const nextRes = DisplayManager.cycleNext();
            resText.setText(nextRes.label);
            GameAudio.playClick();
        });

        // Fullscreen Icon Button
        const fsBtn = this.add.rectangle(235, -45, 32, 26, 0x334155, 0.9)
            .setStrokeStyle(1.5, 0x94a3b8)
            .setInteractive({ useHandCursor: true });
        const fsIcon = this.add.text(235, -45, '⛶', {
            fontSize: '13px', fill: '#ffffff'
        }).setOrigin(0.5);

        fsBtn.on('pointerover', () => fsBtn.setFillStyle(0x475569, 1));
        fsBtn.on('pointerout', () => fsBtn.setFillStyle(0x334155, 0.9));
        fsBtn.on('pointerdown', () => {
            DisplayManager.toggleFullscreen(this);
            GameAudio.playClick();
        });

        // Divider
        const divider = this.add.rectangle(0, -21, 500, 1, 0x334155);

        // Controls List
        const ctrlTitle = this.add.text(0, -7, '🎮 PANDUAN KONTROL PERMAINAN', {
            fontSize: '12px', fontStyle: 'bold', fill: '#93c5fd', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        const ctrlList = this.add.text(-240, 8,
            '▶ [A] / [D]        : Bergerak Kiri / Kanan\n' +
            '▶ [W] / [SPASI]    : Melompat\n' +
            '▶ [E]              : Berinteraksi dengan Karakter / Objek\n' +
            '▶ [1] / [I]        : Buka Daftar Lengkap Tas Inventory\n' +
            '▶ [Q]              : Buka / Tutup Catatan Misi / Quest\n' +
            '▶ [☰] / [ESC]     : Buka / Tutup Pengaturan & Jeda',
            { fontSize: '11px', fill: '#cbd5e1', fontFamily: FONT_BODY, lineSpacing: 3 }
        );

        // Action Buttons: Resume & Quit to Title
        const resumeBtn = this.add.rectangle(-130, 125, 220, 36, 0x2563eb, 0.95)
            .setStrokeStyle(2, 0x93c5fd)
            .setInteractive({ useHandCursor: true });
        const resumeText = this.add.text(-130, 125, '▶ LANJUTKAN [ESC]', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(0x3b82f6, 1));
        resumeBtn.on('pointerout', () => resumeBtn.setFillStyle(0x2563eb, 0.95));
        resumeBtn.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettingsModal(false);
        });

        // Quit to Title Menu Button
        const quitBtn = this.add.rectangle(130, 125, 220, 36, 0x991b1b, 0.95)
            .setStrokeStyle(2, 0xf87171)
            .setInteractive({ useHandCursor: true });
        const quitText = this.add.text(130, 125, '🚪 KELUAR KE MENU', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        quitBtn.on('pointerover', () => quitBtn.setFillStyle(0xdc2626, 1));
        quitBtn.on('pointerout', () => quitBtn.setFillStyle(0x991b1b, 0.95));
        quitBtn.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettingsModal(false);
            this.cameras.main.fadeOut(350, 0, 0, 0);
            this.time.delayedCall(400, () => {
                this.scene.start('TitleScene');
            });
        });

        // Bottom Location Info Badge (Moved from Top Left HUD into Hamburger Menu)
        const locBadgeBg = this.add.rectangle(0, 165, 510, 26, 0x060f1e, 0.95)
            .setStrokeStyle(1.5, 0x1e3a8a);
        this.settingsLocationText = this.add.text(0, 165, '📍 Lokasi: Rumah Aksel & Rachael (Halaman Teras)', {
            fontSize: '13px', fontStyle: 'bold', fill: '#4ade80', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        this.settingsModalBox.add([
            modalBg, headerBg, title,
            bgmLabel, bgmBtn, bgmText,
            sfxLabel, sfxBtn, sfxText,
            resLabel, resBtn, resText, fsBtn, fsIcon,
            divider, ctrlTitle, ctrlList,
            resumeBtn, resumeText,
            quitBtn, quitText,
            locBadgeBg, this.settingsLocationText
        ]);

        // Key [P] listener for settings
        this.input.keyboard.on('keydown-P', () => {
            this.toggleSettingsModal();
        });
    }

    toggleSettingsModal(forceState = null) {
        if (this.isTalking) return;
        const nextState = forceState !== null ? forceState : !this.isSettingsOpen;
        if (nextState) {
            if (this.isInvOpen) this.toggleInventoryModal();
            if (this.isQuestModalOpen) this.toggleQuestModal();
            if (this.player && this.player.body) this.player.setVelocity(0, 0);
        }
        this.isSettingsOpen = nextState;
        this.settingsModalOverlay.setVisible(nextState);
        this.settingsModalBox.setVisible(nextState);

        if (nextState) {
            this.settingsModalBox.setScale(0.92);
            this.tweens.add({
                targets: this.settingsModalBox,
                scaleX: 1,
                scaleY: 1,
                duration: 180,
                ease: 'Back.out'
            });
        }
    }

    getItemTextureKey(item) {
        if (!item) return null;
        const name = (typeof item === 'string' ? item : item.id || '').toLowerCase();
        if (name.includes('ramuan') || name.includes('cure') || name.includes('potion') || name.includes('obat')) return 'item_potion';
        if (name.includes('kunci') || name.includes('key')) return 'item_key';
        if (name.includes('seed') || name.includes('permata') || name.includes('gem') || name.includes('kristal') || name.includes('diamond')) return 'item_gem';
        if (name.includes('pisau') || name.includes('belati') || name.includes('dagger') || name.includes('pedang')) return 'item_dagger';
        if (name.includes('magic bread') || name.includes('roti magis')) return 'item_magic_bread';
        if (name.includes('roti') || name.includes('bread')) return 'item_bread';
        if (name.includes('madu') || name.includes('honey')) return 'item_honey';
        if (name.includes('smoker') || name.includes('asap')) return 'item_smoker';
        if (name.includes('tepung') || name.includes('flour')) return 'item_flour';
        if (name.includes('kayu') || name.includes('firewood')) return 'special_firewood';
        return null;
    }

    getItemFallbackEmoji(item) {
        if (!item) return '';
        const name = (typeof item === 'string' ? item : item.id || '').toLowerCase();
        if (name.includes('ramuan') || name.includes('potion')) return '🧪';
        if (name.includes('kunci') || name.includes('key')) return '🗝️';
        if (name.includes('gem') || name.includes('seed')) return '💎';
        if (name.includes('pisau') || name.includes('dagger')) return '🗡️';
        if (name.includes('roti') || name.includes('bread')) return '🍞';
        if (name.includes('madu') || name.includes('honey')) return '🍯';
        if (name.includes('kayu')) return '🪵';
        return '📦';
    }

    renderInventorySlots() {
        const inv = getInventory(this.registry);

        // Update bag badge count indicator in HUD
        if (this.bagBadgeBg && this.bagBadgeText) {
            if (inv.length > 0) {
                this.bagBadgeBg.setVisible(true);
                this.bagBadgeText.setText(inv.length.toString()).setVisible(true);
            } else {
                this.bagBadgeBg.setVisible(false);
                this.bagBadgeText.setVisible(false);
            }
        }

        // Update 20 Grid Slot Boxes (5x4)
        if (this.invSlotBoxes) {
            for (let i = 0; i < this.invSlotBoxes.length; i++) {
                const box = this.invSlotBoxes[i];
                const img = this.invSlotImages ? this.invSlotImages[i] : null;
                const txt = this.invSlotTexts ? this.invSlotTexts[i] : null;

                if (!box) continue;

                if (i < inv.length) {
                    const item = inv[i];
                    box.setFillStyle(0x050a14, 0.98);
                    box.setStrokeStyle(2.5, 0x1b416e);

                    const texKey = this.getItemTextureKey(item);
                    if (texKey && this.textures && this.textures.exists(texKey)) {
                        if (img) {
                            img.setTexture(texKey).setVisible(true).setScale(1.35);
                        }
                        if (txt) txt.setVisible(false);
                    } else {
                        if (txt) {
                            txt.setText(this.getItemFallbackEmoji(item)).setVisible(true);
                        }
                        if (img) img.setVisible(false);
                    }
                } else {
                    box.setFillStyle(0x04070e, 0.98);
                    box.setStrokeStyle(2.5, 0x153154);
                    if (img) img.setVisible(false);
                    if (txt) txt.setVisible(false);
                }
            }
        }

        // Show default header info in detail bar when not hovering a specific item
        if (this.invDetailTitle && this.invDetailText) {
            this.showItemDetail(null);
        }
    }

    showItemDetail(item) {
        if (!this.invDetailTitle || !this.invDetailText) return;
        if (item) {
            const displayName = typeof item === 'string' ? item : item.id;
            const desc = (typeof item === 'object' && item.desc) ? item.desc : 'Item penting dalam perjalanan Aksel.';
            this.invDetailTitle.setText(`🔹 ${displayName.toUpperCase()}`).setFill('#38bdf8');
            this.invDetailText.setText(`"${desc}"`).setFill('#cbd5e1');
        } else {
            const inv = getInventory(this.registry);
            this.invDetailTitle.setText(`📦 INVENTARIS (${inv.length}/20 Slot)`).setFill('#94a3b8');
            this.invDetailText.setText('Sorot kotak untuk melihat informasi barang.').setFill('#64748b');
        }
    }

    toggleInventoryModal(forceState = null) {
        if (this.isTalking) return;
        const nextState = forceState !== null ? forceState : !this.isInvOpen;
        if (nextState) {
            if (this.isQuestModalOpen) this.toggleQuestModal();
            if (this.isSettingsOpen) this.toggleSettingsModal(false);
            if (this.player && this.player.body) this.player.setVelocity(0, 0);
        }
        this.isInvOpen = nextState;
        this.invModalOverlay.setVisible(nextState);
        this.invModalContainer.setVisible(nextState);

        if (nextState) {
            GameAudio.playClick();
            if (this.settingsLocationText) {
                const loc = this.currentLocationName || this.registry.get('currentLocationName') || 'Rumah Aksel & Rachael (Halaman Teras)';
                this.settingsLocationText.setText(`📍 Lokasi: ${loc.replace(/^📍\s*/, '')}`);
            }
            this.renderInventorySlots();
            this.invModalContainer.setScale(0.92);
            this.tweens.add({
                targets: this.invModalContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 160,
                ease: 'Back.out'
            });
        }
    }

    createQuestUI() {
        this.questContainer = this.add.container(16, 42).setDepth(15);

        const questHudBg = this.add.rectangle(140, 22, 280, 40, 0x0f172a, 0.92)
            .setStrokeStyle(2, 0x6366f1)
            .setInteractive({ useHandCursor: true });

        questHudBg.on('pointerdown', () => this.toggleQuestModal());

        this.questHudTitle = this.add.text(10, 6, '📜 QUEST [Q]: Loading...', { fontSize: '16px', fontStyle: 'bold', fill: '#818cf8', fontFamily: FONT_TITLE });

        this.questHudObj = this.add.text(10, 22, 'Objective: ...', {
            fontSize: '11px', fill: '#cbd5e1', fontFamily: FONT_BODY
        });

        this.questContainer.add([questHudBg, this.questHudTitle, this.questHudObj]);

        this.questModalOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.6).setDepth(30).setVisible(false);
        this.questModalBox = this.add.rectangle(400, 225, 520, 320, 0x1e1b4b, 0.98).setStrokeStyle(3, 0x818cf8).setDepth(31).setVisible(false);
        this.questTitleText = this.add.text(400, 95, '📜 CATATAN QUEST & OBJEKTIF', { fontSize: '17px', fontStyle: 'bold', fill: '#a5b4fc', fontFamily: FONT_BODY }).setOrigin(0.5).setDepth(32).setVisible(false);
        this.questContentText = this.add.text(170, 135, '', { fontSize: '14px', fill: '#f8fafc', fontFamily: FONT_BODY, lineSpacing: 8 }).setDepth(32).setVisible(false);
        this.questCloseHint = this.add.text(400, 360, 'Tekan [Q] atau Klik untuk Tutup', { fontSize: '12px', fill: '#94a3b8' }).setOrigin(0.5).setDepth(32).setVisible(false);

        this.questModalOverlay.setInteractive();
        this.questModalOverlay.on('pointerdown', () => this.toggleQuestModal());
        this.isQuestModalOpen = false;

        this.updateQuestHUD();
    }

    updateQuestHUD() {
        const qState = getQuestState(this.registry);
        if (this.questHudTitle && this.questHudObj) {
            this.questHudTitle.setText(`📜 QUEST [Q]: ${qState.title}`);
            const shortObj = qState.objective.length > 36 ? qState.objective.substring(0, 33) + '...' : qState.objective;
            this.questHudObj.setText(`▶ ${shortObj}`);
        }
    }

    toggleQuestModal() {
        if (this.isInvOpen) this.toggleInventoryModal();
        if (this.isSettingsOpen) this.toggleSettingsModal(false);
        this.isQuestModalOpen = !this.isQuestModalOpen;
        const visible = this.isQuestModalOpen;
        this.questModalOverlay.setVisible(visible);
        this.questModalBox.setVisible(visible);
        this.questTitleText.setVisible(visible);
        this.questContentText.setVisible(visible);
        this.questCloseHint.setVisible(visible);

        if (visible) {
            const qState = getQuestState(this.registry);
            let txt = `Bab/Status :  ${qState.chapter}\n`;
            txt += `Misi Aktif  :  ${qState.title}\n\n`;
            txt += `📌 OBJEKTIF UTAMA:\n   ${qState.objective}\n\n`;
            
            if (qState.completedQuests && qState.completedQuests.length > 0) {
                txt += `✅ QUEST SELESAI:\n`;
                qState.completedQuests.forEach(q => {
                    txt += `   ✔ ${q}\n`;
                });
            } else {
                txt += `💡 Tips: Ikuti alur cerita & bicaralah dengan NPC.`;
            }
            
            this.questContentText.setText(txt);
        }
    }

    showChapterBanner(titleText, subText = '') {
        const bannerContainer = this.add.container(400, -80).setDepth(40);
        const bg = this.add.rectangle(0, 0, 800, 80, 0x0f172a, 0.95).setStrokeStyle(3, 0xf59e0b);
        const txt = this.add.text(0, -12, titleText, { fontSize: '22px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY }).setOrigin(0.5);
        const sub = this.add.text(0, 16, subText, { fontSize: '13px', fill: '#cbd5e1', fontFamily: FONT_BODY }).setOrigin(0.5);
        
        bannerContainer.add([bg, txt, sub]);

        this.tweens.add({
            targets: bannerContainer,
            y: 70,
            duration: 800,
            ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(2500, () => {
                    this.tweens.add({
                        targets: bannerContainer,
                        y: -80,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => bannerContainer.destroy()
                    });
                });
            }
        });
    }

    createDialogueUI() {
        this.dialogueOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.4).setDepth(20).setVisible(false);
        this.dialogueBox = this.add.rectangle(400, 370, 760, 110, 0x0f172a, 0.95).setStrokeStyle(3, 0x3b82f6).setDepth(21).setVisible(false);
        this.speakerBox = this.add.rectangle(130, 305, 180, 28, 0x1e3a8a, 1).setStrokeStyle(2, 0x60a5fa).setDepth(22).setVisible(false);
        this.speakerText = this.add.text(130, 305, '', { fontSize: '14px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY }).setOrigin(0.5).setDepth(23).setVisible(false);
        this.dialogueBodyText = this.add.text(45, 335, '', { fontSize: '15px', fill: '#f8fafc', fontFamily: FONT_BODY, wordWrap: { width: 710 } }).setDepth(23).setVisible(false);

        // Clickable & interactive Skip Button
        this.skipBtn = this.add.rectangle(710, 305, 130, 26, 0x1e293b, 0.95)
            .setStrokeStyle(1.5, 0xf59e0b)
            .setDepth(22)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.skipBtnText = this.add.text(710, 305, '⏩ SKIP [ESC / S]', {
            fontSize: '11px', fontStyle: 'bold', fill: '#fcd34d', fontFamily: FONT_BODY
        }).setOrigin(0.5).setDepth(23).setVisible(false);

        this.skipBtn.on('pointerover', () => {
            this.skipBtn.setFillStyle(0x334155, 1);
            this.skipBtn.setStrokeStyle(2, 0xfbbf24);
        });
        this.skipBtn.on('pointerout', () => {
            this.skipBtn.setFillStyle(0x1e293b, 0.95);
            this.skipBtn.setStrokeStyle(1.5, 0xf59e0b);
        });
        this.skipBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.skipDialogue();
        });

        // Click dialogue box to advance
        this.dialogueBox.setInteractive({ useHandCursor: true });
        this.dialogueBox.on('pointerdown', () => {
            if (this.isTalking) this.nextDialogue();
        });

        this.continuePrompt = this.add.text(740, 412, 'Lanjut [E / SPACE] ▶  |  Skip [ESC / S]', {
            fontSize: '12px', fontStyle: 'bold', fill: '#60a5fa', fontFamily: FONT_BODY
        }).setOrigin(1, 1).setDepth(23).setVisible(false);

        // Global keys to skip dialogue anytime in any scene, or toggle/close settings
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isTalking) {
                this.skipDialogue();
            } else if (this.isSettingsOpen) {
                this.toggleSettingsModal(false);
            } else if (this.isInvOpen) {
                this.toggleInventoryModal();
            } else if (this.isQuestModalOpen) {
                this.toggleQuestModal();
            } else {
                this.toggleSettingsModal(true);
            }
        });
        this.input.keyboard.on('keydown-S', () => {
            if (this.isTalking) this.skipDialogue();
        });
    }

    startDialogue(dialogueList, onCompleteCallback = null) {
        if (!dialogueList || dialogueList.length === 0) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }

        this.isTalking = true;
        this.activeDialogueList = dialogueList;
        this.currentDialogueIndex = 0;
        this.onDialogueComplete = onCompleteCallback;
        if (this.player && this.player.body) this.player.setVelocityX(0);

        this.dialogueOverlay.setVisible(true);
        this.dialogueBox.setVisible(true);
        this.speakerBox.setVisible(true);
        this.speakerText.setVisible(true);
        this.dialogueBodyText.setVisible(true);
        this.continuePrompt.setVisible(true);
        if (this.skipBtn) this.skipBtn.setVisible(true);
        if (this.skipBtnText) this.skipBtnText.setVisible(true);
        if (this.promptText) this.promptText.setVisible(false);

        this.displayCurrentDialogue();
    }

    displayCurrentDialogue() {
        const currentData = this.activeDialogueList[this.currentDialogueIndex];
        this.speakerText.setText(currentData.speaker);
        this.dialogueBodyText.setText('');
        let charIndex = 0;
        if (this.typeTimer) this.typeTimer.remove();

        this.typeTimer = this.time.addEvent({
            delay: 22,
            callback: () => {
                this.dialogueBodyText.setText(currentData.text.substring(0, charIndex));
                charIndex++;
            },
            repeat: currentData.text.length
        });
    }

    nextDialogue() {
        const currentData = this.activeDialogueList[this.currentDialogueIndex];
        if (this.dialogueBodyText.text.length < currentData.text.length) {
            if (this.typeTimer) this.typeTimer.remove();
            this.dialogueBodyText.setText(currentData.text);
            return;
        }

        this.currentDialogueIndex++;
        if (this.currentDialogueIndex < this.activeDialogueList.length) {
            this.displayCurrentDialogue();
        } else {
            this.endDialogue();
        }
    }

    skipDialogue() {
        if (!this.isTalking) return;
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }
        this.endDialogue();
    }

    endDialogue() {
        this.isTalking = false;
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }
        this.dialogueOverlay.setVisible(false);
        this.dialogueBox.setVisible(false);
        this.speakerBox.setVisible(false);
        this.speakerText.setVisible(false);
        this.dialogueBodyText.setVisible(false);
        this.continuePrompt.setVisible(false);
        if (this.skipBtn) this.skipBtn.setVisible(false);
        if (this.skipBtnText) this.skipBtnText.setVisible(false);
        if (this.onDialogueComplete) {
            const cb = this.onDialogueComplete;
            this.onDialogueComplete = null;
            cb();
        }
    }

    showMapLockedNotice(message) {
        if (this.lockedNoticeActive) return;
        this.lockedNoticeActive = true;

        const noticeBox = this.add.container(400, 100).setDepth(35);
        const bg = this.add.rectangle(0, 0, 540, 50, 0x7f1d1d, 0.95).setStrokeStyle(2, 0xef4444);
        const txt = this.add.text(0, -7, '🔒 MAP TERKUNCI! QUEST BELUM SELESAI', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f87171', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        const sub = this.add.text(0, 11, message, {
            fontSize: '11px', fill: '#fecaca', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        noticeBox.add([bg, txt, sub]);

        this.tweens.add({
            targets: noticeBox,
            y: 110,
            duration: 350,
            ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(2200, () => {
                    this.tweens.add({
                        targets: noticeBox,
                        alpha: 0,
                        y: 85,
                        duration: 400,
                        onComplete: () => {
                            noticeBox.destroy();
                            this.lockedNoticeActive = false;
                        }
                    });
                });
            }
        });
    }

    checkMapGate({ targetScene, targetData, reqQuestNum, reqItem, lockMessage, direction }) {
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);

        let isLocked = false;

        if (reqQuestNum !== undefined && qState.questNumber < reqQuestNum) {
            isLocked = true;
        }

        if (reqItem && !inv.some(item => item.id === reqItem)) {
            isLocked = true;
        }

        if (isLocked) {
            this.showMapLockedNotice(lockMessage || 'Selesaikan quest di map ini terlebih dahulu!');
            if (direction === 'right') {
                this.player.setX(740);
                this.player.setVelocityX(-150);
            } else if (direction === 'left') {
                this.player.setX(40);
                this.player.setVelocityX(150);
            }
            return false;
        }

        this.scene.start(targetScene, targetData);
        return true;
    }

    drawMapLockIndicator(x, y, labelText) {
        const barrierContainer = this.add.container(x, y).setDepth(12);
        const bg = this.add.rectangle(0, 0, 120, 24, 0x991b1b, 0.9).setStrokeStyle(2, 0xef4444);
        const txt = this.add.text(0, 0, labelText || '🔒 MAP TERKUNCI', {
            fontSize: '10px', fontStyle: 'bold', fill: '#fef2f2', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        barrierContainer.add([bg, txt]);

        this.tweens.add({
            targets: barrierContainer,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 900
        });
    }

    handlePlayerMovementAndBoundaries({
        canExitLeft = false,
        canExitRight = false,
        onExitLeft = null,
        onExitRight = null,
        minX = 20,
        maxX = 780
    } = {}) {
        if (!this.player || !this.player.body) return;

        // Failsafe: bila karakter terdorong keluar atau jatuh dari platform, kembalikan posisi secara aman ke platform
        if (this.player.y > 425) {
            this.player.setVelocity(0, 0);
            this.player.setY(380);
            this.player.setX(Phaser.Math.Clamp(this.player.x, 30, 770));
        }

        if (this.isTalking || this.isInvOpen || this.isQuestModalOpen || this.isSettingsOpen) {
            this.player.setVelocityX(0);
            return;
        }

        const left = this.cursors.left.isDown || this.keys.a.isDown;
        const right = this.cursors.right.isDown || this.keys.d.isDown;
        const jump = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;

        if (left) {
            this.player.setVelocityX(-200);
        } else if (right) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (jump && (this.player.body.touching.down || this.player.body.blocked.down)) {
            this.player.setVelocityY(-450);
        }

        // Batas Layar Kiri (Left Boundary)
        if (this.player.x < 15) {
            if (canExitLeft && onExitLeft) {
                onExitLeft();
            } else {
                // Karakter tetap di dalam layar, nol-kan kecepatan minus agar akselerasi ke kanan langsung responsif
                this.player.setX(minX);
                if (this.player.body.velocity.x < 0) {
                    this.player.setVelocityX(0);
                }
            }
        }

        // Batas Layar Kanan (Right Boundary)
        if (this.player.x > 770) {
            if (canExitRight && onExitRight) {
                onExitRight();
            } else {
                this.player.setX(maxX);
                if (this.player.body.velocity.x > 0) {
                    this.player.setVelocityX(0);
                }
            }
        }
    }

    createForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Vertical Deep Forest Gradient Sky
        bgG.fillGradientStyle(0x03170e, 0x03170e, 0x082618, 0x082618, 1);
        bgG.fillRect(0, 0, 800, 450);

        // 2. Light Shafts / Sunbeams filtering through high canopy
        bgG.fillStyle(0x6ee7b7, 0.04);
        bgG.beginPath();
        bgG.moveTo(100, 0);
        bgG.lineTo(240, 0);
        bgG.lineTo(330, 420);
        bgG.lineTo(150, 420);
        bgG.closePath();
        bgG.fillPath();

        bgG.beginPath();
        bgG.moveTo(490, 0);
        bgG.lineTo(630, 0);
        bgG.lineTo(730, 420);
        bgG.lineTo(550, 420);
        bgG.closePath();
        bgG.fillPath();

        // 3. Deep Distant Forest Silhouettes (Pine / Conifers)
        const distantPines = [
            { x: 50, w: 70, h: 260 },
            { x: 170, w: 85, h: 290 },
            { x: 290, w: 75, h: 240 },
            { x: 480, w: 90, h: 280 },
            { x: 620, w: 80, h: 250 },
            { x: 730, w: 95, h: 300 }
        ];
        distantPines.forEach(t => {
            bgG.fillStyle(0x062114, 0.95);
            bgG.fillRect(t.x + t.w * 0.42, 418 - t.h, t.w * 0.16, t.h);
            bgG.fillStyle(0x082c1b, 0.9);
            bgG.fillTriangle(t.x, 418 - t.h * 0.25, t.x + t.w * 0.5, 418 - t.h, t.x + t.w, 418 - t.h * 0.25);
            bgG.fillTriangle(t.x - 8, 418 - t.h * 0.05, t.x + t.w * 0.5, 418 - t.h * 0.65, t.x + t.w + 8, 418 - t.h * 0.05);
        });

        // 4. Midground Detailed Forest Trees (Trunks & Canopies)
        const midTrees = [
            { x: 30, trunkW: 24, leafColor: 0x144225 },
            { x: 135, trunkW: 28, leafColor: 0x16532d },
            { x: 500, trunkW: 26, leafColor: 0x144225 },
            { x: 615, trunkW: 30, leafColor: 0x166534 },
            { x: 745, trunkW: 32, leafColor: 0x14532d }
        ];

        midTrees.forEach(tree => {
            // Tree Trunk
            bgG.fillStyle(0x271910, 1);
            bgG.fillRect(tree.x, 0, tree.trunkW, 418);
            // Bark texture highlight
            bgG.fillStyle(0x3e2719, 0.7);
            bgG.fillRect(tree.x + 4, 0, 4, 418);

            // Branches
            bgG.fillStyle(0x271910, 1);
            bgG.fillTriangle(tree.x, 100, tree.x - 30, 70, tree.x, 85);
            bgG.fillTriangle(tree.x + tree.trunkW, 130, tree.x + tree.trunkW + 35, 100, tree.x + tree.trunkW, 115);

            // Foliage clusters
            bgG.fillStyle(tree.leafColor, 0.95);
            bgG.fillCircle(tree.x + tree.trunkW / 2, 40, 55);
            bgG.fillCircle(tree.x - 20, 70, 40);
            bgG.fillCircle(tree.x + tree.trunkW + 25, 90, 45);
        });

        // 5. Overhanging Canopy Ceiling
        bgG.fillStyle(0x0f3e21, 0.95);
        for (let x = -20; x <= 820; x += 50) {
            bgG.fillCircle(x, 10, 45);
        }
        bgG.fillStyle(0x15803d, 0.7);
        for (let x = 10; x <= 800; x += 65) {
            bgG.fillCircle(x, 25, 32);
        }

        // 6. Forest Floor Decor: Bushes, Grass Tufts, Magic Mushrooms
        const bushes = [
            { x: 10, y: 405, r: 26, color: 0x14532d },
            { x: 80, y: 412, r: 20, color: 0x166534 },
            { x: 260, y: 408, r: 24, color: 0x14532d },
            { x: 330, y: 414, r: 18, color: 0x15803d },
            { x: 530, y: 407, r: 25, color: 0x14532d },
            { x: 700, y: 410, r: 22, color: 0x166534 }
        ];
        bushes.forEach(b => {
            bgG.fillStyle(b.color, 0.95);
            bgG.fillCircle(b.x, b.y, b.r);
            bgG.fillCircle(b.x + b.r * 0.6, b.y + 4, b.r * 0.75);
            bgG.fillCircle(b.x - b.r * 0.5, b.y + 6, b.r * 0.7);
        });

        // Grass blades
        bgG.fillStyle(0x22c55e, 0.85);
        for (let gx = 25; gx < 780; gx += 35) {
            bgG.fillTriangle(gx, 418, gx + 4, 404, gx + 8, 418);
            bgG.fillTriangle(gx + 12, 418, gx + 17, 406, gx + 22, 418);
        }

        // Magic Mushrooms
        const mushrooms = [
            { x: 110, y: 413, color: 0xef4444 },
            { x: 118, y: 415, color: 0xef4444 },
            { x: 460, y: 413, color: 0x38bdf8 },
            { x: 670, y: 414, color: 0xa855f7 }
        ];
        mushrooms.forEach(m => {
            bgG.fillStyle(0xf8fafc, 1);
            bgG.fillRect(m.x + 2, m.y, 3, 6);
            bgG.fillStyle(m.color, 1);
            bgG.fillCircle(m.x + 3.5, m.y, 5);
            bgG.fillStyle(0xffffff, 0.9);
            bgG.fillCircle(m.x + 2, m.y - 1, 1.2);
            bgG.fillCircle(m.x + 5, m.y - 1, 1.2);
        });

        // 7. Ambient Glowing Magic Spores / Fireflies
        for (let i = 0; i < 18; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(90, 390);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), 0xa7f3d0, 0.75).setDepth(1);

            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.9 },
                scale: { from: 0.8, to: 1.4 },
                duration: Phaser.Math.Between(2200, 4500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createWitchYardAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Mystical Twilight / Midnight Sky Gradient
        bgG.fillGradientStyle(0x0a0618, 0x130a2a, 0x271142, 0x3b1456, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Stars
        for (let i = 0; i < 36; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 180);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.9)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.15, to: 0.95 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(1800, 3800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 3. Eerie Glowing Full Moon (Upper Left, x: 190, y: 75)
        bgG.fillStyle(0xa855f7, 0.06);
        bgG.fillCircle(190, 75, 58);
        bgG.fillStyle(0x38bdf8, 0.08);
        bgG.fillCircle(190, 75, 42);
        bgG.fillStyle(0xfef9c3, 0.15);
        bgG.fillCircle(190, 75, 32);
        bgG.fillStyle(0xfef08a, 0.95);
        bgG.fillCircle(190, 75, 25);
        bgG.fillStyle(0xca8a04, 0.35);
        bgG.fillCircle(182, 70, 5);
        bgG.fillCircle(196, 81, 6);
        bgG.fillCircle(198, 68, 3.5);
        bgG.fillCircle(185, 84, 4);

        // 4. Eerie violet mist clouds drifting slowly
        const clouds = [
            { x: 90, y: 85, w: 140, h: 22 },
            { x: 340, y: 60, w: 170, h: 26 },
            { x: 580, y: 110, w: 130, h: 20 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0x581c87, 0.22);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 10);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 4, c.h * 0.7);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 6, c.h * 0.85);
        });

        // 5. Distant jagged mountain crags & spooky pine forest silhouette
        bgG.fillStyle(0x110724, 0.95);
        bgG.fillTriangle(0, 418, 140, 230, 280, 418);
        bgG.fillTriangle(190, 418, 360, 210, 530, 418);
        bgG.fillTriangle(440, 418, 590, 240, 740, 418);

        const distantPines = [
            { x: 20, w: 35, h: 140 }, { x: 70, w: 40, h: 160 },
            { x: 260, w: 42, h: 150 }, { x: 310, w: 36, h: 135 },
            { x: 440, w: 45, h: 165 }, { x: 490, w: 38, h: 140 }
        ];
        distantPines.forEach(p => {
            bgG.fillStyle(0x190b33, 0.9);
            bgG.fillRect(p.x + p.w * 0.4, 418 - p.h, p.w * 0.2, p.h);
            bgG.fillTriangle(p.x, 418 - p.h * 0.3, p.x + p.w * 0.5, 418 - p.h, p.x + p.w, 418 - p.h * 0.3);
            bgG.fillTriangle(p.x - 4, 418 - p.h * 0.1, p.x + p.w * 0.5, 418 - p.h * 0.65, p.x + p.w + 4, 418 - p.h * 0.1);
        });

        // 6. Gnarled Twisted Witch Forest Trees (Left side: x: 30-140)
        bgG.fillStyle(0x1a0f28, 1);
        bgG.beginPath();
        bgG.moveTo(45, 418);
        bgG.lineTo(35, 260);
        bgG.lineTo(25, 140);
        bgG.lineTo(40, 140);
        bgG.lineTo(55, 260);
        bgG.lineTo(75, 418);
        bgG.closePath();
        bgG.fillPath();

        bgG.fillTriangle(30, 230, -5, 180, 25, 205);
        bgG.fillTriangle(48, 200, 95, 150, 42, 185);
        bgG.fillTriangle(32, 150, 10, 100, 36, 130);
        bgG.fillTriangle(38, 140, 60, 90, 45, 120);

        bgG.fillStyle(0x28133f, 0.85);
        bgG.fillCircle(15, 130, 30);
        bgG.fillCircle(75, 125, 34);
        bgG.fillCircle(40, 95, 32);

        // Mid-left tree
        bgG.fillStyle(0x160c22, 1);
        bgG.fillRect(345, 180, 18, 238);
        bgG.fillTriangle(345, 270, 305, 220, 345, 250);
        bgG.fillTriangle(363, 250, 405, 210, 363, 235);
        bgG.fillStyle(0x220f35, 0.8);
        bgG.fillCircle(335, 190, 28);
        bgG.fillCircle(375, 180, 26);
        bgG.fillCircle(355, 160, 30);

        // 7. Spooky Weathered Wooden Fence (x: 80 to 590)
        for (let fx = 90; fx <= 590; fx += 55) {
            bgG.fillStyle(0x261738, 0.95);
            bgG.fillRect(fx, 360, 8, 58);
            bgG.fillTriangle(fx - 1, 360, fx + 4, 348, fx + 9, 360);
        }
        bgG.fillStyle(0x35214d, 0.85);
        bgG.fillRect(80, 375, 520, 6);
        bgG.fillRect(80, 395, 520, 6);

        // 8. THE WITCH'S COTTAGE (Right Side: x: 610 to 800)
        bgG.fillStyle(0x241530, 1);
        bgG.fillRect(620, 210, 180, 208);
        // Timber planks vertical lines
        bgG.fillStyle(0x170b20, 0.9);
        for (let px = 635; px < 800; px += 24) {
            bgG.fillRect(px, 210, 2, 208);
        }
        // Heavy timber frame beams
        bgG.fillStyle(0x1a0f24, 1);
        bgG.fillRect(620, 210, 10, 208);
        bgG.fillRect(620, 210, 180, 12);
        bgG.fillRect(620, 330, 180, 8);

        // Stone Chimney rising from roof
        bgG.fillStyle(0x2b2236, 1);
        bgG.fillRect(745, 60, 32, 150);
        bgG.fillStyle(0x3d324c, 1);
        bgG.fillRect(740, 54, 42, 10);
        bgG.fillStyle(0x181220, 0.8);
        for (let cy = 70; cy < 200; cy += 16) {
            bgG.fillRect(745, cy, 32, 2);
        }

        // Crooked Steep Gable Roof
        bgG.fillStyle(0x150b22, 1);
        bgG.fillTriangle(595, 218, 705, 65, 815, 218);
        bgG.fillStyle(0x37194f, 1);
        bgG.fillTriangle(605, 214, 705, 75, 805, 214);
        bgG.fillStyle(0x28103c, 0.8);
        for (let sy = 95; sy <= 200; sy += 18) {
            const spread = (sy - 75) * 1.0;
            bgG.fillRect(705 - spread, sy, spread * 2, 4);
        }

        // Glowing stained-glass diamond window (Left of door, x: 645, y: 275)
        bgG.fillStyle(0xa855f7, 0.25);
        bgG.fillCircle(648, 280, 28);
        bgG.fillStyle(0xfde047, 0.9);
        bgG.fillRoundedRect(634, 265, 28, 36, 12);
        bgG.fillStyle(0xa855f7, 0.6);
        bgG.fillRect(637, 270, 22, 26);
        bgG.fillStyle(0x1f112e, 1);
        bgG.fillRect(647, 265, 3, 36);
        bgG.fillRect(634, 281, 28, 3);

        // Porch roof canopy right above the door
        bgG.fillStyle(0x190d26, 1);
        bgG.fillTriangle(665, 350, 700, 330, 735, 350);
        bgG.fillStyle(0x35194d, 1);
        bgG.fillRect(665, 348, 70, 5);

        // Hanging magical lantern by the door
        bgG.fillStyle(0xf59e0b, 0.3);
        bgG.fillCircle(665, 365, 14);
        bgG.fillStyle(0xfef08a, 0.95);
        bgG.fillCircle(665, 365, 4);
        bgG.fillStyle(0x1f112e, 1);
        bgG.fillRect(664, 352, 2, 10);
        bgG.strokeRect(661, 360, 8, 10);

        // 9. Ground Path & Natural Details
        const steppingStones = [
            { x: 380, y: 422, w: 26, h: 8 },
            { x: 440, y: 420, w: 32, h: 9 },
            { x: 510, y: 423, w: 28, h: 8 },
            { x: 575, y: 421, w: 34, h: 9 },
            { x: 640, y: 422, w: 30, h: 8 },
            { x: 695, y: 420, w: 36, h: 10 }
        ];
        steppingStones.forEach(s => {
            bgG.fillStyle(0x40364d, 0.85);
            bgG.fillRoundedRect(s.x, s.y, s.w, s.h, 4);
            bgG.fillStyle(0x615473, 0.6);
            bgG.fillRoundedRect(s.x + 2, s.y + 1, s.w - 4, 3, 2);
        });

        // Wild overgrown grass tufts along ground edge (y: 418)
        bgG.fillStyle(0x3b1c5a, 0.9);
        for (let gx = 15; gx < 790; gx += 28) {
            bgG.fillTriangle(gx, 418, gx + 4, 404, gx + 8, 418);
            bgG.fillTriangle(gx + 10, 418, gx + 15, 407, gx + 20, 418);
        }
        bgG.fillStyle(0x15803d, 0.6);
        for (let gx = 30; gx < 770; gx += 45) {
            bgG.fillTriangle(gx, 418, gx + 3, 408, gx + 6, 418);
        }

        // Bioluminescent Witch Mushrooms
        const mushrooms = [
            { x: 140, y: 413, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 152, y: 415, col: 0x06b6d4, glow: 0x67e8f9 },
            { x: 280, y: 414, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 420, y: 414, col: 0x22c55e, glow: 0x86efac },
            { x: 615, y: 413, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 624, y: 415, col: 0x06b6d4, glow: 0x67e8f9 }
        ];
        mushrooms.forEach(m => {
            bgG.fillStyle(0xf1f5f9, 0.9);
            bgG.fillRect(m.x + 2, m.y, 3, 6);
            bgG.fillStyle(m.col, 1);
            bgG.fillCircle(m.x + 3.5, m.y, 6);
            bgG.fillStyle(0xffffff, 0.9);
            bgG.fillCircle(m.x + 2, m.y - 1.5, 1.2);
            bgG.fillCircle(m.x + 5.5, m.y - 1.5, 1.2);

            const mGlow = this.add.circle(m.x + 3.5, m.y, 14, m.glow, 0.25).setDepth(0);
            this.tweens.add({
                targets: mGlow,
                alpha: { from: 0.1, to: 0.4 },
                scale: { from: 0.85, to: 1.25 },
                duration: Phaser.Math.Between(1500, 2600),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 10. Chimney Animated Smoke Puffs
        for (let i = 0; i < 6; i++) {
            const smoke = this.add.circle(760, 50, Phaser.Math.Between(5, 9), 0xa855f7, 0.4).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: 760 - Phaser.Math.Between(20, 60),
                y: 50 - Phaser.Math.Between(40, 80),
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.4, to: 0 },
                duration: 3000 + i * 400,
                delay: i * 500,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 11. Ambient Floating Mana Wisps / Magic Fireflies
        for (let i = 0; i < 22; i++) {
            const fx = Phaser.Math.Between(25, 775);
            const fy = Phaser.Math.Between(80, 395);
            const col = Phaser.Math.RND.pick([0xc084fc, 0x5eead4, 0xfde047, 0xa7f3d0]);
            const wisp = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), col, 0.8).setDepth(1);

            this.tweens.add({
                targets: wisp,
                x: fx + Phaser.Math.Between(-35, 35),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.9 },
                scale: { from: 0.7, to: 1.4 },
                duration: Phaser.Math.Between(2000, 4200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createWitchCottageAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Cozy yet Mystical Room Gradient
        bgG.fillGradientStyle(0x0e0618, 0x160a26, 0x220e38, 0x12071f, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Wooden Wall Paneling
        bgG.fillStyle(0x180d24, 1);
        bgG.fillRect(0, 50, 800, 368);
        bgG.fillStyle(0x231333, 0.8);
        for (let px = 0; px <= 800; px += 26) {
            bgG.fillRect(px, 50, 2, 368);
        }
        // Baseboard and chair rail trim
        bgG.fillStyle(0x2e1840, 1);
        bgG.fillRect(0, 404, 800, 14);
        bgG.fillRect(0, 220, 800, 8);

        // 3. Heavy Timber Ceiling Beams
        bgG.fillStyle(0x1a0e26, 1);
        bgG.fillRect(0, 0, 800, 50);
        bgG.fillStyle(0x2a163d, 1);
        for (let bx = 60; bx < 800; bx += 140) {
            bgG.fillRect(bx, 0, 18, 55);
            // Hanging dried herbs & charms
            bgG.fillStyle(Phaser.Math.RND.pick([0xa855f7, 0x10b981, 0xf59e0b]), 0.85);
            bgG.fillCircle(bx + 9, 70, 7);
            bgG.fillCircle(bx + 9, 82, 5);
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRect(bx + 8, 55, 2, 15);
        }

        // 4. Arched Stone Fireplace & Glowing Hearth (Center x: 300-430, y: 220-418)
        bgG.fillStyle(0x292133, 1);
        bgG.fillRect(295, 220, 140, 198);
        bgG.fillStyle(0x130e1a, 1);
        bgG.fillRoundedRect(315, 270, 100, 148, 16);
        // Stone blocks pattern
        bgG.fillStyle(0x3d324c, 0.7);
        for (let fy = 230; fy < 410; fy += 20) {
            bgG.fillRect(295, fy, 140, 2);
        }
        // Fireplace mantel shelf
        bgG.fillStyle(0x4a3b5c, 1);
        bgG.fillRect(285, 215, 160, 14);

        // Glowing fire embers in hearth
        bgG.fillStyle(0xef4444, 0.8);
        bgG.fillCircle(365, 410, 24);
        bgG.fillStyle(0xf59e0b, 0.95);
        bgG.fillCircle(365, 412, 14);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(365, 413, 7);

        // 5. Bubbling Iron Cauldron over fire
        bgG.fillStyle(0x18181b, 1);
        bgG.fillCircle(365, 360, 28);
        bgG.fillRect(337, 340, 56, 16);
        bgG.fillStyle(0x27272a, 1);
        bgG.fillRect(333, 336, 64, 6);
        // Cauldron bubbling green magic surface
        bgG.fillStyle(0x10b981, 0.95);
        bgG.fillEllipse(365, 340, 24, 7);

        // Animated cauldron potion bubbles
        for (let i = 0; i < 5; i++) {
            const bubble = this.add.circle(365 + Phaser.Math.Between(-16, 16), 338, Phaser.Math.Between(3, 5), 0x34d399, 0.8).setDepth(0);
            this.tweens.add({
                targets: bubble,
                y: 338 - Phaser.Math.Between(25, 55),
                alpha: { from: 0.8, to: 0 },
                scale: { from: 0.8, to: 1.5 },
                duration: 1800 + i * 300,
                delay: i * 400,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 6. Glowing Arcane Rune Circle on Floorboards
        const runeG = this.add.graphics().setDepth(0);
        runeG.lineStyle(2, 0xa855f7, 0.4);
        runeG.strokeCircle(365, 415, 60);
        runeG.strokeCircle(365, 415, 44);
        runeG.strokeRect(335, 385, 60, 60);
        this.tweens.add({
            targets: runeG,
            alpha: { from: 0.25, to: 0.85 },
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 7. Bookshelves & Alchemical Cabinets (Left and Right background)
        // Left cabinet (x: 80 to 180, y: 180 to 418)
        bgG.fillStyle(0x351947, 1);
        bgG.fillRect(80, 180, 110, 238);
        bgG.fillStyle(0x1c0c28, 1);
        bgG.fillRect(86, 186, 98, 226);
        // Shelves
        for (let sy = 230; sy <= 380; sy += 50) {
            bgG.fillStyle(0x4a2364, 1);
            bgG.fillRect(86, sy, 98, 6);
            // Colorful potion bottles on shelves
            const bottleCols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xa855f7, 0xec4899];
            for (let bx = 95; bx < 175; bx += 18) {
                const col = Phaser.Math.RND.pick(bottleCols);
                bgG.fillStyle(col, 0.9);
                bgG.fillRect(bx, sy - 14, 10, 14);
                bgG.fillStyle(0xf8fafc, 0.8);
                bgG.fillRect(bx + 3, sy - 18, 4, 4);
            }
        }

        // 8. Wall Candle Sconces (x: 230 and x: 500)
        [230, 500].forEach(cx => {
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRect(cx - 3, 190, 6, 20);
            bgG.fillStyle(0xfef08a, 0.9);
            bgG.fillCircle(cx, 185, 4);
            const flameGlow = this.add.circle(cx, 185, 16, 0xf59e0b, 0.25).setDepth(0);
            this.tweens.add({
                targets: flameGlow,
                scale: { from: 0.8, to: 1.25 },
                alpha: { from: 0.15, to: 0.35 },
                duration: Phaser.Math.Between(800, 1500),
                yoyo: true,
                repeat: -1
            });
        });

        // 9. Floating Mana Wisps in room
        for (let i = 0; i < 12; i++) {
            const mx = Phaser.Math.Between(50, 750);
            const my = Phaser.Math.Between(100, 390);
            const wisp = this.add.circle(mx, my, Phaser.Math.Between(2, 3), 0xc084fc, 0.7).setDepth(1);
            this.tweens.add({
                targets: wisp,
                y: my + Phaser.Math.Between(-15, 15),
                alpha: { from: 0.2, to: 0.85 },
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createGrandmaGardenAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Cheerful Countryside Morning Sky
        bgG.fillGradientStyle(0x38bdf8, 0x60a5fa, 0x93c5fd, 0xfef08a, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Warm Sun with soft halos (x: 710, y: 70)
        bgG.fillStyle(0xfef08a, 0.15);
        bgG.fillCircle(710, 70, 52);
        bgG.fillStyle(0xfde047, 0.35);
        bgG.fillCircle(710, 70, 36);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(710, 70, 22);

        // 3. Fluffy White Cumulus Clouds
        const clouds = [
            { x: 90, y: 65, w: 120, h: 26 },
            { x: 280, y: 45, w: 150, h: 30 },
            { x: 490, y: 80, w: 110, h: 24 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0xffffff, 0.85);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 12);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 6, c.h * 0.8);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 8, c.h);
        });

        // 4. Distant Rolling Green Hills
        bgG.fillStyle(0x15803d, 0.7);
        bgG.fillCircle(180, 420, 240);
        bgG.fillCircle(500, 420, 280);
        bgG.fillStyle(0x166534, 0.9);
        bgG.fillCircle(340, 430, 220);
        bgG.fillCircle(720, 420, 200);

        // 5. Grandma Mary's Cozy Countryside Cottage (Left Side: x: 0 to 180, y: 180 to 418)
        bgG.fillStyle(0xfef3c7, 1);
        bgG.fillRect(0, 220, 180, 198);
        // Half-timber wood beams
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(0, 220, 180, 10);
        bgG.fillRect(170, 220, 10, 198);
        bgG.fillRect(85, 220, 8, 198);
        bgG.fillTriangle(0, 310, 85, 230, 85, 310);
        bgG.fillTriangle(85, 230, 170, 310, 85, 310);

        // Cottage Thatched Roof
        bgG.fillStyle(0xb45309, 1);
        bgG.fillTriangle(-20, 225, 90, 110, 200, 225);
        bgG.fillStyle(0xd97706, 1);
        bgG.fillTriangle(-10, 220, 90, 120, 190, 220);

        // Stone Chimney with White Smoke
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(130, 90, 24, 60);
        bgG.fillStyle(0x64748b, 1);
        bgG.fillRect(126, 84, 32, 8);
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(142, 80, Phaser.Math.Between(4, 7), 0xffffff, 0.6).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: 142 + Phaser.Math.Between(15, 40),
                y: 80 - Phaser.Math.Between(30, 60),
                scale: { from: 0.8, to: 2.0 },
                alpha: { from: 0.6, to: 0 },
                duration: 2500 + i * 400,
                delay: i * 600,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // Cottage Window with blooming Flower Box
        bgG.fillStyle(0x38bdf8, 0.85);
        bgG.fillRoundedRect(35, 270, 36, 40, 6);
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(51, 270, 4, 40);
        bgG.fillRect(35, 288, 36, 4);
        // Flower box
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(30, 310, 46, 12);
        // Red and yellow flowers
        bgG.fillStyle(0xef4444, 1);
        bgG.fillCircle(38, 308, 4);
        bgG.fillCircle(52, 308, 4);
        bgG.fillCircle(68, 308, 4);
        bgG.fillStyle(0xfde047, 1);
        bgG.fillCircle(45, 306, 3.5);
        bgG.fillCircle(60, 306, 3.5);

        // 6. White Wooden Picket Fence (x: 180 to 800)
        for (let fx = 180; fx <= 800; fx += 32) {
            bgG.fillStyle(0xf8fafc, 0.95);
            bgG.fillRect(fx, 365, 8, 53);
            bgG.fillTriangle(fx - 1, 365, fx + 4, 354, fx + 9, 365);
        }
        bgG.fillStyle(0xe2e8f0, 0.9);
        bgG.fillRect(180, 380, 620, 6);
        bgG.fillRect(180, 400, 620, 6);

        // 7. Bountiful Apple Tree on Far Right (x: 720, y: 418)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(715, 230, 26, 188);
        bgG.fillStyle(0x15803d, 0.95);
        bgG.fillCircle(728, 200, 55);
        bgG.fillCircle(690, 220, 42);
        bgG.fillCircle(765, 220, 42);
        // Red apples
        const apples = [{ x: 700, y: 190 }, { x: 740, y: 180 }, { x: 715, y: 220 }, { x: 755, y: 230 }, { x: 680, y: 235 }];
        apples.forEach(a => {
            bgG.fillStyle(0xef4444, 1);
            bgG.fillCircle(a.x, a.y, 4.5);
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillRect(a.x - 1, a.y - 6, 2, 2);
        });

        // 8. Vegetable Garden Beds & Flowers on Ground
        // Vegetable soil patch (x: 320 to 520, y: 414)
        bgG.fillStyle(0x78350f, 0.85);
        bgG.fillRoundedRect(310, 412, 220, 10, 4);
        // Sprouting carrots
        for (let cx = 325; cx < 420; cx += 22) {
            bgG.fillStyle(0xf97316, 1);
            bgG.fillTriangle(cx, 416, cx + 3, 412, cx + 6, 416);
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillTriangle(cx + 1, 412, cx + 3, 404, cx + 5, 412);
        }
        // Round cabbages
        for (let cbx = 440; cbx < 520; cbx += 26) {
            bgG.fillStyle(0x16a34a, 1);
            bgG.fillCircle(cbx, 411, 7);
            bgG.fillStyle(0x86efac, 1);
            bgG.fillCircle(cbx, 410, 4);
        }

        // Flower patches along fence
        const flowers = [
            { x: 210, col: 0xef4444 }, { x: 235, col: 0xfde047 },
            { x: 550, col: 0xec4899 }, { x: 580, col: 0x38bdf8 },
            { x: 610, col: 0xfde047 }, { x: 640, col: 0xef4444 }
        ];
        flowers.forEach(f => {
            bgG.fillStyle(0x16a34a, 1);
            bgG.fillRect(f.x + 2, 406, 2, 12);
            bgG.fillStyle(f.col, 1);
            bgG.fillCircle(f.x + 3, 404, 5);
            bgG.fillStyle(0xffffff, 1);
            bgG.fillCircle(f.x + 3, 404, 2);
        });

        // 9. Fluttering Butterflies
        const butterflyCols = [0xfde047, 0x38bdf8, 0xf472b6];
        for (let i = 0; i < 3; i++) {
            const bx = Phaser.Math.Between(220, 680);
            const by = Phaser.Math.Between(260, 360);
            const bFly = this.add.circle(bx, by, 3, butterflyCols[i], 0.9).setDepth(1);
            this.tweens.add({
                targets: bFly,
                x: bx + Phaser.Math.Between(-40, 40),
                y: by + Phaser.Math.Between(-30, 30),
                scaleX: { from: 0.5, to: 1.3 },
                duration: Phaser.Math.Between(1500, 2500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createBeeGardenAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Golden Sunny Meadow Sky
        bgG.fillGradientStyle(0x38bdf8, 0x86efac, 0xfef08a, 0xca8a04, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Rolling Meadow Hills
        bgG.fillStyle(0x16a34a, 0.7);
        bgG.fillCircle(150, 420, 250);
        bgG.fillCircle(450, 420, 300);
        bgG.fillStyle(0x15803d, 0.9);
        bgG.fillCircle(300, 430, 260);
        bgG.fillCircle(680, 430, 240);

        // 3. ANCIENT OAK TREE ON THE RIGHT (Holds Beehive at x: 650, y: 320)
        bgG.fillStyle(0x451a03, 1);
        // Massive Trunk
        bgG.beginPath();
        bgG.moveTo(710, 418);
        bgG.lineTo(690, 250);
        bgG.lineTo(670, 100);
        bgG.lineTo(760, 100);
        bgG.lineTo(780, 418);
        bgG.closePath();
        bgG.fillPath();
        // Sturdy branch extending left to hold the beehive at (650, 320)
        bgG.beginPath();
        bgG.moveTo(690, 280);
        bgG.lineTo(610, 310);
        bgG.lineTo(610, 326);
        bgG.lineTo(690, 302);
        bgG.closePath();
        bgG.fillPath();

        // Lush Oak Leaves Canopy
        bgG.fillStyle(0x14532d, 0.95);
        bgG.fillCircle(730, 110, 75);
        bgG.fillCircle(650, 140, 65);
        bgG.fillCircle(610, 200, 55);
        bgG.fillCircle(640, 250, 45);
        bgG.fillStyle(0x16a34a, 0.85);
        bgG.fillCircle(710, 90, 60);
        bgG.fillCircle(660, 120, 50);

        // 4. Wooden Apiary Bee Boxes on Stilts (x: 460, y: 370)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(455, 380, 4, 38);
        bgG.fillRect(485, 380, 4, 38);
        bgG.fillStyle(0xfef3c7, 1);
        bgG.fillRect(445, 350, 50, 32);
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(442, 346, 56, 6);
        bgG.fillRect(442, 362, 56, 4);
        bgG.fillStyle(0x1c1917, 1);
        bgG.fillRect(464, 372, 12, 4);

        // 5. Wildflower Meadow across Ground
        // Giant Sunflowers (x: 80, 200, 330)
        [80, 200, 330].forEach(sx => {
            bgG.fillStyle(0x15803d, 1);
            bgG.fillRect(sx, 320, 4, 98);
            // Yellow petals
            bgG.fillStyle(0xfacc15, 1);
            bgG.fillCircle(sx + 2, 320, 18);
            // Dark seed center
            bgG.fillStyle(0x713f12, 1);
            bgG.fillCircle(sx + 2, 320, 9);
        });

        // Purple Lavender Spikes & Daisies
        for (let lx = 30; lx < 600; lx += 45) {
            bgG.fillStyle(0x16a34a, 1);
            bgG.fillRect(lx + 2, 370, 2, 48);
            bgG.fillStyle(0xa855f7, 0.95);
            bgG.fillCircle(lx + 3, 370, 5);
            bgG.fillCircle(lx + 3, 378, 4);
            bgG.fillCircle(lx + 3, 386, 4);
        }

        // 6. Cute Animated Bees Buzzing around Hive (at 650, 320) and Flowers
        for (let i = 0; i < 6; i++) {
            const beeContainer = this.add.container(650 + Phaser.Math.Between(-60, 40), 310 + Phaser.Math.Between(-30, 40)).setDepth(1);
            // Bee body (striped)
            const beeBody = this.add.circle(0, 0, 3.5, 0xfacc15);
            const beeStripe = this.add.rectangle(0, 0, 2, 5, 0x18181b);
            const beeWing = this.add.circle(0, -3, 2, 0xffffff, 0.8);
            beeContainer.add([beeBody, beeStripe, beeWing]);

            this.tweens.add({
                targets: beeContainer,
                x: beeContainer.x + Phaser.Math.Between(-35, 35),
                y: beeContainer.y + Phaser.Math.Between(-25, 25),
                duration: Phaser.Math.Between(1000, 2000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 7. Floating Golden Pollen Particles
        for (let i = 0; i < 18; i++) {
            const px = Phaser.Math.Between(40, 760);
            const py = Phaser.Math.Between(120, 390);
            const pollen = this.add.circle(px, py, Phaser.Math.Between(1, 2), 0xfef08a, 0.75).setDepth(0);
            this.tweens.add({
                targets: pollen,
                y: py + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.8 },
                duration: Phaser.Math.Between(2000, 3500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createWoodshopAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Warm Golden Hour Sunset Sky
        bgG.fillGradientStyle(0x451a03, 0x7c2d12, 0xc2410c, 0xf59e0b, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Distant Forest Pine Ridge Silhouette
        bgG.fillStyle(0x291206, 0.9);
        const pines = [
            { x: 30, h: 180 }, { x: 80, h: 210 }, { x: 140, h: 190 },
            { x: 440, h: 220 }, { x: 500, h: 185 }, { x: 570, h: 230 },
            { x: 650, h: 200 }, { x: 720, h: 240 }
        ];
        pines.forEach(p => {
            bgG.fillTriangle(p.x, 418, p.x + 30, 418 - p.h, p.x + 60, 418);
        });

        // 3. Mr. Heinreich's Rustic Lumber Workshop Shed (Left: x: 40 to 280, y: 180 to 418)
        bgG.fillStyle(0x271306, 1);
        bgG.fillRect(50, 220, 220, 198);
        // Heavy timber beams
        bgG.fillStyle(0x3e1f0a, 1);
        bgG.fillRect(50, 220, 16, 198);
        bgG.fillRect(254, 220, 16, 198);
        bgG.fillRect(150, 220, 14, 198);
        bgG.fillRect(50, 220, 220, 14);

        // Shed Roof
        bgG.fillStyle(0x1c0b03, 1);
        bgG.fillTriangle(30, 225, 160, 130, 290, 225);
        bgG.fillStyle(0x5c2b0c, 1);
        bgG.fillTriangle(40, 220, 160, 140, 280, 220);

        // Tool Rack on Wall (Saws, Axes, Hammers)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(80, 260, 60, 8);
        // Crosscut saw
        bgG.fillStyle(0x94a3b8, 1);
        bgG.fillRect(85, 272, 4, 35);
        bgG.fillTriangle(85, 307, 100, 295, 85, 285);
        // Broad axe
        bgG.fillStyle(0x64748b, 1);
        bgG.fillRect(115, 272, 4, 30);
        bgG.fillStyle(0xc084fc, 0.9);
        bgG.fillRect(110, 270, 14, 8);

        // Hanging Oil Lantern with Warm Glow
        bgG.fillStyle(0xf59e0b, 0.35);
        bgG.fillCircle(160, 235, 20);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(160, 235, 4);
        bgG.fillStyle(0x1c1917, 1);
        bgG.fillRect(158, 220, 4, 12);

        // 4. Stacks of Cut Timber Logs (Right background: x: 440 to 620)
        const logStackY = [390, 366, 342];
        const logStackCols = [0x92400e, 0x78350f, 0xa16207];
        logStackY.forEach((ly, rowIdx) => {
            const count = 5 - rowIdx;
            const startX = 460 + rowIdx * 14;
            for (let i = 0; i < count; i++) {
                const lx = startX + i * 28;
                bgG.fillStyle(logStackCols[rowIdx], 1);
                bgG.fillCircle(lx, ly, 13);
                // Tree growth rings
                bgG.fillStyle(0xfef3c7, 0.4);
                bgG.strokeCircle(lx, ly, 8);
                bgG.strokeCircle(lx, ly, 4);
                bgG.fillStyle(0x451a03, 1);
                bgG.fillCircle(lx, ly, 2);
            }
        });

        // 5. Tree Stump with Axe Embedded (Center: x: 360, y: 395)
        bgG.fillStyle(0x5c2b0c, 1);
        bgG.fillRoundedRect(350, 395, 28, 23, 4);
        bgG.fillStyle(0xfef3c7, 0.4);
        bgG.fillEllipse(364, 395, 13, 5);
        // Axe handle & blade
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(362, 372, 4, 24);
        bgG.fillStyle(0x94a3b8, 1);
        bgG.fillRect(356, 370, 10, 7);

        // 6. Sawhorse & Golden Sawdust on Ground
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(660, 390, 6, 28);
        bgG.fillRect(690, 390, 6, 28);
        bgG.fillRect(650, 386, 55, 6);
        // Pine log on sawhorse
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRoundedRect(645, 376, 65, 12, 4);
        // Sawdust scatter
        bgG.fillStyle(0xfde047, 0.7);
        for (let dx = 330; dx < 740; dx += 18) {
            bgG.fillCircle(dx, 417, Phaser.Math.Between(1, 2.5));
        }
    }

    createFirewoodForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Twilight Deep Forest Gradient
        bgG.fillGradientStyle(0x091e17, 0x0f2d22, 0x144030, 0x1b4d3a, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Light Shafts / Moonlight piercing through trees
        bgG.fillStyle(0x6ee7b7, 0.04);
        bgG.beginPath();
        bgG.moveTo(120, 0);
        bgG.lineTo(260, 0);
        bgG.lineTo(360, 420);
        bgG.lineTo(180, 420);
        bgG.closePath();
        bgG.fillPath();

        bgG.beginPath();
        bgG.moveTo(520, 0);
        bgG.lineTo(660, 0);
        bgG.lineTo(760, 420);
        bgG.lineTo(580, 420);
        bgG.closePath();
        bgG.fillPath();

        // 3. Layered Giant Spruce & Pine Trees
        const trees = [
            { x: 80, w: 42, h: 360, leaves: 0x064e3b },
            { x: 230, w: 36, h: 320, leaves: 0x065f46 },
            { x: 420, w: 48, h: 370, leaves: 0x047857 },
            { x: 610, w: 38, h: 340, leaves: 0x064e3b },
            { x: 740, w: 44, h: 380, leaves: 0x065f46 }
        ];

        trees.forEach(t => {
            // Trunk
            bgG.fillStyle(0x1c1917, 1);
            bgG.fillRect(t.x, 418 - t.h, t.w, t.h);
            bgG.fillStyle(0x292524, 0.8);
            bgG.fillRect(t.x + 4, 418 - t.h, 6, t.h);

            // Layered pine boughs
            for (let by = 418 - t.h; by < 320; by += 48) {
                bgG.fillStyle(t.leaves, 0.95);
                bgG.fillTriangle(t.x - 32, by + 45, t.x + t.w / 2, by, t.x + t.w + 32, by + 45);
            }
        });

        // 4. Forest Floor: Mossy Boulders, Ferns, Fallen Logs
        // Mossy Boulder
        bgG.fillStyle(0x334155, 1);
        bgG.fillCircle(170, 415, 24);
        bgG.fillStyle(0x15803d, 0.8);
        bgG.fillCircle(170, 404, 15);

        // Fallen Log
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRoundedRect(490, 408, 90, 14, 4);
        bgG.fillStyle(0x15803d, 0.7);
        bgG.fillRoundedRect(510, 406, 50, 5, 2);

        // Ferns
        for (let fx = 30; fx < 780; fx += 80) {
            bgG.fillStyle(0x059669, 0.85);
            bgG.fillTriangle(fx, 418, fx - 10, 400, fx + 4, 418);
            bgG.fillTriangle(fx + 4, 418, fx + 14, 398, fx + 8, 418);
        }

        // 5. Ambient Glowing Forest Fireflies
        for (let i = 0; i < 20; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(100, 390);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), 0xa7f3d0, 0.8).setDepth(1);
            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.95 },
                scale: { from: 0.7, to: 1.4 },
                duration: Phaser.Math.Between(2200, 4500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createBakeryMillAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Warm Village Morning Sky
        bgG.fillGradientStyle(0x1e3a5f, 0x2563eb, 0x93c5fd, 0xfef08a, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Soft Clouds
        const clouds = [
            { x: 120, y: 55, w: 130, h: 26 },
            { x: 420, y: 70, w: 160, h: 30 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0xffffff, 0.85);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 12);
            bgG.fillCircle(c.x + c.w * 0.4, c.y - 6, c.h * 0.8);
            bgG.fillCircle(c.x + c.w * 0.7, c.y - 8, c.h);
        });

        // 3. Stone Windmill Tower (Right side: x: 620 to 760, y: 120 to 418)
        bgG.fillStyle(0x475569, 1);
        bgG.beginPath();
        bgG.moveTo(640, 418);
        bgG.lineTo(660, 160);
        bgG.lineTo(720, 160);
        bgG.lineTo(740, 418);
        bgG.closePath();
        bgG.fillPath();
        // Windmill Cap
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillTriangle(645, 165, 690, 110, 735, 165);
        // Windmill 4 Blades
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(688, 70, 4, 140);
        bgG.fillRect(620, 138, 140, 4);
        // Blade sails
        bgG.fillStyle(0xfef3c7, 0.7);
        bgG.fillRect(692, 70, 16, 60);
        bgG.fillRect(692, 142, 16, 60);
        bgG.fillRect(620, 142, 60, 16);
        bgG.fillRect(700, 122, 60, 16);
        // Center hub
        bgG.fillStyle(0x78350f, 1);
        bgG.fillCircle(690, 140, 7);

        // 4. Mr. Breado's Bakery Shopfront (Left: x: 60 to 280, y: 190 to 418)
        bgG.fillStyle(0x9a3412, 1);
        bgG.fillRect(60, 220, 220, 198);
        // Brick texture pattern
        bgG.fillStyle(0x7c2d12, 0.8);
        for (let by = 230; by < 410; by += 16) {
            bgG.fillRect(60, by, 220, 2);
        }

        // Red and White Striped Bakery Awning
        const awningStripes = 8;
        const stripeW = 220 / awningStripes;
        for (let i = 0; i < awningStripes; i++) {
            bgG.fillStyle(i % 2 === 0 ? 0xef4444 : 0xf8fafc, 1);
            bgG.fillRect(60 + i * stripeW, 200, stripeW, 25);
            bgG.fillCircle(60 + i * stripeW + stripeW / 2, 225, stripeW / 2);
        }

        // Brick Chimney with White Smoke
        bgG.fillStyle(0x7c2d12, 1);
        bgG.fillRect(80, 130, 28, 70);
        bgG.fillStyle(0x9a3412, 1);
        bgG.fillRect(76, 124, 36, 8);
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(94, 115, Phaser.Math.Between(4, 7), 0xffffff, 0.6).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: 94 + Phaser.Math.Between(15, 35),
                y: 115 - Phaser.Math.Between(30, 60),
                scale: { from: 0.8, to: 2.0 },
                alpha: { from: 0.6, to: 0 },
                duration: 2600 + i * 400,
                delay: i * 600,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // Hanging Bakery Sign (Pretzel / Bread)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(200, 230, 44, 24);
        bgG.fillStyle(0xfde047, 1);
        bgG.fillCircle(215, 242, 6);
        bgG.fillCircle(229, 242, 6);

        // 5. Stacks of Flour Sacks & Wooden Barrels
        // Flour Sacks (x: 290 to 350)
        bgG.fillStyle(0xf1f5f9, 1);
        bgG.fillRoundedRect(290, 386, 24, 32, 6);
        bgG.fillRoundedRect(310, 390, 24, 28, 6);
        bgG.fillStyle(0xd97706, 1);
        bgG.fillRect(296, 390, 12, 4);
        bgG.fillRect(316, 394, 12, 4);

        // Wooden Barrel
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRoundedRect(480, 380, 28, 38, 4);
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(480, 388, 28, 3);
        bgG.fillRect(480, 404, 28, 3);
    }

    createVillageResidentialAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Village Twilight Sky
        bgG.fillGradientStyle(0x0f172a, 0x1e1b4b, 0x312e81, 0x475569, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Stars
        for (let i = 0; i < 26; i++) {
            const sx = Phaser.Math.Between(20, 780);
            const sy = Phaser.Math.Between(10, 150);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.9 },
                duration: Phaser.Math.Between(1600, 3200),
                yoyo: true,
                repeat: -1
            });
        }

        // 3. Distant Village Ridge & Church Spire
        bgG.fillStyle(0x1e1b4b, 0.8);
        bgG.fillTriangle(30, 418, 120, 260, 210, 418);
        // Church steeple
        bgG.fillRect(520, 240, 30, 178);
        bgG.fillTriangle(515, 240, 535, 170, 555, 240);
        bgG.fillCircle(535, 220, 6);

        // 4. Cobblestone Paved Ground along platform
        for (let cx = 10; cx < 790; cx += 28) {
            bgG.fillStyle(0x334155, 0.9);
            bgG.fillRoundedRect(cx, 419, 24, 10, 3);
            bgG.fillStyle(0x475569, 0.6);
            bgG.fillRoundedRect(cx + 2, 420, 20, 4, 2);
        }

        // 5. Victorian Ornate Street Lamp Posts with Glowing Warm Light
        const lampX = [100, 320, 540, 750];
        lampX.forEach(lx => {
            // Post
            bgG.fillStyle(0x0f172a, 1);
            bgG.fillRect(lx - 2, 290, 5, 128);
            bgG.fillRect(lx - 6, 412, 13, 6);
            // Lantern head
            bgG.fillRect(lx - 6, 280, 13, 12);
            bgG.fillTriangle(lx - 8, 280, lx, 268, lx + 8, 280);

            // Glowing warm light pool
            bgG.fillStyle(0xfde047, 0.9);
            bgG.fillCircle(lx, 286, 5);

            const lampGlow = this.add.circle(lx, 286, 28, 0xf59e0b, 0.22).setDepth(0);
            this.tweens.add({
                targets: lampGlow,
                alpha: { from: 0.15, to: 0.32 },
                scale: { from: 0.9, to: 1.15 },
                duration: Phaser.Math.Between(1200, 2200),
                yoyo: true,
                repeat: -1
            });
        });
    }

    createEastForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Mystical Dusk Gradient
        bgG.fillGradientStyle(0x051f1a, 0x0a2f26, 0x163832, 0x274e44, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Ancient Monolith Runic Stones (Standing Stone at x: 260)
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRoundedRect(250, 280, 28, 138, 6);
        // Glowing cyan magical rune glyphs
        const runeGlyphs = [
            this.add.text(264, 305, 'ᚱ', { fontSize: '14px', fill: '#38bdf8' }).setOrigin(0.5).setDepth(0),
            this.add.text(264, 335, 'ᚦ', { fontSize: '14px', fill: '#2dd4bf' }).setOrigin(0.5).setDepth(0),
            this.add.text(264, 365, 'ᚨ', { fontSize: '14px', fill: '#38bdf8' }).setOrigin(0.5).setDepth(0)
        ];
        runeGlyphs.forEach(g => {
            this.tweens.add({
                targets: g,
                alpha: { from: 0.3, to: 1 },
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 3. Ancient Giant Mossy Trees
        const forestTrees = [
            { x: 60, w: 36, foliage: 0x064e3b },
            { x: 480, w: 42, foliage: 0x065f46 },
            { x: 700, w: 38, foliage: 0x047857 }
        ];
        forestTrees.forEach(t => {
            bgG.fillStyle(0x14201a, 1);
            bgG.fillRect(t.x, 140, t.w, 278);
            // Root flares
            bgG.fillTriangle(t.x, 418, t.x - 18, 418, t.x, 380);
            bgG.fillTriangle(t.x + t.w, 418, t.x + t.w + 18, 418, t.x + t.w, 380);
            // Foliage clusters
            bgG.fillStyle(t.foliage, 0.95);
            bgG.fillCircle(t.x + t.w / 2, 130, 60);
            bgG.fillCircle(t.x - 20, 160, 45);
            bgG.fillCircle(t.x + t.w + 20, 160, 45);
        });

        // 4. Drifting Low Ground Mist
        for (let i = 0; i < 4; i++) {
            const mist = this.add.rectangle(100 + i * 180, 412, 180, 18, 0xa7f3d0, 0.12).setDepth(0);
            this.tweens.add({
                targets: mist,
                x: mist.x + 40,
                alpha: { from: 0.08, to: 0.2 },
                duration: 3500 + i * 500,
                yoyo: true,
                repeat: -1
            });
        }

        // 5. Floating Magic Spores
        for (let i = 0; i < 16; i++) {
            const fx = Phaser.Math.Between(20, 780);
            const fy = Phaser.Math.Between(100, 390);
            const spore = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), 0x5eead4, 0.8).setDepth(1);
            this.tweens.add({
                targets: spore,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.95 },
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 1: HOME SCENE (PROLOGUE ONLY)
// -------------------------------------------------------------
class HomeScene extends BaseScene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    create(data = {}) {
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli') || (data && data.ending === true);

        if (!hasCure && (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3')) {
            this.scene.start('GrandmaGardenScene');
            return;
        }

        this.cameras.main.setBackgroundColor('#13172e');
        this.createHomeAtmosphere();

        const title = hasCure ? 'Rumah Aksel & Rachael (Ending)' : 'Rumah Aksel & Rachael (Halaman Teras)';
        this.currentLocationName = title;
        this.registry.set('currentLocationName', title);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const hasWood = !!this.registry.get('hasCollectedFirewood');
        let startX = 360;
        if (data && data.from === 'LakeForestScene') {
            startX = 60;
        } else if (data && data.from === 'ForestTrailScene') {
            startX = 720;
        }
        if (hasCure && data && data.ending === true) {
            startX = 160;
        }

        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Rachael di Kursi Goyang
        this.rachael = this.physics.add.staticSprite(200, 395, 'npc_rachael').setDepth(5);
        this.rachael.type = 'npc';
        this.rachael.dialogue = [
            { speaker: 'Rachael', text: '(Suara bergetar lemah) Kak Aksel... hati-hatilah di jalan... jangan memaksakan dirimu...' },
            { speaker: 'Aksel', text: 'Tenanglah Rachael, bertahanlah demi kakak dan Nenek. Aku pasti kembali membawa obat!' }
        ];

        // Nenek di Teras Rumah
        this.grandma = this.physics.add.staticSprite(275, 393, 'npc_grandma_home').setDepth(5);
        this.grandma.type = 'npc';

        // Tumpukan Kayu Bakar di Teras (muncul setelah diambil dari Danau)
        this.firewoodStack = this.add.image(115, 412, 'special_firewood').setDepth(4).setScale(1.2);
        this.firewoodStack.setVisible(hasWood);

        this.itemsGroup = this.physics.add.staticGroup();

        // Pisau Belati di Meja Teras (muncul setelah adegan batuk darah / bawa kayu bakar)
        if (!hasCure && hasWood) {
            const hasDagger = inv.some(i => i.id === 'Pisau Belati');
            if (!hasDagger) {
                this.dagger = this.itemsGroup.create(380, 405, 'item_dagger');
                this.dagger.type = 'item';
                this.dagger.itemId = 'Pisau Belati';
                this.dagger.itemDesc = 'Senjata belati peninggalan keluarga untuk perlindungan di perjalanan.';
                this.dagger.setDepth(5);
            }
        }

        // Teks Petunjuk Arah Kiri & Kanan
        this.leftExitText = this.add.text(20, 350, '◀ Ke Hutan Danau & Pegunungan\n(Cari Kayu Bakar)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8'
        }).setOrigin(0, 0.5).setDepth(20);
        this.leftExitText.setVisible(!hasWood);

        this.rightExitText = this.add.text(780, 350, 'Ke Pinggir Hutan ➔\n(Jalan ke Kanan)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#60a5fa', align: 'right'
        }).setOrigin(1, 0.5).setDepth(20);
        this.rightExitText.setVisible(hasWood && !hasCure);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        // 1. Prolog Bagian 1: Suruhan Nenek Mengambil Kayu Bakar di Hutan Danau
        if (!hasWood && !data.from && !this.registry.get('woodQuestIntroPlayed')) {
            this.registry.set('woodQuestIntroPlayed', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Nenek', text: 'Aksel, hari sudah mulai sore dan udara malam nanti akan sangat dingin...' },
                    { speaker: 'Nenek', text: 'Maukah kau tolong carikan 3 ikat kayu bakar kering di tepi Hutan Danau sebelah barat [◀]? Perapian kita sudah hampir habis.' },
                    { speaker: 'Aksel', text: 'Tentu Nenek! Aku akan segera pergi ke Hutan Danau di sebelah barat dan segera kembali membawa kayu bakar.' },
                    { speaker: 'Nenek', text: 'Terima kasih, Aksel. Hati-hati di jalan ya, jangan pulang terlalu larut. Rachael sedang istirahat di kursi goyang.' },
                    { speaker: 'Rachael', text: '(Tersenyum lembut dari kursi goyang) Hati-hati di jalan ya, Kak Aksel...' }
                ]);
                setQuestState(this.registry, {
                    chapter: 'PROLOG',
                    title: 'Mencari Kayu Bakar di Hutan Danau',
                    objective: 'Jalan ke arah barat [◀] menuju Hutan Danau & Pegunungan untuk mencari 3 kayu bakar suruhan Nenek.',
                    questNumber: 0
                });
                this.updateQuestHUD();
            });
        }

        // 2. Prolog Bagian 2: Aksel Pulang Membawa Kayu Bakar -> Rachael Batuk Darah
        if (hasWood && data && data.from === 'LakeForestScene' && !this.registry.get('coughCutscenePlayed')) {
            this.registry.set('coughCutscenePlayed', true);
            this.registry.set('prologueIntroPlayed', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Nenek, Rachael, aku sudah pulang! 3 ikat kayu bakar dari tepi danau sudah kutaruh di teras...' },
                    { speaker: 'Rachael', text: '(Duduk lemas di kursi goyang, tiba-tiba terbatuk hebat) Uhukk... uhukk!! Khh-...' },
                    { speaker: 'Narator', text: '(Setitik darah segar menetes di telapak tangan Rachael... Wajahnya semakin pucat pasi, nafasnya tercekat lemas.)' },
                    { speaker: 'Aksel', text: '(Panik berlari mendekat) Rachael! Bertahanlah! Rachael, kau baik-baik saja?!' },
                    { speaker: 'Nenek', text: '(Tergopoh-gopoh mendekat cemas) Astaga, Rachael cucuku! Rachael... apa yang terasa sakit, Nak?!' },
                    { speaker: 'Rachael', text: '(Suara parau dan sangat pelan) Kak Aksel... Nenek... tubuhku rasanya semakin lemas... dadaku sesak sekali...' },
                    { speaker: 'Aksel', text: 'Rachael, aku akan pergi ke kota untuk mencarikanmu obat!' },
                    { speaker: 'Nenek', text: 'Aksel.. jangan pergi, aku tahu niatmu ingin menyelamatkan adikmu ta tapi... jarak ke kota sangat jauh, kau akan kehabisan uang sebelum sampai sana.' },
                    { speaker: 'Aksel', text: 'Nenek.. aku tahu kau mengkhawatirkanku tapi aku janji aku akan segera kembali. Tolong jaga Rachael ya.' },
                    { speaker: 'Nenek', text: 'Baiklah, nenek akan menyiapkan bekal untukmu.' },
                    { speaker: 'Aksel', text: 'Terima kasih nenek!' }
                ], () => {
                    // Nenek memberikan item bekal makanan ke Aksel
                    const curInv = getInventory(this.registry);
                    if (!curInv.some(i => i.id === 'Roti Bekal')) {
                        curInv.push({ id: 'Roti Bekal', desc: 'Roti bekal buatan Nenek tercinta untuk perjalanan Aksel.' });
                        this.registry.set('inventory', curInv);
                        this.renderInventorySlots();

                        const notice = this.add.text(this.grandma.x, this.grandma.y - 32, '✨ + Roti Bekal (Dari Nenek)', {
                            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000bb', padding: { x: 5, y: 3 }
                        }).setOrigin(0.5).setDepth(30);

                        this.tweens.add({
                            targets: notice, y: notice.y - 30, alpha: 0, duration: 1600,
                            onComplete: () => notice.destroy()
                        });
                    }

                    // Tampilkan Belati di Meja Teras
                    if (!this.dagger && !curInv.some(i => i.id === 'Pisau Belati')) {
                        this.dagger = this.itemsGroup.create(380, 405, 'item_dagger');
                        this.dagger.type = 'item';
                        this.dagger.itemId = 'Pisau Belati';
                        this.dagger.itemDesc = 'Senjata belati peninggalan keluarga untuk perlindungan di perjalanan.';
                        this.dagger.setDepth(5);
                    }

                    setQuestState(this.registry, {
                        chapter: 'PROLOG',
                        title: 'Persiapan Menuju Kota',
                        objective: 'Bekal dari Nenek sudah di tas! Ambil Pisau Belati di meja teras sebelum berangkat ke Timur [➔].',
                        questNumber: 0
                    });
                    this.updateQuestHUD();

                    if (this.rightExitText) this.rightExitText.setVisible(true);
                });
            });
        }

        if (hasCure && data && data.ending === true) {
            this.triggerEndingCutscene();
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    triggerEndingCutscene() {
        if (this.isEndingTriggered) return;
        this.isEndingTriggered = true;

        if (this.promptText) this.promptText.setVisible(false);
        this.nearTarget = null;

        this.cameras.main.setBackgroundColor('#0f172a');

        if (this.player) {
            this.player.setVelocity(0, 0);
            this.player.setX(160);
            this.player.setY(380);
            this.player.setTexture('player_human');
        }

        this.time.delayedCall(500, () => {
            this.startDialogue([
                { speaker: 'Rachael', text: '(Air mata menetes, suara bergetar lemah) Abang... kau sudah kembali... Aku menunggumu, Abang... Aku takut kau tidak kembali...' },
                { speaker: 'Aksel', text: '(Berlari mendekat dan memeluk Rachael erat) Rachael... Maafkan aku membuatmu menunggu begitu lama. Aku sudah berjanji, kan? Aku tidak akan pernah meninggalkanmu!' },
                { speaker: 'Rachael', text: '(Menatap wajah abangnya yang tampak begitu lelah dan penuh luka kecil) Nafasmu terengah-engah... pakaianmu kotor dan robek... Abang, apa yang terjadi di luar sana? Kau pergi ke mana saja demi aku...?' },
                { speaker: 'Aksel', text: '(Tersenyum hangat menahan haru, menyembunyikan semua penderitaan kutukannya) Tidak ada apa-apa, Dik. Hanya sedikit perjalanan panjang di desa... Orang-orang baik di desa membantuku mendapatkan obat ini.' },
                { speaker: 'Aksel', text: 'Lihat, ini [Ramuan Kesembuhan Asli] untukmu. Minumlah sekarang, Rachael... Semua rasa sakit ini akan segera berakhir.' },
                { speaker: 'Rachael', text: '(Menerima botol ramuan magis yang berkilau keemasan) Botol ini... terasa sangat hangat di tanganku...' },
                { speaker: 'Rachael', text: '(Meminum ramuan magis perlahan) ... *Glek... Glek...*' },
                { speaker: 'Rachael', text: '✨ (Cahaya keemasan menyelimuti tubuhnya, rona merah segar kembali ke pipinya) K-kehangatan ini... Rasa lemas dan nyeri di dadaku... semuanya hilang, Abang?!' },
                { speaker: 'Rachael', text: '(Perlahan bangkit berdiri dari kursi goyang, menangis bahagia sambil memeluk Aksel) Abang! Kakiku tidak gemetar lagi! Aku bisa berdiri tegak! Aku sembuh, Abang... Aku sembuh total!!' },
                { speaker: 'Nenek', text: '(Menangis haru memeluk Aksel dan Rachael) Syukurlah ya Tuhan... Rachael cucuku sembuh! Aksel, kau cucu yang paling berani dan berbakti... Nenek bangga sekali padamu, Nak!' },
                { speaker: 'Aksel (Dalam Hati)', text: '(Mengepalkan tangan dengan air mata kelegaan) Semua penderitaan menjadi Goblin, cemoohan, dan kerja keras tanpa henti itu... semuanya terbayar lunas. Rachael... adikku terselamatkan.' },
                { speaker: 'Aksel', text: 'Alhamdulillah... Mulai hari ini, kita akan hidup bahagia bersama, Rachael, Nenek. Dan abang berjanji, abang akan selalu menjaga keluarga kita dengan jalan yang jujur dan benar!' }
            ], () => {
                this.showChapterBanner('🎉 TAMAT: THE GOOD GOBLIN 🎉', 'Kutukan Terlepas - Rachael Sembuh Total!');
                setQuestState(this.registry, {
                    chapter: 'EPILOG (TAMAT)',
                    title: '🎉 GAME TAMAT! SELAMAT!',
                    objective: 'Rachael sembuh total & kutukan terlepas! Terima kasih telah bermain The Good Goblin.',
                    questNumber: 10,
                    completedQuests: [
                        'Prolog: Menghadapi Penyihir & Terkena Kutukan',
                        'Bab 1: Bahan 1 Madu Murni',
                        'Bab 2: Bahan 2 Mythical Seed',
                        'Bab 3: Bahan 3 Magic Bread',
                        'Epilog: Rachael Sembuh Total'
                    ]
                });
                this.updateQuestHUD();
            });
        });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'cure') {
                this.triggerEndingCutscene();
            } else if (this.nearTarget.type === 'npc') {
                this.startDialogue(this.nearTarget.dialogue);
            } else if (this.nearTarget.type === 'item') {
                this.collectItem(this.nearTarget.sprite);
            }
        }
    }

    collectItem(itemSprite) {
        const inv = getInventory(this.registry);
        inv.push({ id: itemSprite.itemId, desc: itemSprite.itemDesc });
        this.registry.set('inventory', inv);

        const notice = this.add.text(itemSprite.x, itemSprite.y - 30, `+ ${itemSprite.itemId}`, {
            fontSize: '13px', fontStyle: 'bold', fill: '#2ecc71', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 30, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        itemSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);
        this.renderInventorySlots();

        const hasDagger = inv.some(i => i.id === 'Pisau Belati');
        const hasBread = inv.some(i => i.id === 'Roti Bekal');

        if (hasDagger && hasBread && !this.registry.get('prologueSuppliesReady')) {
            this.registry.set('prologueSuppliesReady', true);
            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Menuju Rumah Penyihir',
                objective: 'Bekal siap! Jalan ke arah timur [➔] menuju Pinggir Hutan.',
                questNumber: 1
            });
            this.updateQuestHUD();

            this.time.delayedCall(400, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Dalam Hati)', text: 'Bekal dan belati sudah kubawa... Rachael, aku berjanji akan membawamu obat, tunggulah sebentar...' },
                    { speaker: 'Aksel', text: 'Aku pergi dulu ya Rachael adikku... Bertahanlah!' }
                ]);
            });
        }
    }

    createHomeAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. SKY GRADIENT (Warm Twilight / Nostalgic Dusk Sky)
        bgG.fillGradientStyle(0x13172e, 0x181e3a, 0x3d1f35, 0x5a2d28, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. CELESTIAL ELEMENTS (Twinkling Stars, Soft Clouds, Crescent Moon)
        for (let i = 0; i < 28; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 160);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.4, 0.9)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 1 },
                scale: { from: 0.7, to: 1.3 },
                duration: Phaser.Math.Between(1500, 3500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Crescent Moon in top right sky
        bgG.fillStyle(0xfef9c3, 0.95);
        bgG.fillCircle(710, 55, 18);
        bgG.fillStyle(0x161c36, 1);
        bgG.fillCircle(718, 50, 16);
        bgG.fillStyle(0xfef08a, 0.08);
        bgG.fillCircle(710, 55, 32);

        // Soft twilight clouds drifting gently
        const clouds = [
            { x: 120, y: 70, w: 110, h: 22 },
            { x: 380, y: 45, w: 140, h: 26 },
            { x: 580, y: 90, w: 100, h: 20 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0xd8b4e2, 0.18);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 10);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 4, c.h * 0.7);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 6, c.h * 0.85);
        });

        // 3. DISTANT MOUNTAINS & WOODLAND RIDGE
        bgG.fillStyle(0x1e1530, 0.9);
        bgG.fillTriangle(260, 418, 440, 190, 620, 418);
        bgG.fillTriangle(480, 418, 640, 220, 800, 418);
        bgG.fillTriangle(600, 418, 730, 250, 840, 418);

        const distantPines = [
            { x: 360, w: 40, h: 120 },
            { x: 420, w: 46, h: 145 },
            { x: 480, w: 42, h: 130 },
            { x: 540, w: 50, h: 155 },
            { x: 610, w: 45, h: 140 },
            { x: 670, w: 52, h: 165 },
            { x: 740, w: 48, h: 150 }
        ];
        distantPines.forEach(dp => {
            bgG.fillStyle(0x151f28, 0.95);
            bgG.fillRect(dp.x + dp.w * 0.4, 418 - dp.h, dp.w * 0.2, dp.h);
            bgG.fillStyle(0x0e1b18, 0.95);
            bgG.fillTriangle(dp.x, 418 - dp.h * 0.3, dp.x + dp.w * 0.5, 418 - dp.h, dp.x + dp.w, 418 - dp.h * 0.3);
            bgG.fillTriangle(dp.x - 4, 418 - dp.h * 0.1, dp.x + dp.w * 0.5, 418 - dp.h * 0.6, dp.x + dp.w + 4, 418 - dp.h * 0.1);
        });

        // Warm horizon dusk glow
        bgG.fillStyle(0xf59e0b, 0.12);
        bgG.fillRect(0, 310, 800, 108);

        // 4. THE COTTAGE HOUSE (Rumah Aksel & Rachael)
        // Upper Wall Base (Warm timber)
        bgG.fillStyle(0x6c3614, 1);
        bgG.fillRect(0, 160, 330, 258);
        // Timber Horizontal Wood Planks
        for (let py = 168; py < 370; py += 16) {
            bgG.fillStyle(0x7c3f1d, 1);
            bgG.fillRect(0, py, 330, 14);
            bgG.fillStyle(0x9a4f27, 0.5);
            bgG.fillRect(0, py, 330, 2);
            bgG.fillStyle(0x451a03, 0.9);
            bgG.fillRect(0, py + 14, 330, 2);
        }

        // Stone Wall Foundation (Lower Cottage Wall)
        bgG.fillStyle(0x334155, 1);
        bgG.fillRect(0, 370, 330, 48);
        bgG.fillStyle(0x475569, 1);
        for (let row = 0; row < 3; row++) {
            const yOffset = 372 + row * 15;
            const xOffset = (row % 2 === 0) ? 0 : 16;
            for (let bx = xOffset; bx < 330; bx += 32) {
                bgG.fillRect(bx + 1, yOffset, 30, 13);
                bgG.fillStyle(0x1e293b, 0.6);
                bgG.fillRect(bx, yOffset, 1, 13);
                bgG.fillRect(bx, yOffset + 12, 31, 1);
                bgG.fillStyle(0x64748b, 0.4);
                bgG.fillRect(bx + 1, yOffset, 30, 1);
                bgG.fillStyle(0x475569, 1);
            }
        }

        // Vertical Timber Corner Posts & Crossbeams
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(0, 160, 14, 258);
        bgG.fillRect(318, 160, 12, 258);
        bgG.fillRect(180, 160, 10, 210);
        bgG.fillRect(0, 250, 330, 8);

        // Diagonal Tudor Style Timber Beams
        bgG.fillStyle(0x3a1502, 0.9);
        bgG.beginPath();
        bgG.moveTo(14, 168); bgG.lineTo(32, 168); bgG.lineTo(180, 250); bgG.lineTo(162, 250);
        bgG.closePath();
        bgG.fillPath();
        bgG.beginPath();
        bgG.moveTo(180, 168); bgG.lineTo(198, 168); bgG.lineTo(318, 250); bgG.lineTo(300, 250);
        bgG.closePath();
        bgG.fillPath();

        // 5. COTTAGE ROOF (Pitched Gable Roof with Rustic Shingles)
        bgG.fillStyle(0x3d1708, 1);
        bgG.fillTriangle(140, 52, -38, 185, 348, 185);

        bgG.fillStyle(0x993515, 1);
        bgG.fillTriangle(140, 50, -32, 180, 342, 180);

        const roofTiers = [
            { y: 80, leftX: 105, rightX: 175, color: 0xb23b17 },
            { y: 105, leftX: 75, rightX: 205, color: 0x8a2e12 },
            { y: 130, leftX: 40, rightX: 240, color: 0xb23b17 },
            { y: 155, leftX: 5, rightX: 275, color: 0x7c280e },
            { y: 178, leftX: -28, rightX: 338, color: 0xa43615 }
        ];
        roofTiers.forEach(tier => {
            bgG.fillStyle(tier.color, 1);
            bgG.fillRect(tier.leftX, tier.y, tier.rightX - tier.leftX, 8);
            bgG.fillStyle(0x451a03, 0.8);
            bgG.fillRect(tier.leftX, tier.y + 7, tier.rightX - tier.leftX, 2);
            for (let sx = tier.leftX + 12; sx < tier.rightX - 10; sx += 20) {
                bgG.fillRect(sx, tier.y, 2, 8);
            }
        });

        // Decorative Roof Ridge Cap & Fascia Trims
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(128, 46, 24, 8);
        bgG.beginPath();
        bgG.moveTo(140, 48); bgG.lineTo(146, 52); bgG.lineTo(-26, 184); bgG.lineTo(-34, 180);
        bgG.closePath();
        bgG.fillPath();
        bgG.beginPath();
        bgG.moveTo(140, 48); bgG.lineTo(134, 52); bgG.lineTo(336, 184); bgG.lineTo(344, 180);
        bgG.closePath();
        bgG.fillPath();

        // 6. STONE CHIMNEY & ANIMATED SMOKE PUFFS
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(52, 45, 34, 75);
        bgG.fillStyle(0x64748b, 1);
        bgG.fillRect(54, 47, 30, 10);
        bgG.fillStyle(0x334155, 1);
        bgG.fillRect(52, 65, 34, 2);
        bgG.fillRect(52, 85, 34, 2);
        bgG.fillRect(52, 105, 34, 2);
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(48, 40, 42, 8);
        bgG.fillStyle(0x94a3b8, 1);
        bgG.fillRect(50, 41, 38, 2);

        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(69, 36, 6 + i * 2, 0xe2e8f0, 0.4).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: { from: 69, to: 95 + i * 15 },
                y: { from: 36, to: -20 },
                scale: { from: 0.8, to: 2.4 },
                alpha: { from: 0.45, to: 0 },
                duration: 3200 + i * 600,
                delay: i * 900,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 7. COTTAGE BAY WINDOW (Glowing warmly from inside)
        bgG.fillStyle(0xfbbf24, 0.12);
        bgG.beginPath();
        bgG.moveTo(60, 290); bgG.lineTo(140, 290); bgG.lineTo(165, 414); bgG.lineTo(35, 414);
        bgG.closePath();
        bgG.fillPath();

        bgG.fillStyle(0x381e0d, 1);
        bgG.fillRoundedRect(56, 218, 88, 76, 4);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillRect(62, 224, 76, 64);
        bgG.fillStyle(0xf59e0b, 0.35);
        bgG.fillRect(62, 224, 76, 30);

        // Curtains
        bgG.fillStyle(0x991b1b, 0.95);
        bgG.fillTriangle(62, 224, 78, 224, 62, 280);
        bgG.fillTriangle(138, 224, 122, 224, 138, 280);

        // Window Mullion Crossbars
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(98, 224, 4, 64);
        bgG.fillRect(62, 254, 76, 4);
        bgG.fillStyle(0x542308, 1);
        bgG.fillRect(52, 290, 96, 6);

        // Window Planter / Flower Box
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(54, 296, 92, 14);
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(54, 308, 92, 2);
        bgG.fillStyle(0x16a34a, 1);
        for (let fx = 58; fx < 140; fx += 10) {
            bgG.fillCircle(fx, 295, 5);
        }
        const flowers = [
            { x: 62, c: 0xef4444 }, { x: 74, c: 0xfde047 }, { x: 86, c: 0xf43f5e },
            { x: 98, c: 0x38bdf8 }, { x: 110, c: 0xfde047 }, { x: 122, c: 0xef4444 }, { x: 134, c: 0xa855f7 }
        ];
        flowers.forEach(f => {
            bgG.fillStyle(f.c, 1);
            bgG.fillCircle(f.x, 293, 3);
            bgG.fillStyle(0xffffff, 0.9);
            bgG.fillCircle(f.x, 293, 1);
        });

        // 8. COTTAGE FRONT DOOR (Pintu Rumah)
        bgG.fillStyle(0x271306, 1);
        bgG.fillRect(238, 268, 68, 150);
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(242, 272, 60, 146);
        bgG.fillStyle(0x431e08, 1);
        bgG.fillRect(248, 280, 22, 55);
        bgG.fillRect(274, 280, 22, 55);
        bgG.fillRect(248, 345, 22, 65);
        bgG.fillRect(274, 345, 22, 65);
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(240, 290, 16, 5);
        bgG.fillRect(240, 385, 16, 5);
        bgG.fillStyle(0xf59e0b, 1);
        bgG.fillCircle(293, 355, 4);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(292, 354, 1.5);

        // 9. THE TERRACE / PORCH (Halaman Teras)
        // Porch Awning / Canopy Overhang
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(15, 268, 345, 8);
        bgG.fillStyle(0x8a2e12, 1);
        bgG.beginPath();
        bgG.moveTo(10, 258); bgG.lineTo(365, 258); bgG.lineTo(355, 272); bgG.lineTo(15, 272);
        bgG.closePath();
        bgG.fillPath();
        bgG.fillStyle(0xb23b17, 1);
        for (let vx = 20; vx < 355; vx += 14) {
            bgG.fillTriangle(vx, 272, vx + 7, 278, vx + 14, 272);
        }

        // Porch Wooden Support Pillars
        const porchPillars = [
            { x: 30, w: 10 },
            { x: 180, w: 10 },
            { x: 345, w: 10 }
        ];
        porchPillars.forEach(pillar => {
            bgG.fillStyle(0x5c2b0e, 1);
            bgG.fillRect(pillar.x, 272, pillar.w, 142);
            bgG.fillStyle(0x78350f, 0.8);
            bgG.fillRect(pillar.x + 2, 272, 3, 142);
            bgG.fillStyle(0x3a1705, 1);
            bgG.fillRect(pillar.x - 3, 272, pillar.w + 6, 6);
            bgG.fillRect(pillar.x - 3, 408, pillar.w + 6, 6);
            bgG.fillTriangle(pillar.x, 278, pillar.x - 12, 278, pillar.x, 290);
            bgG.fillTriangle(pillar.x + pillar.w, 278, pillar.x + pillar.w + 12, 278, pillar.x + pillar.w, 290);
        });

        // Hanging Porch Lantern
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(276, 274, 2, 12);
        bgG.fillTriangle(277, 286, 271, 292, 283, 292);
        bgG.fillStyle(0xfde047, 1);
        bgG.fillRect(272, 292, 10, 12);
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRect(271, 304, 12, 3);
        bgG.fillRect(276, 292, 2, 12);

        const lanternGlow = this.add.circle(277, 298, 28, 0xfbbf24, 0.22).setDepth(0);
        this.tweens.add({
            targets: lanternGlow,
            alpha: { from: 0.15, to: 0.32 },
            scale: { from: 0.92, to: 1.15 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Raised Wooden Porch Deck / Floor
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(15, 412, 340, 6);
        bgG.fillStyle(0x854d0e, 1);
        bgG.fillRect(15, 407, 340, 5);
        bgG.fillStyle(0x3e1d08, 0.8);
        for (let dx = 25; dx < 350; dx += 24) {
            bgG.fillRect(dx, 407, 2, 11);
        }

        // Terrace Steps down to yard
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(350, 412, 20, 6);
        bgG.fillStyle(0x854d0e, 1);
        bgG.fillRect(350, 409, 20, 3);
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(366, 415, 14, 3);

        // Wooden Terrace Railing
        bgG.fillStyle(0x713f12, 1);
        bgG.fillRect(40, 372, 138, 4);
        for (let rx = 48; rx < 175; rx += 14) {
            bgG.fillStyle(0x854d0e, 1);
            bgG.fillRect(rx, 376, 4, 31);
            bgG.fillStyle(0x5c2b0e, 1);
            bgG.fillRect(rx, 404, 4, 3);
        }
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(40, 403, 138, 4);

        // 10. RACHAEL'S ROCKING CHAIR (Kursi Goyang Halaman Teras)
        const chairG = this.add.graphics().setDepth(1);
        chairG.fillStyle(0x5c2b0e, 1);
        chairG.fillRoundedRect(170, 414, 60, 4, 2);
        chairG.fillRect(168, 412, 4, 3);
        chairG.fillRect(228, 412, 4, 3);

        chairG.fillStyle(0x78350f, 1);
        chairG.fillRect(178, 396, 5, 20);
        chairG.fillRect(216, 396, 5, 20);
        chairG.fillRect(180, 406, 38, 3);

        chairG.fillStyle(0x92400e, 1);
        chairG.fillRect(174, 393, 48, 6);
        chairG.fillStyle(0xd97706, 1);
        chairG.fillRoundedRect(175, 389, 44, 5, 2);

        chairG.fillStyle(0x78350f, 1);
        chairG.fillRect(217, 345, 6, 50);
        chairG.fillStyle(0x92400e, 1);
        for (let sp = 348; sp < 388; sp += 8) {
            chairG.fillRect(212, sp, 4, 3);
        }
        chairG.fillStyle(0xb45309, 1);
        chairG.fillRoundedRect(214, 342, 10, 6, 2);

        chairG.fillStyle(0x92400e, 1);
        chairG.fillRect(176, 375, 28, 4);
        chairG.fillRect(176, 378, 4, 15);

        // 11. PREPARATION TABLE / GARDEN BENCH (Meja Persiapan Bekal)
        const tableG = this.add.graphics().setDepth(2);
        tableG.fillStyle(0x451a03, 1);
        tableG.fillRect(372, 412, 8, 22);
        tableG.fillRect(492, 412, 8, 22);
        tableG.fillRect(432, 414, 6, 20);
        tableG.fillStyle(0x5c2b0e, 1);
        tableG.fillRect(372, 424, 128, 4);
        tableG.fillStyle(0x78350f, 1);
        tableG.fillRoundedRect(362, 410, 148, 7, 2);
        tableG.fillStyle(0x9a4f27, 1);
        tableG.fillRect(364, 411, 144, 2);
        tableG.fillStyle(0xf8fafc, 0.9);
        tableG.fillRect(372, 410, 40, 3);
        tableG.fillRect(470, 410, 34, 3);
        this.add.text(435, 420, 'Meja Bekal', { fontSize: '9px', fontStyle: 'bold', fill: '#94a3b8' }).setOrigin(0.5).setDepth(2);

        // 12. POTTED PLANTS & FLOWERS ON TERRACE CORNERS
        const pots = [
            { x: 36, y: 407, plantColor: 0x22c55e, flowerColor: 0xf43f5e },
            { x: 334, y: 407, plantColor: 0x16a34a, flowerColor: 0xfde047 }
        ];
        pots.forEach(pot => {
            bgG.fillStyle(0xc2410c, 1);
            bgG.fillTriangle(pot.x - 7, pot.y - 12, pot.x + 7, pot.y - 12, pot.x, pot.y);
            bgG.fillRect(pot.x - 6, pot.y - 12, 12, 12);
            bgG.fillStyle(0x9a3412, 1);
            bgG.fillRect(pot.x - 8, pot.y - 14, 16, 3);
            bgG.fillStyle(pot.plantColor, 1);
            bgG.fillCircle(pot.x - 4, pot.y - 18, 6);
            bgG.fillCircle(pot.x + 4, pot.y - 18, 6);
            bgG.fillCircle(pot.x, pot.y - 23, 7);
            bgG.fillStyle(pot.flowerColor, 1);
            bgG.fillCircle(pot.x - 2, pot.y - 21, 2.5);
            bgG.fillCircle(pot.x + 3, pot.y - 19, 2.5);
        });

        // 13. FRONT YARD (Halaman Depan Rumah) & WINDING STONE PATHWAY
        const stones = [
            { x: 380, y: 420, rx: 12, ry: 4 },
            { x: 415, y: 423, rx: 15, ry: 5 },
            { x: 455, y: 421, rx: 14, ry: 4 },
            { x: 520, y: 423, rx: 16, ry: 5 },
            { x: 565, y: 421, rx: 15, ry: 4 },
            { x: 615, y: 423, rx: 18, ry: 5 },
            { x: 665, y: 421, rx: 16, ry: 4 },
            { x: 715, y: 423, rx: 17, ry: 5 },
            { x: 760, y: 421, rx: 18, ry: 5 }
        ];
        stones.forEach(st => {
            bgG.fillStyle(0x334155, 1);
            bgG.fillEllipse(st.x, st.y + 1, st.rx, st.ry);
            bgG.fillStyle(0x64748b, 1);
            bgG.fillEllipse(st.x, st.y, st.rx, st.ry);
            bgG.fillStyle(0x94a3b8, 0.7);
            bgG.fillEllipse(st.x - 2, st.y - 1, st.rx * 0.6, st.ry * 0.5);
        });

        // 14. RUSTIC WOODEN PICKET FENCE
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(515, 385, 220, 3);
        bgG.fillRect(515, 400, 220, 3);

        for (let fx = 520; fx < 735; fx += 16) {
            bgG.fillStyle(0x854d0e, 1);
            bgG.fillRect(fx, 375, 8, 38);
            bgG.fillTriangle(fx, 375, fx + 4, 368, fx + 8, 375);
            bgG.fillStyle(0xa16207, 0.6);
            bgG.fillRect(fx + 1, 375, 2, 38);
        }

        // Garden Arch / Gate Posts
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRect(734, 345, 10, 73);
        bgG.fillRect(775, 345, 10, 73);
        bgG.fillStyle(0x5c2b0e, 1);
        bgG.fillRect(730, 345, 58, 6);
        bgG.fillStyle(0x16a34a, 0.9);
        bgG.fillCircle(735, 355, 6);
        bgG.fillCircle(742, 350, 5);
        bgG.fillCircle(765, 350, 5);
        bgG.fillCircle(774, 358, 6);

        // 15. FRONT YARD TREE (Pohon Halaman Tepi Hutan)
        bgG.fillStyle(0x3e1d08, 1);
        bgG.fillRect(772, 180, 28, 238);
        bgG.fillStyle(0x5c2b0e, 0.7);
        bgG.fillRect(775, 180, 4, 238);
        bgG.fillStyle(0x3e1d08, 1);
        bgG.fillTriangle(772, 230, 725, 200, 772, 220);
        bgG.fillTriangle(772, 280, 715, 260, 772, 270);

        const leaves = [
            { x: 740, y: 170, r: 42, color: 0x14532d },
            { x: 710, y: 200, r: 35, color: 0x166534 },
            { x: 780, y: 140, r: 55, color: 0x15803d },
            { x: 700, y: 250, r: 28, color: 0x16a34a },
            { x: 760, y: 190, r: 45, color: 0x15803d }
        ];
        leaves.forEach(lf => {
            bgG.fillStyle(lf.color, 0.95);
            bgG.fillCircle(lf.x, lf.y, lf.r);
        });

        // 16. LAWN DETAILS: FLOWER BUSHES, GRASS TUFTS, WILDFLOWERS
        const bushes = [
            { x: 505, y: 412, r: 16, c: 0x15803d },
            { x: 535, y: 414, r: 12, c: 0x16a34a },
            { x: 635, y: 413, r: 15, c: 0x15803d },
            { x: 705, y: 414, r: 14, c: 0x166534 }
        ];
        bushes.forEach(b => {
            bgG.fillStyle(b.c, 0.95);
            bgG.fillCircle(b.x, b.y, b.r);
            bgG.fillCircle(b.x - b.r * 0.4, b.y + 2, b.r * 0.7);
            bgG.fillCircle(b.x + b.r * 0.4, b.y + 2, b.r * 0.7);
        });

        const yardFlowers = [
            { x: 395, y: 415, c: 0xfde047 },
            { x: 440, y: 416, c: 0xffffff },
            { x: 545, y: 414, c: 0xf43f5e },
            { x: 590, y: 416, c: 0xfde047 },
            { x: 650, y: 415, c: 0x60a5fa },
            { x: 690, y: 416, c: 0xffffff }
        ];
        yardFlowers.forEach(fl => {
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillRect(fl.x, fl.y, 2, 5);
            bgG.fillStyle(fl.c, 1);
            bgG.fillCircle(fl.x + 1, fl.y - 1, 2.5);
            bgG.fillStyle(0xf59e0b, 1);
            bgG.fillCircle(fl.x + 1, fl.y - 1, 1);
        });

        bgG.fillStyle(0x4ade80, 0.9);
        for (let gx = 370; gx < 790; gx += 22) {
            bgG.fillTriangle(gx, 418, gx + 3, 407, gx + 6, 418);
            bgG.fillTriangle(gx + 8, 418, gx + 12, 409, gx + 16, 418);
        }

        // 17. ATMOSPHERIC TWILIGHT FIREFLIES
        for (let i = 0; i < 16; i++) {
            const fx = Phaser.Math.Between(50, 770);
            const fy = Phaser.Math.Between(180, 410);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(1.5, 2.5), 0xfde047, 0.75).setDepth(3);

            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-25, 25),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.85 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(2000, 4200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        let found = null;
        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');
        const hasWood = !!this.registry.get('hasCollectedFirewood');

        if (this.grandma && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandma.x, this.grandma.y) < 60) {
            let grandmaDialogue;
            if (!hasWood) {
                grandmaDialogue = [
                    { speaker: 'Nenek', text: 'Aksel, pergilah ke arah barat [◀] menuju tepi Hutan Danau untuk mencari 3 ikat kayu bakar ya, Nak.' }
                ];
            } else {
                const hasDagger = inv.some(i => i.id === 'Pisau Belati');
                grandmaDialogue = hasDagger ? [
                    { speaker: 'Nenek', text: 'Hati-hati di jalan ya cucuku tersayang... Bawakan obat penawar untuk adikmu dan kembalilah dengan selamat. Doa Nenek selalu menyertaimu.' }
                ] : [
                    { speaker: 'Nenek', text: 'Aksel, jangan lupa bawa sebilah [Pisau Belati] di atas meja teras untuk melindungimu di perjalanan.' }
                ];
            }
            found = { type: 'npc', dialogue: grandmaDialogue, x: this.grandma.x, y: this.grandma.y - 35, prompt: 'Tekan [E] Bicara dengan Nenek' };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rachael.x, this.rachael.y) < 65) {
            if (hasCure) {
                found = { type: 'cure', x: this.rachael.x, y: this.rachael.y - 35, prompt: 'Tekan [E] Minumkan Ramuan Kesembuhan ke Rachael' };
            } else {
                const rDialogue = !hasWood ? [
                    { speaker: 'Rachael', text: '(Tersenyum lemah) Hati-hati di tepi danau ya, Kak Aksel... udara pegunungan sore ini terasa sangat dingin.' }
                ] : this.rachael.dialogue;
                found = { type: 'npc', dialogue: rDialogue, x: this.rachael.x, y: this.rachael.y - 35, prompt: 'Tekan [E] Bicara dengan Rachael' };
            }
        }

        this.itemsGroup.children.iterate((item) => {
            if (item && item.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 45) {
                found = { type: 'item', sprite: item, x: item.x, y: item.y - 25, prompt: `Tekan [E] Ambil ${item.itemId}` };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        if (this.isEndingTriggered) {
            if (this.player) this.player.setVelocityX(0);
            return;
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: !hasWood,
            minX: 20,
            onExitLeft: () => {
                if (!hasWood) {
                    this.scene.start('LakeForestScene', { from: 'HomeScene' });
                }
            },
            canExitRight: hasWood && !hasCure,
            onExitRight: () => {
                if (hasCure) return;
                if (!hasWood) {
                    this.showMapLockedNotice('Cari 3 kayu bakar di Hutan Danau sebelah barat [◀] terlebih dahulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                    return;
                }
                const inv = getInventory(this.registry);
                const hasDagger = inv.some(i => i.id === 'Pisau Belati');
                const hasBread = inv.some(i => i.id === 'Roti Bekal');
                if (!hasDagger || !hasBread) {
                    this.checkMapGate({
                        targetScene: 'ForestTrailScene',
                        reqQuestNum: 1,
                        lockMessage: 'Ambil Pisau Belati di meja teras sebelum berangkat ke Hutan Timur!',
                        direction: 'right'
                    });
                } else {
                    this.scene.start('ForestTrailScene', { from: 'HomeScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 1B: LAKE FOREST SCENE (HUTAN, DANAU, & PEGUNUNGAN DI BARAT)
// -------------------------------------------------------------
class LakeForestScene extends BaseScene {
    constructor() {
        super({ key: 'LakeForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#0b1329');
        this.createLakeForestAtmosphere();

        this.currentLocationName = 'Hutan Danau & Pegunungan Barat (Mencari Kayu)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();

        let startX = 720;
        this.player = this.physics.add.sprite(startX, 380, 'player_human').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // 3 Batang Kayu Bakar yang Tersebar di Tepi Danau
        this.woodGroup = this.physics.add.staticGroup();
        const collected = this.registry.get('lakeFirewoodCount') || 0;
        const woodPositions = [
            { x: 190, y: 412 },
            { x: 410, y: 412 },
            { x: 620, y: 412 }
        ];

        for (let i = collected; i < 3; i++) {
            const w = this.woodGroup.create(woodPositions[i].x, woodPositions[i].y, 'special_firewood');
            w.woodIndex = i;
            w.type = 'firewood';
            w.setDepth(4);
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        // Teks Petunjuk Keluar ke Rumah
        this.rightExitText = this.add.text(780, 350, 'Ke Rumah Nenek & Rachael ➔\n(Jalan ke Kanan)', {
            fontSize: '11px', fontStyle: 'bold', fill: '#38bdf8', align: 'right'
        }).setOrigin(1, 0.5).setDepth(20);
        this.rightExitText.setVisible(collected >= 3);

        this.leftHint = this.add.text(20, 350, '◀ Ujung Danau Kaki Gunung', {
            fontSize: '11px', fontStyle: 'bold', fill: '#94a3b8'
        }).setOrigin(0, 0.5).setDepth(20);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        if (!this.registry.get('lakeSceneIntroSaid')) {
            this.registry.set('lakeSceneIntroSaid', true);
            this.time.delayedCall(400, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Udara di tepi danau pegunungan ini terasa sangat dingin... Pemandangannya sungguh asri.' },
                    { speaker: 'Aksel (Dalam Hati)', text: 'Aku harus segera mencari 3 ikat kayu bakar kering di sekitar tepi danau ini sebelum malam tiba!' }
                ]);
            });
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    createLakeForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. SKY GRADIENT (Sunset Twilight Over Mountains)
        bgG.fillGradientStyle(0x0f172a, 0x1e1b4b, 0x451a03, 0x7c2d12, 1);
        bgG.fillRect(0, 0, 800, 420);

        // Twinkling Stars
        for (let i = 0; i < 24; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 140);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.9)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.95 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(1800, 3600),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 2. MAJESTIC MOUNTAINS WITH SNOWCAPS (Pegunungan Megah)
        // Background Mountains (Deep Violet-Navy)
        bgG.fillStyle(0x18132e, 0.95);
        bgG.fillTriangle(-50, 390, 110, 120, 270, 390);
        bgG.fillTriangle(170, 390, 340, 90, 510, 390);
        bgG.fillTriangle(410, 390, 590, 110, 770, 390);
        bgG.fillTriangle(650, 390, 810, 140, 970, 390);

        // Snowcaps on peaks
        bgG.fillStyle(0xe2e8f0, 0.9);
        bgG.fillTriangle(95, 150, 110, 120, 125, 150);
        bgG.fillTriangle(320, 125, 340, 90, 360, 125);
        bgG.fillTriangle(570, 140, 590, 110, 610, 140);

        // Midground Mountain Ridge
        bgG.fillStyle(0x0e172e, 1);
        bgG.fillTriangle(30, 400, 210, 160, 390, 400);
        bgG.fillTriangle(310, 400, 480, 175, 650, 400);

        // 3. TRANQUIL LAKE WATER (Danau Luas Berkilau)
        // Water Body Surface
        bgG.fillStyle(0x0f2347, 1);
        bgG.fillRect(0, 270, 800, 140);
        bgG.fillGradientStyle(0x1e3a8a, 0x1e3a8a, 0x0284c7, 0x0284c7, 0.45);
        bgG.fillRect(0, 270, 800, 70);

        // Lake Shore Bank (Grass and stones)
        bgG.fillStyle(0x14532d, 0.9);
        bgG.fillRect(0, 405, 800, 15);
        bgG.fillStyle(0x365314, 1);
        bgG.fillRect(0, 403, 800, 3);

        // Water reflection ripples (Animated)
        for (let r = 0; r < 8; r++) {
            const rx = Phaser.Math.Between(50, 750);
            const ry = Phaser.Math.Between(280, 395);
            const rw = Phaser.Math.Between(40, 90);
            const ripple = this.add.rectangle(rx, ry, rw, 2.5, 0x67e8f9, 0.45).setDepth(1);
            this.tweens.add({
                targets: ripple,
                alpha: { from: 0.15, to: 0.65 },
                scaleX: { from: 0.8, to: 1.25 },
                duration: Phaser.Math.Between(1600, 2800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Reeds and Cattails along lake shore
        const reedX = [35, 75, 120, 260, 310, 470, 510, 680, 725];
        reedX.forEach(rx => {
            bgG.fillStyle(0x166534, 1);
            bgG.fillRect(rx, 375, 3, 30);
            bgG.fillRect(rx + 5, 380, 2.5, 25);
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRoundedRect(rx - 1, 372, 5, 12, 2);
        });

        // 4. LUSH PINE & EVERGREEN FOREST (Hutan Pinus Asri)
        const pines = [
            { x: 15, w: 55, h: 210 },
            { x: 85, w: 65, h: 240 },
            { x: 230, w: 60, h: 195 },
            { x: 440, w: 65, h: 220 },
            { x: 620, w: 70, h: 250 },
            { x: 740, w: 60, h: 215 }
        ];
        pines.forEach(p => {
            bgG.fillStyle(0x271910, 1);
            bgG.fillRect(p.x + p.w * 0.42, 412 - p.h * 0.35, p.w * 0.16, p.h * 0.35);
            bgG.fillStyle(0x062818, 0.95);
            bgG.fillTriangle(p.x, 412 - p.h * 0.18, p.x + p.w * 0.5, 412 - p.h * 0.6, p.x + p.w, 412 - p.h * 0.18);
            bgG.fillStyle(0x0a3c24, 0.95);
            bgG.fillTriangle(p.x + 4, 412 - p.h * 0.45, p.x + p.w * 0.5, 412 - p.h * 0.85, p.x + p.w - 4, 412 - p.h * 0.45);
            bgG.fillStyle(0x14532d, 1);
            bgG.fillTriangle(p.x + 8, 412 - p.h * 0.7, p.x + p.w * 0.5, 412 - p.h, p.x + p.w - 8, 412 - p.h * 0.7);
        });

        // Glowing fireflies / water wisps
        for (let i = 0; i < 14; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(260, 400);
            const ff = this.add.circle(fx, fy, Phaser.Math.Between(1.5, 2.5), 0x6ee7b7, 0.7).setDepth(2);
            this.tweens.add({
                targets: ff,
                x: fx + Phaser.Math.Between(-25, 25),
                y: fy + Phaser.Math.Between(-18, 18),
                alpha: { from: 0.2, to: 0.85 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(2200, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'firewood') {
                this.collectLakeFirewood(this.nearTarget.sprite);
            }
        }
    }

    collectLakeFirewood(woodSprite) {
        let count = this.registry.get('lakeFirewoodCount') || 0;
        count++;
        this.registry.set('lakeFirewoodCount', count);

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `🪵 Kayu Bakar (${count}/3)!`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#f59e0b', backgroundColor: '#000000bb', padding: { x: 5, y: 3 }
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        woodSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (count >= 3) {
            this.registry.set('hasCollectedFirewood', true);
            this.rightExitText.setVisible(true);

            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Kayu Bakar Terkumpul!',
                objective: '3 ikat kayu bakar sudah terkumpul! Bawa pulang ke Rumah Nenek & Rachael di sebelah kanan [➔].',
                questNumber: 0
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: 'Aksel', text: 'Alhamdulillah, 3 ikat kayu bakar sudah terkumpul! Cukup untuk menghangatkan rumah semalaman.' },
                { speaker: 'Aksel', text: 'Sekarang aku harus segera pulang ke rumah Nenek dan Rachael di sebelah kanan [➔]!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'PROLOG',
                title: 'Mencari Kayu Bakar di Hutan Danau',
                objective: `Kumpulkan kayu bakar di sekitar tepi danau (Terkumpul: ${count}/3).`,
                questNumber: 0
            });
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;

        this.woodGroup.children.iterate((w) => {
            if (w && w.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) < 50) {
                found = { type: 'firewood', sprite: w, x: w.x, y: w.y - 25, prompt: 'Tekan [E] Ambil Kayu Bakar' };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        const count = this.registry.get('lakeFirewoodCount') || 0;
        this.handlePlayerMovementAndBoundaries({
            canExitLeft: false,
            minX: 20,
            canExitRight: count >= 3,
            onExitRight: () => {
                if (count < 3) {
                    this.showMapLockedNotice('Kumpulkan ketiga ikat kayu bakar terlebih dahulu sebelum pulang!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('HomeScene', { from: 'LakeForestScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 2: FOREST TRAIL SCENE (PINGGIR HUTAN)
// -------------------------------------------------------------
class ForestTrailScene extends BaseScene {
    constructor() {
        super({ key: 'ForestTrailScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#03170e');
        this.createForestAtmosphere();

        this.currentLocationName = 'Pinggir Hutan Mistis (Bertanya Arah)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();

        const qState = getQuestState(this.registry);
        const playerTexture = (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') ? 'player_goblin' : 'player_human';
        
        let startX = 50;
        if (data && data.from === 'WitchYardScene') {
            startX = 740;
        } else if ((data && data.from === 'HomeScene') || (data && data.from === 'GrandmaGardenScene')) {
            startX = 60;
        } else if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
            startX = 740;
        }

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(3);
        this.physics.add.collider(this.player, this.platforms);

        this.hunter = this.physics.add.staticSprite(400, 393, 'npc_hunter').setDepth(3);
        this.hunter.type = 'npc';

        if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2') {
            this.hunter.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Permisi paman, apakah paman tahu di mana letak Madu Magis Murni?' },
                { speaker: 'Pemburu Desa', text: 'Madu Magis? Oh! Lebah magis itu ada di kebun milik Grandma Mary di sebelah barat!' }
            ];
        } else {
            this.hunter.dialogue = [
                { speaker: 'Aksel', text: 'Permisi paman, apakah paman tahu di mana letak rumah penyihir Madam Joanne?' },
                { speaker: 'Pemburu Desa', text: 'Pondok Madam Joanne ada di sebelah timur melewati rimbunan hutan ini, nak.' },
                { speaker: 'Pemburu Desa', text: 'Tapi berhati-hatilah! Halaman rumahnya dijaga oleh seekor Monster Bayangan yang ganas.' },
                { speaker: 'Aksel', text: 'Terima kasih paman! Aku punya pisau ini untuk melawannya.' }
            ];
        }

        // Quest 5 Special Firewood Items (If Quest 5 Active)
        this.woodGroup = this.physics.add.staticGroup();
        if (qState.questNumber === 5) {
            const woodCount = this.registry.get('firewoodCount') || 0;
            const woodPositions = [220, 480, 680];
            for (let i = woodCount; i < 3; i++) {
                const wItem = this.woodGroup.create(woodPositions[i], 415, 'special_firewood');
                wItem.type = 'firewood';
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

        if (hasCure) {
            this.add.text(20, 350, '◀ Rumah Rachael (Ending)', { fontSize: '12px', fontStyle: 'bold', fill: '#4ade80' }).setDepth(15);
        }

        const askedHunter = !!this.registry.get('askedHunterDirections') || (qState.chapter !== 'PROLOG');
        this.rightExitText = this.add.text(760, 350, 'Ke Halaman Penyihir ➔', {
            fontSize: '12px', fontStyle: 'bold', fill: '#34d399', align: 'right'
        }).setOrigin(1, 0.5).setDepth(15);
        this.rightExitText.setVisible(askedHunter);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        if (qState.chapter === 'PROLOG' && !this.registry.get('forestTrailIntroSaid')) {
            this.registry.set('forestTrailIntroSaid', true);
            this.time.delayedCall(450, () => {
                this.startDialogue([
                    { speaker: 'Aksel', text: 'Rachael, maaf jika aku berbohong... Sebenarnya aku tidak bermaksud pergi ke kota, tapi aku tahu harus ke mana...' },
                    { speaker: 'Aksel (Dalam Hati)', text: 'Rumah penyihir tua itu... Yaa, di mana konon katanya dia punya ramuan penyembuh segala penyakit!' },
                    { speaker: 'Aksel', text: 'Ada seorang pemburu di depan. Sebaiknya aku bertanya arah padanya.' }
                ]);
            });
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'npc') {
                this.startDialogue(this.nearTarget.dialogue, () => {
                    if (!this.registry.get('askedHunterDirections')) {
                        this.registry.set('askedHunterDirections', true);
                        if (this.rightExitText) this.rightExitText.setVisible(true);

                        const qState = getQuestState(this.registry);
                        if (qState.chapter === 'PROLOG') {
                            setQuestState(this.registry, {
                                chapter: 'PROLOG',
                                title: 'Menuju Rumah Penyihir',
                                objective: 'Arah diketahui! Jalan ke timur [➔] menuju Halaman Rumah Penyihir.',
                                questNumber: 1
                            });
                            this.updateQuestHUD();
                        }
                    }
                });
            } else if (this.nearTarget.type === 'firewood') {
                this.collectFirewood(this.nearTarget.sprite);
            }
        }
    }

    collectFirewood(woodSprite) {
        let count = this.registry.get('firewoodCount') || 0;
        count++;
        this.registry.set('firewoodCount', count);

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `✨ Kayu Bakar Khusus (${count}/3)!`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#f59e0b', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        woodSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (count >= 3) {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 6: Serahkan Kayu Bakar Khusus',
                objective: '3 Kayu Bakar Khusus terkumpul! Kembali ke Mr. Heinreich di Bengkel Kayu.',
                questNumber: 6
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Berhasil mengumpulkan 3 Kayu Bakar Khusus! Sekarang aku serahkan ke Mr. Heinreich!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                objective: `Cari Kayu Bakar Khusus di pinggir hutan (Progress: ${count}/3).`
            });
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.hunter.x, this.hunter.y) < 60) {
            found = { type: 'npc', dialogue: this.hunter.dialogue, x: this.hunter.x, y: this.hunter.y - 35, prompt: 'Tekan [E] Tanya Arah' };
        }

        this.woodGroup.children.iterate((w) => {
            if (w && w.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) < 45) {
                found = { type: 'firewood', sprite: w, x: w.x, y: w.y - 25, prompt: 'Tekan [E] Ambil Kayu Bakar Khusus' };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const inv = getInventory(this.registry);
                const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

                if (!hasCure) {
                    this.showMapLockedNotice('Aksel berjanji tidak akan pulang sebelum membawa obat untuk Rachael!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }
                this.scene.start('HomeScene', { from: 'ForestTrailScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const qState = getQuestState(this.registry);
                const asked = !!this.registry.get('askedHunterDirections') || (qState.chapter !== 'PROLOG');
                if (!asked) {
                    this.showMapLockedNotice('Tanyakan arah pondok Madam Joanne kepada Pemburu Desa terlebih dahulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                    return;
                }
                this.scene.start('WitchYardScene', { from: 'ForestTrailScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 3: WITCH YARD SCENE
// -------------------------------------------------------------
class WitchYardScene extends BaseScene {
    constructor() {
        super({ key: 'WitchYardScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#0a0618');
        this.createWitchYardAtmosphere();

        this.currentLocationName = 'Halaman Pondok Penyihir';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const playerTexture = (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') ? 'player_goblin' : 'player_human';

        let startX = 60;
        if (data && data.from === 'WitchCottageScene') {
            startX = 660;
        } else if (data && data.from === 'EastForestScene') {
            startX = 740;
        } else if (data && data.from === 'ForestTrailScene') {
            startX = 60;
        } else if (qState.chapter !== 'PROLOG') {
            startX = 660;
        }

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.door = this.physics.add.staticSprite(700, 385, 'witch_door').setDepth(4);

        const inv = getInventory(this.registry);
        const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

        if (hasCure) {
            this.add.text(20, 350, '◀ Jalan Hutan (Rumah Rachael)', {
                fontSize: '12px', fontStyle: 'bold', fill: '#4ade80'
            });
        } else if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
            this.add.text(20, 350, '◀ Kebun Nenek Mary', {
                fontSize: '12px', fontStyle: 'bold', fill: '#86efac'
            });
        }
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            f: Phaser.Input.Keyboard.KeyCodes.F,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        if (this.registry.get('justCursed')) {
            this.registry.set('justCursed', false);

            this.showChapterBanner('BAB 1: MENCARI MADU MAGIS', 'Bahan 1 Dari 3 Bahan Magis');

            this.time.delayedCall(1000, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Uggggh... wujudku benar-benar berubah jadi Goblin hijau kerdil seperti ini...' },
                    { speaker: 'Aksel (Goblin)', text: 'Maafkan aku, Rachael... Karena kecerobohanku mencuri, kau harus menahan sakit lebih lama lagi...' },
                    { speaker: 'Aksel (Goblin)', text: 'Tapi aku tidak boleh patah semangat! Aku harus segera mengumpulkan 3 Bahan Magis itu!' },
                    { speaker: 'Aksel (Goblin)', text: 'Bahan pertama: [Madu Murni]. Aku harus bertanya ke warga desa di mana sarang lebah magis berada!' }
                ]);
            });
        }

        if (qState.chapter !== 'PROLOG' || this.registry.get('monsterDefeated')) {
            this.isMonsterDefeated = true;
        } else {
            this.monsterHP = 3;
            this.isMonsterDefeated = false;
            this.monster = this.physics.add.sprite(550, 375, 'monster_shadow').setDepth(5);
            this.monster.setCollideWorldBounds(true);
            this.physics.add.collider(this.monster, this.platforms);

            this.hpText = this.add.text(550, 335, '❤️ MONSTER HP: 3/3', {
                fontSize: '12px', fontStyle: 'bold', fill: '#ef4444', backgroundColor: '#000000cc', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(15);

            this.battleHint = this.add.text(400, 110, '⚔️ TEKAN [F] / [SPACE] DI DEKAT MONSTER UNTUK MENYERANG DENGAN PISAU!', {
                fontSize: '13px', fontStyle: 'bold', fill: '#f59e0b', backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setDepth(15);

            if (!this.registry.get('witchYardIntroSaid')) {
                this.registry.set('witchYardIntroSaid', true);
                this.time.delayedCall(450, () => {
                    this.startDialogue([
                        { speaker: 'Aksel', text: 'Inikah rumah penyihir tua itu... Nampaknya dijaga sama monster menyeramkan ini ya...' },
                        { speaker: 'Aksel', text: 'Aku harus mengalahkan monster ini dan mendapatkan ramuan penyembuh dari penyihir itu!' }
                    ]);
                });
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.input.keyboard.on('keydown-F', () => this.attackMonster());
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTalking) {
                this.nextDialogue();
            } else {
                this.attackMonster();
            }
        });

        this.input.keyboard.on('keydown-E', () => {
            if (this.isTalking) {
                this.nextDialogue();
            } else if (this.canEnterCottage() && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 75) {
                this.scene.start('WitchCottageScene', { from: 'WitchYardScene' });
            } else if (!this.canEnterCottage() && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 75) {
                this.showMapLockedNotice('Pintu terkunci rapat dari dalam! Selesaikan dulu pencarian 3 Bahan Magis.');
            }
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.isTalking) this.nextDialogue();
        });

        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    attackMonster() {
        if (this.isMonsterDefeated || !this.monster || !this.monster.active || this.isTalking) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y);
        if (dist < 75) {
            this.monsterHP--;

            const slash = this.add.rectangle(this.monster.x, this.monster.y, 40, 40, 0xef4444, 0.8);
            this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 250, onComplete: () => slash.destroy() });

            this.monster.setTint(0xffffff);
            this.time.delayedCall(150, () => this.monster.clearTint());

            if (this.monsterHP > 0) {
                this.hpText.setText(`❤️ MONSTER HP: ${this.monsterHP}/3`);
            } else {
                this.isMonsterDefeated = true;
                this.registry.set('monsterDefeated', true);
                if (this.hpText) this.hpText.destroy();

                this.tweens.add({
                    targets: this.monster, alpha: 0, y: this.monster.y + 20, duration: 600,
                    onComplete: () => {
                        this.monster.destroy();
                        this.onMonsterDefeated();
                    }
                });
            }
        }
    }

    onMonsterDefeated() {
        this.registry.set('monsterDefeated', true);
        if (this.battleHint) {
            this.battleHint.setText('✨ MONSTER DIKALAHKAN! DEKATI PINTU RUMAH & TEKAN [E] UNTUK MENYELINAP!');
            this.battleHint.setStyle({ fill: '#10b981' });
        }

        // Pisau hancur setelah pertarungan sengit
        const inv = getInventory(this.registry);
        const daggerIdx = inv.findIndex(i => i.id === 'Pisau Belati');
        if (daggerIdx !== -1) {
            inv[daggerIdx] = { id: 'Pisau (Hancur)', desc: 'Belati patah akibat pertarungan sengit melawan monster bayangan.' };
            this.registry.set('inventory', inv);
            this.renderInventorySlots();
        }

        setQuestState(this.registry, {
            chapter: 'PROLOG',
            title: 'Menyelinap Mencuri Ramuan',
            objective: 'Monster kalah! Dekati Pintu Rumah Penyihir & Tekan [E] Menyelinap.'
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel', text: 'Huh... pisauku hancur, badanku lelah... Huh kuat sekali monster itu... tapi aku lebih kuat, hahahaha!' },
            { speaker: 'Aksel (Dalam Hati)', text: 'Rachael, tunggulah sebentar lagi... Aku akan pulang dan kau akan sembuh!' },
            { speaker: 'Aksel', text: 'Pintunya ternyata tidak terkunci... dan penyihir itu sepertinya tidak ada di dalam. Ini kesempatanku menyelinap masuk dan mengambil obatnya!' }
        ]);
    }

    canEnterCottage() {
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
        const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
        const has3Ingredients = hasHoney && hasSeed && hasBread;

        if (qState.chapter === 'PROLOG' && this.isMonsterDefeated) {
            return true;
        }

        if (has3Ingredients) {
            return true;
        }

        return false;
    }

    update() {
        const qState = getQuestState(this.registry);

        if (this.canEnterCottage()) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 75) {
                const prompt = (qState.chapter === 'PROLOG') ? 'Tekan [E] Menyelinap Masuk' : 'Tekan [E] Masuk & Serahkan 3 Bahan';
                this.promptText.setPosition(this.door.x, this.door.y - 45).setText(prompt).setVisible(true);
            } else {
                this.promptText.setVisible(false);
            }
        } else if (this.monster && this.monster.active) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.monster.x, this.monster.y) < 80) {
                this.promptText.setPosition(this.monster.x, this.monster.y - 40).setText('Tekan [F] / [SPACE] Tebas Pisau!').setVisible(true);
            } else {
                this.promptText.setVisible(false);
            }
        } else {
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const inv = getInventory(this.registry);
                const hasCure = inv.some(i => i.id === 'Ramuan Kesembuhan Asli');

                if (hasCure) {
                    this.scene.start('ForestTrailScene', { from: 'WitchYardScene' });
                } else if (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') {
                    this.scene.start('GrandmaGardenScene');
                } else {
                    this.showMapLockedNotice('Aksel harus menyelinap masuk ke rumah penyihir untuk mencari obat Rachael!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                }
            },
            canExitRight: true,
            onExitRight: () => {
                this.showMapLockedNotice('Hutan Timur terhalang kabut sihir pekat! Pergilah ke barat [◀] menuju Kebun Nenek Mary.');
                this.player.setX(740);
                this.player.setVelocityX(-150);
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 4: WITCH COTTAGE INTERIOR
// -------------------------------------------------------------
class WitchCottageScene extends BaseScene {
    constructor() {
        super({ key: 'WitchCottageScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0e0618');
        this.createWitchCottageAtmosphere();

        this.currentLocationName = 'Dalam Pondok Penyihir';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const playerTexture = (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') ? 'player_goblin' : 'player_human';
        this.player = this.physics.add.sprite(60, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.shelf = this.physics.add.staticSprite(500, 390, 'potion_shelf').setDepth(4);

        this.joanne = this.physics.add.staticSprite(650, 393, 'npc_joanne').setDepth(5);
        this.joanne.type = 'npc';
        const isCursed = qState.chapter !== 'PROLOG';
        this.joanne.setVisible(isCursed);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(20, 360, '◀ Keluar Ke Halaman', { fontSize: '12px', fontStyle: 'bold', fill: '#60a5fa' });

        this.createVisualInventoryUI();
        this.createDialogueUI();
        this.createQuestUI();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'shelf') {
                this.triggerTheftCutscene();
            } else if (this.nearTarget.type === 'npc') {
                this.talkToJoanne();
            } else if (this.nearTarget.type === 'exit') {
                this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
            }
        }
    }

    talkToJoanne() {
        const inv = getInventory(this.registry);
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
        const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

        if (hasHoney && hasSeed && hasBread) {
            this.triggerEpilogueCutscene();
        } else {
            const dialogue = [
                { speaker: 'Madam Joanne', text: 'Kembali lagi, Aksel? Ingat, kau butuh 3 Bahan Magis untuk menyembuhkan adikmu dan melepaskan kutukan ini:' },
                { speaker: 'Madam Joanne', text: `1. [Madu Murni] dari kebun Grandma Mary: ${hasHoney ? '✅ (Sudah)' : '❌ (Belum)'}` },
                { speaker: 'Madam Joanne', text: `2. [Mythical Seed] dari Mr. Heinreich: ${hasSeed ? '✅ (Sudah)' : '❌ (Belum)'}` },
                { speaker: 'Madam Joanne', text: `3. [Magic Bread] dari Mr. Breado: ${hasBread ? '✅ (Sudah)' : '❌ (Belum)'}` },
                { speaker: 'Madam Joanne', text: 'Cepat selesaikan tugas warga desa dan kumpulkan semua bahannya!' }
            ];
            this.startDialogue(dialogue);
        }
    }

    triggerEpilogueCutscene() {
        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Madam Joanne! Aku telah berhasil mengumpulkan ketiga Bahan Magis (Madu Murni, Mythical Seed, dan Magic Bread)!' },
            { speaker: 'Aksel (Goblin)', text: 'Tolong lepaskan kutukan ini dan berikan obat ramuan untuk adikku Rachael!' },
            { speaker: 'Madam Joanne', text: 'Fufufu... Kau Goblin kerdil yang luar biasa gigih dan tulus, Aksel.' },
            { speaker: 'Madam Joanne', text: 'Ketahuilah... Botol ramuan yang kau curi dulu sebenarnya hanyalah Minyak Pegal Biasa!' },
            { speaker: 'Aksel (Goblin)', text: 'APA?! Ramuan yang kuambil dulu bukan obat?!' },
            { speaker: 'Madam Joanne', text: 'Tentu saja bukan! Tapi dengan 3 Bahan Magis hasil kerja kerasmu membantu warga desa ini, aku meracikkan RAMUAN KESEMBUHAN ASLI untuk adiknya!' },
            { speaker: 'Madam Joanne', text: 'Dan karena ketulusan hatimu, KUTUKAN GOBLIN DIHAPUSKAN!' }
        ], () => {
            const flash = this.add.rectangle(400, 225, 800, 450, 0xffffff, 0.95).setDepth(30);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    flash.destroy();
                    this.player.setTexture('player_human');
                    this.registry.set('isCursed', false);

                    const inv = getInventory(this.registry);
                    inv.push({ id: 'Ramuan Kesembuhan Asli', desc: 'Ramuan magis asli buatan Madam Joanne untuk Rachael.' });
                    this.registry.set('inventory', inv);
                    this.renderInventorySlots();

                    setQuestState(this.registry, {
                        chapter: 'BAB 4',
                        title: 'Bab 4: Pulang & Obati Rachael',
                        objective: 'Kutukan terlepas! Bawa [Ramuan Kesembuhan Asli] pulang ke rumah di barat lewat Jalan Hutan [◀].',
                        questNumber: 10,
                        completedQuests: [
                            'Quest 1-3: Bahan 1 Madu Murni',
                            'Quest 4-6: Bahan 2 Mythical Seed',
                            'Quest 7-9: Bahan 3 Magic Bread'
                        ]
                    });
                    this.updateQuestHUD();

                    this.startDialogue([
                        { speaker: 'Aksel (Manusia)', text: 'Tubuhku... Suaraku... Aku kembali menjadi manusia!' },
                        { speaker: 'Madam Joanne', text: 'Ini [Ramuan Kesembuhan Asli]. Keluarlah ke barat melalui Jalan Hutan untuk pulang ke rumahmu!' },
                        { speaker: 'Aksel (Manusia)', text: 'Terima kasih banyak Madam Joanne! Aku akan segera pulang membawa ramuan ini!' }
                    ], () => {
                        this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
                    });
                }
            });
        });
    }

    triggerTheftCutscene() {
        this.joanne.setVisible(true);

        const flash = this.add.rectangle(400, 225, 800, 450, 0xa855f7, 0.7).setDepth(19);
        this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

        this.startDialogue([
            { speaker: 'Aksel', text: 'Ini dia ramuannya! Aku berhasil mengambilnya—' },
            { speaker: 'Madam Joanne', text: 'BOCAH PENCURI! Berani sekali kau menyelinap masuk ke rumahku!!' },
            { speaker: 'Aksel', text: 'Aaaah! Madam Joanne?! A-ampun! Aku hanya ingin menyelamatkan adik perempuanku yang sakit parah!' },
            { speaker: 'Madam Joanne', text: 'Wah.. wah.. wah... kakak yang baik rupanya. Kulihat hebat juga kau bisa mengalahkan monster penjagaku.' },
            { speaker: 'Madam Joanne', text: '(Merancangkan sihir kegelapan) Tapi bukan berarti kau bisa lolos begitu saja! Bayar dosamu! Kutukan ini akan mengubah wujudmu menjadi Goblin kerdil!' },
            { speaker: 'Aksel (Goblin)', text: 'Aaaarrghh!! Tubuhku... kenapa kulitku jadi hijau dan kerdil?!' },
            { speaker: 'Madam Joanne', text: 'Dengarkan baik-baik, Goblin kecil!' },
            { speaker: 'Madam Joanne', text: 'Jika kau ingin menyembuhkan adikmu, kau butuh 3 Bahan Magis yang sesungguhnya!' },
            { speaker: 'Madam Joanne', text: '1. [Madu Murni] dari sarang lebah magis di kebun Grandma Mary.' },
            { speaker: 'Madam Joanne', text: '2. [Mythical Seed] dari Mr. Heinreich si tukang kayu desa.' },
            { speaker: 'Madam Joanne', text: '3. [Magic Bread] yang diolah oleh Mr. Breado si pembuat roti.' },
            { speaker: 'Madam Joanne', text: 'Bantu warga desa menyelesaikan tugas mereka agar mereka memberikan 3 bahan tersebut padamu!' },
            { speaker: 'Madam Joanne', text: 'Bawa ketiga bahan itu kembali padaku jika kau ingin lepas dari kutukan dan mendapatkan obat asli adikmu!' },
            { speaker: 'Madam Joanne', text: 'CEPAT PERGILAH! KAU TIDAK PUNYA BANYAK WAKTU JIKA INGIN MENYELAMATKAN ADIKMU! HAHAHAHA!' }
        ], () => {
            this.registry.set('justCursed', true);
            this.registry.set('monsterDefeated', true);
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Mencari Madu Magis',
                objective: 'Cari Madu Magis di Kebun Nenek Mary (Jalan ke Barat).',
                questNumber: 1,
                completedQuests: ['Prolog: Menyelinap ke Rumah Penyihir & Kutukan Goblin']
            });
            this.updateQuestHUD();
            this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
        });
    }

    displayCurrentDialogue() {
        super.displayCurrentDialogue();

        if (this.currentDialogueIndex === 5) {
            this.player.setTexture('player_goblin');
        }
    }

    update() {
        let found = null;

        const qState = getQuestState(this.registry);
        if (qState.chapter === 'PROLOG' && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shelf.x, this.shelf.y) < 65) {
            found = { type: 'shelf', x: this.shelf.x, y: this.shelf.y - 35, prompt: 'Tekan [E] Ambil Botol Ramuan' };
        } else if (this.joanne && this.joanne.visible && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.joanne.x, this.joanne.y) < 65) {
            found = { type: 'npc', x: this.joanne.x, y: this.joanne.y - 35, prompt: 'Tekan [E] Bicara Madam Joanne' };
        } else if (this.player.x < 35) {
            found = { type: 'exit', x: 40, y: 360, prompt: 'Tekan [E] Keluar' };
        }

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                this.scene.start('WitchYardScene', { from: 'WitchCottageScene' });
            },
            canExitRight: false,
            maxX: 770
        });
    }
}

// -------------------------------------------------------------
// SCENE 5: GRANDMA MARY'S HOUSE & YARD SCENE
// -------------------------------------------------------------
class GrandmaGardenScene extends BaseScene {
    constructor() {
        super({ key: 'GrandmaGardenScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#38bdf8');
        this.createGrandmaGardenAtmosphere();

        this.currentLocationName = 'Halaman Rumah Grandma Mary (Barat Desa)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const playerTexture = (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') ? 'player_goblin' : 'player_human';
        const startX = (data && data.from === 'BeeGardenScene') ? 60 : 750;

        this.player = this.physics.add.sprite(startX, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.mary = this.physics.add.staticSprite(250, 395, 'npc_mary').setDepth(5);
        this.mary.type = 'npc';

        const inv = getInventory(this.registry);
        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const weedCount = this.registry.get('weedCount') || 0;

        if (hasHoney) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Luar biasa Goblin kecil yang baik hati! Kamu berhasil mendapatkan Madu Murni dari sarang lebah!' },
                { speaker: 'Aksel (Goblin)', text: 'Terima kasih banyak Nenek Mary! Sekarang aku menuju Mr. Heinreich untuk mencari Bahan 2 (Mythical Seed)!' }
            ];
        } else if (hasSmoker) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Bagus sekali! Kamu sudah membawa Bee Smoker dari Mr. Heinreich.' },
                { speaker: 'Grandma Mary', text: 'Sekarang pergilah ke Kebun Lebah di sebelah barat, dekati sarang lebah lalu tekan [E] untuk memanen Madu Murni!' }
            ];
        } else if (weedCount >= 5) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Terima kasih sudah membersihkan 5 rumput liar! Sekarang dapatkan Bee Smoker dari Mr. Heinreich di bengkel kayu (Timur) agar lebah tidak menyengat!' }
            ];
        } else if (this.registry.get('talkedToMary')) {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Tolong bantu Nenek bersihkan 5 rumput liar di Kebun Lebah sebelah barat (Jalan ke Barat) dulu ya Goblin kecil yang baik!' }
            ];
        } else {
            this.mary.dialogue = [
                { speaker: 'Grandma Mary', text: 'Oh, halo makhluk kecil... mataku sudah rabun tua. Kamu pengelana kecil yang baik hati ya?' },
                { speaker: 'Aksel (Goblin)', text: 'Nenek Mary... aku seorang pengelana kecil. Aku sangat membutuhkan Madu Murni dari lebahmu untuk obat adikku yang sedang sakit parah.' },
                { speaker: 'Grandma Mary', text: 'Boleh saja, Goblin kecil! Tapi tolong bantu Nenek bersihkan 5 rumput liar di Kebun Lebah sebelah barat dulu ya.' }
            ];
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(20, 350, '◀ Kebun Lebah & Sarang Lebah\n(Jalan ke Barat)', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });
        this.add.text(780, 350, 'Ke Bengkel Heinreich ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#f59e0b', align: 'right' }).setOrigin(1, 0.5);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        if (qState.chapter === 'BAB 1' && !this.registry.get('talkedToMary')) {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Bab 1: Bicara dengan Grandma Mary',
                objective: 'Bicara dengan Grandma Mary di Halaman Rumahnya (Tekan [E]).',
                questNumber: 1
            });
            this.updateQuestHUD();
        }

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'npc') {
                this.startDialogue(this.nearTarget.dialogue, () => {
                    if (!this.registry.get('talkedToMary')) {
                        this.registry.set('talkedToMary', true);
                        setQuestState(this.registry, {
                            chapter: 'BAB 1',
                            title: 'Quest 1: Bersihkan 5 Rumput Liar',
                            objective: 'Pergi ke Kebun Lebah sebelah barat (Jalan ke Barat) & bersihkan 5 rumput liar [E].',
                            questNumber: 1
                        });
                        this.updateQuestHUD();
                    }
                });
            }
        }
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mary.x, this.mary.y) < 60) {
            found = { type: 'npc', dialogue: this.mary.dialogue, x: this.mary.x, y: this.mary.y - 35, prompt: 'Tekan [E] Bicara Nenek Mary' };
        }

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                this.scene.start('BeeGardenScene', { from: 'GrandmaGardenScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('WoodshopScene', { from: 'GrandmaGardenScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 5.5: BEE GARDEN & BEEHIVE DEEP AREA SCENE
// -------------------------------------------------------------
class BeeGardenScene extends BaseScene {
    constructor() {
        super({ key: 'BeeGardenScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#38bdf8');
        this.createBeeGardenAtmosphere();

        this.currentLocationName = 'Kebun Lebah Magis & Sarang Lebah (Grandma Mary)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        const qState = getQuestState(this.registry);
        const playerTexture = (qState.chapter === 'BAB 1' || qState.chapter === 'BAB 2' || qState.chapter === 'BAB 3') ? 'player_goblin' : 'player_human';
        this.player = this.physics.add.sprite(740, 380, playerTexture).setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.beehive = this.physics.add.staticSprite(650, 320, 'beehive').setDepth(4);
        this.add.text(650, 290, '🐝 Sarang Lebah Magis', { fontSize: '11px', fontStyle: 'bold', fill: '#fef08a' }).setOrigin(0.5).setDepth(20);

        this.weedsGroup = this.physics.add.staticGroup();
        this.weedCount = this.registry.get('weedCount') || 0;

        if (this.weedCount < 5) {
            const weedPositions = [150, 260, 370, 480, 570];
            for (let i = this.weedCount; i < 5; i++) {
                const weed = this.weedsGroup.create(weedPositions[i], 412, 'weed_node');
                weed.type = 'weed';
                weed.setDepth(4);
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(780, 350, 'Ke Halaman Grandma Mary ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac', align: 'right' }).setOrigin(1, 0.5);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'weed') {
                if (!this.registry.get('talkedToMary')) {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Aku harus bicara dulu dengan Grandma Mary di halaman sebelum membersihkan rumput liar di kebun ini!' }
                    ]);
                } else {
                    this.cleanWeed(this.nearTarget.sprite);
                }
            } else if (this.nearTarget.type === 'beehive') {
                this.harvestHoney();
            }
        }
    }

    cleanWeed(weedSprite) {
        this.weedCount++;
        this.registry.set('weedCount', this.weedCount);
        
        const notice = this.add.text(weedSprite.x, weedSprite.y - 25, `✨ Rumput Liar Bersih! (${this.weedCount}/5)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#4ade80', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notice, y: notice.y - 25, alpha: 0, duration: 1200,
            onComplete: () => notice.destroy()
        });

        weedSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (this.weedCount >= 5) {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Quest 2: Beli Bee Smoker (Mr. Heinreich)',
                objective: 'Rumput liar selesai! Beli Bee Smoker dari Mr. Heinreich di bengkel kayu (Timur).',
                questNumber: 2,
                completedQuests: ['Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary']
            });

            this.time.delayedCall(800, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 5 rumput liar dan hama di Kebun Lebah sudah kubersihkan!' },
                    { speaker: 'Aksel (Goblin)', text: 'Sekarang aku perlu [Bee Smoker] dari Mr. Heinreich si tukang kayu agar lebahnya tidak menyengat saat dipanen!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 1',
                title: 'Quest 1: Bersihkan 5 Rumput Liar',
                objective: `Bersihkan rumput liar di Kebun Lebah (Progress: ${this.weedCount}/5).`
            });
        }
        this.updateQuestHUD();
    }

    harvestHoney() {
        const inv = getInventory(this.registry);
        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');

        if (hasHoney) {
            this.startDialogue([{ speaker: 'Aksel (Goblin)', text: 'Madu Murni dari sarang lebah ini sudah berhasil kupanen!' }]);
            return;
        }

        if (!hasSmoker) {
            this.startDialogue([
                { speaker: 'Aksel (Goblin)', text: 'Aduuh! Lebah-lebahnya marah dan menyengat! Aku harus mendapatkan [Bee Smoker] dulu dari Mr. Heinreich!' }
            ]);
            return;
        }

        const smoke = this.add.circle(this.beehive.x, this.beehive.y, 10, 0x94a3b8, 0.7);
        this.tweens.add({ targets: smoke, scaleX: 4, scaleY: 4, alpha: 0, duration: 1500, onComplete: () => smoke.destroy() });

        inv.push({ id: 'Bahan 1: Madu Murni', desc: 'Madu emas murni penetral racun & penyembuh penyakit.' });
        this.registry.set('inventory', inv);

        this.add.text(this.beehive.x, this.beehive.y - 35, '✨ + [Bahan 1: Madu Murni]!', {
            fontSize: '14px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5);

        this.renderInventorySlots();

        setQuestState(this.registry, {
            chapter: 'BAB 2',
            title: 'Bab 2: Berburu Mythical Seed',
            objective: 'Madu Murni dikumpulkan! Pergi ke Mr. Heinreich di Bengkel Kayu untuk Bahan 2 (Mythical Seed).',
            questNumber: 4,
            completedQuests: [
                'Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary',
                'Quest 2: Dapatkan Bee Smoker dari Mr. Heinreich',
                'Quest 3: Panen Bahan 1 (Madu Murni) dari Sarang Lebah'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! Asapnya menenangkan lebah dan aku mendapatkan [Bahan 1: Madu Murni]!' },
            { speaker: 'Grandma Mary', text: 'Luar biasa Aksel! Simpan baik-baik madu murni itu untuk adimu.' },
            { speaker: 'Aksel (Goblin)', text: 'Terima kasih Nenek Mary! 1 Bahan Magis selesai, sekarang aku menuju Mr. Heinreich untuk Bahan 2 (Mythical Seed)!' }
        ]);
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.beehive.x, this.beehive.y) < 60) {
            found = { type: 'beehive', x: this.beehive.x, y: this.beehive.y - 35, prompt: 'Tekan [E] Panen Madu Murni' };
        }

        this.weedsGroup.children.iterate((weed) => {
            if (weed && weed.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, weed.x, weed.y) < 45) {
                const promptMsg = this.registry.get('talkedToMary') ? 'Tekan [E] Bersihkan Rumput Liar' : 'Bicara Dulu dengan Nenek Mary!';
                found = { type: 'weed', sprite: weed, x: weed.x, y: weed.y - 25, prompt: promptMsg };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }
        this.handlePlayerMovementAndBoundaries({
            canExitLeft: false,
            minX: 20,
            canExitRight: true,
            onExitRight: () => {
                this.scene.start('GrandmaGardenScene', { from: 'BeeGardenScene' });
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 6: WOODSHOP SCENE (BENGKEL KAYU MR. HEINREICH - BAB 2)
// -------------------------------------------------------------
class WoodshopScene extends BaseScene {
    constructor() {
        super({ key: 'WoodshopScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#451a03');
        this.createWoodshopAtmosphere();

        let startX = 60;
        if (data && data.from === 'FirewoodForestScene') {
            startX = 740;
        }

        this.currentLocationName = 'Bengkel & Gudang Kayu Mr. Heinreich (Timur Desa)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.heinreich = this.physics.add.staticSprite(220, 390, 'npc_heinreich').setDepth(5);
        this.heinreich.type = 'npc';

        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasSmoker = inv.some(i => i.id === 'Bee Smoker');
        const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
        const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');

        // Trigger Chapter 2 Banner when arriving with Honey
        if (hasHoney && qState.chapter === 'BAB 2' && !this.registry.get('ch2BannerShown')) {
            this.registry.set('ch2BannerShown', true);
            this.showChapterBanner('BAB 2: BERBURU MYTHICAL SEED', 'Bahan 2 Dari 3 Bahan Magis');
        }

        // Dialogue setup based on Chapter 2 progress
        if (hasSeed) {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Bawa [Mythical Seed] itu ke Mr. Breado si pembuat roti untuk diolah menjadi Magic Bread!' }
            ];
        } else if (qState.questNumber === 6) {
            this.heinreich.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Ini 3 Kayu Bakar Khusus yang kau minta dari pinggir hutan!' },
                { speaker: 'Mr. Heinreich', text: 'Kerja keras yang luar biasa, Goblin kecil! Sesuai janjiku, ini [Bahan 2: Mythical Seed] untukmu!' }
            ];
        } else if (qState.questNumber === 5) {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Sekarang cari 3 Kayu Bakar Khusus di Pinggir Hutan (Timur) lalu serahkan padaku ya, Goblin kecil!' }
            ];
        } else if (hasHoney) {
            this.heinreich.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Aku sudah berhasil mendapatkan Madu Murni! Sekarang aku membutuhkan [Bahan 2: Mythical Seed]!' },
                { speaker: 'Mr. Heinreich', text: 'Hoho! Kau Goblin kecil yang hebat juga! Tapi Mythical Seed itu langka. Bantu aku 2 tugas dulu ya.' },
                { speaker: 'Mr. Heinreich', text: 'Tugas pertama (Quest 4): Rapikan 5 Karung Pupuk di sebelah kanan gudang ini!' }
            ];
        } else if (!hasSmoker) {
            this.heinreich.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Aku butuh alat pengasap lebah (Bee Smoker) untuk memanen madu di kebun Grandma Mary!' },
                { speaker: 'Mr. Heinreich', text: 'Wujudmu Goblin kerdil tapi hatimu baik membantu Grandma Mary ya? Ini, ambil Bee Smoker di meja sampingku!' }
            ];
        } else {
            this.heinreich.dialogue = [
                { speaker: 'Mr. Heinreich', text: 'Gunakan [Bee Smoker] itu di kebun Grandma Mary agar lebahnya tenang saat dipanen!' }
            ];
        }

        // Bee Smoker Item (Quest 2)
        this.smokerItem = null;
        if (!hasSmoker && !hasHoney) {
            this.smokerItem = this.physics.add.staticSprite(320, 405, 'item_smoker');
            this.smokerItem.type = 'smoker_item';
        }

        // 5 Fertilizer Bags Group (Quest 4)
        this.bagsGroup = this.physics.add.staticGroup();
        this.bagCount = this.registry.get('bagCount') || 0;
        if (hasHoney && !hasSeed && this.bagCount < 5 && (qState.questNumber === 4 || qState.questNumber < 4)) {
            const bagPositions = [450, 520, 590, 660, 730];
            for (let i = this.bagCount; i < 5; i++) {
                const bag = this.bagsGroup.create(bagPositions[i], 408, 'fertilizer_bag');
                bag.type = 'bag';
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.add.text(20, 350, '◀ Kebun Grandma Mary', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });
        this.add.text(630, 350, 'Pinggir Hutan (Kayu) ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'npc') {
                this.startDialogue(this.nearTarget.dialogue, () => {
                    const qState = getQuestState(this.registry);
                    if (qState.questNumber === 6) {
                        this.giveMythicalSeed();
                    }
                });
            } else if (this.nearTarget.type === 'smoker_item') {
                this.collectSmoker();
            } else if (this.nearTarget.type === 'bag') {
                this.arrangeBag(this.nearTarget.sprite);
            }
        }
    }

    collectSmoker() {
        const inv = getInventory(this.registry);
        inv.push({ id: 'Bee Smoker', desc: 'Alat pengasap seng untuk menenangkan lebah galak.' });
        this.registry.set('inventory', inv);

        const notice = this.add.text(this.smokerItem.x, this.smokerItem.y - 30, '✨ + Bee Smoker!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#2ecc71', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        this.smokerItem.destroy();
        this.smokerItem = null;
        this.nearTarget = null;
        this.promptText.setVisible(false);
        this.renderInventorySlots();

        setQuestState(this.registry, {
            chapter: 'BAB 1',
            title: 'Quest 3: Panen Madu Murni',
            objective: 'Bee Smoker didapatkan! Kembali ke Kebun Grandma Mary & panen Madu [E].',
            questNumber: 3,
            completedQuests: [
                'Quest 1: Bersihkan 5 Rumput Liar Kebun Grandma Mary',
                'Quest 2: Dapatkan Bee Smoker dari Mr. Heinreich'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil mendapatkan [Bee Smoker]! Sekarang aku bisa memanen Madu Murni dari lebah Grandma Mary!' }
        ]);
    }

    arrangeBag(bagSprite) {
        this.bagCount++;
        this.registry.set('bagCount', this.bagCount);

        const notice = this.add.text(bagSprite.x, bagSprite.y - 25, `✨ Karung Pupuk Rapi! (${this.bagCount}/5)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        bagSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (this.bagCount >= 5) {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                objective: 'Karung pupuk rapi! Pergi ke Pinggir Hutan (Timur) & kumpulkan 3 Kayu Bakar Khusus.',
                questNumber: 5,
                completedQuests: [
                    'Quest 1-3: Bahan 1 Madu Murni',
                    'Quest 4: Rapikan 5 Karung Pupuk Gudang Heinreich'
                ]
            });
            this.updateQuestHUD();

            this.time.delayedCall(800, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Mr. Heinreich! Semua 5 Karung Pupuk di gudang sudah kurapikan!' },
                    { speaker: 'Mr. Heinreich', text: 'Bagus sekali! Sekarang tugas kedua: Jalan ke sebelah kanan ke Pinggir Hutan dan kumpulkan 3 Kayu Bakar Khusus!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 4: Susun 5 Karung Pupuk',
                objective: `Rapikan karung pupuk di gudang Heinreich (Progress: ${this.bagCount}/5).`,
                questNumber: 4
            });
            this.updateQuestHUD();
        }
    }

    giveMythicalSeed() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Bahan 2: Mythical Seed')) return;

        inv.push({ id: 'Bahan 2: Mythical Seed', desc: 'Benih langka berevolusi sihir energi kehidupan.' });
        this.registry.set('inventory', inv);

        this.renderInventorySlots();

        // Trigger Chapter 3 Banner & Quest State
        this.showChapterBanner('BAB 3: MEMBUAT MAGIC BREAD', 'Bahan 3 Dari 3 Bahan Magis');

        setQuestState(this.registry, {
            chapter: 'BAB 3',
            title: 'Bab 3: Olah Tepung Magis',
            objective: 'Bawa Mythical Seed ke Mesin Gilingan Batu Desa & temui Mr. Breado.',
            questNumber: 7,
            completedQuests: [
                'Quest 1-3: Bahan 1 Madu Murni',
                'Quest 4: Rapikan 5 Karung Pupuk',
                'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                'Quest 6: Terima Bahan 2 (Mythical Seed)'
            ]
        });
        this.updateQuestHUD();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Hore!! Aku mendapatkan [Bahan 2: Mythical Seed]!' },
            { speaker: 'Mr. Heinreich', text: 'Bawa benih magis itu ke Mr. Breado si koki roti desa untuk diolah menjadi Magic Bread!' },
            { speaker: 'Aksel (Goblin)', text: 'Terima kasih Mr. Heinreich! 2 Bahan selesai, tinggal 1 bahan terakhir (Magic Bread)!' }
        ]);
    }

    update() {
        let found = null;

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heinreich.x, this.heinreich.y) < 60) {
            found = { type: 'npc', dialogue: this.heinreich.dialogue, x: this.heinreich.x, y: this.heinreich.y - 35, prompt: 'Tekan [E] Bicara Mr. Heinreich' };
        } else if (this.smokerItem && this.smokerItem.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.smokerItem.x, this.smokerItem.y) < 45) {
            found = { type: 'smoker_item', x: this.smokerItem.x, y: this.smokerItem.y - 25, prompt: 'Tekan [E] Ambil Bee Smoker' };
        }

        this.bagsGroup.children.iterate((bag) => {
            if (bag && bag.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, bag.x, bag.y) < 45) {
                found = { type: 'bag', sprite: bag, x: bag.x, y: bag.y - 25, prompt: 'Tekan [E] Rapikan Karung Pupuk' };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                if (hasHoney) {
                    this.showMapLockedNotice('Tugas di kebun Grandma Mary selesai! Fokus pada tugas Mr. Heinreich.');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }
                this.scene.start('GrandmaGardenScene', { from: 'WoodshopScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const qState = getQuestState(this.registry);

                if (!hasHoney) {
                    this.showMapLockedNotice('Kumpulkan [Bahan 1: Madu Murni] dari kebun Grandma Mary dulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else if (qState.questNumber < 5) {
                    this.showMapLockedNotice('Bicara & rapikan 5 Karung Pupuk dulu bersama Mr. Heinreich!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('FirewoodForestScene', { from: 'WoodshopScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 8: FIREWOOD FOREST SCENE (PINGGIR HUTAN TIMUR - BAB 2)
// -------------------------------------------------------------
class FirewoodForestScene extends BaseScene {
    constructor() {
        super({ key: 'FirewoodForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#091e17');
        this.createFirewoodForestAtmosphere();

        this.currentLocationName = 'Area Kayu Bakar Khusus (Pinggir Hutan Timur)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'BakeryMillScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        this.add.text(20, 350, '◀ Bengkel Heinreich', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });
        this.add.text(630, 350, 'Gilingan & Toko Roti ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });

        // Firewood items group
        this.woodGroup = this.physics.add.staticGroup();
        const collected = this.registry.get('collectedFirewood') || [];
        const woodPositions = [260, 480, 700];

        for (let i = 0; i < 3; i++) {
            if (!collected.includes(i)) {
                const wItem = this.woodGroup.create(woodPositions[i], 410, 'special_firewood');
                wItem.woodIndex = i;
                wItem.type = 'firewood';
            }
        }

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget && this.nearTarget.type === 'firewood') {
            this.collectWood(this.nearTarget.sprite);
        }
    }

    collectWood(woodSprite) {
        let collected = this.registry.get('collectedFirewood') || [];
        if (!collected.includes(woodSprite.woodIndex)) {
            collected.push(woodSprite.woodIndex);
            this.registry.set('collectedFirewood', collected);
        }

        let count = collected.length;
        this.registry.set('firewoodCount', count);

        const notice = this.add.text(woodSprite.x, woodSprite.y - 25, `✨ Kayu Bakar Khusus! (${count}/3)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        woodSprite.destroy();
        this.nearTarget = null;
        this.promptText.setVisible(false);

        if (count >= 3) {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 6: Serahkan Kayu Bakar Khusus',
                objective: '3 Kayu Bakar Khusus terkumpul! Kembali ke Mr. Heinreich di Bengkel Kayu [E].',
                questNumber: 6,
                completedQuests: [
                    'Quest 1-3: Bahan 1 Madu Murni',
                    'Quest 4: Rapikan 5 Karung Pupuk Gudang Heinreich',
                    'Quest 5: Kumpulkan 3 Kayu Bakar Khusus'
                ]
            });
            this.updateQuestHUD();

            this.time.delayedCall(600, () => {
                this.startDialogue([
                    { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 3 Kayu Bakar Khusus sudah terkumpul! Sekarang aku kembali ke Bengkel Mr. Heinreich!' }
                ]);
            });
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 2',
                title: 'Quest 5: Kumpulkan 3 Kayu Bakar Khusus',
                objective: `Kumpulkan kayu bakar khusus di Pinggir Hutan Timur (Progress: ${count}/3).`,
                questNumber: 5
            });
            this.updateQuestHUD();
        }
    }

    update() {
        let found = null;

        this.woodGroup.children.iterate((w) => {
            if (w && w.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) < 45) {
                found = { type: 'firewood', sprite: w, x: w.x, y: w.y - 25, prompt: 'Tekan [E] Ambil Kayu Bakar Khusus' };
            }
        });

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const collected = this.registry.get('collectedFirewood') || [];
                const inv = getInventory(this.registry);
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');

                if (collected.length < 3 && !hasSeed) {
                    this.showMapLockedNotice('Kumpulkan 3 Kayu Bakar Khusus dulu sebelum kembali ke Mr. Heinreich!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }
                this.scene.start('WoodshopScene', { from: 'FirewoodForestScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                if (!hasSeed) {
                    this.showMapLockedNotice('Serahkan kayu bakar ke Heinreich untuk dapatkan [Bahan 2: Mythical Seed] dulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('BakeryMillScene', { from: 'FirewoodForestScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 9: BAKERY MILL SCENE (TOKO ROTI & GILINGAN BATU - BAB 3)
// -------------------------------------------------------------
class BakeryMillScene extends BaseScene {
    constructor() {
        super({ key: 'BakeryMillScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#1e3a5f');
        this.createBakeryMillAtmosphere();

        this.currentLocationName = 'Area Gilingan Batu & Toko Roti Mr. Breado (Bab 3)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'VillageResidentialScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // NPC Mr. Breado
        this.breado = this.physics.add.staticSprite(200, 390, 'npc_breado').setDepth(5);
        this.breado.type = 'npc';

        // Stone Mill (Interactive 1)
        this.mill = this.physics.add.staticSprite(380, 395, 'stone_mill').setDepth(4);
        this.mill.type = 'mill';

        // Bread Baskets (Interactive 2)
        this.basket = this.physics.add.staticSprite(550, 405, 'bread_basket').setDepth(4);
        this.basket.type = 'basket';

        // Magic Oven (Interactive 3)
        this.oven = this.physics.add.staticSprite(710, 380, 'magic_oven').setDepth(4);
        this.oven.type = 'oven';

        this.add.text(20, 350, '◀ Pinggir Hutan (Kayu)', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });
        this.add.text(780, 350, 'Pemukiman Warga (3 Rumah) ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#60a5fa', align: 'right' }).setOrigin(1, 0.5);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });

        this.updateDialogueState();
    }

    updateDialogueState() {
        const inv = getInventory(this.registry);
        const hasFlour = inv.some(i => i.id === 'Tepung Magis');
        const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
        const delivered = this.registry.get('deliveredHouses') || [];
        const qState = getQuestState(this.registry);

        if (hasMagicBread) {
            this.breado.dialogue = [
                { speaker: 'Mr. Breado', text: 'Selamat ya Goblin kecil yang baik hati! Ketiga Bahan Magis utama sudah lengkap di tanganmu!' },
                { speaker: 'Mr. Breado', text: 'Segera kembali ke kediaman Madam Joanne di timur untuk melepaskan kutukan & menyembuhkan adikmu!' }
            ];
        } else if (delivered.length >= 3 || qState.questNumber === 9) {
            this.breado.dialogue = [
                { speaker: 'Mr. Breado', text: 'Wah, kamu sudah kembali! Terima kasih banyak sudah mengantarkan seluruh roti ke rumah warga!' }
            ];
        } else if (hasFlour || qState.questNumber === 8) {
            this.breado.dialogue = [
                { speaker: 'Mr. Breado', text: 'Bantu aku mengantarkan 3 Keranjang Roti Pagi ke 3 rumah warga di area Pemukiman Warga (sebelah kanan) ya, Goblin kecil!' }
            ];
        } else {
            this.breado.dialogue = [
                { speaker: 'Aksel (Goblin)', text: 'Mr. Breado! Aku membawa [Mythical Seed]! Bisakah Anda membantuku mengolahnya menjadi Magic Bread?' },
                { speaker: 'Mr. Breado', text: 'Hoho! Selamat datang Goblin kecil yang baik! Tentu saja! Tapi benih keras itu harus digiling dulu di Gilingan Batu Desa di sebelahku!' }
            ];
        }
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'npc') {
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
                const delivered = this.registry.get('deliveredHouses') || [];

                if (delivered.length >= 3 && !hasMagicBread) {
                    this.giveMagicBreadReward();
                } else {
                    this.startDialogue(this.breado.dialogue);
                }
            } else if (this.nearTarget.type === 'mill') {
                this.grindSeed();
            } else if (this.nearTarget.type === 'basket') {
                this.deliverBread();
            } else if (this.nearTarget.type === 'oven') {
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
                if (hasMagicBread) {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Oven magis ini telah selesai memanggang Magic Bread yang kuterima dari Mr. Breado.' }
                    ]);
                } else {
                    this.startDialogue([
                        { speaker: 'Aksel (Goblin)', text: 'Aroma harum Magic Bread tercium dari oven! Aku harus bicara ke Mr. Breado untuk menerima hadiahku.' }
                    ]);
                }
            }
        }
    }

    grindSeed() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Tepung Magis')) return;

        inv.push({ id: 'Tepung Magis', desc: 'Tepung halus berkilau emas hasil gilingan Mythical Seed.' });
        this.registry.set('inventory', inv);
        this.renderInventorySlots();

        const notice = this.add.text(this.mill.x, this.mill.y - 30, '✨ + Tepung Magis!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        setQuestState(this.registry, {
            chapter: 'BAB 3',
            title: 'Quest 8: Antar 3 Roti Pagi',
            objective: 'Tepung Magis didapatkan! Antarkan 3 Keranjang Roti Pagi ke 3 rumah warga di sebelah kanan [➔].',
            questNumber: 8,
            completedQuests: [
                'Quest 1-3: Bahan 1 Madu Murni',
                'Quest 4-6: Bahan 2 Mythical Seed',
                'Quest 7: Giling Mythical Seed Jadi Tepung Magis'
            ]
        });
        this.updateQuestHUD();
        this.updateDialogueState();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Berhasil! Mythical Seed sudah berhasil digiling menjadi [Tepung Magis]!' },
            { speaker: 'Mr. Breado', text: 'Bagus sekali! Sekarang tugas berikutnya: Antarkan 3 Keranjang Roti Pagi ke 3 rumah warga di sebelah kanan (Pemukiman Warga) ya, Goblin kecil!' }
        ]);
    }

    deliverBread() {
        let count = this.registry.get('breadDeliverCount') || 0;
        if (count >= 3) {
            this.startDialogue([
                { speaker: 'Mr. Breado', text: 'Semua 3 roti sudah berhasil kamu antarkan ke rumah-rumah warga desa! Terima kasih ya, Goblin kecil yang baik hati!' }
            ]);
            return;
        }

        this.startDialogue([
            { speaker: 'Mr. Breado', text: 'Antarkan 3 keranjang roti ini ke 3 rumah warga yang berada di sebelah kanan (Pemukiman Warga)!' },
            { speaker: 'Aksel (Goblin)', text: 'Baik Mr. Breado, aku akan langsung mengantarkannya ke rumah-rumah warga!' }
        ]);
    }

    giveMagicBreadReward() {
        const inv = getInventory(this.registry);
        if (inv.some(i => i.id === 'Bahan 3: Magic Bread')) return;

        inv.push({ id: 'Bahan 3: Magic Bread', desc: 'Roti magis emas kaya nutrisi sihir pemulihan, hadiah dari Mr. Breado.' });
        this.registry.set('inventory', inv);
        this.renderInventorySlots();

        const notice = this.add.text(this.breado.x, this.breado.y - 45, '✨ + Bahan 3: Magic Bread!', {
            fontSize: '13px', fontStyle: 'bold', fill: '#2ecc71', backgroundColor: '#000000aa', padding: { x: 6, y: 3 }
        }).setOrigin(0.5);
        this.tweens.add({ targets: notice, y: notice.y - 30, alpha: 0, duration: 1500, onComplete: () => notice.destroy() });

        setQuestState(this.registry, {
            chapter: 'BAB 4',
            title: 'Bab 4: Kembali ke Madam Joanne',
            objective: 'Ketiga Bahan Magis LENGKAP! Kembali ke Rumah Madam Joanne lewat Hutan Timur [➔].',
            questNumber: 10,
            completedQuests: [
                'Quest 1-3: Bahan 1 Madu Murni',
                'Quest 4-6: Bahan 2 Mythical Seed',
                'Quest 7-9: Bahan 3 Magic Bread'
            ]
        });
        this.updateQuestHUD();
        this.updateDialogueState();

        this.startDialogue([
            { speaker: 'Aksel (Goblin)', text: 'Mr. Breado! Semua 3 keranjang roti pagi sudah berhasil kuantarkan ke seluruh rumah warga desa!' },
            { speaker: 'Mr. Breado', text: 'Luar biasa! Terima kasih banyak ya, Goblin kecil yang baik hati! Warga desa sangat terbantu olehmu.' },
            { speaker: 'Mr. Breado', text: 'Sebagai hadiah atas kebaikan dan bantuanmu, ini aku serahkan [Bahan 3: Magic Bread] yang baru saja selesai kupanggang dengan sempurna!' },
            { speaker: 'Aksel (Goblin)', text: 'HOREEE!! [Bahan 3: Magic Bread] akhirnya kudapatkan! Terima kasih banyak Mr. Breado!' },
            { speaker: 'Aksel (Dalam Hati)', text: '(Ketiga Bahan Magis akhirnya lengkap! Sekarang aku bisa kembali ke Madam Joanne untuk melepaskan kutukan dan menyembuhkan Rachael!)' }
        ], () => {
            this.showChapterBanner('SEMUA 3 BAHAN MAGIS LENGKAP!', 'Segera Temui Madam Joanne untuk Menyembuhkan Rachael!');
        });
    }

    update() {
        let found = null;
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);
        const hasFlour = inv.some(i => i.id === 'Tepung Magis');
        const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');
        const delivered = this.registry.get('deliveredHouses') || [];

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.breado.x, this.breado.y) < 60) {
            const prompt = (delivered.length >= 3 && !hasMagicBread) ? 'Tekan [E] Minta Hadiah Magic Bread dari Mr. Breado' : 'Tekan [E] Bicara Mr. Breado';
            found = { type: 'npc', x: this.breado.x, y: this.breado.y - 35, prompt: prompt };
        } else if (!hasFlour && !hasMagicBread && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mill.x, this.mill.y) < 55) {
            found = { type: 'mill', x: this.mill.x, y: this.mill.y - 30, prompt: 'Tekan [E] Giling Mythical Seed' };
        } else if (hasFlour && !hasMagicBread && qState.questNumber === 8 && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.basket.x, this.basket.y) < 55) {
            found = { type: 'basket', x: this.basket.x, y: this.basket.y - 25, prompt: 'Tekan [E] Info Roti Pagi' };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.oven.x, this.oven.y) < 60) {
            found = { type: 'oven', x: this.oven.x, y: this.oven.y - 35, prompt: 'Tekan [E] Lihat Oven Magis' };
        }

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                this.showMapLockedNotice('Tugas Mr. Heinreich sudah selesai! Fokus membantu Mr. Breado mengolah Magic Bread.');
                this.player.setX(35);
                this.player.setVelocityX(150);
            },
            canExitRight: true,
            onExitRight: () => {
                if (!hasFlour && !hasMagicBread) {
                    this.showMapLockedNotice('Giling Mythical Seed di Mesin Batu dulu menjadi Tepung Magis!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('VillageResidentialScene', { from: 'BakeryMillScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 10: VILLAGE RESIDENTIAL SCENE (3 RUMAH PEMESAN ROTI)
// -------------------------------------------------------------
class VillageResidentialScene extends BaseScene {
    constructor() {
        super({ key: 'VillageResidentialScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#0f172a');
        this.createVillageResidentialAtmosphere();

        this.currentLocationName = 'Pemukiman Desa (3 Rumah Pemesan Roti)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'EastForestScene') {
            startX = 740;
        } else if (data && data.from === 'BakeryMillScene') {
            startX = 60;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // House 1: Pak Thomas
        this.house1 = this.physics.add.staticSprite(200, 370, 'village_house1').setDepth(4);
        this.npc1 = this.physics.add.staticSprite(240, 395, 'npc_thomas').setDepth(5);
        this.add.text(200, 305, 'Rumah 1\nPak Thomas', { fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', align: 'center' }).setOrigin(0.5).setDepth(20);

        // House 2: Ibu Sarah
        this.house2 = this.physics.add.staticSprite(420, 370, 'village_house2').setDepth(4);
        this.npc2 = this.physics.add.staticSprite(460, 395, 'npc_sarah').setDepth(5);
        this.add.text(420, 305, 'Rumah 2\nIbu Sarah', { fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', align: 'center' }).setOrigin(0.5).setDepth(20);

        // House 3: Paman Bob
        this.house3 = this.physics.add.staticSprite(640, 370, 'village_house3').setDepth(4);
        this.npc3 = this.physics.add.staticSprite(680, 395, 'npc_bob').setDepth(5);
        this.add.text(640, 305, 'Rumah 3\nPaman Bob', { fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', align: 'center' }).setOrigin(0.5).setDepth(20);

        this.add.text(20, 350, '◀ Toko Roti Mr. Breado', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' });
        this.add.text(780, 350, 'Hutan Timur ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac', align: 'right' }).setOrigin(1, 0.5);

        this.promptText = this.add.text(0, 0, '', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f1c40f', backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();

        this.input.keyboard.on('keydown-E', () => this.handleActionKey());
        this.input.keyboard.on('keydown-ENTER', () => this.handleActionKey());
        this.input.keyboard.on('keydown-SPACE', () => { if (this.isTalking) this.nextDialogue(); });
        this.input.keyboard.on('keydown-I', () => { if (!this.isTalking) this.toggleInventoryModal(); });
        this.input.keyboard.on('keydown-Q', () => { if (!this.isTalking) this.toggleQuestModal(); });
    }

    handleActionKey() {
        if (this.isTalking) {
            this.nextDialogue();
        } else if (this.nearTarget) {
            if (this.nearTarget.type === 'house1') {
                this.deliverToHouse('thomas', 'Pak Thomas', this.house1);
            } else if (this.nearTarget.type === 'house2') {
                this.deliverToHouse('sarah', 'Ibu Sarah', this.house2);
            } else if (this.nearTarget.type === 'house3') {
                this.deliverToHouse('bob', 'Paman Bob', this.house3);
            }
        }
    }

    deliverToHouse(houseKey, name, sprite) {
        let delivered = this.registry.get('deliveredHouses') || [];
        if (delivered.includes(houseKey)) {
            let message = '';
            if (houseKey === 'thomas') message = 'Pak Thomas: "Rotinya masih hangat dan sangat lezat! Terima kasih ya, Goblin kecil yang baik hati!"';
            if (houseKey === 'sarah') message = 'Ibu Sarah: "Selamat pagi Goblin kecil yang manis! Roti hangat ini pas sekali untuk sarapan."';
            if (houseKey === 'bob') message = 'Paman Bob: "Terima kasih banyak Goblin kecil! Kamu makhluk kecil yang sangat rajin dan ramah!"';

            this.startDialogue([
                { speaker: name, text: message }
            ]);
            return;
        }

        const qState = getQuestState(this.registry);
        if (qState.questNumber < 8) {
            this.startDialogue([
                { speaker: name, text: 'Halo Goblin kecil! Kami sedang menunggu pesanan roti pagi dari Mr. Breado.' }
            ]);
            return;
        }

        delivered.push(houseKey);
        this.registry.set('deliveredHouses', delivered);
        const count = delivered.length;
        this.registry.set('breadDeliverCount', count);

        const notice = this.add.text(sprite.x, sprite.y - 40, `✨ Roti Terantar! (${count}/3)`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: notice, y: notice.y - 25, alpha: 0, duration: 1200, onComplete: () => notice.destroy() });

        if (count >= 3) {
            setQuestState(this.registry, {
                chapter: 'BAB 3',
                title: 'Quest 9: Minta Hadiah Magic Bread',
                objective: '3 Roti Warga Terantar! Kembali & temui Mr. Breado [E] untuk menerima [Magic Bread] sebagai hadiah.',
                questNumber: 9,
                completedQuests: [
                    'Quest 1-3: Bahan 1 Madu Murni',
                    'Quest 4-6: Bahan 2 Mythical Seed',
                    'Quest 7: Giling Tepung Magis',
                    'Quest 8: Antar 3 Keranjang Roti Pagi ke Warga'
                ]
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: name, text: `Terima kasih banyak Goblin kecil yang baik hati! Ini roti pesanan yang kami tunggu!` },
                { speaker: 'Aksel (Goblin)', text: 'Hore! Semua 3 rumah warga desa sudah menerima roti pagi mereka! Sekarang aku harus kembali menemui Mr. Breado di Toko Roti!' }
            ]);
        } else {
            setQuestState(this.registry, {
                chapter: 'BAB 3',
                title: 'Quest 8: Antar 3 Roti Pagi',
                objective: `Antar keranjang roti pagi ke 3 rumah warga desa (Progress: ${count}/3).`,
                questNumber: 8
            });
            this.updateQuestHUD();

            this.startDialogue([
                { speaker: name, text: `Wah, terima kasih Goblin kecil yang baik! Roti buatan Mr. Breado selalu yang terbaik!` },
                { speaker: 'Aksel (Goblin)', text: `Sama-sama! Masih ada ${3 - count} rumah lagi yang harus kuantarkan.` }
            ]);
        }
    }

    update() {
        let found = null;
        let delivered = this.registry.get('deliveredHouses') || [];

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house1.x, this.house1.y) < 70) {
            const prompt = delivered.includes('thomas') ? 'Tekan [E] Bicara Pak Thomas' : 'Tekan [E] Antar Roti (Rumah Pak Thomas)';
            found = { type: 'house1', x: this.house1.x, y: this.house1.y - 45, prompt: prompt };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house2.x, this.house2.y) < 70) {
            const prompt = delivered.includes('sarah') ? 'Tekan [E] Bicara Ibu Sarah' : 'Tekan [E] Antar Roti (Rumah Ibu Sarah)';
            found = { type: 'house2', x: this.house2.x, y: this.house2.y - 45, prompt: prompt };
        } else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.house3.x, this.house3.y) < 70) {
            const prompt = delivered.includes('bob') ? 'Tekan [E] Bicara Paman Bob' : 'Tekan [E] Antar Roti (Rumah Paman Bob)';
            found = { type: 'house3', x: this.house3.x, y: this.house3.y - 45, prompt: prompt };
        }

        if (found && !this.isTalking && !this.isInvOpen && !this.isQuestModalOpen) {
            this.nearTarget = found;
            this.promptText.setPosition(found.x, found.y).setText(found.prompt).setVisible(true);
        } else {
            this.nearTarget = null;
            this.promptText.setVisible(false);
        }

        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                const delivered = this.registry.get('deliveredHouses') || [];
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (delivered.length < 3 && !hasMagicBread) {
                    this.showMapLockedNotice('Antarkan 3 keranjang roti ke 3 rumah warga desa dulu!');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }

                if (hasMagicBread) {
                    this.showMapLockedNotice('Magic Bread sudah didapatkan! Segera kembali ke Madam Joanne di timur.');
                    this.player.setX(35);
                    this.player.setVelocityX(150);
                    return;
                }

                this.scene.start('BakeryMillScene', { from: 'VillageResidentialScene' });
            },
            canExitRight: true,
            onExitRight: () => {
                const delivered = this.registry.get('deliveredHouses') || [];
                const inv = getInventory(this.registry);
                const hasMagicBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (delivered.length < 3 && !hasMagicBread) {
                    this.showMapLockedNotice('Antarkan 3 keranjang roti ke 3 rumah warga desa dulu!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('EastForestScene', { from: 'VillageResidentialScene' });
                }
            }
        });
    }
}

// -------------------------------------------------------------
// SCENE 11: EAST FOREST SCENE (HUTAN LEBAT TIMUR / JALUR KE RUMAH PENYIHIR)
// -------------------------------------------------------------
class EastForestScene extends BaseScene {
    constructor() {
        super({ key: 'EastForestScene' });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor('#051f1a');
        this.createEastForestAtmosphere();

        this.currentLocationName = 'Hutan Belantara Timur (Jalur Kembali ke Rumah Madam Joanne)';
        this.registry.set('currentLocationName', this.currentLocationName);

        this.platforms = this.physics.add.staticGroup();
        const mainPlatform = this.platforms.create(400, 434, 'platform').setScale(2, 1).refreshBody();
        mainPlatform.setDepth(2);

        let startX = 60;
        if (data && data.from === 'WitchYardScene') {
            startX = 740;
        }
        this.player = this.physics.add.sprite(startX, 380, 'player_goblin').setDepth(5);
        this.physics.add.collider(this.player, this.platforms);

        // Signpost in center
        this.add.rectangle(400, 400, 12, 40, 0x78350f).setDepth(4);
        this.add.rectangle(400, 380, 150, 24, 0xd97706).setDepth(4);
        this.add.text(400, 380, '◄ Pemukiman | Witch Yard ►', { fontSize: '10px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0.5).setDepth(4);

        this.add.text(20, 350, '◀ Pemukiman Desa', { fontSize: '12px', fontStyle: 'bold', fill: '#86efac' }).setDepth(20);
        this.add.text(780, 350, 'Halaman Madam Joanne ➔', { fontSize: '12px', fontStyle: 'bold', fill: '#a855f7', align: 'right' }).setOrigin(1, 0.5).setDepth(20);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.createDialogueUI();
        this.createVisualInventoryUI();
        this.createQuestUI();
    }

    update() {
        this.handlePlayerMovementAndBoundaries({
            canExitLeft: true,
            onExitLeft: () => {
                this.showMapLockedNotice('Ketiga Bahan Magis sudah lengkap! Segera temui Madam Joanne di timur.');
                this.player.setX(35);
                this.player.setVelocityX(150);
            },
            canExitRight: true,
            onExitRight: () => {
                const inv = getInventory(this.registry);
                const hasHoney = inv.some(i => i.id === 'Bahan 1: Madu Murni');
                const hasSeed = inv.some(i => i.id === 'Bahan 2: Mythical Seed');
                const hasBread = inv.some(i => i.id === 'Bahan 3: Magic Bread');

                if (!hasHoney || !hasSeed || !hasBread) {
                    this.showMapLockedNotice('Kumpulkan ketiga Bahan Magis dulu sebelum kembali ke Madam Joanne!');
                    this.player.setX(740);
                    this.player.setVelocityX(-150);
                } else {
                    this.scene.start('WitchYardScene', { from: 'EastForestScene' });
                }
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    resolution: Math.max(2, window.devicePixelRatio || 2),
    render: {
        antialias: false,
        antialiasGL: false,
        roundPixels: true,
        pixelArt: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: [BootScene, TitleScene, HomeScene, LakeForestScene, ForestTrailScene, WitchYardScene, WitchCottageScene, GrandmaGardenScene, BeeGardenScene, WoodshopScene, FirewoodForestScene, BakeryMillScene, VillageResidentialScene, EastForestScene]
};

// Ensure Google Fonts (Fredoka & Pirata One) are fully loaded before rendering
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        new Phaser.Game(config);
    });
} else {
    new Phaser.Game(config);
}
