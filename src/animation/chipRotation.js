export const CHIP_ROTATION_DURATION = 1.2;

/** Follow unwrapped turns: crossing a video loop must not reverse rotation. */
export function createChipRotation(initial = 0) {
  let value = initial;
  let target = initial;
  let elapsed = 0;
  let direction = 0;
  let response = CHIP_ROTATION_DURATION * 7 / 30;
  return {
    update(next, immediate = false) {
      if (immediate) {
        value = target = next;
        elapsed = direction = 0;
        response = CHIP_ROTATION_DURATION * 7 / 30;
        return;
      }
      if (next === target) return;
      const nextDirection = Math.sign(next - target);
      // Reverse without a pose jump; catch up sooner with the new direction.
      response = CHIP_ROTATION_DURATION * (direction && direction !== nextDirection ? 7 / 60 : 7 / 30);
      direction = nextDirection;
      target = next;
      elapsed = 0;
    },
    advance(seconds) {
      if (value === target || seconds <= 0) return false;
      const delta = Math.min(seconds, .05);
      elapsed += delta;
      value += (target - value) * (1 - Math.exp(-delta / response));
      if (elapsed >= CHIP_ROTATION_DURATION || Math.abs(target - value) < .00001) value = target;
      return true;
    },
    value: () => value,
    moving: () => value !== target,
  };
}
