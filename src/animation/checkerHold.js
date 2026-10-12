/** Skip only the stationary checker interval on the way back up the page.
 * Keep the reverse gesture's distance for the preceding animation, including
 * when starting partway through the hold or crossing it with a fast scroll.
 */
export function reverseCheckerScroll(previous, current, { start, end }) {
  if (current >= previous || previous <= start || current >= end) return current;
  return Math.max(0, current - (Math.min(previous, end) - start));
}
