import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMasterQuality } from '../lib/audio/master-quality.ts';
import { isStarAdmin } from '../lib/star/admin.ts';
import { analyzeAudioFile } from '../lib/audio/file-dna.ts';

const original = { duration: 60, channels: 2, sampleRate: 48000, score: 90, peakDb: -3, rmsDb: -18, clippingCount: 0, status: 'verified' };
test('higher volume alone is not an improvement', () => {
  assert.equal(compareMasterQuality(original, { ...original, peakDb: -1, rmsDb: -16 }).outcome, 'no_measured_improvement');
});
test('a better score cannot conceal new clipping or lost dynamics', () => {
  for (const change of [{ clippingCount: 1 }, { rmsDb: -10 }, { duration: 50 }, { channels: 1 }, { status: 'failed' }]) {
    assert.equal(compareMasterQuality(original, { ...original, score: 95, ...change }).reviewRequired, true);
  }
});
test('clean technical improvement is distinct from unchanged or invalid results', () => {
  assert.equal(compareMasterQuality(original, { ...original, score: 95 }).outcome, 'technical_improvement');
  assert.equal(compareMasterQuality(original, original).reviewRequired, true);
  assert.equal(compareMasterQuality(original, { ...original, score: NaN }).reviewRequired, true);
});
test('admin check rejects missing users and user-editable metadata', () => {
  const previous = process.env.CRUCIBLE_STAR_ADMIN_IDS;
  try {
    process.env.CRUCIBLE_STAR_ADMIN_IDS = 'allowed-user';
    assert.equal(isStarAdmin(null), false);
    assert.equal(isStarAdmin({ id: 'other', app_metadata: {}, user_metadata: { role: 'admin' } }), false);
    assert.equal(isStarAdmin({ id: 'allowed-user', app_metadata: {} }), true);
    assert.equal(isStarAdmin({ id: 'other', app_metadata: { role: 'admin' } }), true);
  } finally {
    if (previous === undefined) delete process.env.CRUCIBLE_STAR_ADMIN_IDS;
    else process.env.CRUCIBLE_STAR_ADMIN_IDS = previous;
  }
});
test('whole-file scan catches a one-sample peak beyond the old stride and never gives 100', async () => {
  const samples = new Float32Array(2000002).fill(0.2);
  samples[1999999] = 1;
  const previous = globalThis.window;
  globalThis.window = { AudioContext: class {
    async decodeAudioData() { return { length: samples.length, duration: samples.length / 48000, sampleRate: 48000, numberOfChannels: 1, getChannelData: () => samples }; }
    async close() {}
  } };
  try {
    const clipped = await analyzeAudioFile(new Blob(['fixture']));
    assert.equal(clipped.analysis.clippingCount, 1);
    samples[1999999] = 0.2;
    const clean = await analyzeAudioFile(new Blob(['fixture']));
    assert.ok(clean.analysis.score < 100);
  } finally { globalThis.window = previous; }
});
