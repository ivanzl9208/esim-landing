// Network Information is unavailable in Safari. A load deadline supplies the
// same static fallback there; unknown connection speed alone isn't a failure.
export const MEDIA_LOAD_DEADLINE = 4000;
// The all-keyframe transparent MOV is larger than WebM. Give its complete
// Blob download time on mobile before switching to the rotating frame fallback.
export const CHIP_MOV_LOAD_DEADLINE = 15000;

// A connection estimate can describe a previous host rather than the current
// media transfer. Only an explicit data-saving preference or offline state
// prevents the small autoplay hero from attempting a bounded download.
export function avoidsVideo({ connection, onLine } = {}) {
  return onLine === false || Boolean(connection?.saveData);
}

export function prefersStaticMedia({ connection, onLine } = {}) {
  if (onLine === false) return true;
  if (!connection) return false;
  const { saveData, effectiveType, downlink, rtt } = connection;
  return Boolean(saveData || ['slow-2g', '2g', '3g'].includes(effectiveType)
    || (Number.isFinite(downlink) && downlink < 1)
    || (Number.isFinite(rtt) && rtt > 400));
}
