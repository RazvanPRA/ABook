import type { BookId } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import { deriveSteps, isActivePhase, stepOfPhase } from '../steps';
import type { ImportPhase } from '../types';

const [BOOK] = BOOK_IDS as [BookId];
const statuses = (phase: ImportPhase) =>
  deriveSteps(phase).map(step => step.status);

describe('deriveSteps', () => {
  it('lists the four steps of the mockup, all waiting before a file is picked', () => {
    expect(deriveSteps({ type: 'idle' }).map(step => step.id)).toEqual([
      'copy',
      'extract',
      'split',
      'save',
    ]);
    expect(statuses({ type: 'idle' })).toEqual([
      'waiting',
      'waiting',
      'waiting',
      'waiting',
    ]);
  });

  it.each([
    [{ type: 'copying' }, ['active', 'waiting', 'waiting', 'waiting']],
    [
      { type: 'duplicate', existingBookId: BOOK },
      ['active', 'waiting', 'waiting', 'waiting'],
    ],
    [{ type: 'opening' }, ['done', 'active', 'waiting', 'waiting']],
    [{ type: 'splitting' }, ['done', 'done', 'active', 'waiting']],
    [{ type: 'saving' }, ['done', 'done', 'done', 'active']],
    [{ type: 'ready' }, ['done', 'done', 'done', 'done']],
  ] as const)(
    'marks earlier steps done, the current active, later waiting (%o)',
    (phase, expected) => {
      expect(statuses(phase)).toEqual(expected);
    },
  );

  it('carries page X/Y on the extract step while extracting', () => {
    const steps = deriveSteps({ type: 'extracting', page: 186, total: 412 });
    expect(steps[1]).toEqual({
      id: 'extract',
      status: 'active',
      progress: { page: 186, total: 412 },
    });
    expect(steps.filter(step => step.progress !== null)).toHaveLength(1);
  });

  it('shows the failed step in error, and a cancelled one back to waiting', () => {
    expect(
      statuses({ type: 'failed', reason: 'scanned', step: 'extract' }),
    ).toEqual(['done', 'error', 'waiting', 'waiting']);
    expect(statuses({ type: 'cancelled', step: 'split' })).toEqual([
      'done',
      'done',
      'waiting',
      'waiting',
    ]);
  });
});

describe('phase helpers', () => {
  it('tells running phases from finished ones', () => {
    expect(isActivePhase({ type: 'saving' })).toBe(true);
    expect(isActivePhase({ type: 'ready' })).toBe(false);
    expect(isActivePhase({ type: 'idle' })).toBe(false);
  });

  it('maps every running phase to its step', () => {
    expect(stepOfPhase({ type: 'duplicate', existingBookId: BOOK })).toBe(
      'copy',
    );
    expect(stepOfPhase({ type: 'extracting', page: 1, total: 2 })).toBe(
      'extract',
    );
  });
});
