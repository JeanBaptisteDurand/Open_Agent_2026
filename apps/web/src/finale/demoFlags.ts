// Read finale URL flags. Single source of truth so we never sprinkle
// useSearchParams across surfaces. Memoized at module scope where the
// flag is set once per page load (presenter, demo). showGuard reads
// reactively because the user may toggle it during a presentation.

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

function readFlag(name: string): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get(name);
  return v === "1" || v === "true";
}

export function isPresenter(): boolean {
  return readFlag("presenter");
}

export function isDemo(): boolean {
  return readFlag("demo");
}

export function isShowGuard(): boolean {
  return readFlag("showGuard");
}

export function useDemoFlag(): boolean {
  const [params] = useSearchParams();
  return useMemo(() => {
    const v = params.get("demo");
    return v === "1" || v === "true";
  }, [params]);
}

export function usePresenterFlag(): boolean {
  const [params] = useSearchParams();
  return useMemo(() => {
    const v = params.get("presenter");
    return v === "1" || v === "true";
  }, [params]);
}

export function useShowGuardFlag(): boolean {
  const [params] = useSearchParams();
  return useMemo(() => {
    const v = params.get("showGuard");
    return v === "1" || v === "true";
  }, [params]);
}
