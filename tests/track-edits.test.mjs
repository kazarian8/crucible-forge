import test from 'node:test';
import assert from 'node:assert/strict';
import { processTrackAudio } from '../lib/audio/track-edits.ts';

// Minimal PCM container: tests run the production DSP without browser playback.
globalThis.AudioBuffer = class {
  constructor({ length, numberOfChannels, sampleRate }) {
    this.length = length; this.numberOfChannels = numberOfChannels; this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  getChannelData(c) { return this.channels[c]; }
};
function tone(seconds = 1, channels = 2, rate = 44100) {
  const buffer = new AudioBuffer({ length: Math.round(seconds * rate), numberOfChannels: channels, sampleRate: rate });
  for (let c = 0; c < channels; c++) for (let i = 0; i < buffer.length; i++) buffer.channels[c][i] = (c ? -1 : 1) * .4 * Math.sin(2 * Math.PI * 440 * i / rate);
  return buffer;
}
function frequency(buffer) {
  const channel = buffer.channels[0]; let crossings = 0;
  const start = Math.round(buffer.length * .2), end = Math.round(buffer.length * .8);
  for (let i = start; i < end; i++) if (channel[i] <= 0 && channel[i + 1] > 0) crossings++;
  return crossings * buffer.sampleRate / (end - start);
}
function assertStereo(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    assert.ok(Number.isFinite(buffer.channels[0][i]));
    assert.ok(Math.abs(buffer.channels[0][i] + buffer.channels[1][i]) < 1e-5, 'stereo phase stays linked');
  }
}
test('reverse respects trim boundaries, preserves source, and reverses twice exactly', async () => {
  const source = tone(); const before = source.channels[0].slice();
  const reverse = await processTrackAudio(source, .1, .8, 'reverse', 0);
  assert.equal(reverse.length, 30870);
  assert.equal(reverse.channels[0][0], before[35279]);
  const restored = await processTrackAudio(reverse, 0, reverse.duration, 'reverse', 0);
  assert.deepEqual(restored.channels[0], before.slice(4410, 35280));
  assert.deepEqual(source.channels[0], before); assertStereo(reverse);
});
for (const percent of [50, 150, 200]) test(`stretch ${percent}% changes duration without changing pitch`, async () => {
  const source = tone(); const out = await processTrackAudio(source, 0, 1, 'stretch', percent);
  assert.equal(out.length, Math.round(source.length * percent / 100));
  assert.ok(Math.abs(frequency(out) - 440) < 8, `frequency ${frequency(out)}`); assertStereo(out);
});
for (const semitones of [-12, 7, 12]) test(`transpose ${semitones} preserves duration and changes frequency`, async () => {
  const source = tone(); const out = await processTrackAudio(source, 0, 1, 'transpose', semitones);
  assert.equal(out.length, source.length);
  assert.ok(Math.abs(frequency(out) - 440 * 2 ** (semitones / 12)) < 8, `frequency ${frequency(out)}`); assertStereo(out);
});
test('zero-strength denoise is transparent, including clip boundaries', async () => {
  const source = tone(.2); const out = await processTrackAudio(source, 0, source.duration, 'denoise', 0);
  for (let i = 0; i < out.length; i++) assert.ok(Math.abs(out.channels[0][i] - source.channels[0][i]) < 1e-6);
  assertStereo(out);
});
test('denoise reduces steady noise and preserves duration', async () => {
  const source = tone(); let seed = 19;
  for (let i = 0; i < source.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; source.channels[0][i] = seed / 2147483648 * .02; source.channels[1][i] = -source.channels[0][i]; }
  const out = await processTrackAudio(source, 0, 1, 'denoise', 70);
  const energy = (data) => data.reduce((sum, sample) => sum + sample * sample, 0);
  assert.ok(energy(out.channels[0]) < energy(source.channels[0]) * .8);
  assert.equal(out.length, source.length); assertStereo(out);
});
test('silence, short clips, mono at 48 kHz, invalid values, and cancellation', async () => {
  for (const action of ['stretch', 'transpose', 'reverse', 'denoise']) {
    const source = tone(.01, 1, 48000); source.channels[0].fill(0);
    const out = await processTrackAudio(source, 0, source.duration, action, action === 'stretch' ? 125 : 2);
    assert.equal(out.numberOfChannels, 1); assert.ok(out.channels[0].every((sample) => sample === 0));
  }
  const source = tone();
  await assert.rejects(processTrackAudio(source, 0, 1, 'stretch', 0));
  await assert.rejects(processTrackAudio(source, 0, 1, 'transpose', NaN));
  await assert.rejects(processTrackAudio(source, .5, .5, 'reverse', 0));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(processTrackAudio(source, 0, 1, 'reverse', 0, controller.signal), { name: 'AbortError' });
});
