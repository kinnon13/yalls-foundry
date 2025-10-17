export function attachVerticalSwipe(
  el: HTMLElement,
  onNext: () => void,
  onPrev: () => void
) {
  let startY = 0, lastY = 0, startT = 0;
  let touching = false;

  el.style.touchAction = 'pan-y'; // allow vertical scrolling gestures

  const onDown = (e: TouchEvent | MouseEvent) => {
    touching = true;
    const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    startY = lastY = y; startT = performance.now();
  };

  const onMove = (e: TouchEvent | MouseEvent) => {
    if (!touching) return;
    const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    lastY = y;
  };

  const onUp = (e?: Event) => {
    if (!touching) return;
    touching = false;

    const dy = lastY - startY;
    const dt = Math.max(1, performance.now() - startT);
    const v = dy / dt; // px/ms

    // prevent iOS rubber-banding "click-through"
    if (e && 'preventDefault' in e) try { (e as Event).preventDefault(); } catch {}

    if (dy > 80 || v > 0.5) onPrev();
    else if (dy < -80 || v < -0.5) onNext();
  };

  el.addEventListener('touchstart', onDown, { passive: true });
  el.addEventListener('touchmove', onMove, { passive: true });
  el.addEventListener('touchend', onUp, { passive: false });

  el.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove as any, { passive: true });
  window.addEventListener('mouseup', onUp);

  return () => {
    el.removeEventListener('touchstart', onDown);
    el.removeEventListener('touchmove', onMove as any);
    el.removeEventListener('touchend', onUp);
    el.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove', onMove as any);
    window.removeEventListener('mouseup', onUp);
  };
}
