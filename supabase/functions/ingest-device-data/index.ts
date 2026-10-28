// Supabase Edge Function: ingest-device-data/index.ts
// Validates and ingests HTTP POST telemetry payloads from ESP32 wearable hardware modules

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VALID_DEVICE_TOKENS = new Set([
  "tok_esp32_safelynk_prod_8842",
  "tok_esp32_demo_key_9910",
  "tok_esp32_wearer_sarah_01"
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    if (!token || !VALID_DEVICE_TOKENS.has(token)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized ESP32 device token. Access denied." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    const {
      deviceIdentifier = "ESP32-SL-8842",
      heartRate = 75,
      motionX = 0.05,
      motionY = 0.98,
      motionZ = 0.12,
      batteryLevel = 88,
      buttonPressed = false,
      buttonPressDurationMs = 0
    } = payload;

    const motionMagnitude = Math.sqrt(motionX * motionX + motionY * motionY + motionZ * motionZ);
    let sensorStatus = "nominal";

    if (motionMagnitude > 3.2) {
      sensorStatus = "potential_fall";
    } else if (heartRate > 125) {
      sensorStatus = "elevated_hr";
    }

    const isPhysicalSOS = buttonPressed || buttonPressDurationMs >= 2500;

    return new Response(
      JSON.stringify({
        status: isPhysicalSOS ? "PHYSICAL_SOS_TRIGGERED" : "TELEMETRY_RECORDED",
        deviceIdentifier,
        sensorStatus,
        motionMagnitude: Number(motionMagnitude.toFixed(3)),
        batteryLevel,
        isPhysicalSOS,
        processedAt: new Date().toISOString()
      }),
      { status: isPhysicalSOS ? 201 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
