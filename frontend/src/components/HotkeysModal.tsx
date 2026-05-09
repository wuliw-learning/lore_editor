import { Modal } from './Modal'

type Props = {
  onClose: () => void
}

const shortcuts = [
  ['Ctrl + K', 'Open search'],
  ['Ctrl + N', 'Create new root page'],
  ['Ctrl + S', 'Show saved state'],
  ['Ctrl + /', 'Open hotkeys help'],
  ['Esc', 'Close modal or slash menu'],
  ['ArrowUp / ArrowDown', 'Navigate slash menu'],
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
