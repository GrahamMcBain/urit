# Webhook Setup for Cast Mentions

To enable tagging via cast mentions (e.g., "@tag @username"), you need to set up a webhook that listens for cast events on Farcaster.

## Webhook Endpoint

The app provides a webhook endpoint at:
```
https://yourdomain.com/api/webhook/cast-mention
```

## Webhook Configuration

### Option 1: Neynar Webhooks
1. Go to [Neynar Developer Dashboard](https://dev.neynar.com/)
2. Create a new webhook
3. Set the webhook URL to `https://yourdomain.com/api/webhook/cast-mention`
4. Subscribe to `cast.created` events
5. Set up filters to only receive casts that mention your target account

### Option 2: Warpcast/Farcaster Webhooks
1. Set up a webhook subscription for cast events
2. Filter for casts containing "@tag" mentions
3. Point the webhook to your endpoint

## Webhook Payload

The webhook should send cast data in one of these formats:

### Neynar Format
```json
{
  "type": "cast.created",
  "data": {
    "text": "@tag @username",
    "author": {
      "fid": 123,
      "username": "alice",
      "display_name": "Alice",
      "pfp_url": "https://..."
    }
  }
}
```

### Alternative Format
```json
{
  "cast": {
    "text": "@tag @username",
    "fid": 123,
    "username": "alice",
    "display_name": "Alice",
    "pfp_url": "https://..."
  }
}
```

## Supported Tag Formats

The webhook will recognize these tag formats in casts:
- `@tag @username` - Standard format
- `@tag username` - Without @ prefix on username

## Security

Add webhook signature verification by implementing the TODO in the webhook handler:
```typescript
// TODO: Add signature verification based on your webhook provider
```

## Testing

Test your webhook by:
1. Posting a cast with "@tag @username" format
2. Checking your webhook endpoint logs
3. Verifying the tag appears in the game
