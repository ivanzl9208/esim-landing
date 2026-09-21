import { clamp, mix, smoothstep } from './math.js';

// Figma 29–39: all four labels coexist; focus moves between fixed positions.
// Each entry contains timeline position, label opacities, and the sharp label.
const frames = [
  [0, [0, 0, 0, 0], -1],
  [0.08, [.6, .6, .4, .2], -1], // 30
  [0.22, [1, .6, .4, .2], 0], // 31
  [0.7, [1, .6, .4, .2], 0],
  [1, [.2, 1, .6, .4], -1], // 32
  [1.22, [.2, 1, .6, .4], 1], // 33
  [1.7, [.2, 1, .6, .4], 1],
  [2, [.2, .2, 1, .6], -1], // 34
  [2.22, [.2, .2, 1, .6], 2], // 35
  [2.7, [.2, .2, 1, .6], 2],
  [3, [.2, .2, .2, 1], -1], // 36
  [3.22, [.2, .2, .2, 1], 3], // 37
  [3.7, [.2, .2, .2, 1], 3],
  [3.9, [.2, .2, .2, .2], -1], // 38
  [4, [0, 0, 0, 0], -1], // 39
];

export function desktopStoryFrame(progress, index) {
  const time = clamp(progress) * 4;
  const end = frames.findIndex(frame => frame[0] >= time);
  const to = frames[end];
  const from = frames[Math.max(0, end - 1)];
  const blend = from === to ? 0 : smoothstep(from[0], to[0], time);
  return {
    opacity: mix(from[1][index], to[1][index], blend),
    blur: mix(from[2] === index ? 0 : 10, to[2] === index ? 0 : 10, blend),
  };
}
