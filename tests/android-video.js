// Isolate native Android decoding from the application's scroll scheduler.
const video = document.getElementById('video');
const events = [];
const report = () => {
  document.getElementById('state').textContent = JSON.stringify({ time: video.currentTime,
    duration: video.duration, ready: video.readyState, seeking: video.seeking,
    error: video.error?.code, events }, null, 2);
};
for (const type of ['loadedmetadata', 'loadeddata', 'seeking', 'seeked', 'error']) {
  video.addEventListener(type, () => { events.push({ type, time: video.currentTime }); report(); });
}
document.querySelectorAll('[data-time]').forEach(button => {
  button.onclick = () => { video.currentTime = Number(button.dataset.time); report(); };
});
document.getElementById('report').onclick = report;
const response = await fetch('/assets/chip-scroll.webm');
video.src = URL.createObjectURL(await response.blob());
