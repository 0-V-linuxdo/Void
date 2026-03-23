import type { ComponentType, CSSProperties, ReactElement, ReactNode } from "react";

// #region Common Radix props

export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";

export interface RadixContentProps {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionBoundary?: Element | Element[] | null;
    collisionPadding?: number | Partial<Record<Side, number>>;
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
	| "primary"
	| "secondary"
	| "tertiary"
	| "danger"
	| "text"
	| "textsecondary"
	| "none"
	| (string & {});

export type ButtonSize =
	| "xs"
	| "sm"
	| "md"
	| "xl"
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
    type?: "button" | "submit" | "reset";
    "aria-label"?: string;
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
    forceMount?: boolean;
    children?: ReactNode;
    onInteractOutside?: (e: Event) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    onCloseAutoFocus?: (e: Event) => void;
    [key: string]: any;
}

export interface DialogOverlayProps {
    className?: string;
    forceMount?: boolean;
    [key: string]: any;
}

export interface DialogPortalProps {
    forceMount?: boolean;
    container?: HTMLElement | null;
    children?: ReactNode;
}

export interface DialogHeaderProps extends RadixSubProps {}
export interface DialogFooterProps extends RadixSubProps {}
export interface DialogTitleProps extends RadixSubProps {}
export interface DialogDescriptionProps extends RadixSubProps {}
export interface DialogCloseProps extends RadixTriggerProps {}
export interface DialogTriggerProps extends RadixTriggerProps {}

export type Dialog = ComponentType<DialogProps>;
export type DialogContent = ComponentType<DialogContentProps>;
export type DialogOverlay = ComponentType<DialogOverlayProps>;
export type DialogPortal = ComponentType<DialogPortalProps>;
export type DialogHeader = ComponentType<DialogHeaderProps>;
export type DialogFooter = ComponentType<DialogFooterProps>;
export type DialogTitle = ComponentType<DialogTitleProps>;
export type DialogDescription = ComponentType<DialogDescriptionProps>;
export type DialogClose = ComponentType<DialogCloseProps>;
export type DialogTrigger = ComponentType<DialogTriggerProps>;

// #endregion

// #region Select (Radix Select)

export interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
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

export interface SelectContentProps extends RadixContentProps {
    position?: SelectContentPosition;
    showScrollButtons?: boolean;
}

export interface SelectItemProps {
    value: string;
    disabled?: boolean;
    asChild?: boolean;
    textValue?: string;
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
    form?: string;
    size?: SwitchSize;
    className?: string;
    [key: string]: any;
}

export type Switch = ComponentType<SwitchProps>;

// #endregion

// #region Tooltip (Radix Tooltip)

export interface TooltipProviderProps {
    delayDuration?: number;
    skipDelayDuration?: number;
    disableHoverableContent?: boolean;
    children?: ReactNode;
}

export interface TooltipProps extends RadixRootProps {
    delayDuration?: number;
    disableHoverableContent?: boolean;
}

export interface TooltipTriggerProps extends RadixTriggerProps {}

export interface TooltipContentProps extends RadixContentProps {
    disableAnimation?: boolean;
    container?: HTMLElement | null;
}

export type TooltipProvider = ComponentType<TooltipProviderProps>;
export type Tooltip = ComponentType<TooltipProps>;
export type TooltipTrigger = ComponentType<TooltipTriggerProps>;
export type TooltipContent = ComponentType<TooltipContentProps>;

// #endregion

// #region DropdownMenu (Radix DropdownMenu)

export interface DropdownMenuProps extends RadixRootProps {
    dir?: "ltr" | "rtl";
    modal?: boolean;
}

export interface DropdownMenuTriggerProps extends RadixTriggerProps {}

export interface DropdownMenuPortalProps {
    forceMount?: boolean;
    container?: HTMLElement | null;
    children?: ReactNode;
}

export interface DropdownMenuContentProps extends RadixContentProps {
    loop?: boolean;
    onCloseAutoFocus?: (e: Event) => void;
    forceMount?: boolean;
}

export interface DropdownMenuItemProps {
    onSelect?: (e: Event) => void;
    disabled?: boolean;
    inset?: boolean;
    textValue?: string;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type IndicatorPosition = "start" | "end";

export interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (checked: boolean) => void;
    indicatorPosition?: IndicatorPosition;
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
    indicatorPosition?: IndicatorPosition;
    indicatorType?: "circle" | "check";
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
export type DropdownMenuPortal = ComponentType<DropdownMenuPortalProps>;
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

export interface CardHeaderProps extends RadixSubProps {}
export interface CardTitleProps extends RadixSubProps {}
export interface CardDescriptionProps extends RadixSubProps {}
export interface CardContentProps extends RadixSubProps {}
export interface CardFooterProps extends RadixSubProps {}

export type Card = ComponentType<CardProps>;
export type CardHeader = ComponentType<CardHeaderProps>;
export type CardTitle = ComponentType<CardTitleProps>;
export type CardDescription = ComponentType<CardDescriptionProps>;
export type CardContent = ComponentType<CardContentProps>;
export type CardFooter = ComponentType<CardFooterProps>;

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
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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

// #region Badge

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "accent" | (string & {});

export interface BadgeProps {
    variant?: BadgeVariant;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

// #endregion

// #region AlertDialog

export interface AlertDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
    children?: ReactNode;
    [key: string]: any;
}

export interface AlertDialogContentProps {
    className?: string;
    children?: ReactNode;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    onOpenAutoFocus?: (e: Event) => void;
    [key: string]: any;
}

// #endregion

// #region Toast (sonner)

export interface ToastAction {
    label: string;
    onClick: (e: React.MouseEvent) => void;
}

export interface ToastOptions {
    id?: string | number;
    description?: ReactNode;
    duration?: number;
    icon?: ReactNode;
    action?: ToastAction | ReactElement;
    cancel?: ToastAction | ReactElement;
    dismissible?: boolean;
    closeButton?: boolean;
    onDismiss?: (toast: any) => void;
    onAutoClose?: (toast: any) => void;
    className?: string;
    classNames?: {
        toast?: string;
        title?: string;
        description?: string;
        icon?: string;
        actionButton?: string;
        cancelButton?: string;
        closeButton?: string;
        content?: string;
    };
    style?: CSSProperties;
    unstyled?: boolean;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
    richColors?: boolean;
    [key: string]: any;
}

export interface ToastPromiseOptions<T = any> {
    loading?: ReactNode;
    success?: ReactNode | ((data: T) => ReactNode);
    error?: ReactNode | ((error: any) => ReactNode);
}

export interface ToastFn {
    (message: ReactNode, options?: ToastOptions): string | number;
    success(message: ReactNode, options?: ToastOptions): string | number;
    error(message: ReactNode, options?: ToastOptions): string | number;
    warning(message: ReactNode, options?: ToastOptions): string | number;
    info(message: ReactNode, options?: ToastOptions): string | number;
    loading(message: ReactNode, options?: ToastOptions): string | number;
    message(message: ReactNode, options?: ToastOptions): string | number;
    promise<T>(promise: Promise<T> | (() => Promise<T>), options?: ToastPromiseOptions<T>): string | number;
    dismiss(id?: string | number): void;
    custom(jsx: (id: string | number) => ReactNode, options?: ToastOptions): string | number;
    getHistory(): any[];
    getToasts(): any[];
}

// #endregion

// #region Motion (framer-motion)

export interface MotionProps {
    whileHover?: Record<string, any>;
    whileTap?: Record<string, any>;
    whileFocus?: Record<string, any>;
    whileInView?: Record<string, any>;
    initial?: Record<string, any> | string | false;
    animate?: Record<string, any> | string;
    exit?: Record<string, any> | string;
    transition?: Record<string, any>;
    variants?: Record<string, Record<string, any>>;
    layout?: boolean | "position" | "size" | "preserve-aspect";
    layoutId?: string;
    drag?: boolean | "x" | "y";
    dragConstraints?: { top?: number; right?: number; bottom?: number; left?: number } | React.RefObject<Element>;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
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
    onValueCommit?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
    inverted?: boolean;
    minStepsBetweenThumbs?: number;
    name?: string;
    form?: string;
    dir?: "ltr" | "rtl";
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
    custom?: any;
    presenceAffectsLayout?: boolean;
    children?: ReactNode;
}

export type AnimatePresence = ComponentType<AnimatePresenceProps>;

// #endregion

// #region Popover (Radix Popover)

export interface PopoverProps extends RadixRootProps {
    modal?: boolean;
}

export interface PopoverTriggerProps extends RadixTriggerProps {
    hoverOpen?: boolean;
}

export interface PopoverContentProps extends RadixContentProps {
    onOpenAutoFocus?: (e: Event) => void;
    onCloseAutoFocus?: (e: Event) => void;
    onInteractOutside?: (e: Event) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    forceMount?: boolean;
    hoverOpen?: boolean;
    closeOnClick?: boolean;
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
    activationMode?: "automatic" | "manual";
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

export type TabsTriggerVariant = "default" | "underline";

export interface TabsTriggerProps {
    value?: string;
    variant?: TabsTriggerVariant;
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
    orientation?: "horizontal" | "vertical";
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

export type AccordionChevronPosition = "before" | "after";

export interface AccordionTriggerProps {
    className?: string;
    chevronPosition?: AccordionChevronPosition;
    chevronClassName?: string;
    icon?: ReactNode;
    showIconOnly?: boolean;
    disabled?: boolean;
    align?: "start";
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
    form?: string;
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
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    [key: string]: any;
}

export type Textarea = ComponentType<TextareaProps>;

// #endregion

// #region Spinner

export type SpinnerSize = "xxs" | "xs" | "sm" | "default" | "lg";

export interface SpinnerProps {
    size?: SpinnerSize;
    testId?: string;
    className?: string;
    [key: string]: any;
}

export type Spinner = ComponentType<SpinnerProps>;

// #endregion

// #region Avatar

export interface AvatarUser {
    givenName?: string;
    familyName?: string;
    profileImageUrl?: string;
}

export interface AvatarProps {
    user?: AvatarUser;
    fallbackText?: string;
    className?: string;
    textClassName?: string;
    [key: string]: any;
}

export type Avatar = ComponentType<AvatarProps>;

// #endregion

// #region Command (cmdk)

export interface CommandProps {
    value?: string;
    onValueChange?: (value: string) => void;
    filter?: (value: string, search: string) => number;
    shouldFilter?: boolean;
    loop?: boolean;
    label?: string;
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
    keywords?: string[];
    onSelect?: (value: string) => void;
    disabled?: boolean;
    forceMount?: boolean;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface CommandGroupProps {
    heading?: ReactNode;
    value?: string;
    forceMount?: boolean;
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

// #region Drawer (Vaul Drawer)

export interface DrawerProps extends RadixRootProps {
    shouldScaleBackground?: boolean;
    closeThreshold?: number;
    snapPoints?: (number | string)[];
    activeSnapPoint?: number | string | null;
    setActiveSnapPoint?: (snapPoint: number | string | null) => void;
    direction?: "top" | "right" | "bottom" | "left";
    dismissible?: boolean;
    modal?: boolean;
}

export interface DrawerContentProps {
    className?: string;
    children?: ReactNode;
    onInteractOutside?: (e: Event) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    [key: string]: any;
}

export interface DrawerTriggerProps extends RadixTriggerProps {}
export interface DrawerHeaderProps extends RadixSubProps {}
export interface DrawerFooterProps extends RadixSubProps {}
export interface DrawerTitleProps extends RadixSubProps {}
export interface DrawerDescriptionProps extends RadixSubProps {}

export type Drawer = ComponentType<DrawerProps>;
export type DrawerContent = ComponentType<DrawerContentProps>;
export type DrawerTrigger = ComponentType<DrawerTriggerProps>;
export type DrawerHeader = ComponentType<DrawerHeaderProps>;
export type DrawerFooter = ComponentType<DrawerFooterProps>;
export type DrawerTitle = ComponentType<DrawerTitleProps>;
export type DrawerDescription = ComponentType<DrawerDescriptionProps>;

// #endregion

// #region Table

export interface TableProps {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export interface TableHeaderProps extends RadixSubProps {}
export interface TableBodyProps extends RadixSubProps {}
export interface TableRowProps extends RadixSubProps {}
export interface TableHeadProps extends RadixSubProps {}
export interface TableCellProps extends RadixSubProps {}

export type Table = ComponentType<TableProps>;
export type TableHeader = ComponentType<TableHeaderProps>;
export type TableBody = ComponentType<TableBodyProps>;
export type TableRow = ComponentType<TableRowProps>;
export type TableHead = ComponentType<TableHeadProps>;
export type TableCell = ComponentType<TableCellProps>;

// #endregion

// #region Label

export interface LabelProps {
    htmlFor?: string;
    className?: string;
    children?: ReactNode;
    [key: string]: any;
}

export type Label = ComponentType<LabelProps>;

// #endregion

// #region HoverCard

export interface HoverCardProps extends RadixRootProps {
    openDelay?: number;
    closeDelay?: number;
}

export interface HoverCardTriggerProps extends RadixTriggerProps {}

export interface HoverCardContentProps extends RadixContentProps {
    forceMount?: boolean;
}

export type HoverCard = ComponentType<HoverCardProps>;
export type HoverCardTrigger = ComponentType<HoverCardTriggerProps>;
export type HoverCardContent = ComponentType<HoverCardContentProps>;

// #endregion

// #region Portal

export interface PortalProps {
    container?: HTMLElement | null;
    children?: ReactNode;
    [key: string]: any;
}

export type Portal = ComponentType<PortalProps>;

// #endregion

// #endregion

