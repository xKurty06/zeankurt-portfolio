"use client";

export function monitorElementActivity(
  element: Element,
  onChange: (active: boolean) => void,
  options: IntersectionObserverInit = {},
) {
  let isVisible = document.visibilityState === "visible";
  let isIntersecting = false;
  let frame = 0;

  const computeIntersection = () => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    isIntersecting =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < viewportHeight &&
      rect.left < viewportWidth;
  };

  const emit = () => {
    onChange(isVisible && isIntersecting);
  };

  const refresh = () => {
    frame = 0;
    computeIntersection();
    emit();
  };

  const scheduleRefresh = () => {
    if (frame !== 0) return;
    frame = window.requestAnimationFrame(refresh);
  };

  const observer = new IntersectionObserver(([entry]) => {
    isIntersecting = entry?.isIntersecting ?? false;
    emit();
  }, options);

  const handleVisibilityChange = () => {
    isVisible = document.visibilityState === "visible";
    scheduleRefresh();
  };

  observer.observe(element);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("scroll", scheduleRefresh, { passive: true });
  window.addEventListener("resize", scheduleRefresh, { passive: true });
  window.addEventListener("pageshow", scheduleRefresh);
  window.addEventListener("focus", scheduleRefresh);
  scheduleRefresh();

  return () => {
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }
    observer.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("scroll", scheduleRefresh);
    window.removeEventListener("resize", scheduleRefresh);
    window.removeEventListener("pageshow", scheduleRefresh);
    window.removeEventListener("focus", scheduleRefresh);
  };
}
