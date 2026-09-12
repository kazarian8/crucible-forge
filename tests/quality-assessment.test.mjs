import test from 'node:test';
import assert from 'node:assert/strict';
import { assessAudioQuality, compareAudioQuality } from '../lib/audio/quality-assessment.ts';
function pcm(length = 32000, amplitude = .2, stereo = false) {
  const channels = Array.from({ length: stereo ? 2 : 1 }, () => Float32Array.from({ length }, (_, i) => amplitude * Math.sin(2 * Math.PI * 440 * i / 16000)));
  return { length, sampleRate: 16000, numberOfChannels: channels.length, getChannelData: (c) => channels[c] };
}
test('clean signal never receives an invented quality percentage', async () => {
 const q = await assessAudioQuality(pcm());
 assert.equal(q.score, null); assert.equal(q.calibration, 'not-calibrated');
 assert.ok(Math.abs(q.crestDb - 3.0103) < .01);
 assert.equal(q.stereoCorrelation, null);
 assert.deepEqual(JSON.parse(JSON.stringify(q)), q);
});
test('full scan catches a single late clipped sample that a stride could skip', async () => {
 const input = pcm(2000001); input.getChannelData(0)[1999999] = 1;
 const q = await assessAudioQuality(input);
 assert.equal(q.clippingSamples, 1); assert.equal(q.findings.find(f => f.check === 'clipping').timeSeconds, 1999999 / 16000);
});
test('brief phase cancellation is flagged even when the overall correlation is positive', async () => {
 const input = pcm(160000, .2, true);
 for(let i = 80000; i < 83200; i++) input.getChannelData(1)[i] *= -1;
 const q = await assessAudioQuality(input);
 assert.ok(q.stereoCorrelation > .8); assert.ok(q.findings.some(f => f.check === 'phase' && f.timeSeconds === 5));
});
test('gain alone is not declared a quality improvement; introduced clipping is reported', async () => {
 const a = await assessAudioQuality(pcm(32000, .2));
 const b = await assessAudioQuality(pcm(32000, .4));
 const c = compareAudioQuality(a,b);
 assert.ok(Math.abs(c.rmsChangeDb - 6.0206) < .01); assert.ok(Math.abs(c.crestChangeDb) < .01);
 assert.match(c.verdict, /do not establish better/);
 const bad = await assessAudioQuality(pcm(32000, 1));
 assert.ok(compareAudioQuality(a,bad).newReviewChecks.includes('clipping'));
 assert.ok(compareAudioQuality(bad,a).resolvedReviewChecks.includes('clipping'));
});
test('silence, DC offset, one-sided stereo and invalid PCM are handled honestly', async () => {
 const silence = await assessAudioQuality(pcm(32000,0,true));
 assert.equal(silence.stereoCorrelation,null); assert.equal(silence.quietSectionRmsDbfs,null);
 assert.equal(silence.score,null); assert.deepEqual(JSON.parse(JSON.stringify(silence)),silence);
 const input = pcm(32000,.2,true); input.getChannelData(1).fill(0);
 assert.ok((await assessAudioQuality(input)).findings.some(f=>f.check==='balance'));
 input.getChannelData(0).fill(.1);
 assert.ok((await assessAudioQuality(input)).findings.some(f=>f.check==='dc'));
 input.getChannelData(0)[200]=NaN; await assert.rejects(assessAudioQuality(input),/invalid samples/);
});
