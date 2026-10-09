"use client";

import { useId } from "react";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEME_LABELS,
  EDITOR_THEMES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

interface Option<T> {
  value: T;
  label: string;
}

const FONT_SIZE_OPTIONS = EDITOR_FONT_SIZES.map((size) => ({ value: size, label: `${size}px` }));
const TAB_SIZE_OPTIONS = EDITOR_TAB_SIZES.map((size) => ({
  value: size,
  label: `${size} spaces`,
}));
const THEME_OPTIONS = EDITOR_THEMES.map((theme) => ({
  value: theme,
  label: EDITOR_THEME_LABELS[theme],
}));

// Each change saves straight away; there's no Save button
export function EditorPreferencesForm() {
  const { preferences, updatePreference } = useEditorPreferences();

  return (
    <div className="flex flex-col divide-y">
      <SelectRow
        label="Font size"
        value={preferences.fontSize}
        options={FONT_SIZE_OPTIONS}
        onChange={(value) => updatePreference("fontSize", value)}
      />
      <SelectRow
        label="Tab size"
        value={preferences.tabSize}
        options={TAB_SIZE_OPTIONS}
        onChange={(value) => updatePreference("tabSize", value)}
      />
      <SelectRow
        label="Theme"
        value={preferences.theme}
        options={THEME_OPTIONS}
        onChange={(value) => updatePreference("theme", value)}
      />
      <SwitchRow
        label="Word wrap"
        description="Wrap long lines instead of scrolling sideways"
        checked={preferences.wordWrap}
        onChange={(checked) => updatePreference("wordWrap", checked)}
      />
      <SwitchRow
        label="Minimap"
        description="Show a code overview along the right edge"
        checked={preferences.minimap}
        onChange={(checked) => updatePreference("minimap", checked)}
      />
    </div>
  );
}

interface SelectRowProps<T extends EditorPreferences[keyof EditorPreferences]> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

function SelectRow<T extends EditorPreferences[keyof EditorPreferences]>({
  label,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <Select
        value={value}
        items={options}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SwitchRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchRow({ label, description, checked, onChange }: SwitchRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3 last:pb-0">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
