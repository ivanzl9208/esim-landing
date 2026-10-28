// Text inputs may match :focus-visible after touch/click. Track Tab intent
// explicitly for the checker's enclosing ring, without changing native focus.
export function observeTabNavigation(target, update) {
  const keydown = event => {
    if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) update(true);
  };
  const pointer = () => update(false);
  const capture = { capture: true };
  const passiveCapture = { capture: true, passive: true };
  target.addEventListener('keydown', keydown, capture);
  target.addEventListener('pointerdown', pointer, capture);
  target.addEventListener('touchstart', pointer, passiveCapture);
  return () => {
    target.removeEventListener('keydown', keydown, capture);
    target.removeEventListener('pointerdown', pointer, capture);
    target.removeEventListener('touchstart', pointer, passiveCapture);
  };
}
