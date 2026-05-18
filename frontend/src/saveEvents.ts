export const FORCE_SAVE_EVENT = 'lore:flush-save'

export function requestSaveFlush() {
  window.dispatchEvent(new CustomEvent(FORCE_SAVE_EVENT))
}
