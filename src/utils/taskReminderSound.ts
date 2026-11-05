// Synthesizes a classic, high-clarity Outlook 2007 Task Reminder Chime using Web Audio API

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playOutlookTaskReminderSound(urgent: boolean = false): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Classic Outlook 2007 crystalline chord progression (E5 -> G#5 -> B5 -> E6)
    const notes = urgent
      ? [
          { freq: 659.25, start: 0, duration: 0.22, gain: 0.22 },
          { freq: 830.61, start: 0.14, duration: 0.22, gain: 0.24 },
          { freq: 987.77, start: 0.28, duration: 0.28, gain: 0.26 },
          { freq: 1318.51, start: 0.44, duration: 0.55, gain: 0.30 },
          // Second urgent pulse
          { freq: 987.77, start: 0.85, duration: 0.20, gain: 0.24 },
          { freq: 1318.51, start: 1.02, duration: 0.65, gain: 0.32 }
        ]
      : [
          { freq: 587.33, start: 0, duration: 0.25, gain: 0.18 }, // D5
          { freq: 739.99, start: 0.15, duration: 0.28, gain: 0.20 }, // F#5
          { freq: 880.0, start: 0.3, duration: 0.32, gain: 0.22 }, // A5
          { freq: 1174.66, start: 0.46, duration: 0.65, gain: 0.26 } // D6
        ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      harmonic.type = "triangle";
      harmonic.frequency.setValueAtTime(n.freq * 2, now + n.start);

      gainNode.gain.setValueAtTime(0.0001, now + n.start);
      gainNode.gain.exponentialRampToValueAtTime(n.gain, now + n.start + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);

      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(n.gain * 0.25, now + n.start);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration * 0.7);

      osc.connect(gainNode);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + n.start);
      harmonic.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.05);
      harmonic.stop(now + n.start + n.duration + 0.05);
    }
  } catch (err) {
    console.warn("Audio reminder playback notice:", err);
  }
}
