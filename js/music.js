/* =========================================================
   Background music
   ---------------------------------------------------------
   1. If you place a royalty-free track at  assets/music.mp3  it is played in a loop.
   2. If that file is missing, a built-in instrumental (tanpura drone + bamboo-flute
      melody in raga Bhoopali, generated live with the Web Audio API) plays instead,
      so the invitation always has music and needs no copyrighted audio.
   Browsers block autoplay, so music starts on the "Tap to Open" tap; if it is still
   blocked it starts on the visitor's first interaction.
   ========================================================= */

class IndianSynth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.running = false;
    this.muted = false;
    this.timer = null;
    this.sa = 146.83;           // D3 – comfortable tonic
    this.beat = 0.62;           // seconds per beat
    this.nextDrone = 0;
    this.nextMel = 0;
    this.melIdx = 0;
    this.droneIdx = 0;
    this.nextBell = 0;
  }

  /* Must be called synchronously inside a user gesture (iOS requirement). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      const comp = this.ctx.createDynamicsCompressor();
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this._impulse(2.8, 2.4);
      const wet = this.ctx.createGain(); wet.gain.value = 0.38;
      this.bus = this.ctx.createGain();
      this.bus.connect(this.master);
      this.bus.connect(this.reverb); this.reverb.connect(wet); wet.connect(this.master);
      this.master.connect(comp); comp.connect(this.ctx.destination);

      // tanpura-like buzzing waveform (rich odd + even harmonics)
      const n = 28, real = new Float32Array(n), imag = new Float32Array(n);
      for (let k = 1; k < n; k++) imag[k] = 1 / Math.pow(k, 1.25) * (k % 5 === 0 ? 1.6 : 1);
      this.buzz = this.ctx.createPeriodicWave(real, imag);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    // silent buffer – fully unlocks audio on older iOS
    try {
      const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource();
      s.buffer = b; s.connect(this.ctx.destination); s.start(0);
    } catch (e) {}
    return true;
  }

  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate, len = rate * seconds;
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  start() {
    if (!this.unlock() || this.running) { if (this.running) this.setMuted(false); return; }
    this.running = true;
    const t = this.ctx.currentTime + 0.1;
    this.nextDrone = t; this.nextMel = t + 3.2; this.nextBell = t + 6;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.7, t + 3);
    this._tick();
    this.timer = setInterval(() => this._tick(), 400);
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(m ? 0 : 0.7, t + 0.6);
    if (!m && this.ctx.state === 'suspended') this.ctx.resume();
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume()  { if (this.ctx && !this.muted && this.ctx.state === 'suspended') this.ctx.resume(); }

  _tick() {
    const horizon = this.ctx.currentTime + 2.2;
    // tanpura cycle: Pa(low) – Sa – Sa – Sa(low)
    const cycle = [0.75, 1, 1, 0.5];
    while (this.nextDrone < horizon) {
      this._pluck(this.sa * cycle[this.droneIdx % 4], this.nextDrone);
      this.droneIdx++;
      this.nextDrone += 1.3;
    }
    // flute melody (Bhoopali: S R G P D, just intonation)
    while (this.nextMel < horizon) {
      const ph = IndianSynth.PHRASES[this.melIdx % IndianSynth.PHRASES.length];
      let t = this.nextMel;
      ph.forEach(([r, b]) => {
        const d = b * this.beat;
        if (r) this._flute(this.sa * 2 * r, t, d);
        t += d;
      });
      this.melIdx++;
      this.nextMel = t + this.beat * 3;      // breath between phrases
    }
    // soft temple-bell shimmer
    while (this.nextBell < horizon) {
      this._bell(this.sa * 4, this.nextBell);
      this.nextBell += 9.5;
    }
  }

  _pluck(freq, t) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    o.setPeriodicWave(this.buzz); o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + 3.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.8);
    o.connect(f); f.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + 5);
  }

  _flute(freq, t, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.setValueAtTime(freq * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);   // gentle meend
    o2.frequency.value = freq * 2;
    lfo.frequency.value = 5.2; lg.gain.value = freq * 0.006;    // vibrato
    lfo.connect(lg); lg.connect(o.frequency);
    const g2 = ctx.createGain(); g2.gain.value = 0.12;
    const peak = 0.17;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + Math.min(0.12, dur * 0.4));
    g.gain.setValueAtTime(peak * 0.9, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.bus);
    o.start(t); o2.start(t); lfo.start(t);
    const end = t + dur + 0.3;
    o.stop(end); o2.stop(end); lfo.stop(end);
  }

  _bell(freq, t) {
    [1, 2.01, 3.98].forEach((m, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * m;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05 / (i + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 4.2);
    });
  }
}

/* Bhoopali ratios relative to Sa: S=1  R=9/8  G=5/4  P=3/2  D=5/3  S'=2 ; lower D = 5/6, lower P = 3/4 */
(function () {
  const S = 1, R = 9 / 8, G = 5 / 4, P = 1.5, D = 5 / 3, S2 = 2, d = 5 / 6, p = 0.75, R2 = 2.25, G2 = 2.5;
  IndianSynth.PHRASES = [
    [[G, 2], [R, 1], [S, 1], [R, 1], [G, 1], [P, 2], [G, 1], [R, 1], [G, 3]],
    [[P, 2], [D, 1], [P, 1], [G, 1], [P, 1], [G, 1], [R, 1], [S, 2], [d, 1], [S, 1], [R, 3]],
    [[G, 1], [P, 1], [D, 2], [S2, 2], [D, 1], [P, 1], [G, 2], [P, 1], [G, 1], [R, 1], [S, 3]],
    [[D, 1], [S2, 1], [R2, 2], [S2, 1], [D, 1], [P, 2], [G, 1], [P, 1], [D, 1], [P, 1], [G, 1], [R, 1], [S, 4]],
    [[S, 1], [R, 1], [G, 1], [P, 1], [G, 1], [R, 1], [S, 1], [d, 1], [p, 1], [d, 1], [S, 2], [R, 1], [G, 1], [R, 4]],
    [[G2, 2], [R2, 1], [S2, 1], [D, 2], [P, 1], [G, 1], [P, 1], [D, 1], [S2, 2], [D, 1], [P, 1], [G, 3]],
  ];
})();

/* ---------------- Music controller ---------------- */
const Music = (function () {
  const synth = new IndianSynth();
  const el = new Audio();
  el.loop = true; el.preload = 'auto'; el.volume = 0.65; el.setAttribute('playsinline', '');
  let fileOK = null;           // null = unknown, true/false after load attempt
  el.addEventListener('canplay', () => { fileOK = true; });
  el.addEventListener('error',   () => { fileOK = false; });
  el.src = 'assets/music.mp3';

  let mode = null, started = false, muted = false, armed = false;
  const listeners = [];
  const emit = () => listeners.forEach(fn => fn(muted));

  function armFirstInteraction() {
    if (armed) return; armed = true;
    const kick = () => {
      ['pointerdown', 'touchend', 'click', 'keydown'].forEach(e => document.removeEventListener(e, kick, true));
      armed = false;
      if (!started && !muted) start();
    };
    ['pointerdown', 'touchend', 'click', 'keydown'].forEach(e => document.addEventListener(e, kick, true));
  }

  function useSynth() {
    synth.unlock(); synth.start(); mode = 'synth'; started = true;
  }

  function start() {
    if (muted) return;
    synth.unlock();                      // unlock WebAudio synchronously inside the gesture
    if (fileOK === false) { useSynth(); return; }
    const p = el.play();
    if (p && p.then) {
      p.then(() => { mode = 'file'; started = true; })
       .catch(err => {
         if (err && err.name === 'NotAllowedError') armFirstInteraction();   // autoplay blocked
         else useSynth();                                                    // no mp3 found
       });
    } else { mode = 'file'; started = true; }
  }

  function setMuted(m) {
    muted = m;
    if (m) { el.pause(); synth.setMuted(true); }
    else if (!started) { start(); }
    else if (mode === 'file') { el.play().catch(() => {}); }
    else { synth.setMuted(false); }
    emit();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { el.pause(); synth.suspend(); }
    else if (started && !muted) { if (mode === 'file') el.play().catch(() => {}); else synth.resume(); }
  });

  return {
    start,
    toggle: () => setMuted(!muted),
    isMuted: () => muted,
    onChange: fn => listeners.push(fn),
  };
})();
