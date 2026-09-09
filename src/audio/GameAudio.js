export class GameAudio {
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

    static playHurt() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);
            gain.gain.setValueAtTime(0.25 * this.sfxGain.gain.value, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.17);
        } catch (e) {}
    }

    static playRespawn() {
        this.init();
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const t = now + idx * 0.08;
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.18 * this.sfxGain.gain.value, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.28);
            });
        } catch (e) {}
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
