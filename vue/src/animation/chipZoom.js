import { clamp, mix } from './math.js';

// Figma 238:1473: the same square image grows and travels upwards.
// Coordinates are offsets from the viewport centre at layout scale 1.
export function chipZoomFrame(zoom, safety, mobile) {
  const frames = mobile
    ? [[260, 47], [339, -24.5], [586, -192], [721, -444.5]]
    : [[470, 0], [575, -52.5], [910, -261], [1182, -650]];
  let from = frames[0], to = frames[1], progress = clamp(zoom);
  if (safety > 0 && safety <= .18) {
    from = frames[1]; to = frames[2]; progress = clamp(safety / .18);
  } else if (safety > .18) {
    from = frames[2]; to = frames[3]; progress = clamp((safety - .18) / .24);
  }
  return {
    scale: mix(from[0], to[0], progress) / frames[0][0],
    y: mix(from[1], to[1], progress),
  };
}
