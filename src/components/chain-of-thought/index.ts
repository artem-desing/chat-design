// The component surface — what lifts out into the real Wally app.
export { ChainOfThought } from './chain-of-thought';
export type {
  ChainOfThoughtProps,
  ChainStep,
  ChainDetail,
  FindingItem,
  StepType,
  StepStatus,
} from './types';

// Playground-only: the simulated-stream hook + fixtures that drive the demo.
export { useSimulatedRun, type SimRun, type SimStep } from './use-simulated-run';
export { RUNS } from './fixtures';
