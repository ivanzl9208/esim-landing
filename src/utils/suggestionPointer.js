/** Complete a tap before a delayed/absent compatibility click. A pan is not a selection. */
export function createSuggestionPointer(select, releaseFocus) {
  let pending;
  let skipClick = false;
  const cancel = () => {
    if (pending) skipClick = true;
    pending = undefined;
    releaseFocus();
  };
  return {
    get active() { return Boolean(pending); },
    down(event, device) {
      if (event.isPrimary === false || event.button !== 0) return;
      skipClick = false;
      pending = { id: event.pointerId, x: event.clientX, y: event.clientY, device };
      // Keep the input and keyboard layout stable until release or cancellation.
      event.preventDefault();
    },
    move(event) {
      if (pending?.id === event.pointerId && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 10) cancel();
    },
    up(event) {
      if (pending?.id !== event.pointerId) return;
      const device = pending.device;
      pending = undefined;
      skipClick = true;
      event.preventDefault();
      select(device);
    },
    click(event, device) {
      // Ignore compatibility clicks after a completed tap or cancelled pan.
      // detail=0 remains available to keyboard/assistive click activation.
      if (skipClick && event.detail !== 0) { skipClick = false; return; }
      select(device);
    },
    cancel,
  };
}
