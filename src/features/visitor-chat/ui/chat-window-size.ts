/** Desktop chat window size (chat design §4). Its own module so the launcher can place the window before its chunk loads. */
export const CHAT_WINDOW_SIZE = { width: 380, height: 572 } as const;

/** The window's top never rises above this: the 56 px navbar strip plus a 16 px gap. */
export const CHAT_WINDOW_TOP_MIN = 72;

/** Below this height the window stops avoiding the launcher and takes the whole free column instead. */
export const CHAT_WINDOW_MIN_HEIGHT = 280;

/** Space between the bead and the window. */
export const CHAT_WINDOW_GAP = 12;
