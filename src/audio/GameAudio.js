export class GameAudio {
    static bgmVolume = 0.8;
    static sfxVolume = 0.8;
    static bgmEnabled = true;
    static sfxEnabled = true;

    static init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.bgmGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.bgmGain.connect(this.ctx.destination);
            this.sfxGain.connect(this.ctx.destination);
            this.updateGainValues();

            // Global user gesture unlocker for browsers
            const unlock = () => {
                this.resume();
                if (this.bgmEnabled && !this.bgmPlaying) {
                    this.startAmbientBGM();
                }
            };
            window.addEventListener('pointerdown', unlock, { once: false });
            window.addEventListener('keydown', unlock, { once: false });
        } catch (e) {
            console.warn('Web Audio not supported', e);
        }
    }

    static resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    static setBGMVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, Math.round(val * 10) / 10));
        this.updateGainValues();
    }

    static setSFXVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, Math.round(val * 10) / 10));
        this.updateGainValues();
    }

    static updateGainValues() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (this.bgmGain) {
            const targetBGM = this.bgmEnabled ? this.bgmVolume * 0.45 : 0;
            this.bgmGain.gain.setValueAtTime(targetBGM, now);
        }
        if (this.sfxGain) {
            const targetSFX = this.sfxEnabled ? this.sfxVolume * 0.5 : 0;
            this.sfxGain.gain.setValueAtTime(targetSFX, now);
        }
    }

    // --- SFX: CHILL LOMPAT (JUMP) ---
    static playJump() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    // --- SFX: CHILL MENDARAT (LAND) ---
    static playLand() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {}
    }

    // --- SFX: CHILL AMBIL ITEM / BAHAN SIHIR (COLLECT / ITEM GET) ---
    static playCollect() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            // Sparkling crystalline arpeggio: E5, G#5, B5, E6
            const notes = [659.25, 830.61, 987.77, 1318.51];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.07;
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(0.38, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(startTime);
                osc.stop(startTime + 0.46);
            });
        } catch (e) {}
    }

    // --- SFX: DIALOG BLIP / TYPEWRITER (CHILL KALIMBA TAP) ---
    static playDialogue() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            const freq = 420 + Math.random() * 80;
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.045);
        } catch (e) {}
    }

    // --- SFX: TRANSISI PINTU / AREA (WHOOSH MAGIS CHILL) ---
    static playTransition() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [329.63, 440.00, 554.37, 659.25].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.05;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(0.28, startTime + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(startTime);
                osc.stop(startTime + 0.36);
            });
        } catch (e) {}
    }

    // --- SFX: QUEST SELESAI / AKHIR TUGAS (TRIUMPHANT CHILL CHORD) ---
    static playQuestComplete() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const chord = [261.63, 329.63, 392.00, 493.88, 587.33];
            chord.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.05;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(0.35, startTime + 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(startTime);
                osc.stop(startTime + 0.82);
            });
        } catch (e) {}
    }

    // --- SFX: TOMBOL HOVER ---
    static playHover() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.04);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.045);
        } catch (e) {}
    }

    // --- SFX: KLIK TOMBOL (WATER DROP) ---
    static playClick() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [523.25, 783.99].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.03;
                osc.frequency.setValueAtTime(freq, startTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.8, startTime + 0.1);
                gain.gain.setValueAtTime(0.24, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(startTime);
                osc.stop(startTime + 0.11);
            });
        } catch (e) {}
    }

    // --- SFX: START GAME ---
    static playStart() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [392.00, 523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const t = now + idx * 0.08;
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.001, t);
                gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.36);
            });
        } catch (e) {}
    }

    // --- SFX: TERKENA HAZARD (GENTLE CARTOON WOBBLE) ---
    static playHurt() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(140, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    // --- SFX: RESPAWN (GENTLE RECOVERY SWELL) ---
    static playRespawn() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const t = now + idx * 0.06;
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.001, t);
                gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.32);
            });
        } catch (e) {}
    }

    // --- BGM: SIMPLE CHILL MINIMALIST BACKSOUND ---
    static startAmbientBGM() {
        this.init();
        this.resume();
        if (!this.bgmEnabled || !this.ctx || this.bgmPlaying) return;
        try {
            // Melodi sederhana, tenang & minimalis (nada lembut ala music box / piano santai)
            const melody = [
                { f: 261.63, dur: 2.2 }, // C4
                { f: 329.63, dur: 2.2 }, // E4
                { f: 392.00, dur: 2.5 }, // G4
                { f: 329.63, dur: 2.0 }, // E4
                { f: 349.23, dur: 2.2 }, // F4
                { f: 392.00, dur: 2.2 }, // G4
                { f: 440.00, dur: 2.5 }, // A4
                { f: 392.00, dur: 3.0 }  // G4
            ];

            let noteIdx = 0;
            this.bgmPlaying = true;
            this.updateGainValues();

            const playNextNote = () => {
                if (!this.bgmPlaying || !this.bgmEnabled || !this.ctx) return;
                const item = melody[noteIdx % melody.length];
                noteIdx++;

                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(item.f, now);

                // Nada bersih dan terdengar jelas, volume diatur oleh master bgmGain
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + item.dur);

                osc.connect(gain);
                gain.connect(this.bgmGain);
                osc.start(now);
                osc.stop(now + item.dur + 0.05);

                this.bgmTimer = setTimeout(playNextNote, (item.dur - 0.4) * 1000);
            };

            playNextNote();
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
