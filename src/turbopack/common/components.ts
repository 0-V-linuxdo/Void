/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* eslint-disable unused-imports/no-unused-imports */
import type {
    AccordionContentProps, AccordionItemProps, AccordionProps, AccordionTriggerProps,
    AlertDialogContentProps, AlertDialogProps, AvatarProps, BadgeProps, ButtonProps, ButtonWithTooltipProps,
    CardContentProps, CardHeaderProps, CardProps, CardTitleProps, CheckboxProps,
    CommandEmptyProps, CommandGroupProps, CommandInputProps, CommandItemProps, CommandListProps, CommandProps,
    DialogContentProps, DialogHeaderProps, DialogOverlayProps, DialogPortalProps, DialogProps, DialogTriggerProps,
    DrawerContentProps, DrawerDescriptionProps, DrawerFooterProps, DrawerHeaderProps, DrawerProps, DrawerTitleProps, DrawerTriggerProps,
    DropdownMenuCheckboxItemProps, DropdownMenuContentProps, DropdownMenuItemProps, DropdownMenuPortalProps,
    DropdownMenuProps, DropdownMenuRadioGroupProps, DropdownMenuRadioItemProps, DropdownMenuSeparatorProps,
    DropdownMenuSubContentProps, DropdownMenuSubProps, DropdownMenuSubTriggerProps, DropdownMenuTriggerProps,
    HoverCardContentProps, HoverCardProps, HoverCardTriggerProps,
    InputProps, LabelProps, MotionProps,
    PopoverArrowProps, PopoverContentProps, PopoverProps, PopoverTriggerProps,
    PortalProps, RadixSubProps, ResponsiveDialogProps,
    SelectContentProps, SelectItemProps, SelectProps, SelectTriggerProps, SelectValueProps,
    SeparatorProps, SettingsDescriptionProps, SettingsRowProps, SettingsTitleProps,
    SkeletonProps, SliderProps, SpinnerProps, SwitchProps,
    TableBodyProps, TableCellProps, TableHeadProps, TableHeaderProps, TableProps, TableRowProps,
    TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps, TextareaProps,
    TooltipContentProps, TooltipProps, TooltipProviderProps, TooltipTriggerProps,
} from "@grok-types";
import type { ComponentType } from "react";

import { filters, findByProps, findByPropsLazy, findExportedComponent, waitFor } from "../turbopack";
import { type AnyComponent, LazyComponent } from "./react";

export type {
    AccordionContentProps, AccordionItemProps, AccordionProps, AccordionTriggerProps,
    AlertDialogContentProps, AlertDialogProps, AvatarProps, BadgeProps, BadgeVariant,
    ButtonProps, ButtonShape, ButtonSize, ButtonVariant, ButtonWithTooltipProps,
    CardContentProps, CardHeaderProps, CardProps, CardTitleProps, CardVariant, CheckboxProps,
    CommandEmptyProps, CommandGroupProps, CommandInputProps, CommandItemProps, CommandListProps, CommandProps,
    DialogCloseProps, DialogContentProps, DialogDescriptionProps, DialogFooterProps,
    DialogHeaderProps, DialogOverlayProps, DialogPortalProps, DialogProps, DialogTitleProps, DialogTriggerProps,
    DrawerContentProps, DrawerDescriptionProps, DrawerFooterProps, DrawerHeaderProps, DrawerProps, DrawerTitleProps, DrawerTriggerProps,
    DropdownMenuCheckboxItemProps, DropdownMenuContentProps, DropdownMenuItemProps, DropdownMenuPortalProps,
    DropdownMenuProps, DropdownMenuRadioGroupProps, DropdownMenuRadioItemProps, DropdownMenuSeparatorProps,
    DropdownMenuSubContentProps, DropdownMenuSubProps, DropdownMenuSubTriggerProps, DropdownMenuTriggerProps,
    HoverCardContentProps, HoverCardProps, HoverCardTriggerProps,
    InputProps, LabelProps, MotionProps,
    PopoverArrowProps, PopoverContentProps, PopoverProps, PopoverTriggerProps,
    PortalProps, ResponsiveDialogProps,
    SelectContentPosition, SelectContentProps, SelectItemProps, SelectProps, SelectTriggerProps, SelectTriggerSize, SelectValueProps,
    SeparatorOrientation, SeparatorProps,
    SettingsDescriptionProps, SettingsRowProps, SettingsTitleProps,
    SkeletonProps, SliderProps, SpinnerProps, SpinnerSize, SwitchProps, SwitchSize,
    TableBodyProps, TableCellProps, TableHeadProps, TableHeaderProps, TableProps, TableRowProps,
    TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps, TextareaProps,
    TooltipContentProps, TooltipProps, TooltipProviderProps, TooltipTriggerProps,
} from "@grok-types";

function createModuleLazy(...filterProps: string[]) {
    let mod: Record<string, ComponentType> | null = null;
    waitFor(filters.byProps(...filterProps), m => { mod = m; });
    return (name: string): AnyComponent => LazyComponent(name, () => (mod?.[name] ?? findExportedComponent(name)) as AnyComponent | null);
}

const buttonLazy = createModuleLazy("Button", "ButtonWithPopover");
export const Button: ComponentType<ButtonProps> = buttonLazy("Button");

// ButtonWithTooltip must come from the legacy module (which Grok's chat bar uses).
// The new module (with ButtonWithPopover) has different variant/size enums and breaks chat bar buttons.
let legacyButtonMod: Record<string, ComponentType> | null = null;
waitFor(m => m.ButtonWithTooltip != null && m.Button != null && !m.ButtonWithPopover, m => { legacyButtonMod = m; });
export const ButtonWithTooltip: ComponentType<ButtonWithTooltipProps> = LazyComponent("ButtonWithTooltip", () => legacyButtonMod?.ButtonWithTooltip as AnyComponent | null);

const cardLazy = createModuleLazy("Card", "CardContent", "CardHeader", "CardTitle");
export const Card: ComponentType<CardProps> = cardLazy("Card");
export const CardContent: ComponentType<CardContentProps> = cardLazy("CardContent");
export const CardHeader: ComponentType<CardHeaderProps> = cardLazy("CardHeader");
export const CardTitle: ComponentType<CardTitleProps> = cardLazy("CardTitle");

const dialogLazy = createModuleLazy("Dialog", "DialogContent", "DialogHeader");
export const Dialog: ComponentType<DialogProps> = dialogLazy("Dialog");
export const DialogContent: ComponentType<DialogContentProps> = dialogLazy("DialogContent");
export const DialogHeader: ComponentType<DialogHeaderProps> = dialogLazy("DialogHeader");
export const DialogTitle: ComponentType<RadixSubProps> = dialogLazy("DialogTitle");
export const DialogDescription: ComponentType<RadixSubProps> = dialogLazy("DialogDescription");
export const DialogFooter: ComponentType<RadixSubProps> = dialogLazy("DialogFooter");
export const DialogClose: ComponentType<RadixSubProps> = dialogLazy("DialogClose");
export const DialogTrigger: ComponentType<DialogTriggerProps> = dialogLazy("DialogTrigger");
export const DialogOverlay: ComponentType<DialogOverlayProps> = dialogLazy("DialogOverlay");
export const DialogPortal: ComponentType<DialogPortalProps> = dialogLazy("DialogPortal");

const dropdownMenuLazy = createModuleLazy("DropdownMenu", "DropdownMenuContent", "DropdownMenuTrigger");
export const DropdownMenu: ComponentType<DropdownMenuProps> = dropdownMenuLazy("DropdownMenu");
export const DropdownMenuTrigger: ComponentType<DropdownMenuTriggerProps> = dropdownMenuLazy("DropdownMenuTrigger");
export const DropdownMenuContent: ComponentType<DropdownMenuContentProps> = dropdownMenuLazy("DropdownMenuContent");
export const DropdownMenuItem: ComponentType<DropdownMenuItemProps> = dropdownMenuLazy("DropdownMenuItem");
export const DropdownMenuCheckboxItem: ComponentType<DropdownMenuCheckboxItemProps> = dropdownMenuLazy("DropdownMenuCheckboxItem");
export const DropdownMenuRadioGroup: ComponentType<DropdownMenuRadioGroupProps> = dropdownMenuLazy("DropdownMenuRadioGroup");
export const DropdownMenuRadioItem: ComponentType<DropdownMenuRadioItemProps> = dropdownMenuLazy("DropdownMenuRadioItem");
export const DropdownMenuSeparator: ComponentType<DropdownMenuSeparatorProps> = dropdownMenuLazy("DropdownMenuSeparator");
export const DropdownMenuSub: ComponentType<DropdownMenuSubProps> = dropdownMenuLazy("DropdownMenuSub");
export const DropdownMenuSubTrigger: ComponentType<DropdownMenuSubTriggerProps> = dropdownMenuLazy("DropdownMenuSubTrigger");
export const DropdownMenuSubContent: ComponentType<DropdownMenuSubContentProps> = dropdownMenuLazy("DropdownMenuSubContent");
export const DropdownMenuPortal: ComponentType<DropdownMenuPortalProps> = dropdownMenuLazy("DropdownMenuPortal");

const drawerLazy = createModuleLazy("Drawer", "DrawerContent", "DrawerTrigger");
export const Drawer: ComponentType<DrawerProps> = drawerLazy("Drawer");
export const DrawerContent: ComponentType<DrawerContentProps> = drawerLazy("DrawerContent");
export const DrawerTrigger: ComponentType<DrawerTriggerProps> = drawerLazy("DrawerTrigger");
export const DrawerDescription: ComponentType<DrawerDescriptionProps> = drawerLazy("DrawerDescription");
export const DrawerFooter: ComponentType<DrawerFooterProps> = drawerLazy("DrawerFooter");
export const DrawerHeader: ComponentType<DrawerHeaderProps> = drawerLazy("DrawerHeader");
export const DrawerTitle: ComponentType<DrawerTitleProps> = drawerLazy("DrawerTitle");

const hoverCardLazy = createModuleLazy("HoverCard", "HoverCardContent", "HoverCardTrigger");
export const HoverCard: ComponentType<HoverCardProps> = hoverCardLazy("HoverCard");
export const HoverCardContent: ComponentType<HoverCardContentProps> = hoverCardLazy("HoverCardContent");
export const HoverCardTrigger: ComponentType<HoverCardTriggerProps> = hoverCardLazy("HoverCardTrigger");

export const Input: ComponentType<InputProps> = LazyComponent("Input", () => findExportedComponent("Input"));
export const Label: ComponentType<LabelProps> = LazyComponent("Label", () => findExportedComponent("Label"));
export const MotionDiv: ComponentType<MotionProps> = LazyComponent("MotionDiv", () => findByProps("motion")?.motion?.div);
export const Portal: ComponentType<PortalProps> = LazyComponent("Portal", () => findExportedComponent("Portal"));
export const ResponsiveDialog: ComponentType<ResponsiveDialogProps> = drawerLazy("ResponsiveDialog");

const selectLazy = createModuleLazy("Select", "SelectContent", "SelectTrigger");
export const Select: ComponentType<SelectProps> = selectLazy("Select");
export const SelectTrigger: ComponentType<SelectTriggerProps> = selectLazy("SelectTrigger");
export const SelectContent: ComponentType<SelectContentProps> = selectLazy("SelectContent");
export const SelectItem: ComponentType<SelectItemProps> = selectLazy("SelectItem") as any;
export const SelectValue: ComponentType<SelectValueProps> = selectLazy("SelectValue");

export const Separator: ComponentType<SeparatorProps> = LazyComponent("Separator", () => findExportedComponent("Separator"));

const settingsLazy = createModuleLazy("SettingsRow", "SettingsTitle", "SettingsDescription");
export const SettingsRow: ComponentType<SettingsRowProps> = settingsLazy("SettingsRow");
export const SettingsTitle: ComponentType<SettingsTitleProps> = settingsLazy("SettingsTitle");
export const SettingsDescription: ComponentType<SettingsDescriptionProps> = settingsLazy("SettingsDescription");

export const Skeleton: ComponentType<SkeletonProps> = LazyComponent("Skeleton", () => findExportedComponent("Skeleton"));
export const Slider: ComponentType<SliderProps> = LazyComponent("Slider", () => findExportedComponent("Slider"));
export const Switch: ComponentType<SwitchProps> = LazyComponent("Switch", () => findExportedComponent("Switch"));

const tableLazy = createModuleLazy("Table", "TableBody", "TableCell");
export const Table: ComponentType<TableProps> = tableLazy("Table");
export const TableBody: ComponentType<TableBodyProps> = tableLazy("TableBody");
export const TableCell: ComponentType<TableCellProps> = tableLazy("TableCell");
export const TableHead: ComponentType<TableHeadProps> = tableLazy("TableHead");
export const TableHeader: ComponentType<TableHeaderProps> = tableLazy("TableHeader");
export const TableRow: ComponentType<TableRowProps> = tableLazy("TableRow");

const tooltipLazy = createModuleLazy("Tooltip", "TooltipTrigger", "TooltipContent");
export const Tooltip: ComponentType<TooltipProps> = tooltipLazy("Tooltip");
export const TooltipTrigger: ComponentType<TooltipTriggerProps> = tooltipLazy("TooltipTrigger");
export const TooltipContent: ComponentType<TooltipContentProps> = tooltipLazy("TooltipContent");
export const TooltipProvider: ComponentType<TooltipProviderProps> = tooltipLazy("TooltipProvider");

export const Textarea: ComponentType<TextareaProps> = LazyComponent("Textarea", () => findExportedComponent("Textarea"));
export const Checkbox: ComponentType<CheckboxProps> = LazyComponent("Checkbox", () => findExportedComponent("Checkbox"));
export const Spinner: ComponentType<SpinnerProps> = LazyComponent("Spinner", () => findExportedComponent("Spinner"));
export const Avatar: ComponentType<AvatarProps> = LazyComponent("Avatar", () => findExportedComponent("Avatar"));

const popoverLazy = createModuleLazy("Popover", "PopoverContent", "PopoverTrigger");
export const Popover: ComponentType<PopoverProps> = popoverLazy("Popover");
export const PopoverTrigger: ComponentType<PopoverTriggerProps> = popoverLazy("PopoverTrigger");
export const PopoverContent: ComponentType<PopoverContentProps> = popoverLazy("PopoverContent");
export const PopoverArrow: ComponentType<PopoverArrowProps> = popoverLazy("PopoverArrow");

const tabsLazy = createModuleLazy("Tabs", "TabsList", "TabsTrigger", "TabsContent");
export const Tabs: ComponentType<TabsProps> = tabsLazy("Tabs");
export const TabsList: ComponentType<TabsListProps> = tabsLazy("TabsList");
export const TabsTrigger: ComponentType<TabsTriggerProps> = tabsLazy("TabsTrigger");
export const TabsContent: ComponentType<TabsContentProps> = tabsLazy("TabsContent");

const accordionLazy = createModuleLazy("Accordion", "AccordionContent", "AccordionItem");
export const Accordion: ComponentType<AccordionProps> = accordionLazy("Accordion");
export const AccordionItem: ComponentType<AccordionItemProps> = accordionLazy("AccordionItem");
export const AccordionTrigger: ComponentType<AccordionTriggerProps> = accordionLazy("AccordionTrigger");
export const AccordionContent: ComponentType<AccordionContentProps> = accordionLazy("AccordionContent");

const commandLazy = createModuleLazy("Command", "CommandInput", "CommandList", "CommandItem");
export const Command: ComponentType<CommandProps> = commandLazy("Command");
export const CommandInput: ComponentType<CommandInputProps> = commandLazy("CommandInput");
export const CommandList: ComponentType<CommandListProps> = commandLazy("CommandList");
export const CommandItem: ComponentType<CommandItemProps> = commandLazy("CommandItem");
export const CommandGroup: ComponentType<CommandGroupProps> = commandLazy("CommandGroup");
export const CommandEmpty: ComponentType<CommandEmptyProps> = commandLazy("CommandEmpty");

export const Badge: ComponentType<BadgeProps> = LazyComponent("Badge", () => findExportedComponent("Badge"));

const alertDialogLazy = createModuleLazy("AlertDialog", "AlertDialogContent", "AlertDialogAction");
export const AlertDialog: ComponentType<AlertDialogProps> = alertDialogLazy("AlertDialog");
export const AlertDialogTrigger: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogTrigger");
export const AlertDialogContent: ComponentType<AlertDialogContentProps> = alertDialogLazy("AlertDialogContent");
export const AlertDialogHeader: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogHeader");
export const AlertDialogFooter: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogFooter");
export const AlertDialogTitle: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogTitle");
export const AlertDialogDescription: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogDescription");
export const AlertDialogAction: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogAction");
export const AlertDialogCancel: ComponentType<RadixSubProps> = alertDialogLazy("AlertDialogCancel");

const toggleGroupLazy = createModuleLazy("ToggleGroup", "ToggleGroupItem");
export const ToggleGroup: ComponentType<RadixSubProps> = toggleGroupLazy("ToggleGroup");
export const ToggleGroupItem: ComponentType<RadixSubProps> = toggleGroupLazy("ToggleGroupItem");

export const SidebarComponents = findByPropsLazy("Sidebar", "SidebarContent", "SidebarProvider");
export const AnimatePresence = LazyComponent("AnimatePresence", () => findExportedComponent("AnimatePresence"));
