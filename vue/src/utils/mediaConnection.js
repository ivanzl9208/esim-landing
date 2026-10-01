// Network Information is unavailable in Safari. A load deadline supplies the
// same static fallback there; unknown connection speed alone isn't a failure.
export const MEDIA_LOAD_DEADLINE = 4000;

export function prefersStaticMedia({ connection, onLine } = {}) {
  if (onLine === false) return true;
  if (!connection) return false;
  const { saveData, effectiveType, downlink, rtt } = connection;
  return Boolean(saveData || ['slow-2g', '2g', '3g'].includes(effectiveType)
    || (Number.isFinite(downlink) && downlink < 1)
    || (Number.isFinite(rtt) && rtt > 400));
}
