import type { ZustandStore } from "../zustand";

/** Animation command for the rocket plume state machine. */
export type RocketCommand = "hold" | "trigger" | "stop" | null;

/** Zustand state for the rocket plume animation on the chat bar. */
export interface RocketStoreState {
    /** Current animation command: hold (idle glow), trigger (fire), stop (halt), or null (inactive). */
    command: RocketCommand;
    /** Sequence counter incremented on every command change. */
    seq: number;

    /** Enter the idle glow state (ready to fire). */
    hold: () => void;
    /** Fire the rocket plume animation. */
    trigger: () => void;
    /** Stop the rocket plume animation. */
    stop: () => void;
}

/** Module exports for the Rocket store. */
export interface RocketStoreModule {
    /** Zustand store hook for rocket plume animation. */
    useRocketStore: ZustandStore<RocketStoreState>;
}
