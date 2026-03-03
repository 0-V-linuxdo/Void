/** Tab mode for the tasks page. */
export type TaskTabMode = "active" | "inactive" | (string & {});

/** Scheduled task lifecycle state. */
export type TaskState = "active" | "completed" | "archived" | (string & {});

/**
 * Task execution result status from the API (`GrokApiV2TaskResultStatus`).
 *
 * | Status                    | Description                |
 * |---------------------------|----------------------------|
 * | `"TASK_RESULT_PENDING"`   | Execution not yet complete |
 * | `"TASK_RESULT_SUCCESS"`   | Completed successfully     |
 * | `"TASK_RESULT_ERROR"`     | Failed with an error       |
 */
export type TaskResultStatus =
	| "TASK_RESULT_PENDING"
	| "TASK_RESULT_SUCCESS"
	| "TASK_RESULT_ERROR"
	| (string & {});

/**
 * Task repetition cadence from the API (`GrokApiV2TaskCadence`).
 *
 * Controls how often a scheduled task runs.
 */
export type TaskCadence =
	| "TASK_CADENCE_ONCE"
	| "TASK_CADENCE_ONCE_DAILY"
	| "TASK_CADENCE_ONCE_WEEKLY"
	| "TASK_CADENCE_ONCE_WEEKDAY"
	| "TASK_CADENCE_ONCE_MONTHLY"
	| "TASK_CADENCE_ONCE_ANNUALLY"
	| "TASK_CADENCE_ONCE_INSTANT"
	| (string & {});

/** Task notification decision from the API (`GrokApiV2TaskNotificationDecision`). */
export type TaskNotificationDecision = "DISABLED" | "YES" | "NO" | (string & {});
