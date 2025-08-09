"use client";

import { useEffect } from "react";

export default function ClientReady() {
  useEffect(() => {
    (async () => {
      try {
        const mod = await (new Function('u', 'return import(u)'))('https://esm.sh/@farcaster/miniapp-sdk');
        if (mod?.sdk?.actions?.ready) {
          await mod.sdk.actions.ready();
        }
        if (mod?.sdk?.back?.enableWebNavigation) {
          await mod.sdk.back.enableWebNavigation();
        }
      } catch {
        // ignore
      }
    })();
  }, []);
  return null;
}
