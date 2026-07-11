/**
 * Generic Zustand store interface matching Grok's store pattern.
 *
 * Grok uses Zustand v4 with the `create` pattern. Each store is a callable
 * hook that can optionally accept a selector. The store also exposes
 * `getState`, `getInitialState`, `setState`, and `subscribe` for
 * non-React access.
 *
 * @example
 * ```ts
 * // As a React hook (inside component)
 * const user = useSessionStore(s => s.user);
 *
 * // Direct state access (outside React)
 * const state = useSessionStore.getState();
 * ```
 */
export interface ZustandStore<State extends object> {
    /** Call as a hook with no selector to get the full state. */
    (): State;
    /** Call as a hook with a selector to subscribe to a derived value. */
    <T>(selector: (state: State) => T): T;
    /** Read current state synchronously without subscribing. */
    getState(): State;
    /** Read the initial state the store was created with. */
    getInitialState(): State;
    /** Merge partial state or apply an updater function. Pass `replace: true` to replace state entirely. */
    setState(partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean): void;
    subscribe<T>(selector: (state: State) => T, listener: (current: T, prev: T) => void, options?: { equalityFn?: (a: T, b: T) => boolean; fireImmediately?: boolean }): () => void;
    /** Subscribe to state changes. Returns an unsubscribe function. */
    subscribe(listener: (state: State, prevState: State) => void): () => void;
}
