import type { PlaybackStatus } from "../enums/tts";
import type { ZustandStore } from "../zustand";

/**
 * Zustand state for text-to-speech playback, managing audio streams
 * and player lifecycle. Supports streaming audio from response text
 * with playback rate control and skip.
 */
export interface TextToSpeechStoreState {
    /** Cancel function for the current audio stream, or null. */
    cancelStream: (() => void) | null;
    /** Whether the browser supports advanced playback controls. */
    supportsPlaybackControls: boolean;
    /** Audio player element, or null when unmounted. */
    player: HTMLAudioElement | null;
    /** Stream ID of the currently playing response, or null. */
    currentStreamId: string | null;
    /** Current playback speed multiplier (1 = normal). */
    playbackRate: number;
    /** Current playback status. */
    playbackStatus: PlaybackStatus;
    /** Internal: Timestamp when playback started, or null when stopped. */
    _startTime: number | null;
    /** Internal: Total accumulated playback duration in milliseconds. */
    _accumulatedDuration: number;

    /** Set the playback speed multiplier. */
    setPlaybackRate: (rate: number) => void;
    /** Get the playback status for a specific stream ID. */
    getPlaybackStatus: (streamId: string) => PlaybackStatus;
    /** Skip forward or backward by an offset in seconds. */
    skipOffset: (offset: number) => void;
    /** Toggle between playing and paused states. */
    togglePlayback: () => void;
    /** Start TTS playback for a response. */
    playTextToSpeechForResponse: (responseId: string, text: string) => Promise<void>;
    /** Stop TTS playback. */
    stopTextToSpeech: (reason?: string) => void;

    /** Internal: Mount the audio player for a response. */
    _mountPlayer: (responseId: string, options: any) => void;
    /** Internal: Unmount and clean up the audio player. */
    _unmountPlayer: () => void;
    /** Internal: Handle audio playback errors. */
    _onError: (error: any) => void;
    /** Internal: Update the current playback status. */
    _setPlaybackStatus: (status: PlaybackStatus) => void;
    /** Internal: Handle the playing event from the audio element. */
    _onPlaying: () => void;
    /** Internal: Handle the pause event from the audio element. */
    _onPause: () => void;
    /** Internal: Handle the waiting/buffering event from the audio element. */
    _onWaiting: () => void;
    /** Internal: Log an analytics event when playback stops. */
    _logStopEvent: () => void;
    /** Internal: Handle the ended event from the audio element. */
    _onEnded: () => void;
    /** Internal: Read and play an audio stream from the API. */
    _readAudioStream: (stream: any, options: any) => Promise<void>;
}

/** Module exports for the TextToSpeech store. */
export interface TextToSpeechStoreModule {
    /** Zustand store hook for TTS state. */
    useTextToSpeechStore: ZustandStore<TextToSpeechStoreState>;
}
