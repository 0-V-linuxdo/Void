import type { ZustandStore } from "../zustand";

/** Mode of the skill create/edit dialog. */
export type SkillCreateDialogMode = "create" | "import" | null | (string & {});

/**
 * Zustand state for the skills page, managing the selected skill
 * and the create/edit skill dialog state.
 */
export interface SkillsStoreState {
    /** Currently selected skill object, or null. */
    selectedSkill: any | null;
    /** Active create dialog mode, or null when closed. */
    createDialogMode: SkillCreateDialogMode;
    /** Skill being edited, or null when the edit dialog is closed. */
    editDialogSkill: any | null;

    /** Set the currently selected skill. */
    setSelectedSkill: (skill: any | null) => void;
    /** Open the create skill dialog in the given mode. */
    openCreateDialog: (mode: SkillCreateDialogMode) => void;
    /** Close the create skill dialog. */
    closeCreateDialog: () => void;
    /** Open the edit skill dialog with the given skill. */
    openEditDialog: (skill: any) => void;
    /** Close the edit skill dialog. */
    closeEditDialog: () => void;
}

/** Module exports for the Skills store. */
export interface SkillsStoreModule {
    /** Zustand store hook for skills state. */
    useSkillsStore: ZustandStore<SkillsStoreState>;
}
