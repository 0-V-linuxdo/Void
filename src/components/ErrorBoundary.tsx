/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@turbopack/common/react";
import type { ComponentType, ReactNode } from "react";

export interface ErrorBoundaryProps {
    fallback?: ReactNode;
    children?: ReactNode;
    onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

let ErrorBoundaryClass: ComponentType<ErrorBoundaryProps> | null = null;

function getErrorBoundaryClass(): ComponentType<ErrorBoundaryProps> {
    if (ErrorBoundaryClass) return ErrorBoundaryClass;

    ErrorBoundaryClass = class VoidErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
        constructor(props: ErrorBoundaryProps) {
            super(props);
            this.state = { hasError: false };
        }

        static getDerivedStateFromError(): ErrorBoundaryState {
            return { hasError: true };
        }

        componentDidCatch(error: Error) {
            this.props.onError?.(error);
        }

        render(): ReactNode {
            if (this.state.hasError) return this.props.fallback ?? null;
            return this.props.children ?? null;
        }
    } as unknown as ComponentType<ErrorBoundaryProps>;

    return ErrorBoundaryClass;
}

type ErrorBoundaryComponent = ComponentType<ErrorBoundaryProps> & {
    wrap<P extends Record<string, any>>(Component: ComponentType<P>, fallback?: ReactNode): ComponentType<P>;
};

function ErrorBoundaryWrapper(props: ErrorBoundaryProps): ReactNode {
    const Cls = getErrorBoundaryClass();
    return <Cls {...props} />;
}

export const ErrorBoundary: ErrorBoundaryComponent = ErrorBoundaryWrapper as unknown as ErrorBoundaryComponent;

Object.defineProperty(ErrorBoundary, "wrap", {
    value<P extends Record<string, any>>(Component: ComponentType<P>, fallback: ReactNode = null): ComponentType<P> {
        const Wrapped = (props: P) => (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
        Object.defineProperty(Wrapped, "name", { value: `ErrorBoundary(${Component.displayName ?? Component.name ?? "Unknown"})` });
        return Wrapped;
    },
    configurable: true,
});
