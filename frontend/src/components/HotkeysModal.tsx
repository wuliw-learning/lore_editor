import { Modal } from './Modal'

type Props = {
  onClose: () => void
}

const shortcuts = [
  ['Ctrl + K', 'Open search'],
  ['Ctrl + N', 'Create new root page'],
  ['Ctrl + S', 'Flush pending saves'],
  ['Ctrl + /', 'Open hotkeys help'],
  ['Esc', 'Close modal or slash menu'],
  ['ArrowUp / ArrowDown', 'Navigate slash menu'],
  ['Alt + ArrowUp', 'Move to previous block'],
  ['Alt + ArrowDown', 'Move to next block'],
  ['Enter', 'Select slash item or create next block'],
]

export function HotkeysModal({ onClose }: Props) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <div className="hotkeys-list">
        {shortcuts.map(([combo, meaning]) => (
          <div className="hotkey-row" key={combo}>
            <code>{combo}</code>
            <span>{meaning}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
