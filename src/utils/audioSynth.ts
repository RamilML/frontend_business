class AudioSynth {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Высокий короткий бип успеха (880 Гц -> 1200 Гц)
   */
  public playSuccessBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio not supported or blocked
    }
  }

  /**
   * Низкий гудок ошибки (220 Гц -> 150 Гц)
   */
  public playErrorBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not supported
    }

    this.triggerHapticError();
  }

  /**
   * Вибрация ТСД / Смартфона при ошибке
   */
  public triggerHapticError(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
  }

  public triggerHapticSuccess(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  }
}

export const audioSynth = new AudioSynth();
