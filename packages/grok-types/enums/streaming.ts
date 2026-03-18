/** Severity of a streaming error, determines whether retry is possible. */
export type StreamErrorSeverity =
    | "STREAM_ERROR_SEVERITY_UNKNOWN"
    | "STREAM_ERROR_SEVERITY_NORMAL"
    | "STREAM_ERROR_SEVERITY_FATAL"
    | (string & {});

/** Progress report category during response streaming. */
export type ProgressReportCategory =
    | "PROGRESS_REPORT_CATEGORY_UNKNOWN"
    | "PROGRESS_REPORT_CATEGORY_ATTACHMENTS_PREPROCESSING"
    | "PROGRESS_REPORT_CATEGORY_HISTORY_ATTACHMENTS_PREPROCESSING"
    | "PROGRESS_REPORT_CATEGORY_WEBPAGE_ATTACHMENTS_PREPROCESSING"
    | "PROGRESS_REPORT_CATEGORY_HISTORY_WEBPAGE_ATTACHMENTS_PREPROCESSING"
    | "TOOL_PROCESSING"
    | "HEAVY_ROLLOUT"
    | (string & {});
