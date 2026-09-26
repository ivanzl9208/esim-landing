/** Save the scene's meaning, using geometry from before the viewport changed. */
export function captureScenePosition(scrollY, { sceneTop, checkerTop, height }) {
  if (scrollY < checkerTop) {
    return { kind: 'scene', progress: Math.max(0, (scrollY - sceneTop) / Math.max(1, checkerTop - sceneTop)) };
  }
  const offset = scrollY - checkerTop;
  return offset < height
    ? { kind: 'checker', progress: offset / height }
    : { kind: 'after', offset: offset - height };
}

export function restoreScenePosition(position, { sceneTop, checkerTop, height }) {
  if (position.kind === 'scene') return sceneTop + position.progress * (checkerTop - sceneTop);
  if (position.kind === 'checker') return checkerTop + position.progress * height;
  return checkerTop + height + position.offset;
}
