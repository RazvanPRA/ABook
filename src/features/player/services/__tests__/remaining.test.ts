import { toChapterIndex } from '@/shared/domain';
import { makeToc, position } from '../../__fixtures__/chapters';
import { DEFAULT_SENTENCE_LENGTH, remainingCharacters } from '../remainingTime';
import {
  createSpeechMeter,
  DEFAULT_CHARS_PER_SECOND,
  METERED_SENTENCES,
} from '../speechMeter';

describe('speech meter', () => {
  const spoken = (characters: number, milliseconds: number, rate = 1) => ({
    characters,
    milliseconds,
    rate,
  });

  it('has a usual speed until something is measured', () => {
    const meter = createSpeechMeter();
    expect(meter.speedAt(2)).toBe(2 * DEFAULT_CHARS_PER_SECOND);
    meter.record(spoken(0, 1000));
    meter.record(spoken(100, 0));
    expect(meter.speedAt(1)).toBe(DEFAULT_CHARS_PER_SECOND);
  });

  it('averages the sentences by their length', () => {
    const meter = createSpeechMeter();
    meter.record(spoken(10, 1000));
    meter.record(spoken(90, 3000));
    expect(meter.speedAt(1)).toBe(25);
  });

  it('scales with the rate instead of forgetting', () => {
    const meter = createSpeechMeter();
    meter.record(spoken(40, 1000, 2));
    expect(meter.speedAt(2)).toBe(40);
    expect(meter.speedAt(1)).toBe(20);
  });

  it('counts only the last sentences', () => {
    const meter = createSpeechMeter();
    meter.record(spoken(10_000, 1000));
    for (let i = 0; i < METERED_SENTENCES; i += 1) {
      meter.record(spoken(10, 1000));
    }
    expect(meter.speedAt(1)).toBe(10);
  });
});

describe('remaining characters', () => {
  const TOC = makeToc([
    [1, 1],
    [2, 2],
    [3, 3, 3],
  ]);
  const chunk = (...lengths: number[]) => ({
    sentences: lengths.map(length => 'x'.repeat(length)),
    sentencePages: [],
  });

  it('is exact in memory and estimated elsewhere', () => {
    const peek = (chapter: number) => (chapter === 1 ? chunk(10, 30) : null);
    expect(remainingCharacters(TOC, position(1, 1), peek)).toBe(30 + 3 * 20);
  });

  it('counts only what is left of an unread chapter', () => {
    expect(remainingCharacters(TOC, position(2, 1), () => null)).toBe(
      2 * DEFAULT_SENTENCE_LENGTH,
    );
    expect(remainingCharacters(TOC, position(2, 9), () => null)).toBe(0);
  });

  it('is nothing after the last chapter', () => {
    expect(
      remainingCharacters(
        TOC,
        { ...position(0, 0), chapter: toChapterIndex(3) },
        () => null,
      ),
    ).toBe(0);
  });
});
