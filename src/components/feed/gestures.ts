/**
 * Swipe Gesture Detection
 * Detects vertical swipes with velocity for TikTok-style navigation
 */

export function attachSwipe(
  el: HTMLElement,
  onNext: () => void,
  onPrev: () => void
) {
  let startY = 0;
  let lastY = 0;
  let startT = 0;

  const onDown = (e: TouchEvent | MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    startY = lastY = y;
    startT = Date.now();
  };

  const onMove = (e: TouchEvent | MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    lastY = y;
  };

  const onUp = () => {
    const dy = lastY - startY;
    const dt = Math.max(1, Date.now() - startT);
    const velocity = dy / dt; // px/ms

    // Swipe down (previous) - threshold: 80px or 0.5px/ms
    if (dy > 80 || velocity > 0.5) {
      onPrev();
    }
    // Swipe up (next) - threshold: -80px or -0.5px/ms
    else if (dy < -80 || velocity < -0.5) {
      onNext();
    }
  };

  // Touch events
  el.addEventListener('touchstart', onDown, { passive: true });
  el.addEventListener('touchmove', onMove, { passive: true });
  el.addEventListener('touchend', onUp);

  // Mouse events (for desktop testing)
  el.addEventListener('mousedown', onDown);
  const onMouseMove = (e: MouseEvent) => onMove(e);
  const onMouseUp = () => onUp();
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Cleanup
  return () => {
    el.removeEventListener('touchstart', onDown);
    el.removeEventListener('touchmove', onMove);
    el.removeEventListener('touchend', onUp);
    el.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
}
