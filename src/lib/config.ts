// Game configuration
export const GAME_CONFIG = {
  // Super admin FIDs that can reset the game and tag anyone
  SUPER_ADMIN_FIDS: [1626, 2, 6791], // Add more FIDs here if needed
  
  // Game settings
  AUTO_REFRESH_INTERVAL: 5000, // 5 seconds
  SEARCH_DEBOUNCE: 300, // 300ms
} as const;

export function isSuperAdmin(fid: number): boolean {
  return (GAME_CONFIG.SUPER_ADMIN_FIDS as readonly number[]).includes(fid);
}
