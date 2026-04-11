/** All page identifiers Grok's client-side router recognizes. */
export type GrokPage =
    | "main"
    | "chat"
    | "files"
    | "workspace"
    | "workspaces"
    | "images"
    | "imagine"
    | "imagine-template"
    | "imagine-favorites"
    | "imagine-my-templates"
    | "imagine-post"
    | "imagine-more"
    | "imagine-carpet"
    | "templates-v2"
    | "skills"
    | "tasks"
    | "plans"
    | "finance"
    | "faq"
    | "release-notes"
    | "share-links"
    | "deleted-conversations"
    | "history"
    | "templates"
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
