const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

const savedTabIndexes = new WeakMap();

/**
 * Keep scroll-driven, visually hidden regions out of both the accessibility
 * tree and the keyboard order. The explicit tabindex fallback is required for
 * Chromium versions that predate native `inert` support.
 */
export function setRegionInteractive(root, interactive) {
  if (!root) return;
  root.inert = !interactive;
  if (interactive) root.removeAttribute?.('aria-hidden');
  else root.setAttribute?.('aria-hidden', 'true');

  const focusable = root.querySelectorAll?.(focusableSelector) ?? [];
  focusable.forEach(element => {
    if (!interactive) {
      if (!savedTabIndexes.has(element)) savedTabIndexes.set(element, element.getAttribute('tabindex'));
      element.setAttribute('tabindex', '-1');
      return;
    }
    if (!savedTabIndexes.has(element)) return;
    const previous = savedTabIndexes.get(element);
    savedTabIndexes.delete(element);
    if (previous === null) element.removeAttribute('tabindex');
    else element.setAttribute('tabindex', previous);
  });
}
