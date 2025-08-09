"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useMiniApp } from "@neynar/react";
import { Button } from "./ui/Button";
import { Player, LeaderboardEntry } from "../lib/types";
import { isSuperAdmin } from "../lib/config";

interface TagGameProps {
  title?: string;
}

interface SearchUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  follower_count?: number;
}

export default function TagGame({ title = "Tag" }: TagGameProps) {
  const { context, actions } = useMiniApp();
  const [currentlyTagged, setCurrentlyTagged] = useState<Player | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [taggedTime, setTaggedTime] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  // Check if current user is super admin
  const isAdmin = context?.user?.fid ? isSuperAdmin(context.user.fid) : false;



  // Fetch current game state
  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch('/api/tag');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCurrentlyTagged(data.currentlyTagged);
      setApiError(""); // Clear any previous errors
      
      // If the game was reset, show message
      if (data.wasReset) {
        setMessage("The game has been reset for a new day!");
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error);
      setApiError(`Failed to connect to game API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, []);

  // Update timer for currently tagged player
  useEffect(() => {
    if (currentlyTagged?.taggedAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - currentlyTagged.taggedAt!;
        setTaggedTime(elapsed);
      }, 100); // Update every 100ms for smooth timer

      return () => clearInterval(interval);
    } else {
      setTaggedTime(0);
    }
  }, [currentlyTagged]);

  // Initial data fetch
  useEffect(() => {
    fetchGameState();
    fetchLeaderboard();
  }, [fetchGameState, fetchLeaderboard]);

  // Auto-refresh game state
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGameState();
      if (activeTab === 'leaderboard') {
        fetchLeaderboard();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [fetchGameState, fetchLeaderboard, activeTab]);

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search-users?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Admin function to reset game
  const handleResetGame = useCallback(async () => {
    if (!context?.user?.fid || !isAdmin) {
      setMessage("Unauthorized - Admin access required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminFid: context.user.fid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Game reset successfully!");
        await fetchGameState();
        await fetchLeaderboard();
      } else {
        setMessage(data.error || "Failed to reset game");
      }
    } catch (error) {
      console.error('Reset game error:', error);
      setMessage("Failed to reset game");
    } finally {
      setLoading(false);
    }
  }, [context, isAdmin, fetchGameState, fetchLeaderboard]);

  // Handle tagging a friend (including admin override)
  const handleTagFriend = useCallback(async () => {
    if (!context?.user?.fid) {
      setMessage("You must be logged in to play!");
      return;
    }

    if (!selectedUser) {
      setMessage("Please select a user to tag!");
      return;
    }
    
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taggerFid: context.user.fid,
          taggedFid: selectedUser.fid,
          taggedUser: {
            username: selectedUser.username,
            display_name: selectedUser.display_name,
            pfp_url: selectedUser.pfp_url,
          },
          isAdminOverride: isAdmin && currentlyTagged && currentlyTagged.fid !== context.user.fid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Successfully tagged @${selectedUser.username}!`);
        setSelectedUser(null);
        setSearchQuery("");
        setSearchResults([]);
        await fetchGameState();
        await fetchLeaderboard();
        
        // Send notification to tagged user (if they have the app)
        if ('sendNotification' in actions) {
          type NotifActions = { sendNotification: (opts: { title: string; body: string; targetUrl?: string }) => Promise<void> };
          await (actions as unknown as NotifActions).sendNotification({
            title: "You\'ve been tagged!",
            body: "Quick! Tag someone else before too much time passes!",
            targetUrl: `${process.env.NEXT_PUBLIC_URL}`,
          });
        }
        
        // Compose a cast to share the tag
        const castText = `I just tagged @${selectedUser.username} in Tag! 🫱\n\nYour turn to tag someone else quickly! ⚡\n\nPlay at ${process.env.NEXT_PUBLIC_URL}`;
        await actions.composeCast({ text: castText }, 'tag-game');
      } else {
        setMessage(data.error || "Failed to tag friend");
      }
    } catch (error) {
      console.error('Tag error:', error);
      setMessage("Failed to tag friend");
    } finally {
      setLoading(false);
    }
  }, [context, actions, selectedUser, fetchGameState, fetchLeaderboard]);

  // Format time duration with tenths of seconds for short durations
  const formatTime = (milliseconds: number) => {
    const totalSeconds = milliseconds / 1000;
    const seconds = Math.floor(totalSeconds);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else if (seconds >= 10) {
      return `${seconds}s`;
    } else {
      // Show tenths for under 10 seconds
      return `${totalSeconds.toFixed(1)}s`;
    }
  };

  const isCurrentUserTagged = currentlyTagged?.fid === context?.user?.fid;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Image 
          src="/icon.png" 
          alt="Tag Logo" 
          width={48}
          height={48}
          className="rounded"
        />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      
      {/* API Error Display */}
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Connection Error</p>
          <p className="text-sm">{apiError}</p>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('game')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'game'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500'
          }`}
        >
          Game
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'leaderboard'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === 'game' && (
        <div className="space-y-4">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4 border-2 border-red-200">
              <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">🔧 Admin Controls</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleResetGame}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Reset Game (Clear &quot;It&quot; Status)
                </Button>
                <p className="text-xs text-red-700 dark:text-red-300">
                  You can tag anyone even if you&apos;re not &quot;it&quot;
                </p>
              </div>
            </div>
          )}

          {/* Game Status */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            {currentlyTagged ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Currently tagged:</p>
                <p className="text-lg font-bold">{currentlyTagged.displayName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tagged for: {formatTime(taggedTime)}
                </p>
                {isCurrentUserTagged && (
                  <p className="text-red-600 font-medium mt-2">
                    You&apos;re it! Tag someone else quickly!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg">No one is currently tagged</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Be the first to start the game!
                </p>
              </div>
            )}
          </div>

          {/* User Search and Tag Section */}
          <div className="space-y-4">
            {/* Show search if current user can tag OR if they're admin */}
            {(!currentlyTagged || isCurrentUserTagged || isAdmin) && (
              <div className="space-y-3">
                <h3 className="font-bold text-center">Who do you want to tag?</h3>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a user by username..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Selected User */}
                {selectedUser && (
                  <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-3 border-2 border-primary-300">
                    <div className="flex items-center space-x-3">
                      {selectedUser.pfp_url && (
                        <Image 
                          src={selectedUser.pfp_url} 
                          alt={selectedUser.display_name}
                          width={40}
                          height={40}
                          unoptimized
                          className="rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-bold">{selectedUser.display_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">@{selectedUser.username}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setSearchQuery("");
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchQuery && !selectedUser && searchResults.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border rounded-lg max-h-64 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.fid}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchResults([]);
                        }}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        {user.pfp_url && (
                          <Image 
                            src={user.pfp_url} 
                            alt={user.display_name}
                            width={32}
                            height={32}
                            unoptimized
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium">{user.display_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                        </div>
                        {user.follower_count && (
                          <p className="text-xs text-gray-500">{user.follower_count} followers</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {searchQuery && !selectedUser && !isSearching && searchResults.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No users found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}

            {/* Tag Button */}
            <div className="text-center">
              <Button
                onClick={handleTagFriend}
                disabled={loading || (!isAdmin && currentlyTagged && !isCurrentUserTagged) || !selectedUser}
                isLoading={loading}
                className="w-full text-lg py-3"
              >
                {!isAdmin && currentlyTagged && !isCurrentUserTagged
                  ? `Only ${currentlyTagged.displayName} can tag right now`
                  : selectedUser
                  ? `Tag @${selectedUser.username}!${isAdmin && currentlyTagged && !isCurrentUserTagged ? ' (Admin Override)' : ''}`
                  : 'Select a user to tag'
                }
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`text-center p-3 rounded-lg ${
              message.includes('success') || message.includes('Success')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Game Rules */}
          <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-4">
            <h3 className="font-bold text-primary-900 dark:text-primary-100 mb-2">How to Play:</h3>
            <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
              <li>• When you&apos;re tagged, you must tag someone else quickly</li>
              <li>• Tag people in this app OR by casting &quot;@tag @username&quot; on Farcaster</li>
              <li>• Only the currently tagged person can tag others</li>
              <li>• You can only tag a person once per 24-hour period</li>
              <li>• The game resets every 24 hours</li>
              <li>• The goal is to spend the least time being tagged</li>
              <li>• Check the leaderboard to see who&apos;s winning!</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">Daily Leaderboard</h2>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Ranked by daily points (faster untagging = more points)
        </p>
            <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-3 text-xs">
              <p className="font-bold mb-1">Point System:</p>
              <p>• Under 10 seconds: 100,000 points</p>
              <p>• 10-60 seconds: 50,000 points</p>
              <p>• 1-5 minutes: 25,000 points</p>
              <p>• 5+ minutes: decreasing points</p>
              <p className="text-primary-700 dark:text-primary-300 mt-1">Max 100k points per day!</p>
            </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No players yet!</p>
              <p className="text-sm text-gray-400">Start playing to see the leaderboard</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.fid}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{entry.displayName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Daily: {(entry.dailyPoints || 0).toLocaleString()} | 
                        Total: {(entry.totalPoints || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{(entry.dailyPoints || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">today</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
