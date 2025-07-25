"use client";

import { useCallback, useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import TagGame from "./TagGame";
import { Header } from "./ui/Header";
import { Footer } from "./ui/Footer";

export type Tab = 'home' | 'actions' | 'context' | 'wallet';

interface NeynarUser {
  fid: number;
  score: number;
}

export default function Demo(
  { title }: { title?: string } = { title: "Tag" }
) {
  const {
    isSDKLoaded,
    context,
    actions,
  } = useMiniApp();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [neynarUser, setNeynarUser] = useState<NeynarUser | null>(null);

  useEffect(() => {
    console.log("=== SDK State Debug ===");
    console.log("isSDKLoaded:", isSDKLoaded);
    console.log("context:", context);
    console.log("actions:", actions);
    console.log("actions?.ready:", actions?.ready);
    console.log("Condition check:", isSDKLoaded && actions?.ready);
    
    // Call ready() when SDK is loaded and actions are ready
    if (isSDKLoaded && actions?.ready) {
      console.log("✅ Calling actions.ready()");
      try {
        actions.ready();
        console.log("✅ actions.ready() called successfully");
      } catch (error) {
        console.error("❌ Error calling ready():", error);
      }
    } else {
      console.log("❌ Not calling ready() - conditions not met");
      console.log("  isSDKLoaded:", isSDKLoaded);
      console.log("  actions?.ready exists:", !!actions?.ready);
    }
    console.log("=== End Debug ===");
  }, [isSDKLoaded, actions, context]);

  // Fetch Neynar user object when context is available
  useEffect(() => {
    const fetchNeynarUserObject = async () => {
      if (context?.user?.fid) {
        try {
          const response = await fetch(`/api/users?fids=${context.user.fid}`);
          const data = await response.json();
          if (data.users?.[0]) {
            setNeynarUser(data.users[0]);
          }
        } catch (error) {
          console.error('Failed to fetch Neynar user object:', error);
        }
      }
    };

    fetchNeynarUserObject();
  }, [context?.user?.fid]);

  // Register player when they first open the app
  useEffect(() => {
    const registerPlayer = async () => {
      if (context?.user?.fid && neynarUser) {
        try {
          await fetch(`/api/player/${context.user.fid}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: neynarUser.username || context.user.username,
              displayName: neynarUser.display_name || context.user.displayName,
              pfpUrl: neynarUser.pfp_url || context.user.pfpUrl,
            }),
          });
        } catch (error) {
          console.error('Failed to register player:', error);
        }
      }
    };

    registerPlayer();
  }, [context?.user, neynarUser]);

  if (!isSDKLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Farcaster SDK...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, try refreshing</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="mx-auto py-2 px-4 pb-20">
        <Header neynarUser={neynarUser} />

        {activeTab === 'home' && (
          <TagGame title={title} />
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3 px-6 w-full max-w-md mx-auto">
            <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-4 text-center">
              <h2 className="font-bold mb-2">Share Tag Game</h2>
              <p className="text-sm mb-3">Invite friends to play Tag with you!</p>
              <button
                onClick={async () => {
                  const shareUrl = `${process.env.NEXT_PUBLIC_URL}`;
                  await navigator.clipboard.writeText(shareUrl);
                }}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg"
              >
                Copy Game Link
              </button>
            </div>

            <button onClick={actions.close} className="w-full bg-gray-500 text-white py-2 rounded-lg">
              Close Mini App
            </button>
          </div>
        )}

        {activeTab === 'context' && (
          <div className="mx-6">
            <h2 className="text-lg font-semibold mb-2">Context</h2>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words w-full">
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <Footer activeTab={activeTab} setActiveTab={setActiveTab} showWallet={false} />
      </div>
    </div>
  );
}

