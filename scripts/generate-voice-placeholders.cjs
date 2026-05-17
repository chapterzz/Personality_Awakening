/**
 * 生成 16 型语音彩蛋占位音频（T4.3 MVP）。
 * 输出 16-bit PCM WAV（写入 .mp3 路径；浏览器按内容嗅探解码），约 0.7s 880Hz 提示音，便于验收「能听到」。
 * 用法：node scripts/generate-voice-placeholders.cjs
 */
const fs = require('fs');
const path = require('path');

const TYPES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];

/** @param {number} durationSec @param {number} freqHz @param {number} sampleRate */
function createBeepWavBuffer(durationSec = 0.7, freqHz = 880, sampleRate = 44100) {
  const numSamples = Math.floor(durationSec * sampleRate);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, i / (sampleRate * 0.02));
    const release = Math.min(1, (numSamples - i) / (sampleRate * 0.12));
    const envelope = attack * release;
    const sample = Math.sin(2 * Math.PI * freqHz * t) * envelope * 0.45;
    const int16 = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

const outDir = path.join(__dirname, '..', 'apps', 'web', 'public', 'audio', 'voice');
const beep = createBeepWavBuffer();
fs.mkdirSync(outDir, { recursive: true });

for (const type of TYPES) {
  fs.writeFileSync(path.join(outDir, `${type}.mp3`), beep);
}

console.log(
  `Wrote ${TYPES.length} placeholder beep files (~0.7s WAV payload at *.mp3 paths, peak ~0.45)`,
);
