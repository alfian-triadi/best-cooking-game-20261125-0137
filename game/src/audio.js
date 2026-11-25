// Tiny synthesized sound effects through WebAudio: no audio files, nothing
// to load. Each effect is a short oscillator blip; the game stays silent
// until the first user gesture creates the context.
let context = null;

function ensureContext() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

function blip(frequency, duration, type, volume) {
  const audio = ensureContext();
  if (!audio) return;
  try {
    if (audio.state === 'suspended') void audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

export const SOUND_PICKUP = 'pickup';
export const SOUND_CHOP = 'chop';
export const SOUND_READY = 'ready';
export const SOUND_SERVE = 'serve';
export const SOUND_ERROR = 'error';
export const SOUND_EXPIRE = 'expire';

export function playSound(name) {
  if (name === SOUND_PICKUP) blip(520, 0.08, 'sine', 0.12);
  else if (name === SOUND_CHOP) blip(220, 0.05, 'square', 0.08);
  else if (name === SOUND_READY) { blip(660, 0.09, 'sine', 0.12); setTimeout(() => blip(880, 0.12, 'sine', 0.12), 90); }
  else if (name === SOUND_SERVE) { blip(523, 0.09, 'triangle', 0.14); setTimeout(() => blip(784, 0.14, 'triangle', 0.14), 100); }
  else if (name === SOUND_ERROR) blip(160, 0.16, 'sawtooth', 0.08);
  else if (name === SOUND_EXPIRE) { blip(330, 0.12, 'sawtooth', 0.1); setTimeout(() => blip(220, 0.2, 'sawtooth', 0.1), 120); }
}
