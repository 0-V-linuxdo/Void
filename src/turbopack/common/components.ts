/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type {
    AccordionContentProps,
    AccordionItemProps,
    AccordionProps,
    AccordionTriggerProps,
    AvatarProps,
    ButtonProps,
    ButtonWithTooltipProps,
    CardProps,
    CheckboxProps,
    CommandEmptyProps,
    CommandGroupProps,
    CommandInputProps,
    CommandItemProps,
    CommandListProps,
    CommandProps,
    DialogContentProps,
    DialogHeaderProps,
    DialogProps,
    DropdownMenuCheckboxItemProps,
    DropdownMenuContentProps,
    DropdownMenuItemProps,
    DropdownMenuProps,
    DropdownMenuRadioGroupProps,
    DropdownMenuRadioItemProps,
    DropdownMenuSeparatorProps,
    DropdownMenuSubContentProps,
    DropdownMenuSubProps,
    DropdownMenuSubTriggerProps,
    DropdownMenuTriggerProps,
    InputProps,
    MotionProps,
    PopoverArrowProps,
    PopoverContentProps,
    PopoverProps,
    PopoverTriggerProps,
    RadixSubProps,
    ResponsiveDialogProps,
    SelectContentProps,
    SelectItemProps,
    SelectProps,
    SelectTriggerProps,
    SelectValueProps,
    SeparatorProps,
    SettingsDescriptionProps,
    SettingsRowProps,
    SettingsTitleProps,
    SkeletonProps,
    SliderProps,
    SpinnerProps,
    SwitchProps,
    TabsContentProps,
    TabsListProps,
    TabsProps,
    TabsTriggerProps,
    TextareaProps,
    TooltipContentProps,
    TooltipProps,
    TooltipTriggerProps,
} from "@grok-types";
import type { ComponentType } from "react";

import { filters, findByProps, findByPropsLazy, findExportedComponent, waitFor } from "../turbopack";
import { type AnyComponent, LazyComponent } from "./react";

export type {
    AccordionContentProps,
    AccordionItemProps,
    AccordionProps,
    AccordionTriggerProps,
    AvatarProps,
    ButtonProps,
    ButtonShape,
    ButtonSize,
    ButtonVariant,
    ButtonWithTooltipProps,
    CardProps,
    CardVariant,
    CheckboxProps,
    CommandEmptyProps,
    CommandGroupProps,
    CommandInputProps,
    CommandItemProps,
    CommandListProps,
    CommandProps,
    DialogCloseProps,
    DialogContentProps,
    DialogDescriptionProps,
    DialogFooterProps,
    DialogHeaderProps,
    DialogProps,
    DialogTitleProps,
    DropdownMenuCheckboxItemProps,
    DropdownMenuContentProps,
    DropdownMenuItemProps,
    DropdownMenuProps,
    DropdownMenuRadioGroupProps,
    DropdownMenuRadioItemProps,
    DropdownMenuSeparatorProps,
    DropdownMenuSubContentProps,
    DropdownMenuSubProps,
    DropdownMenuSubTriggerProps,
    DropdownMenuTriggerProps,
    InputProps,
    MotionProps,
    PopoverArrowProps,
    PopoverContentProps,
    PopoverProps,
    PopoverTriggerProps,
    ResponsiveDialogProps,
    SelectContentPosition,
    SelectContentProps,
    SelectItemProps,
    SelectProps,
    SelectTriggerProps,
    SelectTriggerSize,
    SelectValueProps,
    SeparatorOrientation,
    SeparatorProps,
    SettingsDescriptionProps,
    SettingsRowProps,
    SettingsTitleProps,
    SkeletonProps,
    SliderProps,
    SpinnerProps,
    SpinnerSize,
    SwitchProps,
    SwitchSize,
    TabsContentProps,
    TabsListProps,
    TabsProps,
    TabsTriggerProps,
    TextareaProps,
    ToastFn,
    ToastOptions,
    TooltipContentProps,
    TooltipProps,
    TooltipTriggerProps,
} from "@grok-types";

let buttonModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("Button", "ButtonWithTooltipOptimized"), m => {
    buttonModule = m;
});

const buttonLazy = <T extends ComponentType<any>>(name: string) =>
    LazyComponent(name, () => (buttonModule?.[name] ?? findExportedComponent(name)) as any) as T;

export const Button = buttonLazy<ComponentType<ButtonProps>>("Button");
export const ButtonWithTooltip = buttonLazy<ComponentType<ButtonWithTooltipProps>>("ButtonWithTooltip");

export const Card: ComponentType<CardProps> = LazyComponent("Card", () => findExportedComponent("Card"));

let dialogModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("Dialog", "DialogContent", "DialogHeader"), m => {
    dialogModule = m;
});

const dialogLazy = (name: string): AnyComponent => LazyComponent(name, () => (dialogModule?.[name] ?? findExportedComponent(name)) as AnyComponent | null);

export const Dialog: ComponentType<DialogProps> = dialogLazy("Dialog");
export const DialogContent: ComponentType<DialogContentProps> = dialogLazy("DialogContent");

export const DialogHeader: ComponentType<DialogHeaderProps> = dialogLazy("DialogHeader");
export const DialogTitle: ComponentType<RadixSubProps> = dialogLazy("DialogTitle");
export const DialogDescription: ComponentType<RadixSubProps> = dialogLazy("DialogDescription");
export const DialogFooter: ComponentType<RadixSubProps> = dialogLazy("DialogFooter");
export const DialogClose: ComponentType<RadixSubProps> = dialogLazy("DialogClose");

let dropdownMenuModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("DropdownMenu", "DropdownMenuContent", "DropdownMenuTrigger"), m => {
    dropdownMenuModule = m;
});

const dropdownMenuLazy = (name: string): AnyComponent => LazyComponent(name, () => (dropdownMenuModule?.[name] ?? findExportedComponent(name)) as AnyComponent | null);

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

export const Input: ComponentType<InputProps> = LazyComponent("Input", () => findExportedComponent("Input"));

export const MotionDiv: ComponentType<MotionProps> = LazyComponent("MotionDiv", () => findByProps("motion")?.motion?.div);

export const Select: ComponentType<SelectProps> = LazyComponent("Select", () => findExportedComponent("Select"));
export const SelectTrigger: ComponentType<SelectTriggerProps> = LazyComponent("SelectTrigger", () => findExportedComponent("SelectTrigger"));
export const SelectContent: ComponentType<SelectContentProps> = LazyComponent("SelectContent", () => findExportedComponent("SelectContent"));
export const SelectItem: ComponentType<SelectItemProps> = LazyComponent("SelectItem", () => findExportedComponent("SelectItem"));
export const SelectValue: ComponentType<SelectValueProps> = LazyComponent("SelectValue", () => findExportedComponent("SelectValue"));

export const Separator: ComponentType<SeparatorProps> = LazyComponent("Separator", () => findExportedComponent("Separator"));

export const Skeleton: ComponentType<SkeletonProps> = LazyComponent("Skeleton", () => findExportedComponent("Skeleton"));

export const Slider: ComponentType<SliderProps> = LazyComponent("Slider", () => findExportedComponent("Slider"));

export const SettingsRow: ComponentType<SettingsRowProps> = LazyComponent("SettingsRow", () => findExportedComponent("SettingsRow"));
export const SettingsTitle: ComponentType<SettingsTitleProps> = LazyComponent("SettingsTitle", () => findExportedComponent("SettingsTitle"));
export const SettingsDescription: ComponentType<SettingsDescriptionProps> = LazyComponent("SettingsDescription", () => findExportedComponent("SettingsDescription"));

export const Switch: ComponentType<SwitchProps> = LazyComponent("Switch", () => findExportedComponent("Switch"));

export const Tooltip: ComponentType<TooltipProps> = LazyComponent("Tooltip", () => findExportedComponent("Tooltip"));
export const TooltipTrigger: ComponentType<TooltipTriggerProps> = LazyComponent("TooltipTrigger", () => findExportedComponent("TooltipTrigger"));
export const TooltipContent: ComponentType<TooltipContentProps> = LazyComponent("TooltipContent", () => findExportedComponent("TooltipContent"));

export const { toast } = findByPropsLazy("toast", "Toaster");

export const Textarea: ComponentType<TextareaProps> = LazyComponent("Textarea", () => findExportedComponent("Textarea"));

export const Checkbox: ComponentType<CheckboxProps> = LazyComponent("Checkbox", () => findExportedComponent("Checkbox"));

export const Spinner: ComponentType<SpinnerProps> = LazyComponent("Spinner", () => findExportedComponent("Spinner"));

export const Avatar: ComponentType<AvatarProps> = LazyComponent("Avatar", () => findExportedComponent("Avatar"));

let popoverModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("Popover", "PopoverContent", "PopoverTrigger"), m => {
    popoverModule = m;
});

const popoverLazy = (name: string): AnyComponent => LazyComponent(name, () => (popoverModule?.[name] ?? findExportedComponent(name)) as AnyComponent | null);

export const Popover: ComponentType<PopoverProps> = popoverLazy("Popover");
export const PopoverTrigger: ComponentType<PopoverTriggerProps> = popoverLazy("PopoverTrigger");
export const PopoverContent: ComponentType<PopoverContentProps> = popoverLazy("PopoverContent");
export const PopoverArrow: ComponentType<PopoverArrowProps> = popoverLazy("PopoverArrow");

let tabsModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("Tabs", "TabsList", "TabsTrigger", "TabsContent"), m => {
    tabsModule = m;
});

const tabsLazy = (name: string): AnyComponent => LazyComponent(name, () => (tabsModule?.[name] ?? findExportedComponent(name)) as AnyComponent | null);

export const Tabs: ComponentType<TabsProps> = tabsLazy("Tabs");
export const TabsList: ComponentType<TabsListProps> = tabsLazy("TabsList");
export const TabsTrigger: ComponentType<TabsTriggerProps> = tabsLazy("TabsTrigger");
export const TabsContent: ComponentType<TabsContentProps> = tabsLazy("TabsContent");

let accordionModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("Accordion", "AccordionContent", "AccordionItem"), m => {
    accordionModule = m;
});

const accordionLazy = (name: string): AnyComponent => LazyComponent(name, () => (accordionModule?.[name] ?? findExportedComponent(name)) as AnyComponent | null);

export const Accordion: ComponentType<AccordionProps> = accordionLazy("Accordion");
export const AccordionItem: ComponentType<AccordionItemProps> = accordionLazy("AccordionItem");
export const AccordionTrigger: ComponentType<AccordionTriggerProps> = accordionLazy("AccordionTrigger");
export const AccordionContent: ComponentType<AccordionContentProps> = accordionLazy("AccordionContent");

let commandModule: Record<string, ComponentType> | null = null;

waitFor(filters.byProps("Command", "CommandInput", "CommandList", "CommandItem"), m => {
    commandModule = m;
});

const commandLazy = (name: string): AnyComponent => LazyComponent(name, () => (commandModule?.[name] ?? findExportedComponent(name)) as AnyComponent | null);

export const Command: ComponentType<CommandProps> = commandLazy("Command");
export const CommandInput: ComponentType<CommandInputProps> = commandLazy("CommandInput");
export const CommandList: ComponentType<CommandListProps> = commandLazy("CommandList");
export const CommandItem: ComponentType<CommandItemProps> = commandLazy("CommandItem");
export const CommandGroup: ComponentType<CommandGroupProps> = commandLazy("CommandGroup");
export const CommandEmpty: ComponentType<CommandEmptyProps> = commandLazy("CommandEmpty");

export const ResponsiveDialog: ComponentType<ResponsiveDialogProps> = LazyComponent("ResponsiveDialog", () => findExportedComponent("ResponsiveDialog"));

export const SidebarComponents = findByPropsLazy("Sidebar", "SidebarContent", "SidebarProvider");
export const AnimatePresence = LazyComponent("AnimatePresence", () => findExportedComponent("AnimatePresence"));
