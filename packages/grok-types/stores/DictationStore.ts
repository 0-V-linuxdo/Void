import type { RefinementLevel } from "../enums/dictation";
import type { ZustandStore } from "../zustand";

/** Dictation recording lifecycle status. */
export type DictationStatus = "idle" | "recording" | "transcribing" | (string & {});

/** Audio visualizer state for the dictation waveform. */
export interface DictationVisualizer {
    /** Web Audio context for the recording stream. */
    audioContext: AudioContext;
    /** Frequency analyser node for waveform data. */
    analyser: AnalyserNode;
    /** Active requestAnimationFrame handle, or null when stopped. */
    animationFrame: number | null;
    /** Timestamp of the last waveform sample. */
    lastSampleTime: number;
}

/** Active recording session state. */
export interface DictationSession {
    /** The MediaRecorder capturing audio. */
    recorder: MediaRecorder;
    /** The live audio MediaStream. */
    stream: MediaStream;
    /** Recorded audio chunks. */
    chunks: Blob[];
    /** Waveform visualizer state, or null before visualization starts. */
    visualizer: DictationVisualizer | null;
}

/** Zustand state for dictation/voice recording. */
export interface DictationStoreState {
    /** Current recording lifecycle status. */
    status: DictationStatus;
    /** Audio waveform amplitude samples (0..1) for visualization, max 40 entries. */
    waveformSamples: number[];
    /** Timestamp (Date.now()) when recording started, or null if not recording. */
    startTime: number | null;
    /** Active recording session, or null when idle. */
    session: DictationSession | null;
    /** Callback invoked with transcribed text on completion, or null. */
    onTranscript: ((text: string) => void) | null;
    /** Current refinement level for speech processing. */
    refinementLevel: RefinementLevel;
    /** Whether the hotkey is currently being recorded. */
    isHotkeyRecording: boolean;

    /** Set the refinement level for speech processing. */
    setRefinementLevel: (level: RefinementLevel) => void;
    /** Start a voice recording session with a transcript callback. */
    startRecording: (onTranscript: (text: string) => void) => void;
    /** Start the waveform visualizer for the given audio stream and session. */
    startVisualizer: (stream: MediaStream, session: DictationSession) => void;
    /** Stop the current recording session; if confirm is true, transcribe the audio. */
    stopSession: (confirm: boolean) => void;
    /** Cancel the current recording without transcribing. */
    cancelRecording: () => void;
    /** Confirm and submit the current recording for transcription. */
    confirmRecording: () => void;
}

/** Module exports for the Dictation store. */
export interface DictationStoreModule {
    /** Zustand store hook for dictation/voice recording. */
    useDictationStore: ZustandStore<DictationStoreState>;
    /** Available refinement level values. */
    REFINEMENT_LEVELS: RefinementLevel[];
}
