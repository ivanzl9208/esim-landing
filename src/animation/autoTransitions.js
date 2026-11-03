import { clamp, mix, smoothstep } from './math.js';
import { TRACKS } from './timing.js';
import { featureReadingProgress, featureWindow } from './featureReading.js';
import { STORY_ENTER_END, STORY_EXIT_START } from './storyComposition.js';
import { STORY_BENEFITS } from '../data/story.js';
import { createHeadingInertia, headingExitProgress } from './headingInertia.js';

export const SHUTTER_DURATION = 1.1;
export const TEXT_ENTER_DURATION = .65;
export const TEXT_EXIT_DURATION = .45;
const clock = () => ({ value: 0, target: 0, from: 0, elapsed: 0, duration: 0 });
const request = (motion, target, duration, immediate) => {
  if (immediate) {
    motion.value = motion.target = target;
    motion.elapsed = motion.duration = 0;
  } else if (motion.target !== target) {
    motion.from = motion.value;
    motion.target = target;
    motion.elapsed = 0;
    motion.duration = duration;
  }
};
const advance = (motion, seconds) => {
  if (motion.value === motion.target) return false;
  motion.elapsed = Math.min(motion.duration, motion.elapsed + Math.max(0, seconds));
  motion.value = motion.elapsed === motion.duration ? motion.target
    : mix(motion.from, motion.target, motion.elapsed / motion.duration);
  return true;
};

const textTarget = (local, reverse, enterEnd, exitStart) => {
  if (local <= 0) return 0;
  if (local >= 1) return 1;
  if (reverse && local < enterEnd) return 0;
  if (!reverse && local > exitStart) return 1;
  return (enterEnd + exitStart) / 2;
};
const requestText = (motion, target, enterEnd, exitStart, immediate) => {
  const visible = target > 0 && target < 1;
  if (immediate) {
    request(motion, target, 0, true);
    return;
  }
  // The whole reading interval renders identically. Skip this static section
  // of the phase when starting an entrance/exit, rather than adding a delay.
  const settled = motion.value >= enterEnd && motion.value <= exitStart;
  if (visible) {
    if (settled) request(motion, target, 0, true);
    else request(motion, motion.value < enterEnd ? enterEnd : exitStart, TEXT_ENTER_DURATION, false);
  } else {
    // A fast jump over an unseen card must not play its entrance afterwards.
    if ((motion.value === 0 || motion.value === 1) && motion.value !== target) {
      request(motion, target, 0, true);
      return;
    }
    if (settled) motion.value = target === 0 ? enterEnd : exitStart;
    request(motion, target, TEXT_EXIT_DURATION, false);
  }
};

/** Scroll chooses a transition; this clock finishes it even without more input. */
export function createAutoTransitions(mobile, reduced = false) {
  const shutter = clock();
  const features = Array.from({ length: 6 }, clock);
  const stories = Array.from({ length: STORY_BENEFITS.length }, clock);
  const headings = createHeadingInertia();
  let sharedHeadings = { marquee: 0, definition: 0 };
  let previousTime = 0;
  let previousStory = 0;
  let previousHeadingTime = 0;
  let reverseHeading = false;
  let reverseTime = false;
  let reverseStory = false;
  let scrollStart = null;
  const playbackAt = time => TRACKS.playback[2] * clamp((time - (scrollStart ?? TRACKS.playback[0])) /
    (TRACKS.playback[1] - (scrollStart ?? TRACKS.playback[0])));
  return {
    // Rotation can follow native scroll independently of the geometry scrub,
    // while sharing the actual position at which the shutter finished opening.
    playbackAt,
    update(time, story, immediate = false, headingTime = time) {
      // Use native scroll direction, not the lagging geometry scrub. Keep the
      // reverse mode after input stops, including where heading progress is
      // clamped at 0/1, so an old forward tail cannot leak into another layer.
      if (immediate) reverseHeading = false;
      else if (Math.abs(headingTime - previousHeadingTime) > 1e-6) reverseHeading = headingTime < previousHeadingTime;
      previousHeadingTime = headingTime;
      if (immediate) reverseTime = reverseStory = false;
      else {
        if (Math.abs(time - previousTime) > 1e-6) reverseTime = time < previousTime;
        if (Math.abs(story - previousStory) > 1e-6) reverseStory = story < previousStory;
      }
      previousTime = time;
      previousStory = story;
      const [start, end] = TRACKS.reveal;
      if (time <= start || reduced) scrollStart = null;
      const scrollActive = scrollStart !== null && time >= scrollStart;
      const target = time <= start ? 0 : time >= end || scrollActive ? 1 : reverseTime ? 0 : 1;
      // Once the user has left this screen, its old curtain must not cover
      // the intro while a closing clock catches up after a fast reverse jump.
      request(shutter, target, SHUTTER_DURATION, immediate || time <= start);
      // Opening can finish well before its former scroll endpoint. Let the
      // next gesture move both heading and rotation from that actual position.
      // Keep their original endpoints; only the displayed heading follows on
      // the clock, never its scroll-selected destination.
      if (shutter.value === 0 && shutter.target === 0) scrollStart = null;
      if (!reduced && scrollStart === null && shutter.value === 1 && shutter.target === 1 && time < TRACKS.marquee[0]) {
        scrollStart = time;
      }
      const headingStart = scrollStart ?? TRACKS.marquee[0];
      sharedHeadings = {
        marquee: clamp((time - headingStart) / (TRACKS.marquee[1] - headingStart)),
        definition: clamp((time - TRACKS.definition[0]) / (TRACKS.definition[1] - TRACKS.definition[0])),
      };
      // Restore the original shared reverse playhead: the preceding heading
      // cannot return while the outgoing feature/thesis is still catching up.
      // Forward-only inertia follows native input; reverse adds no follower of
      // its own, but stays synchronized with the existing scene composition.
      const headingPosition = reverseHeading ? time : headingTime;
      headings.update(
        clamp((headingPosition - headingStart) / (TRACKS.marquee[1] - headingStart)),
        clamp((headingPosition - TRACKS.definition[0]) / (TRACKS.definition[1] - TRACKS.definition[0])),
        immediate || reduced || time <= start,
        reverseHeading,
      );
      const rawFeatures = clamp((time - TRACKS.features[0]) / (TRACKS.features[1] - TRACKS.features[0]));
      const featureProgress = featureReadingProgress(rawFeatures, mobile);
      features.forEach((motion, index) => {
        const window = featureWindow(index, mobile);
        const local = clamp((featureProgress - window.start) / (window.end - window.start));
        requestText(motion, textTarget(local, reverseTime, .38, .68), .38, .68,
          immediate || reduced || local === 0 || local === 1);
      });
      stories.forEach((motion, index) => {
        const local = clamp(story * stories.length - index);
        requestText(motion, textTarget(local, reverseStory, STORY_ENTER_END, STORY_EXIT_START),
          STORY_ENTER_END, STORY_EXIT_START, immediate || reduced || local === 0 || local === 1);
      });
    },
    advance(seconds) {
      // Evaluate every clock even if an earlier one already changed.
      const changed = [shutter, ...features, ...stories].map(motion => advance(motion, seconds)).some(Boolean);
      const headingsChanged = headings.advance(seconds);
      return changed || headingsChanged;
    },
    frame() {
      const [start, end] = TRACKS.reveal;
      const chipStart = (TRACKS.chip[0] - start) / (end - start);
      const chipEnd = (TRACKS.chip[1] - start) / (end - start);
      const headingFrame = headings.frame();
      return {
        reveal: smoothstep(0, 1, shutter.value),
        chip: smoothstep(chipStart, chipEnd, shutter.value),
        marquee: headingExitProgress(headingFrame.marquee, sharedHeadings.marquee),
        definition: headingExitProgress(headingFrame.definition, sharedHeadings.definition),
        playback: playbackAt(previousTime),
        featureText: features.map(motion => motion.value),
        storyText: stories.map(motion => motion.value),
      };
    },
  };
}
