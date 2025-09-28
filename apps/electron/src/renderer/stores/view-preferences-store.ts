import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewMode = "grid";

interface ViewPreferencesState {
  serverViewMode: ViewMode;
}

export const useViewPreferencesStore = create<ViewPreferencesState>()(
  persist(
    () => ({
      serverViewMode: "grid",
    }),
    {
      name: "view-preferences",
    },
  ),
);
