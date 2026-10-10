export type ToggleFavoriteResult =
  | { success: true; data: { isFavorite: boolean } }
  | { success: false; error: string };
