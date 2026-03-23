import type { ZustandStore } from "../zustand";

/** Single pipeline execution state. */
export interface PipelineExecution {
    templateId: string | null;
    templateName: string | null;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    isRunning: boolean;
    error: string | null;
    streamData: any;
}

/** Zustand state for multi-execution pipeline management. */
export interface PipelineExecutionStoreState {
    /** All executions keyed by execution ID. */
    executions: Record<string, PipelineExecution>;
    /** Internal abort controllers keyed by execution ID. */
    _abortControllers: Map<string, AbortController>;

    /** Get a single execution by ID. */
    getExecution: (id: string) => PipelineExecution | undefined;
    /** Update partial execution data by ID. */
    _updateExecution: (id: string, data: Partial<PipelineExecution>) => void;
    /** Set error state for an execution. */
    _setError: (id: string, error: string) => void;
    /** Set template info for an execution. */
    setTemplate: (id: string, templateId: string, name: string) => void;
    /** Run a pipeline execution with inputs. */
    run: (id: string, inputs: Record<string, any>) => Promise<void>;
    /** Re-run a pipeline execution with inputs. */
    runRedo: (id: string, inputs: Record<string, any>) => Promise<void>;
    /** Process a streaming response for an execution. */
    _processStream: (id: string, stream: any) => Promise<void>;
    /** Cancel a running execution. */
    cancel: (id: string) => void;
    /** Reset an execution to initial state. */
    reset: (id: string) => void;
}

/** Module exports for the PipelineExecution store. */
export interface PipelineExecutionStoreModule {
    /** Zustand store hook for pipeline execution state. */
    usePipelineExecutionStore: ZustandStore<PipelineExecutionStoreState>;
}
