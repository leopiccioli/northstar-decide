import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

/**
 * IMPORTANTE: Buenas prácticas para emails con links
 * 
 * 1. SIEMPRE incluir ?email= en los links
 *    La app soporta pre-fill via URL params (?email=xxx@xxx.com).
 *    Mejora UX: email pre-llenado y sección de guardado auto-expandida.
 *    Usar: encodeURIComponent(user.email) para caracteres especiales.
 * 
 * 2. SIEMPRE incluir fechas en datos históricos
 *    Cuando se muestran mediciones anteriores, incluir la fecha.
 *    Formato: dd/mm/yyyy (es-AR)
 * 
 * 3. SIEMPRE incluir comentarios si existen
 *    Los comentarios van entre comillas debajo de los scores.
 * 
 * Ver: src/config/urls.ts para la configuración centralizada de URLs
 */

// Configuration constants (Edge Functions can't import from src/)
const BASE_URL = 'https://3d.ceoencamiseta.com';
const EMAIL_FROM = '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>';
const EMAIL_REPLY_TO = 'leopiccioli@gmail.com';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  batchSize?: number;
  delayMs?: number;
  dryRun?: boolean;
}

interface LegacyUser {
  email: string;
  record_count: number;
  dinero: number;
  desarrollo: number;
  diversion: number;
  created_at: string;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const buildEmailHtml = (user: LegacyUser): string => {
  const formattedDate = formatDate(user.created_at);
  const recordText = user.record_count === 1 
    ? '1 medición histórica' 
    : `${user.record_count} mediciones históricas`;
  
  // URL con email pre-filled para mejor UX
  const emailParam = encodeURIComponent(user.email);
  const linkUrl = `${BASE_URL}?email=${emailParam}`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hola,</p>
      
      <p>Ya están tus datos anteriores en el nuevo 3D.</p>
      
      <p>Tenés <strong>${recordText}</strong>. Tu más reciente (${formattedDate}):</p>
      
      <ul style="list-style: none; padding: 0;">
        <li><strong>Dinero:</strong> ${user.dinero}</li>
        <li><strong>Desarrollo:</strong> ${user.desarrollo}</li>
        <li><strong>Diversión:</strong> ${user.diversion}</li>
      </ul>
      
      <p>Entrá a <a href="${linkUrl}">${BASE_URL}</a> para ver tu historial completo.</p>
      
      <p>Leo</p>
    </div>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 50, delayMs = 3000, dryRun = false }: NotificationRequest = await req.json().catch(() => ({}));

    // Use PostgreSQL RPC to get pending users (bypasses 1000 record limit)
    const { data: usersToNotify, error: queryError } = await supabase
      .rpc('get_pending_legacy_notifications', { batch_limit: batchSize });

    if (queryError) {
      throw new Error(`Failed to fetch pending users: ${queryError.message}`);
    }

    const results = {
      sent: 0,
      failed: 0,
      remaining: 0,
      totalRecordsProcessed: usersToNotify.length,
      dryRun,
      errors: [] as string[]
    };

    const subject = "3D Reloaded: parece una peli pero es mejor";

    for (let i = 0; i < usersToNotify.length; i++) {
      const user = usersToNotify[i];

      if (dryRun) {
        console.log(`[DRY RUN] Would send to: ${user.email} (${user.record_count} records)`);
        results.sent++;
        continue;
      }

      try {
        // Send email
        const emailResponse = await resend.emails.send({
          from: EMAIL_FROM,
          to: [user.email],
          reply_to: EMAIL_REPLY_TO,
          subject,
          html: buildEmailHtml(user),
        });

        // Record in outbound_emails
        const { error: insertError } = await supabase.from('outbound_emails').insert({
          to_email: user.email,
          subject,
          email_type: 'legacy_notification',
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_id: emailResponse.data?.id || null,
        });

        if (insertError) {
          console.error(`Failed to record email for ${user.email}:`, insertError.message);
          results.errors.push(`${user.email}: DB insert failed - ${insertError.message}`);
        }

        results.sent++;
        console.log(`Sent notification to: ${user.email}`);

      } catch (emailError: any) {
        results.failed++;
        const errorMsg = `${user.email}: ${emailError.message}`;
        results.errors.push(errorMsg);
        console.error(`Failed to send to ${user.email}:`, emailError.message);

        // Record failure in outbound_emails
        const { error: insertError } = await supabase.from('outbound_emails').insert({
          to_email: user.email,
          subject,
          email_type: 'legacy_notification',
          status: 'failed',
          error_message: emailError.message,
        });

        if (insertError) {
          console.error(`Failed to record failure for ${user.email}:`, insertError.message);
        }
      }

      // Delay between emails (except for last one)
      if (i < usersToNotify.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Calculate remaining using RPC (bypasses 1000 record limit)
    const { data: pendingCount } = await supabase.rpc('count_pending_legacy_notifications');
    results.remaining = (pendingCount || 0) - results.sent;

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-legacy-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
