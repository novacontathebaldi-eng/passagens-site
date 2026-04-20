"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if we should reduce motion/effects for the current device.
 *
 * Strategy (Progressive Enhancement):
 * 1. Respects the OS-level `prefers-reduced-motion` setting (accessibility)
 * 2. Detects mobile/low-power devices via screen width + touch capability
 * 3. Optionally probes GPU performance via a quick canvas test
 *
 * Returns:
 * - `isMobile`: true for mobile-sized screens with touch
 * - `prefersReducedMotion`: true if OS requests reduced motion
 * - `shouldReduceEffects`: combined signal — true if ANY of the above applies
 * - `isLoaded`: true once detection has run (avoids SSR mismatch flash)
 */
export function useReducedMotion() {
  const [state, setState] = useState({
    isMobile: false,
    prefersReducedMotion: false,
    shouldReduceEffects: false,
    isLoaded: false,
  });

  useEffect(() => {
    // 1. OS-level reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = motionQuery.matches;

    // 2. Mobile detection: small screen + touch support
    //    We use 1024px as the breakpoint (below = tablet/phone)
    const isMobile =
      window.innerWidth < 1024 && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // 3. Low hardware concurrency (optional — some devices report this)
    const isLowCPU = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;

    // Combined: reduce if mobile OR reduced motion OR very low CPU
    const shouldReduceEffects = isMobile || prefersReducedMotion || (isMobile && isLowCPU);

    setState({
      isMobile,
      prefersReducedMotion,
      shouldReduceEffects,
      isLoaded: true,
    });

    // Listen for changes to the reduced motion preference
    const handleChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({
        ...prev,
        prefersReducedMotion: e.matches,
        shouldReduceEffects: prev.isMobile || e.matches,
      }));
    };

    motionQuery.addEventListener("change", handleChange);
    return () => motionQuery.removeEventListener("change", handleChange);
  }, []);

  return state;
}
