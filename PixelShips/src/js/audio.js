const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const buffers = {};
let currentBGMKey = null;
let currentBGMSource = null;

const AUDIO_PATHS = {
  menuBGM: "assets/audio/menu.mp3",
  battleBGM: "assets/audio/battle.mp3",
  cannon: "assets/audio/cannon.mp3",
  torpedo: "assets/audio/torpedo.mp3",
  explosion: "assets/audio/explosion.mp3",
  plane_launch: "assets/audio/plane_launch.mp3",
  bomb_drop: "assets/audio/bomb_drop.mp3",
  overdrive: "assets/audio/overdrive.mp3",
  barrage: "assets/audio/barrage.mp3",
  wave_clear: "assets/audio/wave_clear.mp3",
  button_click: "assets/audio/button.mp3",
};

export async function initAudio() {
  const loadPromises = Object.entries(AUDIO_PATHS).map(async ([key, path]) => {
    try {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      buffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error(`Failed to load audio: ${path}`, err);
    }
  });

  await Promise.all(loadPromises);
}

export function resumeAudioContext() {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function playSFX(key, volume = 0.8) {
  if (!buffers[key]) return;

  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();

  source.buffer = buffers[key];
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
}

export function playBGM(key, volume = 0.4) {
  if (!buffers[key]) return;
  if (currentBGMKey === key) return;

  stopBGM();

  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();

  source.buffer = buffers[key];
  source.loop = true;
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);

  currentBGMKey = key;
  currentBGMSource = source;
}

export function stopBGM() {
  if (currentBGMSource) {
    currentBGMSource.stop();
    currentBGMSource.disconnect();
    currentBGMSource = null;
    currentBGMKey = null;
  }
}
