"use client";

import { useEffect } from "react";

export function AppLoaderRemover() {
  useEffect(() => {
    function removeSplash() {
      const loader = document.getElementById("app-loader");
      if (!loader) return;
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 300);
    }

    window.addEventListener('app-ready', removeSplash, { once: true });
    // Fallback: remove after 6s if app-ready never fires
    const fallback = setTimeout(removeSplash, 6000);
    return () => {
      window.removeEventListener('app-ready', removeSplash);
      clearTimeout(fallback);
    };
  }, []);

  return null;
}
