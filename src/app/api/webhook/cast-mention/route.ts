import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/redis';
import { getNeynarClient } from '@/lib/neynar';

// Webhook to handle cast mentions of @tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature if needed
    // TODO: Add signature verification based on your webhook provider
    
    // Handle different webhook formats
    let cast = null;
    
    // Neynar webhook format
    if (body.type === 'cast.created' && body.data) {
      cast = body.data;
    }
    // Alternative webhook formats
    else if (body.cast) {
      cast = body.cast;
    }
    else if (body.data && body.data.cast) {
      cast = body.data.cast;
    }
    
    if (!cast) {
      console.log('No cast found in webhook payload:', JSON.stringify(body, null, 2));
      return NextResponse.json({ success: true, message: 'No cast data found' });
    }
    
    const text = cast.text || '';
    const textLower = text.toLowerCase();
    
    // Check if the cast mentions @tag and another user
    // Support different formats: "@tag @username", "@tag username", etc.
    const tagMentionRegex = /@tag\s+@?(\w+)/i;
    const match = textLower.match(tagMentionRegex);
    
    if (match) {
      const taggerFid = cast.author?.fid || cast.fid;
      const taggedUsername = match[1];
      
      if (!taggerFid) {
        console.log('No tagger FID found in cast:', cast);
        return NextResponse.json({ success: false, message: 'No tagger FID found' });
      }
      
      console.log(`Processing tag from cast: ${taggerFid} wants to tag @${taggedUsername}`);
      
      // Look up the tagged user by username
      try {
        const client = getNeynarClient();
        const searchResponse = await client.searchUser({ q: taggedUsername, limit: 1 });
        
        if (searchResponse.result.users.length > 0) {
          const taggedUser = searchResponse.result.users[0];
          const taggedFid = taggedUser.fid;
            
            // Create the tagged player if they don't exist
            await gameService.createOrUpdatePlayer({
              fid: taggedFid,
              username: taggedUser.username,
              displayName: taggedUser.display_name,
              pfpUrl: taggedUser.pfp_url,
              timesTagged: 0,
              timesTaggedOthers: 0,
              totalTimeTagged: 0,
              dailyPoints: 0,
              lastPointsDate: new Date().toISOString().split('T')[0],
              totalPoints: 0,
            });
            
            // Create the tagger player if they don't exist
            const author = cast.author || cast;
            await gameService.createOrUpdatePlayer({
              fid: taggerFid,
              username: author.username || author.handle || `user${taggerFid}`,
              displayName: author.display_name || author.displayName || author.username || `User ${taggerFid}`,
              pfpUrl: author.pfp_url || author.pfpUrl || '',
              timesTagged: 0,
              timesTaggedOthers: 0,
              totalTimeTagged: 0,
              dailyPoints: 0,
              lastPointsDate: new Date().toISOString().split('T')[0],
              totalPoints: 0,
            });
            
            // Check if game should be reset (24 hour cycle)
            await gameService.checkAndResetGame();
            
            // Tag the player (allow admin override for cast mentions)
            const result = await gameService.tagPlayer(taggerFid, taggedFid, false);
            
            console.log(`Tag via cast: ${cast.author.username} tagged ${taggedUser.username}`, result);
            
            return NextResponse.json({ 
              success: true, 
              message: `Tagged ${taggedUser.username} via cast`,
              result 
            });
          } else {
            console.log(`User not found: ${taggedUsername}`);
            return NextResponse.json({ 
              success: false, 
              message: `User @${taggedUsername} not found` 
            });
          }
        } catch (error) {
          console.error('Error looking up tagged user:', error);
          return NextResponse.json({ 
            success: false, 
            message: 'Error processing tag' 
          }, { status: 500 });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing cast mention webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process webhook' 
    }, { status: 500 });
  }
}
