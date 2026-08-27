# Supabase Edge Function: ZEGOCLOUD RTC Token Generator

This Supabase Edge Function generates secure, time-limited authentication tokens for **ZEGOCLOUD Real-Time Audio and Video Calling** across both the **Web Application** and **Android Native App**.

## App Configuration
- **AppID**: `1253975777`
- **ServerSecret**: `f818dcba886ae4b8f401a94a3e8878da`

## Deployment Command
To deploy this edge function directly using Supabase CLI:
```bash
supabase functions deploy zego-token --project-ref bjwzqafnspaeuwgnxnyn
```

You can also set these via Supabase Secrets:
```bash
supabase secrets set ZEGO_APP_ID=1253975777 ZEGO_SERVER_SECRET=f818dcba886ae4b8f401a94a3e8878da --project-ref bjwzqafnspaeuwgnxnyn
```

## Endpoint URL
- `https://bjwzqafnspaeuwgnxnyn.supabase.co/functions/v1/zego-token`

## Request Format
```json
{
  "userId": "user_123",
  "roomId": "room_abc_xyz",
  "effectiveTimeInSeconds": 3600
}
```

## Response Format
```json
{
  "success": true,
  "appId": 123456789,
  "token": "04AAAAA...",
  "roomId": "room_abc_xyz",
  "userId": "user_123",
  "expiresIn": 3600
}
```
