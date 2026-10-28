import { curtainOffset } from './curtain.js';
import { introFadeFrame, introPanelColumnY } from './introFade.js';

export function createIntroTextRenderer(scene) {
  const curtain = scene.querySelector('.white-curtain');
  const hero = scene.querySelector('.hero-surface');
  const column = scene.querySelector('.intro-text-column');
  const groups = [...column.querySelectorAll('.intro-text-group')];
  const finale = column.querySelector('.intro-text-finale');
  const items = [...groups, finale];
  let signature;
  let measurements;
  let bottom;
  let lastFrame;
  return (state, geometry, reduced) => {
    const frameKey = `${geometry.width}:${geometry.height}:${geometry.scale}:${state.curtain}:${state.introText}:${reduced}`;
    if (lastFrame === frameKey) return;
    lastFrame = frameKey;
    // Layout is read only when geometry/fonts change, never during scrolling.
    const nextSignature = `${geometry.width}:${geometry.scale}`;
    if (signature !== nextSignature) {
      signature = nextSignature;
      measurements = items.map(item => ({ top: item.offsetTop, height: item.offsetHeight }));
      bottom = measurements.at(-1).top + measurements.at(-1).height;
    }
    // Write to the composited layer directly. An inherited custom property
    // invalidates the entire text subtree on each scroll tick in WebKit.
    curtain.style.transform = reduced ? 'none' : `translate3d(0, ${curtainOffset(state.curtain)}%, 0)`;
    curtain.style.opacity = reduced ? (state.curtain >= .8 ? '1' : '0') : '';
    // The white curtain rises over the stationary hero, rather than pushing it
    // upwards. Keep the text's opacity animation on the same scroll playhead.
    hero.style.transform = '';
    // The sticky hero still intersects the viewport under this panel. Tell
    // its player when it is actually occluded, not merely offscreen.
    const covered = state.curtain >= .9999;
    if (hero.hasAttribute?.('data-media-covered') !== covered) hero.toggleAttribute?.('data-media-covered', covered);
    const y = introPanelColumnY(state.introText, state.curtain, geometry.height, bottom);
    const panelOffset = reduced ? 0 : curtainOffset(state.curtain) / 100 * geometry.height;
    column.style.transform = `translate3d(0, ${y.toFixed(3)}px, 0)`;
    items.forEach((item, index) => {
      const isFinale = item === finale;
      // Multiline phrases fade as a whole around their visual centre, so
      // the lower lines are readable before the group starts fading out.
      // Keep the opening single line's existing opacity window.
      const centreOffset = index === 0 ? 0 : measurements[index].height / 2;
      const fadeTop = panelOffset + y + measurements[index].top + centreOffset
        - (isFinale ? .05 * geometry.height : 0);
      const frame = introFadeFrame(fadeTop, geometry.height, isFinale, reduced);
      item.style.opacity = frame.opacity.toFixed(4);
      item.style.transform = `${isFinale ? 'translateX(-50%) ' : ''}scale(${frame.scale.toFixed(5)})`;
    });
  };
}
