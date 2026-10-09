"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  updateEditorPreferences,
  type UpdateEditorPreferencesResult,
} from "@/actions/editor-preferences";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

// One toast that updates in place instead of stacking on rapid changes
const TOAST_ID = "editor-preferences";
const SAVE_FAILED = "Couldn't save your editor settings. Please try again.";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K],
  ) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

interface EditorPreferencesProviderProps {
  initialPreferences: EditorPreferences;
  children: ReactNode;
}

// Holds the signed-in user's editor settings and saves each change as it's made
export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  // Refs so rapid changes build on each other without waiting for a render
  const currentRef = useRef(initialPreferences);
  const savedRef = useRef(initialPreferences);
  // Only the newest save may settle the state, so a slow older one can't undo a newer change
  const latestSaveRef = useRef(0);

  function apply(next: EditorPreferences) {
    currentRef.current = next;
    setPreferences(next);
  }

  async function save(next: EditorPreferences) {
    const saveId = ++latestSaveRef.current;
    let result: UpdateEditorPreferencesResult;
    try {
      result = await updateEditorPreferences(next);
    } catch {
      result = { success: false, error: SAVE_FAILED };
    }

    if (result.success) savedRef.current = result.data;
    if (saveId !== latestSaveRef.current) return;

    if (result.success) {
      toast.success("Editor preferences saved", { id: TOAST_ID });
    } else {
      apply(savedRef.current);
      toast.error(result.error, { id: TOAST_ID });
    }
  }

  const updatePreference: EditorPreferencesContextValue["updatePreference"] = (key, value) => {
    if (currentRef.current[key] === value) return;
    const next = { ...currentRef.current, [key]: value };
    apply(next);
    void save(next);
  };

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

// Falls back to the defaults outside the provider
export function useEditorPreferences(): EditorPreferencesContextValue {
  return (
    useContext(EditorPreferencesContext) ?? {
      preferences: DEFAULT_EDITOR_PREFERENCES,
      updatePreference: () => {},
    }
  );
}
