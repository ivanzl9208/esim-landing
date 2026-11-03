import { createChipRotation } from './chipRotation.js';
import { mix, smoothstep } from './math.js';

// Keep the full tail while reading the heading. Over its final scroll fifth,
// smoothly rejoin the shared scene clock: the last glyph must be outside the
// viewport before the next layer enters, without fading or delaying that layer.
export function headingExitProgress(inertial, shared) {
  return mix(inertial, Math.max(inertial, shared), smoothstep(.8, 1, shared));
}

// Normalized heading progress uses the same bounded 1.2s follower as the chip.
// It only follows a scroll target; stopping never advances the target itself.
// Reverse scrolling bypasses the follower and cancels any forward tail.
export function createHeadingInertia() {
  const marquee = createChipRotation();
  const definition = createChipRotation();
  return {
    update(nextMarquee, nextDefinition, immediate = false, reverse = false) {
      marquee.update(nextMarquee, immediate || reverse);
      definition.update(nextDefinition, immediate || reverse);
    },
    advance(seconds) {
      const movedMarquee = marquee.advance(seconds);
      const movedDefinition = definition.advance(seconds);
      return movedMarquee || movedDefinition;
    },
    frame: () => ({ marquee: marquee.value(), definition: definition.value() }),
  };
}
