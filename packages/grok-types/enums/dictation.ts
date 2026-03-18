/** Dictation refinement level for speech-to-text processing. */
export type RefinementLevel =
	| "REFINEMENT_LEVEL_UNSPECIFIED"
	| "REFINEMENT_LEVEL_LEGACY_ENHANCE"
	| "REFINEMENT_LEVEL_POLISH"
	| "REFINEMENT_LEVEL_ENRICH"
	| (string & {});
