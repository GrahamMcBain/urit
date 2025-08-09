"use client";

import { useState } from "react";
import Image from "next/image";
import { APP_NAME } from "../../lib/constants";
import { sdk } from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [hasClickedPfp, setHasClickedPfp] = useState(false);

  return (
    <div className="relative">
      <div 
        className="mb-2 py-2.5 px-3 rounded-xl flex items-center justify-between border border-primary-500/30 bg-gradient-to-r from-primary-50/80 to-white/60 dark:from-primary-900/30 dark:to-gray-800/60 backdrop-blur-sm shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Image 
            src="/icon.png"
            alt="Tag Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <div className="text-lg font-semibold">
            Welcome to {APP_NAME}!
          </div>
        </div>
        {context?.user && (
          <button 
            className="cursor-pointer rounded-full hover:ring-2 hover:ring-primary-500/40 transition"
            onClick={() => {
              setIsUserDropdownOpen(!isUserDropdownOpen);
              setHasClickedPfp(true);
            }}
          >
            {context.user.pfpUrl && (
              <Image 
                src={context.user.pfpUrl}
                alt="Profile"
                width={40}
                height={40}
                unoptimized
                className="rounded-full border-2 border-primary-500"
              />
            )}
          </button>
        )}
      </div>
      {context?.user && (
        <>
          {!hasClickedPfp && (
            <div className="absolute right-0 -bottom-6 text-xs text-primary-600 flex items-center justify-end gap-1 pr-2">
              <span className="text-[10px]">↑</span> Click PFP! <span className="text-[10px]">↑</span>
            </div>
          )}
          
          {isUserDropdownOpen && (
            <div className="absolute top-full right-0 z-50 w-fit mt-1 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur">
              <div className="p-3 space-y-2">
                <div className="text-right">
                  <h3 
                    className="font-bold text-sm hover:underline cursor-pointer inline-block"
                    onClick={() => sdk.actions.viewProfile({ fid: context.user.fid })}
                  >
                    {context.user.displayName || context.user.username}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    @{context.user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    FID: {context.user.fid}
                  </p>
                  {neynarUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Neynar Score: {neynarUser.score}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
