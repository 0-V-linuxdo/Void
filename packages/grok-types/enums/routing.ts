/** All page identifiers Grok's client-side router recognizes. */
export type GrokPage =
    | "main"
    | "chat"
    | "files"
    | "workspace"
    | "workspaces"
    | "images"
    | "imagine"
    | "imagine-favorites"
    | "imagine-post"
    | "imagine-more"
    | "imagine-carpet"
    | "tasks"
    | "plans"
    | "finance"
    | "faq"
    | "changelog"
    | "share-links"
    | "deleted-conversations"
    | "history"
    | "highlights"
    | "trends"
    | "templates"
    | "dev-models"
    | "user-feature-controls"
    | "user-feature-controls-static"
    | "vibe"
    | "build"
    | "manage-connectors"
    | "playground"
    | "clear-cache"
    | "unknown"
    | (string & {});

/** Sub-page identifiers for the Build page. */
export type BuildSubPage =
    | "remote"
    | "history"
    | "settings"
    | "environment-create"
    | "environment-edit"
    | "environment"
    | "share"
    | "compare"
    | "arena"
    | (string & {});

/** Tab identifiers for the workspace main page. */
export type WorkspaceTab =
    | "own"
    | "shared"
    | "examples"
    | (string & {});
