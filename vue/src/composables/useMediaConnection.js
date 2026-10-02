import { inject, onMounted, onScopeDispose, provide, ref } from 'vue';
import { avoidsVideo, prefersStaticMedia } from '../utils/mediaConnection.js';

const MEDIA_CONNECTION = Symbol('media-connection');

function createMediaConnection() {
  const staticMedia = ref(typeof navigator !== 'undefined' && prefersStaticMedia(navigator));
  const avoidVideo = ref(typeof navigator !== 'undefined' && avoidsVideo(navigator));
  let connection;
  // Keep the fallback for this visit, rather than repeatedly downloading and
  // stopping the same video on an unstable connection.
  const check = () => {
    avoidVideo.value = avoidsVideo(navigator);
    if (prefersStaticMedia(navigator)) staticMedia.value = true;
  };
  onMounted(() => {
    connection = navigator.connection;
    check();
    connection?.addEventListener('change', check);
    window.addEventListener('offline', check);
    window.addEventListener('online', check);
  });
  onScopeDispose(() => {
    connection?.removeEventListener('change', check);
    if (typeof window !== 'undefined') {
      window.removeEventListener('offline', check);
      window.removeEventListener('online', check);
    }
  });
  return { staticMedia, avoidVideo, markSlow: () => { staticMedia.value = true; } };
}

export function provideMediaConnection() {
  const policy = createMediaConnection();
  provide(MEDIA_CONNECTION, policy);
  return policy;
}

export function useMediaConnection() {
  return inject(MEDIA_CONNECTION, null) ?? createMediaConnection();
}
