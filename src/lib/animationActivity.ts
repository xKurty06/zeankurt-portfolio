"use client";

export function monitorElementActivity(
  element: Element,
  onChange: (active: boolean) => void,
  options: IntersectionObserverInit = {},
) {
  let isVisible = document.visibilityState === "visible";
  let isIntersecting = false;

  const emit = () => {
    onChange(isVisible && isIntersecting);
  };

  const observer = new IntersectionObserver(([entry]) => {
    isIntersecting = entry?.isIntersecting ?? false;
    emit();
  }, options);

  const handleVisibilityChange = () => {
    isVisible = document.visibilityState === "visible";
    emit();
  };

  observer.observe(element);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
