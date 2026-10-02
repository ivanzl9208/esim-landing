import { clamp, mix } from './math.js';
import { TRACKS } from './timing.js';

const zoomDistance = TRACKS.chipZoom[1] - TRACKS.chipZoom[0];
const safetyGrowthEnd = .42;
const safetyGrowthDistance = (TRACKS.safety[1] - TRACKS.safety[0]) * safetyGrowthEnd;

// Figma 238:1473: the same square image grows and travels upwards.
// Coordinates are offsets from the viewport centre at layout scale 1.
export function chipZoomFrame(zoom, safety, mobile) {
  const frames = mobile
    ? [[280, 47], [339, -104.5], [586, -272], [721, -524.5]]
    : [[470, 0], [575, -172.5], [910, -381], [1182, -770]];
  let from = frames[0], to = frames[1], progress = clamp(zoom);
  if (safety > 0 && safety <= .18) {
    from = frames[1]; to = frames[2]; progress = clamp(safety / .18);
  } else if (safety > .18) {
    from = frames[2]; to = frames[3]; progress = clamp((safety - .18) / .24);
  }
  // Equal scroll distances add equal size, across both animation tracks.
  const growth = (clamp(zoom) * zoomDistance + clamp(safety / safetyGrowthEnd) * safetyGrowthDistance) /
    (zoomDistance + safetyGrowthDistance);
  const size = mix(frames[0][0], frames[3][0], growth);
  const previousSize = mix(from[0], to[0], progress);
  return {
    scale: size / frames[0][0],
    // Preserve the lower edge and the existing copy entrance as size changes.
    y: mix(from[1], to[1], progress) + (previousSize - size) / 2,
  };
}
