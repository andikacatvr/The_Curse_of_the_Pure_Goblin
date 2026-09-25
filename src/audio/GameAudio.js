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

    // --- BGM: NOSTALGIC TAIWANESE / HONG KONG NATURE SOUNDSCAPE ---
    // Menggabungkan petikan Guzheng/Pipa, suling bambu Dizi, desiran angin sejuk & kicau burung alami
    static playGuzheng(f, startTime, dur, vol = 0.24, bendTo = null) {
        if (!this.ctx || !this.bgmPlaying || !this.bgmEnabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const oscHarmonic = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Karakteristik petikan senar sutra / kawat Guzheng:
            // Gelombang triangle hangat + sine harmonik oktaf atas
            osc.type = 'triangle';
            oscHarmonic.type = 'sine';

            osc.frequency.setValueAtTime(f, startTime);
            oscHarmonic.frequency.setValueAtTime(f * 2, startTime);

            // Efek sliding note khas musik tradisional (hua-yin)
            if (bendTo) {
                osc.frequency.linearRampToValueAtTime(bendTo, startTime + dur * 0.5);
                oscHarmonic.frequency.linearRampToValueAtTime(bendTo * 2, startTime + dur * 0.5);
            }

            // Envelope petikan senar: attack cepat (pluck), lalu peluruhan lembut
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.008);
            gain.gain.exponentialRampToValueAtTime(vol * 0.45, startTime + 0.22);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

            osc.connect(gain);
            oscHarmonic.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(startTime);
            oscHarmonic.start(startTime);
            osc.stop(startTime + dur + 0.05);
            oscHarmonic.stop(startTime + dur + 0.05);
        } catch (e) {}
    }

    static playBambooFlute(f, startTime, dur, vol = 0.15) {
        if (!this.ctx || !this.bgmPlaying || !this.bgmEnabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, startTime);

            // Vibrato LFO lembut khas tiupan seruling bambu pegunungan
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.setValueAtTime(4.6, startTime);
            lfoGain.gain.setValueAtTime(3.2, startTime);
            lfo.connect(osc.frequency);

            // Breath swell attack & release
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.25);
            gain.gain.setValueAtTime(vol * 0.9, startTime + dur - 0.3);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            lfo.start(startTime);
            osc.start(startTime);
            lfo.stop(startTime + dur + 0.05);
            osc.stop(startTime + dur + 0.05);
        } catch (e) {}
    }

    static playNatureChirp(startTime) {
        if (!this.ctx || !this.bgmPlaying || !this.bgmEnabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';

            const baseF = 2600 + Math.random() * 600;
            osc.frequency.setValueAtTime(baseF, startTime);
            osc.frequency.exponentialRampToValueAtTime(baseF + 500, startTime + 0.05);
            osc.frequency.exponentialRampToValueAtTime(baseF - 250, startTime + 0.12);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(0.035, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start(startTime);
            osc.stop(startTime + 0.16);
        } catch (e) {}
    }

    static startBreezeAmbience() {
        if (!this.ctx || this.breezeNode) return;
        try {
            // Buffer pink noise 2 detik di-loop untuk hembusan angin sejuk hutan
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(420, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.022, this.ctx.currentTime);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            noise.start();
            this.breezeNode = noise;
        } catch (e) {}
    }

    static stopBreezeAmbience() {
        if (this.breezeNode) {
            try { this.breezeNode.stop(); } catch (e) {}
            this.breezeNode = null;
        }
    }

    static startAmbientBGM() {
        this.init();
        this.resume();
        if (!this.bgmEnabled || !this.ctx || this.bgmPlaying) return;
        try {
            this.bgmPlaying = true;
            this.updateGainValues();

            // Desiran angin sepoi-sepoi alam pegunungan
            this.startBreezeAmbience();

            // Tangga nada pentatonik G / D (Gong / Yu mode: D - E - G - A - B)
            const N = {
                D3: 146.83, G3: 196.00, A3: 220.00,
                D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00, B4: 493.88,
                D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
            };

            // Frasa melodi santai & syahdu khas drama/pedesaan Taiwan & Hong Kong
            const sequence = [
                // 1. Petikan Guzheng Pembuka
                { guzheng: [N.D3, N.D4], flute: null, dur: 2.2, chirp: true },
                { guzheng: [N.G4, N.A4], flute: null, dur: 2.0 },
                { guzheng: [N.B4], flute: null, dur: 1.8, bend: N.D5 },
                { guzheng: [N.D5, N.B4], flute: N.D5, dur: 2.4 },

                // 2. Suling Bambu (Dizi) Masuk Mengalir Lembut
                { guzheng: [N.G3, N.A4], flute: N.B4, dur: 2.2 },
                { guzheng: [N.G4, N.E4], flute: N.A4, dur: 2.0, chirp: true },
                { guzheng: [N.G4], flute: N.G4, dur: 2.6, bend: N.A4 },
                { guzheng: [N.D4], flute: null, dur: 2.0 },

                // 3. Puncak Suasana Alam yang Tenang
                { guzheng: [N.G3, N.D4], flute: N.G4, dur: 2.2 },
                { guzheng: [N.B4], flute: N.B4, dur: 1.8 },
                { guzheng: [N.D5, N.E5], flute: N.D5, dur: 2.4, chirp: true },
                { guzheng: [N.G5], flute: N.E5, dur: 2.2, bend: N.D5 },

                // 4. Arpeggio Penutup & Harmoni Hangat
                { guzheng: [N.D5, N.B4], flute: N.D5, dur: 2.2 },
                { guzheng: [N.A4, N.G4], flute: N.B4, dur: 2.0 },
                { guzheng: [N.E4, N.G4], flute: N.G4, dur: 2.8 },
                { guzheng: [N.D3, N.G3, N.D4], flute: null, dur: 3.2, chirp: true }
            ];

            let seqIdx = 0;

            const playNextSequence = () => {
                if (!this.bgmPlaying || !this.bgmEnabled || !this.ctx) return;
                const step = sequence[seqIdx % sequence.length];
                seqIdx++;

                const now = this.ctx.currentTime;

                // Mainkan Petikan Guzheng / Pipa
                if (step.guzheng && step.guzheng.length > 0) {
                    step.guzheng.forEach((f, i) => {
                        const noteTime = now + i * 0.08;
                        this.playGuzheng(f, noteTime, step.dur, 0.22, (i === step.guzheng.length - 1 ? step.bend : null));
                    });
                }

                // Mainkan Suling Bambu (Dizi)
                if (step.flute) {
                    this.playBambooFlute(step.flute, now + 0.1, step.dur * 0.9, 0.14);
                }

                // Kicau burung alami sesekali
                if (step.chirp && Math.random() > 0.35) {
                    this.playNatureChirp(now + Math.random() * 0.8 + 0.4);
                }

                this.bgmTimer = setTimeout(playNextSequence, (step.dur - 0.2) * 1000);
            };

            playNextSequence();
        } catch (e) {}
    }

    static stopAmbientBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        this.stopBreezeAmbience();
    }
}
