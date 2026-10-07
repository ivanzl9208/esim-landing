export const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
export const mix = (from, to, progress) => from + (to - from) * progress;
export const smoothstep = (start, end, value) => { const t = clamp((value - start) / (end - start)); return t * t * (3 - 2 * t); };
export const mixRgb = (from, to, t) => 'rgb(' + from.map((v, i) => Math.round(mix(v, to[i], t))).join(', ') + ')';
export function sampleKeyframes(frames, value) {
  if (value <= frames[0].at) return frames[0];
  if (value >= frames.at(-1).at) return frames.at(-1);
  const next = frames.findIndex(frame => frame.at >= value);
  const a = frames[next - 1], b = frames[next], t = (value - a.at) / (b.at - a.at);
  return Object.fromEntries(['top', 'fontSize', 'lineHeight', 'opacity'].map(key => [key, mix(a[key], b[key], t)]));
}
export const cubicBezierValue = (progress, x1, y1, x2, y2) => {
  const targetX = clamp(progress);
  let parameter = targetX;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const inverse = 1 - parameter;
    const currentX =
      3 * inverse * inverse * parameter * x1 +
      3 * inverse * parameter * parameter * x2 +
      parameter * parameter * parameter;
    const derivative =
      3 * inverse * inverse * x1 +
      6 * inverse * parameter * (x2 - x1) +
      3 * parameter * parameter * (1 - x2);

    if (Math.abs(derivative) < 0.00001) break;
    parameter = clamp(
      parameter - (currentX - targetX) / derivative,
    );
  }

  const inverse = 1 - parameter;
  return (
    3 * inverse * inverse * parameter * y1 +
    3 * inverse * parameter * parameter * y2 +
    parameter * parameter * parameter
  );
};
