// Bell chime audio notification utility for hotel reservation events
let lastHotelSoundPlayed = 0;

export function playHotelReservationChime(minIntervalMs = 4000) {
  const now = Date.now();
  if (now - lastHotelSoundPlayed < minIntervalMs) {
    return;
  }
  lastHotelSoundPlayed = now;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);

    // Envelope: Instant attack, long mellow bell decay
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.8);

    // Two pleasant tones in chord (A4 and C#5 / E5)
    const chords = [523.25, 659.25, 783.99]; // C Major arpeggiated chime
    chords.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.connect(gainNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
      osc.start(audioCtx.currentTime + idx * 0.12);
      osc.stop(audioCtx.currentTime + 2.8);
    });
  } catch (err) {
    // Ignore audio context errors if blocked by browser policy
  }
}
