// Supabase Edge Function: ZEGOCLOUD RTC Token Generator
// Uses native Deno runtime built-in APIs

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Standard Zego Token Generation (V2) in TypeScript/Deno
async function generateZegoToken(
  appId: number,
  serverSecret: string,
  userId: string,
  roomId: string,
  effectiveTimeInSeconds: number = 3600
): Promise<string> {
  const createTime = Math.floor(Date.now() / 1000);
  const expireTime = createTime + effectiveTimeInSeconds;
  const nonce = Math.floor(Math.random() * 2147483647);

  const payloadObject = {
    room_id: roomId,
    privilege: {
      1: 1, // login room privilege
      2: 1, // publish stream privilege
    },
    stream_id_list: null,
  };

  const payloadStr = JSON.stringify(payloadObject);

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: nonce,
    ctime: createTime,
    expire: expireTime,
    payload: payloadStr,
  };

  const plainText = JSON.stringify(tokenInfo);

  // Generate 16-byte random IV
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // Prepare 32-byte key from ServerSecret
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(serverSecret);
  const keyBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  // PKCS7 padding for AES-CBC
  const plainBytes = encoder.encode(plainText);
  const blockSize = 16;
  const paddingLength = blockSize - (plainBytes.length % blockSize);
  const paddedBytes = new Uint8Array(plainBytes.length + paddingLength);
  paddedBytes.set(plainBytes);
  paddedBytes.fill(paddingLength, plainBytes.length);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    paddedBytes
  );

  const cipherBytes = new Uint8Array(cipherBuffer);

  // Build binary packet: [4-byte expire][2-byte iv len][iv][2-byte cipher len][cipher]
  const totalLength = 4 + 2 + iv.length + 2 + cipherBytes.length;
  const result = new Uint8Array(totalLength);
  const dataView = new DataView(result.buffer);

  let offset = 0;
  dataView.setInt32(offset, expireTime, false);
  offset += 4;

  dataView.setInt16(offset, iv.length, false);
  offset += 2;
  result.set(iv, offset);
  offset += iv.length;

  dataView.setInt16(offset, cipherBytes.length, false);
  offset += 2;
  result.set(cipherBytes, offset);

  // Return base64 encoded token prefixed with 04 (v2 token identifier)
  let binary = "";
  for (let i = 0; i < result.length; i++) {
    binary += String.fromCharCode(result[i]);
  }
  const base64Token = btoa(binary);
  return "04" + base64Token;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, roomId, effectiveTimeInSeconds } = await req.json();

    if (!userId || !roomId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and roomId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Read ZEGOCLOUD configuration from Supabase Edge Function Secrets or defaults
    const rawAppId = Deno.env.get("ZEGO_APP_ID") || Deno.env.get("VITE_ZEGO_APP_ID") || "1253975777";
    const serverSecret = Deno.env.get("ZEGO_SERVER_SECRET") || Deno.env.get("VITE_ZEGO_SERVER_SECRET") || "f818dcba886ae4b8f401a94a3e8878da";
    const appId = parseInt(rawAppId, 10);

    const token = await generateZegoToken(
      appId,
      serverSecret,
      userId,
      roomId,
      effectiveTimeInSeconds || 3600
    );

    return new Response(
      JSON.stringify({
        success: true,
        appId: appId,
        token: token,
        roomId: roomId,
        userId: userId,
        expiresIn: effectiveTimeInSeconds || 3600,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate ZEGOCLOUD token" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
