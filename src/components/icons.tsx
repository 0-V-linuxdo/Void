/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@turbopack/common/react";

export interface IconProps {
    size?: number | string;
    width?: number | string;
    height?: number | string;
    strokeWidth?: number;
    className?: string;
}

const svg = (props: IconProps, ...children: React.ReactNode[]) => (
    <svg
        width={props.width ?? props.size ?? "1em"}
        height={props.height ?? props.size ?? "1em"}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={props.strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
        aria-hidden="true"
    >
        {children}
    </svg>
);

const filledSvg = (props: IconProps, viewBox: string, ...children: React.ReactNode[]) => (
    <svg
        width={props.width ?? props.size ?? "1em"}
        height={props.height ?? props.size ?? "1em"}
        viewBox={viewBox}
        fill="currentColor"
        className={props.className}
        aria-hidden="true"
    >
        {children}
    </svg>
);

export const BracesIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />,
        <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />,
    );

export const CopyIcon = (props: IconProps = {}) =>
    svg(props,
        <rect x="3" y="8" width="13" height="13" rx="4" stroke="currentColor" />,
        <path fillRule="evenodd" clipRule="evenodd" d="M13 2.00004L12.8842 2.00002C12.0666 1.99982 11.5094 1.99968 11.0246 2.09611C9.92585 2.31466 8.95982 2.88816 8.25008 3.69274C7.90896 4.07944 7.62676 4.51983 7.41722 5.00004H9.76392C10.189 4.52493 10.7628 4.18736 11.4147 4.05768C11.6802 4.00488 12.0228 4.00004 13 4.00004H14.6C15.7366 4.00004 16.5289 4.00081 17.1458 4.05121C17.7509 4.10066 18.0986 4.19283 18.362 4.32702C18.9265 4.61464 19.3854 5.07358 19.673 5.63807C19.8072 5.90142 19.8994 6.24911 19.9488 6.85428C19.9992 7.47112 20 8.26343 20 9.40004V11C20 11.9773 19.9952 12.3199 19.9424 12.5853C19.8127 13.2373 19.4748 13.8114 19 14.2361V16.5829C20.4795 15.9374 21.5804 14.602 21.9039 12.9755C22.0004 12.4907 22.0002 11.9334 22 11.1158L22 11V9.40004V9.35725C22 8.27346 22 7.3993 21.9422 6.69141C21.8826 5.96256 21.7568 5.32238 21.455 4.73008C20.9757 3.78927 20.2108 3.02437 19.27 2.545C18.6777 2.24322 18.0375 2.1174 17.3086 2.05785C16.6007 2.00002 15.7266 2.00003 14.6428 2.00004L14.6 2.00004H13Z" fill="currentColor" />,
    );

export const ChromiumIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M10.88 21.94 15.46 14" />,
        <path d="M21.17 8H12" />,
        <path d="M3.95 6.06 8.54 14" />,
        <circle cx="12" cy="12" r="10" />,
        <circle cx="12" cy="12" r="4" />,
    );

export const CircleAlertIcon = (props: IconProps = {}) =>
    svg(props,
        <circle cx="12" cy="12" r="10" />,
        <line x1="12" x2="12" y1="8" y2="12" />,
        <line x1="12" x2="12.01" y1="16" y2="16" />,
    );

export const PaletteIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />,
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />,
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />,
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />,
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />,
    );

export const TrashIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />,
        <path d="M3 6h18" />,
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    );

export const Trash2Icon = (props: IconProps = {}) =>
    svg(props,
        <path d="M10 11v6" />,
        <path d="M14 11v6" />,
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />,
        <path d="M3 6h18" />,
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    );

export const TestTubeIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3" />,
        <path d="m16 2 6 6" />,
        <path d="M12 16H4" />,
    );

export const TelescopeIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />,
        <path d="m13.56 11.747 4.332-.924" />,
        <path d="m16 21-3.105-6.21" />,
        <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" />,
        <path d="m6.158 8.633 1.114 4.456" />,
        <path d="m8 21 3.105-6.21" />,
        <circle cx="12" cy="13" r="2" />,
    );

export const DownloadIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />,
        <polyline points="7 10 12 15 17 10" />,
        <line x1="12" x2="12" y1="15" y2="3" />,
    );

export const UnplugIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="m19 5 3-3" />,
        <path d="m2 22 3-3" />,
        <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />,
        <path d="M7.5 13.5 10 11" />,
        <path d="M10.5 16.5 13 14" />,
        <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />,
    );

export const Cross2Icon = (props: IconProps = {}) =>
    filledSvg(props, "0 0 15 15",
        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />,
    );

export const EllipsisVertical = (props: IconProps = {}) =>
    svg(props,
        <circle cx="12" cy="12" r="1" />,
        <circle cx="12" cy="5" r="1" />,
        <circle cx="12" cy="19" r="1" />,
    );

export const PinIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 17v5" />,
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />,
    );

export const PinFilledIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 17v5" />,
        <path fill="currentColor" d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />,
    );

export const GhostFilledIcon = (props: IconProps = {}) =>
    filledSvg(props, "0 0 24 24",
        <path fillRule="evenodd" clipRule="evenodd" d="M12 3C9.86974 3 8.36758 3.44687 7.30331 4.30861C6.24544 5.16518 5.77303 6.31294 5.44931 7.34656C5.34315 7.68552 5.24989 8.01119 5.16061 8.32293C4.67184 10.0297 4.3026 11.3191 2.59045 12.0877L2 12.3528V13C2 13.5638 2.1227 14.0439 2.36548 14.4568C2.59992 14.8555 2.9079 15.1234 3.14945 15.3133C3.24924 15.3917 3.33688 15.4587 3.41432 15.5178L3.41445 15.5179C3.75134 15.7753 3.89523 15.8852 4.00625 16.153C4.02083 16.1882 4.05258 16.3202 4.01681 16.6105C3.98277 16.8867 3.89932 17.2176 3.78078 17.5898C3.67031 17.9367 3.54072 18.2855 3.41195 18.6321L3.38617 18.7015C3.25634 19.0512 3.11722 19.4276 3.03341 19.7437L2.70025 21H7.87689L12 22.0308L16.1231 21H21.3378L20.9591 19.7169C20.8577 19.3732 20.7296 19.016 20.6096 18.6814L20.6 18.6547C20.4736 18.302 20.3539 17.9667 20.2541 17.6336C20.0498 16.9516 19.971 16.4061 20.0567 15.9647C20.0994 15.7444 20.1593 15.7043 20.6831 15.3528L20.697 15.3435C20.9367 15.1826 21.2889 14.9346 21.5621 14.5365C21.8517 14.1145 22 13.6069 22 13V12.3528L21.4095 12.0877C19.6974 11.3191 19.3282 10.0297 18.8394 8.32294L18.8392 8.32236C18.75 8.01083 18.6568 7.68526 18.5507 7.34656C18.227 6.31294 17.7546 5.16518 16.6967 4.30861C15.6324 3.44687 14.1303 3 12 3ZM11 10.625C11 11.7986 10.3284 12.75 9.5 12.75C8.67157 12.75 8 11.7986 8 10.625C8 9.4514 8.67157 8.5 9.5 8.5C10.3284 8.5 11 9.4514 11 10.625ZM14.5 12.75C15.3284 12.75 16 11.7986 16 10.625C16 9.4514 15.3284 8.5 14.5 8.5C13.6716 8.5 13 9.4514 13 10.625C13 11.7986 13.6716 12.75 14.5 12.75Z" />,
    );

export const TriangleAlert = (props: IconProps = {}) =>
    svg(props,
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />,
        <path d="M12 9v4" />,
        <path d="M12 17h.01" />,
    );

export const ScalingIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />,
        <path d="M14 15H9v-5" />,
        <path d="M16 3h5v5" />,
        <path d="M21 3 9 15" />,
    );

export const PencilIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />,
        <path d="m15 5 4 4" />,
    );

export const GlobeIcon = (props: IconProps = {}) =>
    svg(props,
        <circle cx="12" cy="12" r="10" />,
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />,
        <path d="M2 12h20" />,
    );

export const CircleXIcon = (props: IconProps = {}) =>
    svg(props,
        <circle cx="12" cy="12" r="10" />,
        <path d="m15 9-6 6" />,
        <path d="m9 9 6 6" />,
    );

export const CircleCheckIcon = (props: IconProps = {}) =>
    svg(props,
        <circle cx="12" cy="12" r="10" />,
        <path d="m9 12 2 2 4-4" />,
    );

export const FolderIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
    );

export const ClockAlertIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 6v6l4 2" />,
        <path d="M20 12v5" />,
        <path d="M20 21h.01" />,
        <path d="M21.25 8.2A10 10 0 1 0 16 21.16" />,
    );

export const CircleGaugeIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M15.6 2.7a10 10 0 1 0 5.7 5.7" />,
        <circle cx="12" cy="12" r="2" />,
        <path d="M13.4 10.6 19 5" />,
    );

export const ChevronsDownUpIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="m7 20 5-5 5 5" />,
        <path d="m7 4 5 5 5-5" />,
    );

export const RotateCcwIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />,
        <path d="M3 3v5h5" />,
    );

export const AppWindowIcon = (props: IconProps = {}) =>
    svg(props,
        <rect x="2" y="4" width="20" height="16" rx="2" />,
        <path d="M10 4v4" />,
        <path d="M2 8h20" />,
        <path d="M6 4v4" />,
    );

export const BrushCleaningIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="m16 22-1-4" />,
        <path d="M19 13.99a1 1 0 0 0 1-1V12a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v.99a1 1 0 0 0 1 1" />,
        <path d="M5 14h14l1.973 6.767A1 1 0 0 1 20 22H4a1 1 0 0 1-.973-1.233z" />,
        <path d="m8 22 1-4" />,
    );

export const BlendIcon = (props: IconProps = {}) =>
    svg(props,
        <circle cx="9" cy="9" r="7" />,
        <circle cx="15" cy="15" r="7" />,
    );

export const TerminalIcon = (props: IconProps = {}) =>
    svg(props,
        <polyline points="4 17 10 11 4 5" />,
        <line x1="12" x2="20" y1="19" y2="19" />,
    );

export const CableIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1" />,
        <path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9" />,
        <path d="M21 21v-2h-4" />,
        <path d="M3 5h4V3" />,
        <path d="M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3" />,
    );

export const MicOffIcon = (props: IconProps = {}) =>
    svg(props,
        <line x1="2" x2="22" y1="2" y2="22" />,
        <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />,
        <path d="M5 10v2a7 7 0 0 0 12 5" />,
        <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />,
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />,
        <line x1="12" x2="12" y1="19" y2="22" />,
    );

export const BotOffIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M13.67 8H18a2 2 0 0 1 2 2v4.33" />,
        <path d="M2 14h2" />,
        <path d="M20 14h2" />,
        <path d="M22 22 2 2" />,
        <path d="M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586" />,
        <path d="M9 13v2" />,
        <path d="M9.67 4H12v2.33" />,
    );

export const Link2OffIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M9 17H7A5 5 0 0 1 7 7" />,
        <path d="M15 7h2a5 5 0 0 1 4 8" />,
        <line x1="8" x2="12" y1="12" y2="12" />,
        <line x1="2" x2="22" y1="2" y2="22" />,
    );

export const UserRoundXIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M2 21a8 8 0 0 1 11.873-7" />,
        <circle cx="10" cy="8" r="5" />,
        <path d="m17 17 5 5" />,
        <path d="m22 17-5 5" />,
    );

export const CatIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />,
        <path d="M8 14v.5" />,
        <path d="M16 14v.5" />,
        <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />,
    );

export const BellIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />,
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />,
    );

export const EyeOffIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />,
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />,
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />,
        <path d="m2 2 20 20" />,
    );

export const UnfoldHorizontalIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M16 12h6" />,
        <path d="M8 12H2" />,
        <path d="M12 2v2" />,
        <path d="M12 8v2" />,
        <path d="M12 14v2" />,
        <path d="M12 20v2" />,
        <path d="m19 15 3-3-3-3" />,
        <path d="m5 9-3 3 3 3" />,
    );

export const UsersRoundIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M18 21a8 8 0 0 0-16 0" />,
        <circle cx="10" cy="8" r="5" />,
        <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />,
    );

export const FilesIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M20 7h-3a2 2 0 0 1-2-2V2" />,
        <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" />,
        <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />,
    );

export const ImagesIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M18 22H4a2 2 0 0 1-2-2V6" />,
        <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" />,
        <circle cx="12" cy="8" r="2" />,
        <rect width="16" height="16" x="6" y="2" rx="2" />,
    );

export const LinkIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />,
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
    );

export const PanelLeftIcon = (props: IconProps = {}) =>
    svg(props,
        <rect width="18" height="18" x="3" y="3" rx="2" />,
        <path d="M9 3v18" />,
    );

export const ScrollTextIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M15 12h-5" />,
        <path d="M15 8h-5" />,
        <path d="M19 17V5a2 2 0 0 0-2-2H4" />,
        <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />,
    );

export const Volume2Icon = (props: IconProps = {}) =>
    svg(props,
        <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />,
        <path d="M16 9a5 5 0 0 1 0 6" />,
        <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />,
    );

export const FileDownIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />,
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />,
        <path d="M12 18v-6" />,
        <path d="m9 15 3 3 3-3" />,
    );

export const HistoryIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />,
        <path d="M3 3v5h5" />,
        <path d="M12 7v5l4 2" />,
    );

export const ClockIcon = (props: IconProps = {}) =>
    svg(props,
        <circle cx="12" cy="12" r="10" />,
        <polyline points="12 6 12 12 16 14" />,
    );

export const TextCursorInputIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" />,
        <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" />,
        <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />,
        <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" />,
        <path d="M9 6v12" />,
    );

export const LayoutGridIcon = (props: IconProps = {}) =>
    svg(props,
        <rect width="7" height="7" x="3" y="3" rx="1" />,
        <rect width="7" height="7" x="14" y="3" rx="1" />,
        <rect width="7" height="7" x="14" y="14" rx="1" />,
        <rect width="7" height="7" x="3" y="14" rx="1" />,
    );

export const SparklesIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />,
        <path d="M20 3v4" />,
        <path d="M22 5h-4" />,
        <path d="M4 17v2" />,
        <path d="M5 18H3" />,
    );

export const ShieldOffIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="m2 2 20 20" />,
        <path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71" />,
        <path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264" />,
    );

export const SettingsIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />,
        <circle cx="12" cy="12" r="3" />,
    );

export const VoidIcon = (props: IconProps = {}) =>
    svg(props,
        <path d="M7 4.5v8.5a5 5 0 0 0 10 0V4.5" />,
        <path d="M9.4 6v2.8" />,
        <path d="M10.8 7.4H8" />,
        <path d="M13.2 6v2.8" />,
        <path d="M14.6 7.4H12" />,
    );

