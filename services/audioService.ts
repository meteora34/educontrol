
export const AudioService = {
  ctx: null as AudioContext | null,
  volume: parseFloat(localStorage.getItem('edu_volume') || '0.5'),

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  },

  setVolume(v: number) {
    this.volume = v;
    localStorage.setItem('edu_volume', v.toString());
  },

  play(type: 'click' | 'success' | 'pop' | 'warning') {
    this.init();
    if (!this.ctx || this.volume === 0) return;

    const now = this.ctx.currentTime;
    const globalGain = this.ctx.createGain();
    globalGain.gain.setValueAtTime(this.volume, now);
    globalGain.connect(this.ctx.destination);

    const playTone = (freq: number, startTime: number, duration: number, oscType: OscillatorType = 'sine', gainVal: number = 0.1) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      gain.connect(globalGain);
      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    switch (type) {
      case 'click':
        playTone(400, now, 0.1, 'sine', 0.1);
        break;
      case 'success':
        playTone(523.25, now, 0.3, 'triangle', 0.1);
        playTone(659.25, now + 0.05, 0.3, 'triangle', 0.1);
        playTone(783.99, now + 0.1, 0.3, 'triangle', 0.1);
        break;
      case 'pop':
        playTone(600, now, 0.1, 'sine', 0.1);
        break;
      case 'warning':
        playTone(150, now, 0.2, 'sawtooth', 0.1);
        break;
    }
  }
};
