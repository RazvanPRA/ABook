import {
  IMPORT_STEP_IDS,
  type ImportPhase,
  type ImportStep,
  type ImportStepId,
  type StepStatus,
} from './types';

/** Phases in which an import is running (or waiting for the user's answer on a duplicate). */
export const ACTIVE_PHASES = [
  'copying',
  'duplicate',
  'opening',
  'extracting',
  'splitting',
  'saving',
] as const satisfies readonly ImportPhase['type'][];

export type ActivePhase = Extract<
  ImportPhase,
  { type: (typeof ACTIVE_PHASES)[number] }
>;

export function isActivePhase(phase: ImportPhase): phase is ActivePhase {
  return (ACTIVE_PHASES as readonly string[]).includes(phase.type);
}

/** The step an active phase belongs to. */
export function stepOfPhase(phase: ActivePhase): ImportStepId {
  switch (phase.type) {
    case 'copying':
    case 'duplicate':
      return 'copy';
    case 'opening':
    case 'extracting':
      return 'extract';
    case 'splitting':
      return 'split';
    case 'saving':
      return 'save';
  }
}

/** Index of the current step, the status it shows, and how far the steps before it got. */
function current(
  phase: ImportPhase,
): { index: number; status: StepStatus } | null {
  if (phase.type === 'idle') {
    return null;
  }
  if (phase.type === 'ready') {
    return { index: IMPORT_STEP_IDS.length, status: 'done' };
  }
  if (phase.type === 'failed' || phase.type === 'cancelled') {
    const status = phase.type === 'failed' ? 'error' : 'waiting';
    return { index: IMPORT_STEP_IDS.indexOf(phase.step), status };
  }
  return {
    index: IMPORT_STEP_IDS.indexOf(stepOfPhase(phase)),
    status: 'active',
  };
}

/**
 * The step list of the import screen: steps before the current one are done, the current one is
 * active (or in error, or back to waiting after a cancel), the rest wait. The extract step carries
 * the page progress while pages come in.
 */
export function deriveSteps(phase: ImportPhase): ImportStep[] {
  const at = current(phase);
  return IMPORT_STEP_IDS.map((id, index) => {
    let status: StepStatus = 'waiting';
    if (at !== null && index < at.index) {
      status = 'done';
    } else if (at !== null && index === at.index) {
      status = at.status;
    }
    const progress =
      id === 'extract' && phase.type === 'extracting'
        ? { page: phase.page, total: phase.total }
        : null;
    return { id, status, progress };
  });
}
