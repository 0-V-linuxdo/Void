import type { ComponentType, CSSProperties, ReactNode } from "react";

// #region Common Radix props

export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";

export interface RadixContentProps {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface RadixTriggerProps {
    asChild?: boolean;
    children?: ReactNode;
    [key: string]: any;
}

export interface RadixRootProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
    [key: string]: any;
}

export interface RadixSubProps {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

// #endregion

// #region Button

export type ButtonVariant =
	| "filled"
	| "filledSecondary"
	| "outline"
	| "ghost"
	| "ghostSecondary"
	| "text"
	| "textSecondary"
	| "sticky"
	| "none"
	| "primary"
	| "secondary"
	| "accent"
	| "card"
	| "destructive"
	| "link"
	| (string & {});

export type ButtonSize =
	| "xxs"
	| "xs"
	| "sm"
	| "md"
	| "lg"
	| "iconXs"
	| "iconSm"
	| "iconMd"
	| "iconLg"
	| "iconXl"
	| "icon"
	| "pill"
	| "nav"
	| "default"
	| "noPadding"
	| "none"
	| (string & {});

export type ButtonShape = "rectangle" | "pill" | "square" | "circle";

export interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    asChild?: boolean;
    disabled?: boolean;
    className?: string;
    title?: string;
    tabIndex?: number;
    onClick?: (e: React.MouseEvent) => void;
    children?: ReactNode;
    [key: string]: any;
}

export interface ButtonWithTooltipProps extends ButtonProps {
    tooltipContent?: ReactNode;
    tooltipContentProps?: Record<string, any>;
    tooltipProps?: Record<string, any>;
    stayOpenOnClick?: boolean;
}

export type Button = ComponentType<ButtonProps>;
export type ButtonWithTooltip = ComponentType<ButtonWithTooltipProps>;

// #endregion

// #region Dialog (Radix Dialog)

export interface DialogProps extends RadixRootProps {
    modal?: boolean;
}

export interface DialogContentProps {
    className?: string;
    overlayClassname?: string;
    analyticsName?: string;
    children?: ReactNode;
    onInteractOutside?: (e: Event) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    onCloseAutoFocus?: (e: Event) => void;
    [key: string]: any;
}

export interface DialogHeaderProps extends RadixSubProps {}
export interface DialogFooterProps extends RadixSubProps {}
export interface DialogTitleProps extends RadixSubProps {}
export interface DialogDescriptionProps extends RadixSubProps {}
export interface DialogCloseProps extends RadixSubProps {}

export type Dialog = ComponentType<DialogProps>;
export type DialogContent = ComponentType<DialogContentProps>;
export type DialogHeader = ComponentType<DialogHeaderProps>;
export type DialogFooter = ComponentType<DialogFooterProps>;
export type DialogTitle = ComponentType<DialogTitleProps>;
export type DialogDescription = ComponentType<DialogDescriptionProps>;
export type DialogClose = ComponentType<DialogCloseProps>;

// #endregion

// #region Select (Radix Select)

export interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    dir?: "ltr" | "rtl";
    children?: ReactNode;
    [key: string]: any;
}

export type SelectTriggerSize = "default" | "sm";

export interface SelectTriggerProps {
    className?: string;
    size?: SelectTriggerSize;
    asChild?: boolean;
    children?: ReactNode;
    [key: string]: any;
}

export type SelectContentPosition = "popper" | "item-aligned";

export interface SelectContentProps {
    className?: string;
    position?: SelectContentPosition;
    showScrollButtons?: boolean;
    children?: ReactNode;
    [key: string]: any;
}

export interface SelectItemProps {
    value: string;
    disabled?: boolean;
    asChild?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface SelectValueProps {
    placeholder?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type Select = ComponentType<SelectProps>;
export type SelectTrigger = ComponentType<SelectTriggerProps>;
export type SelectContent = ComponentType<SelectContentProps>;
export type SelectItem = ComponentType<SelectItemProps>;
export type SelectValue = ComponentType<SelectValueProps>;

// #endregion

// #region Switch (Radix Switch)

export type SwitchSize = "default" | "sm";

export interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    size?: SwitchSize;
    className?: string;
    [key: string]: any;
}

export type Switch = ComponentType<SwitchProps>;

// #endregion

// #region Tooltip (Radix Tooltip)

export interface TooltipProps extends RadixRootProps {
    delayDuration?: number;
}

export interface TooltipTriggerProps extends RadixTriggerProps {}

export interface TooltipContentProps extends RadixContentProps {
    disableAnimation?: boolean;
    container?: HTMLElement | null;
}

export type Tooltip = ComponentType<TooltipProps>;
export type TooltipTrigger = ComponentType<TooltipTriggerProps>;
export type TooltipContent = ComponentType<TooltipContentProps>;

// #endregion

// #region DropdownMenu (Radix DropdownMenu)

export interface DropdownMenuProps extends RadixRootProps {
    dir?: "ltr" | "rtl";
}

export interface DropdownMenuTriggerProps extends RadixTriggerProps {}

export interface DropdownMenuContentProps extends RadixContentProps {
    loop?: boolean;
    onCloseAutoFocus?: (e: Event) => void;
    forceMount?: boolean;
}

export interface DropdownMenuItemProps {
    onSelect?: (e: Event) => void;
    disabled?: boolean;
    inset?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (checked: boolean) => void;
}

export interface DropdownMenuRadioGroupProps {
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface DropdownMenuRadioItemProps extends DropdownMenuItemProps {
    value?: string;
}

export interface DropdownMenuSubProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export interface DropdownMenuSubTriggerProps extends DropdownMenuItemProps {}
export interface DropdownMenuSubContentProps extends RadixContentProps {}
export interface DropdownMenuSeparatorProps extends RadixSubProps {}

export type DropdownMenu = ComponentType<DropdownMenuProps>;
export type DropdownMenuTrigger = ComponentType<DropdownMenuTriggerProps>;
export type DropdownMenuContent = ComponentType<DropdownMenuContentProps>;
export type DropdownMenuItem = ComponentType<DropdownMenuItemProps>;
export type DropdownMenuCheckboxItem = ComponentType<DropdownMenuCheckboxItemProps>;
export type DropdownMenuRadioGroup = ComponentType<DropdownMenuRadioGroupProps>;
export type DropdownMenuRadioItem = ComponentType<DropdownMenuRadioItemProps>;
export type DropdownMenuSub = ComponentType<DropdownMenuSubProps>;
export type DropdownMenuSubTrigger = ComponentType<DropdownMenuSubTriggerProps>;
export type DropdownMenuSubContent = ComponentType<DropdownMenuSubContentProps>;
export type DropdownMenuSeparator = ComponentType<DropdownMenuSeparatorProps>;

// #endregion

// #region Card

export type CardVariant = "default" | "ghost";

export interface CardProps {
    variant?: CardVariant;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type Card = ComponentType<CardProps>;

// #endregion

// #region Input

export interface InputProps {
    type?: string;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    [key: string]: any;
}

export type Input = ComponentType<InputProps>;

// #endregion

// #region Separator (Radix Separator)

export type SeparatorOrientation = "horizontal" | "vertical";

export interface SeparatorProps {
    orientation?: SeparatorOrientation;
    decorative?: boolean;
    className?: string;
    [key: string]: any;
}

export type Separator = ComponentType<SeparatorProps>;

// #endregion

// #region Settings

export interface SettingsRowProps {
    action?: ReactNode;
    hidden?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface SettingsTitleProps {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface SettingsDescriptionProps {
    children?: ReactNode;
    [key: string]: any;
}

export type SettingsRow = ComponentType<SettingsRowProps>;
export type SettingsTitle = ComponentType<SettingsTitleProps>;
export type SettingsDescription = ComponentType<SettingsDescriptionProps>;

// #endregion

// #region Sidebar

export type SidebarSide = "left" | "right";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarCollapsible = "offcanvas" | "icon" | "none";
export type SidebarState = "expanded" | "collapsed";

export interface SidebarContextValue {
    state: SidebarState;
    open: boolean;
    setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    isMobile: boolean;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    toggleSidebar: () => void;
    contentWidthClass: string;
}

export interface SidebarProviderProps {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    [key: string]: any;
}

export interface SidebarProps {
    side?: SidebarSide;
    variant?: SidebarVariant;
    collapsible?: SidebarCollapsible;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface SidebarTriggerProps {
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    iconSize?: number;
    [key: string]: any;
}

export interface SidebarMenuButtonProps {
    tooltip?: ReactNode;
    safeArea?: boolean;
    asChild?: boolean;
    isActive?: boolean;
    variant?: "default" | "outline";
    size?: "default" | "sm" | "lg";
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface SidebarGroupLabelProps {
    asChild?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type SidebarProvider = ComponentType<SidebarProviderProps>;
export type Sidebar = ComponentType<SidebarProps>;
export type SidebarContent = ComponentType<RadixSubProps>;
export type SidebarHeader = ComponentType<RadixSubProps>;
export type SidebarFooter = ComponentType<RadixSubProps>;
export type SidebarGroup = ComponentType<RadixSubProps>;
export type SidebarGroupLabel = ComponentType<SidebarGroupLabelProps>;
export type SidebarGroupAction = ComponentType<RadixSubProps>;
export type SidebarGroupContent = ComponentType<RadixSubProps>;
export type SidebarMenu = ComponentType<RadixSubProps>;
export type SidebarMenuItem = ComponentType<RadixSubProps>;
export type SidebarMenuButton = ComponentType<SidebarMenuButtonProps>;
export type SidebarMenuAction = ComponentType<RadixSubProps>;
export type SidebarMenuBadge = ComponentType<RadixSubProps>;
export type SidebarMenuSkeleton = ComponentType<RadixSubProps>;
export type SidebarMenuSub = ComponentType<RadixSubProps>;
export type SidebarMenuSubItem = ComponentType<RadixSubProps>;
export type SidebarMenuSubButton = ComponentType<RadixSubProps>;
export type SidebarInput = ComponentType<RadixSubProps>;
export type SidebarInset = ComponentType<RadixSubProps>;
export type SidebarRail = ComponentType<RadixSubProps>;
export type SidebarSeparator = ComponentType<RadixSubProps>;
export type SidebarTrigger = ComponentType<SidebarTriggerProps>;

// #endregion

// #region Toast (sonner)

export interface ToastOptions {
    id?: string | number;
    description?: ReactNode;
    duration?: number;
    icon?: ReactNode;
    action?: { label: string; onClick: () => void };
    cancel?: { label: string; onClick?: () => void };
    dismissible?: boolean;
    onDismiss?: (toast: any) => void;
    onAutoClose?: (toast: any) => void;
    className?: string;
    style?: CSSProperties;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
    [key: string]: any;
}

export interface ToastFn {
    (message: ReactNode, options?: ToastOptions): string | number;
    success(message: ReactNode, options?: ToastOptions): string | number;
    error(message: ReactNode, options?: ToastOptions): string | number;
    warning(message: ReactNode, options?: ToastOptions): string | number;
    info(message: ReactNode, options?: ToastOptions): string | number;
    loading(message: ReactNode, options?: ToastOptions): string | number;
    promise<T>(promise: Promise<T> | (() => Promise<T>), options?: { loading?: ReactNode; success?: ReactNode | ((data: T) => ReactNode); error?: ReactNode | ((error: any) => ReactNode) }): string | number;
    dismiss(id?: string | number): void;
    custom(jsx: (id: string | number) => ReactNode, options?: ToastOptions): string | number;
}

// #endregion

// #region Motion (framer-motion)

export interface MotionProps {
    whileHover?: Record<string, any>;
    whileTap?: Record<string, any>;
    whileFocus?: Record<string, any>;
    initial?: Record<string, any> | false;
    animate?: Record<string, any>;
    exit?: Record<string, any>;
    transition?: Record<string, any>;
    variants?: Record<string, any>;
    className?: string;
    style?: CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    children?: ReactNode;
    [key: string]: any;
}

// #endregion

// #region Slider (Radix Slider)

export interface SliderProps {
    value?: number[];
    defaultValue?: number[];
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
    [key: string]: any;
}

export type Slider = ComponentType<SliderProps>;

// #endregion

// #region Skeleton

export interface SkeletonProps {
    className?: string;
    pulse?: boolean;
    [key: string]: any;
}

export type Skeleton = ComponentType<SkeletonProps>;

// #endregion

// #region AnimatePresence (framer-motion)

export interface AnimatePresenceProps {
    initial?: boolean;
    mode?: "sync" | "wait" | "popLayout";
    onExitComplete?: () => void;
    children?: ReactNode;
}

export type AnimatePresence = ComponentType<AnimatePresenceProps>;

// #endregion

// #region Popover (Radix Popover)

export interface PopoverProps extends RadixRootProps {
    modal?: boolean;
}

export interface PopoverTriggerProps extends RadixTriggerProps {}

export interface PopoverContentProps extends RadixContentProps {
    onOpenAutoFocus?: (e: Event) => void;
    onCloseAutoFocus?: (e: Event) => void;
    onInteractOutside?: (e: Event) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    forceMount?: boolean;
}

export interface PopoverArrowProps {
    className?: string;
    width?: number;
    height?: number;
    [key: string]: any;
}

export type Popover = ComponentType<PopoverProps>;
export type PopoverTrigger = ComponentType<PopoverTriggerProps>;
export type PopoverContent = ComponentType<PopoverContentProps>;
export type PopoverArrow = ComponentType<PopoverArrowProps>;

// #endregion

// #region Tabs (Radix Tabs)

export interface TabsProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    orientation?: "horizontal" | "vertical";
    dir?: "ltr" | "rtl";
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface TabsListProps {
    loop?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface TabsTriggerProps {
    value?: string;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface TabsContentProps {
    value?: string;
    forceMount?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type Tabs = ComponentType<TabsProps>;
export type TabsList = ComponentType<TabsListProps>;
export type TabsTrigger = ComponentType<TabsTriggerProps>;
export type TabsContent = ComponentType<TabsContentProps>;

// #endregion

// #region Accordion (Radix Accordion)

export interface AccordionProps {
    type?: "single" | "multiple";
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    collapsible?: boolean;
    disabled?: boolean;
    dir?: "ltr" | "rtl";
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface AccordionItemProps {
    value?: string;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface AccordionTriggerProps {
    className?: string;
    chevronPosition?: "left" | "right";
    icon?: ReactNode;
    showIconOnly?: boolean;
    disabled?: boolean;
    children?: ReactNode;
    [key: string]: any;
}

export interface AccordionContentProps {
    forceMount?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type Accordion = ComponentType<AccordionProps>;
export type AccordionItem = ComponentType<AccordionItemProps>;
export type AccordionTrigger = ComponentType<AccordionTriggerProps>;
export type AccordionContent = ComponentType<AccordionContentProps>;

// #endregion

// #region Checkbox (Radix Checkbox)

export interface CheckboxProps {
    checked?: boolean | "indeterminate";
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean | "indeterminate") => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    className?: string;
    [key: string]: any;
}

export type Checkbox = ComponentType<CheckboxProps>;

// #endregion

// #region Textarea

export interface TextareaProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
    className?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    [key: string]: any;
}

export type Textarea = ComponentType<TextareaProps>;

// #endregion

// #region Spinner

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
    [key: string]: any;
}

export type Spinner = ComponentType<SpinnerProps>;

// #endregion

// #region Avatar

export interface AvatarProps {
    src?: string;
    alt?: string;
    fallback?: ReactNode;
    className?: string;
    [key: string]: any;
}

export type Avatar = ComponentType<AvatarProps>;

// #endregion

// #region Command (cmdk)

export interface CommandProps {
    value?: string;
    onValueChange?: (value: string) => void;
    filter?: (value: string, search: string) => number;
    loop?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface CommandInputProps {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    [key: string]: any;
}

export interface CommandListProps {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface CommandItemProps {
    value?: string;
    onSelect?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface CommandGroupProps {
    heading?: ReactNode;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface CommandEmptyProps {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type Command = ComponentType<CommandProps>;
export type CommandInput = ComponentType<CommandInputProps>;
export type CommandList = ComponentType<CommandListProps>;
export type CommandItem = ComponentType<CommandItemProps>;
export type CommandGroup = ComponentType<CommandGroupProps>;
export type CommandEmpty = ComponentType<CommandEmptyProps>;

// #endregion

// #region ContextMenu (Radix ContextMenu)

export interface ContextMenuProps extends RadixRootProps {}

export interface ContextMenuTriggerProps extends RadixTriggerProps {
    disabled?: boolean;
}

export interface ContextMenuContentProps extends RadixContentProps {
    loop?: boolean;
    onCloseAutoFocus?: (e: Event) => void;
    forceMount?: boolean;
}

export interface ContextMenuItemProps {
    onSelect?: (e: Event) => void;
    disabled?: boolean;
    inset?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface ContextMenuSubProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export interface ContextMenuSubTriggerProps extends ContextMenuItemProps {}
export interface ContextMenuSubContentProps extends RadixContentProps {}
export interface ContextMenuSeparatorProps extends RadixSubProps {}

export type ContextMenu = ComponentType<ContextMenuProps>;
export type ContextMenuTrigger = ComponentType<ContextMenuTriggerProps>;
export type ContextMenuContent = ComponentType<ContextMenuContentProps>;
export type ContextMenuItem = ComponentType<ContextMenuItemProps>;
export type ContextMenuSub = ComponentType<ContextMenuSubProps>;
export type ContextMenuSubTrigger = ComponentType<ContextMenuSubTriggerProps>;
export type ContextMenuSubContent = ComponentType<ContextMenuSubContentProps>;
export type ContextMenuSeparator = ComponentType<ContextMenuSeparatorProps>;

// #endregion

// #region ResponsiveDialog

export interface ResponsiveDialogProps extends DialogProps {}

export type ResponsiveDialog = ComponentType<ResponsiveDialogProps>;

// #endregion
