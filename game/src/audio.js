// Synthesised sound for Lantern Tide: WebAudio only, no audio files.
// Everything is safe to call before the first user gesture; sound starts
// once unlock() runs from a gesture. M toggles mute.
export function createAudio() {
  let context = null;
  let master = null;
  let humOsc = null;
  let humGain = null;
  let wavesGain = null;
  let muted = false;
  let motifTimer = 0;
  let lastWarn = 0;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(context.destination);
      startWaves();
      startHum();
      return true;
    } catch {
      return false;
    }
  }

  function noiseBuffer(seconds) {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  function startWaves() {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(4);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    wavesGain = context.createGain();
    wavesGain.gain.value = 0.05;
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(wavesGain.gain);
    source.connect(filter);
    filter.connect(wavesGain);
    wavesGain.connect(master);
    source.start();
    lfo.start();
  }

  function startHum() {
    humOsc = context.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.value = 55;
    const second = context.createOscillator();
    second.type = 'sine';
    second.frequency.value = 110.5;
    humGain = context.createGain();
    humGain.gain.value = 0;
    const secondGain = context.createGain();
    secondGain.gain.value = 0.4;
    humOsc.connect(humGain);
    second.connect(secondGain);
    secondGain.connect(humGain);
    humGain.connect(master);
    humOsc.start();
    second.start();
  }

  function blip(frequencyStart, frequencyEnd, duration, volume, type) {
    if (!ensure()) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(frequencyStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, frequencyEnd), now + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function thudNoise() {
    if (!ensure()) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(0.4);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.3);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + 0.4);
  }

  return {
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume();
    },
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    // Beam hum follows the beam: 1 while shining, 0 while dark.
    setBeam(level) {
      if (!context || !humGain) return;
      humGain.gain.setTargetAtTime(level * 0.05, context.currentTime, 0.15);
    },
    pulse() {
      blip(880, 440, 0.35, 0.22, 'sine');
    },
    bell() {
      if (!ensure()) return;
      const now = context.currentTime;
      [1244, 1866].forEach((frequency, index) => {
        const osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        const gain = context.createGain();
        gain.gain.setValueAtTime(index === 0 ? 0.16 : 0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    },
    wreck() {
      thudNoise();
      blip(120, 38, 0.4, 0.4, 'sine');
    },
    // Wraith warning: a soft two-note alert, at most once every 2.5 s, so a
    // clinging wraith is heard as well as seen.
    warn() {
      const now = Date.now();
      if (now - lastWarn < 2500) return;
      lastWarn = now;
      blip(660, 520, 0.16, 0.1, 'triangle');
      window.setTimeout(() => blip(520, 420, 0.16, 0.08, 'triangle'), 180);
    },
    // A short title motif: four notes, one every 0.45 s.
    motif() {
      if (!ensure()) return;
      const notes = [329.63, 392, 493.88, 587.33];
      notes.forEach((frequency, index) => {
        window.setTimeout(() => blip(frequency, frequency, 0.5, 0.12, 'triangle'), index * 450);
      });
    },
    // Called every frame on the title screen; replays the motif rarely.
    tickTitle(dt) {
      motifTimer += dt;
      if (motifTimer > 14) {
        motifTimer = 0;
        this.motif();
      }
    },
  };
}
