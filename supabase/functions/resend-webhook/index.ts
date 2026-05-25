import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-signature, svix-timestamp",
};

// Resend event types -> normalized event_type stored in DB
function normalizeEventType(t: string): string {
  // e.g. "email.delivered" -> "delivered"
  return t.startsWith("email.") ? t.slice("email.".length) : t;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

    // Verify signature (Resend uses Svix)
    if (webhookSecret) {
      try {
        const wh = new Webhook(webhookSecret);
        const headers = {
          "svix-id": req.headers.get("svix-id") || "",
          "svix-timestamp": req.headers.get("svix-timestamp") || "",
          "svix-signature": req.headers.get("svix-signature") || "",
        };
        wh.verify(rawBody, headers);
      } catch (err: any) {
        console.error("Signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: "invalid signature" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("RESEND_WEBHOOK_SECRET not set — accepting without verification");
    }

    const payload = JSON.parse(rawBody);
    const type = payload?.type as string | undefined;
    const data = payload?.data || {};

    // Only accept events from 3d.ceoencamiseta.com domain
    const ALLOWED_DOMAIN = '3d.ceoencamiseta.com';
    const fromField = String(data.from || '');
    if (!fromField.includes(`@${ALLOWED_DOMAIN}`)) {
      return new Response(
        JSON.stringify({ ok: true, skipped: 'foreign domain' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!type) {
      return new Response(JSON.stringify({ error: "missing type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resendId = data.email_id || data.id || null;
    const toEmail = Array.isArray(data.to) ? data.to[0] : data.to || null;
    const click = data.click || {};

    const { error } = await supabase.from("email_events").insert({
      resend_email_id: resendId || "unknown",
      event_type: normalizeEventType(type),
      to_email: toEmail,
      link_url: click.link || null,
      user_agent: click.userAgent || null,
      ip_address: click.ipAddress || null,
      raw_payload: payload,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Handler error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
