"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { MiniAppProvider } from "@neynar/react";
import { SafeFarcasterSolanaProvider } from "../components/providers/SafeFarcasterSolanaProvider";
import { USE_WALLET } from "../lib/constants";

const WagmiProvider = dynamic(
  () => import("../components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  const solanaEndpoint = process.env.SOLANA_RPC_ENDPOINT || "https://solana-rpc.publicnode.com";
  
  if (!USE_WALLET) {
    return (
      <SessionProvider session={session}>
        <MiniAppProvider analyticsEnabled={true}>
          {children}
        </MiniAppProvider>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <MiniAppProvider analyticsEnabled={true}>
          <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
            {children}
          </SafeFarcasterSolanaProvider>
        </MiniAppProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
