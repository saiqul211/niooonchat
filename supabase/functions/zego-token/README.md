# Supabase Edge Function: ZEGOCLOUD RTC Token Generator

This Supabase Edge Function generates secure, time-limited authentication tokens for **ZEGOCLOUD Real-Time Audio and Video Calling** across both the **Web Application** and **Android Native App**.

## Secrets Required
In your Supabase project dashboard (`https://supabase.com/dashboard/project/bjwzqafnspaeuwgnxnyn/settings/functions`), add the following secrets:

- `ZEGO_APP_ID`: Your ZEGOCLOUD AppID (numeric integer) from the [ZEGOCLOUD Admin Console](https://console.zegocloud.com/).
- `ZEGO_SERVER_SECRET`: Your 32-character Server Secret from ZEGOCLOUD Console.

## Deployment Command
To deploy this edge function directly using Supabase CLI:
```bash
supabase functions deploy zego-token --project-ref bjwzqafnspaeuwgnxnyn
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
