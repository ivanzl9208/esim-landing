import { clamp, smoothstep } from './math.js';
import { TRACKS } from './timing.js';

// One playhead for the return to centre, the zoom and the safety composition.
// Separate followers allowed zooming while the lateral return was unfinished.
export function storySequenceFrame(time) {
  return Object.fromEntries(['story', 'chipZoom', 'safety', 'returnGradient', 'outro'].map(key => {
    const [start, end, value, ease] = TRACKS[key];
    const progress = clamp((time - start) / (end - start));
    return [key, value * (ease === 'smooth' ? smoothstep(0, 1, progress) : progress)];
  }));
}

// Grow a little at the centre before the copy enters and pushes the chip up.
export const SAFETY_ENTRY_ZOOM = .2;
export const safetyEntryProgress = zoom => clamp((zoom - SAFETY_ENTRY_ZOOM) / (1 - SAFETY_ENTRY_ZOOM));
