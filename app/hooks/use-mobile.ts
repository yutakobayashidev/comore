import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const DEBOUNCE_DELAY = 100;

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const debouncedOnChange = debounce(() => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }, DEBOUNCE_DELAY);
    
    const onChange = () => {
      debouncedOnChange();
    };
    
    mql.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    
    // Set initial value immediately
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return !!isMobile;
}

export function useViewportSize() {
  const [viewportSize, setViewportSize] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const debouncedHandleResize = debounce(() => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, DEBOUNCE_DELAY);

    window.addEventListener("resize", debouncedHandleResize);
    
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, []);

  return viewportSize;
}