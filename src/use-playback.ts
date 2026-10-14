import { onScopeDispose, watch, type Ref } from "vue";

export function usePlayback(
  timestamp: Ref<number>,
  playing: Ref<boolean>,
  speed: Ref<number>,
): void {
  let frame: number | undefined;
  let previous = 0;

  function advance(now: number): void {
    timestamp.value += (now - previous) * speed.value;
    previous = now;
    frame = requestAnimationFrame(advance);
  }

  function stop(): void {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  }

  watch(
    playing,
    (enabled) => {
      stop();
      if (enabled) {
        previous = performance.now();
        frame = requestAnimationFrame(advance);
      }
    },
    { immediate: true, flush: "sync" },
  );

  onScopeDispose(stop);
}
