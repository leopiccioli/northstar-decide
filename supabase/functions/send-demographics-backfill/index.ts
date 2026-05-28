import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SITE_CONFIG = {
  baseUrl: 'https://3d.ceoencamiseta.com',
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
} as const;

const AGE_RANGES = ['18-24','25-34','35-44','45-54','55-64','65+'] as const;
const DELAY_MS = 1500;
const SUBJECT = 'Hace un tiempo hiciste las 3D — ¿cómo te comparás por edad?';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(d: string): string {
  const created = new Date(d);
  const now = new Date();
  const days = Math.floor((now.getTime() - created.getTime()) / 86400000);
  if (days < 30) return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
  const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  if (months < 12) return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'Hace 1 año' : `Hace ${years} años`;
}

function buildCompletarUrl(token: string, age?: string): string {
  const params = new URLSearchParams({
    token,
    utm_source: '3d',
    utm_medium: 'email',
    utm_campaign: 'demographics_backfill',
    utm_content: age ? `age_${age}` : 'completar',
  });
  if (age) params.set('age', age);
  return `${SITE_CONFIG.baseUrl}/completar?${params.toString()}`;
}

function buildRedoUrl(email: string): string {
  const params = new URLSearchParams({
    email,
    utm_source: '3d',
    utm_medium: 'email',
    utm_campaign: 'demographics_backfill',
    utm_content: 'redo',
  });
  return `${SITE_CONFIG.baseUrl}/?${params.toString()}`;
}

function buildPorPaisUrl(): string {
  return `${SITE_CONFIG.baseUrl}/por-pais?utm_source=3d&utm_medium=email&utm_campaign=demographics_backfill&utm_content=por_pais`;
}

function renderHtml(record: any): string {
  const redo = buildRedoUrl(record.email);
  const porPais = buildPorPaisUrl();
  const ago = timeAgo(record.created_at);
  const date = formatDate(record.created_at);

  const ageChips = AGE_RANGES.map(age => {
    const url = buildCompletarUrl(record.id, age);
    return `<a href="${url}" style="display:inline-block;padding:8px 14px;margin:4px 4px 4px 0;border:1px solid #000;border-radius:4px;color:#000;text-decoration:none;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">${age}</a>`;
  }).join('');

  const scoresTable = `
    <table style="border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:2px 16px 2px 0">Dinero</td><td style="padding:2px 0;font-weight:600">${record.dinero}</td></tr>
      <tr><td style="padding:2px 16px 2px 0">Desarrollo</td><td style="padding:2px 0;font-weight:600">${record.desarrollo}</td></tr>
      <tr><td style="padding:2px 16px 2px 0">Diversión</td><td style="padding:2px 0;font-weight:600">${record.diversion}</td></tr>
    </table>
  `;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#ffffff;color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55">
<div style="max-width:520px;margin:0 auto">
<p>${ago} (${date}) completaste las 3D:</p>
${scoresTable}
<p>Sumamos comparaciones por sector y edad (como ya hacemos <a href="${porPais}" style="color:#000;text-decoration:underline">por país</a>). Para que tu medición aparezca ahí, faltan dos datos.</p>
<p style="margin-top:24px"><strong>Dos opciones:</strong></p>

<p style="margin-top:16px"><strong>1.</strong> <a href="${redo}" style="color:#000;text-decoration:underline">Hacé las 3D de nuevo</a> — te evaluás hoy y completamos los datos.</p>

<p style="margin-top:20px"><strong>2.</strong> Tocá tu edad y la sumamos ahora:</p>
<div style="margin:8px 0">${ageChips}</div>
<p style="color:#666;font-size:13px;margin-top:8px">Después te pido el sector en 1 click más.</p>

<p style="margin-top:32px">Leo</p>
</div></body></html>`;
}

function renderText(record: any): string {
  const redo = buildRedoUrl(record.email);
  const porPais = buildPorPaisUrl();
  const ago = timeAgo(record.created_at);
  const date = formatDate(record.created_at);
  const chips = AGE_RANGES.map(age => `  [${age}] ${buildCompletarUrl(record.id, age)}`).join('\n');

  return `${ago} (${date}) completaste las 3D:

Dinero       ${record.dinero}
Desarrollo   ${record.desarrollo}
Diversión    ${record.diversion}

Sumamos comparaciones por sector y edad (como ya hacemos por país: ${porPais}).
Para que tu medición aparezca ahí, faltan dos datos.

Dos opciones:

1. Hacé las 3D de nuevo — te evaluás hoy y completamos los datos:
   ${redo}

2. Tocá tu edad y la sumamos ahora:
${chips}

Después te pido el sector en 1 click más.

Leo`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const batchLimit = Math.min(Math.max(Number(body.batch_limit) || 100, 1), 500);
    const testEmail: string | undefined = body.test_email;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let toSend: any[] = [];

    if (testEmail) {
      // Test mode: pick latest record for any email, ignore notified set
      const { data: rec, error } = await supabase
        .from('records_3d')
        .select('id, email, sector, age_range, dinero, desarrollo, diversion, created_at')
        .ilike('email', testEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !rec) {
        return new Response(JSON.stringify({ error: error?.message || 'No record found for test_email' }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      toSend = [{ ...rec, email: testEmail }];
    } else {
      const { data: pending, error } = await supabase
        .rpc('get_pending_demographics_backfill', { batch_limit: batchLimit });

      if (error) {
        console.error('RPC error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      toSend = (pending || []).map((r: any) => ({
        id: r.record_id,
        email: r.email,
        dinero: r.dinero,
        desarrollo: r.desarrollo,
        diversion: r.diversion,
        created_at: r.created_at,
      }));

      if (!toSend.length) {
        return new Response(JSON.stringify({ sent: 0, failed: 0, message: 'No pending backfill emails' }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

    }

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < toSend.length; i++) {
      const record = toSend[i];
      try {
        const { data: outbound } = await supabase
          .from('outbound_emails')
          .insert({
            record_id: record.id,
            to_email: record.email,
            subject: SUBJECT,
            email_type: 'demographics_backfill',
            status: 'pending',
          })
          .select('id')
          .single();

        const resp = await resend.emails.send({
          from: SITE_CONFIG.emailFrom,
          to: [record.email],
          reply_to: SITE_CONFIG.emailReplyTo,
          subject: SUBJECT,
          text: renderText(record),
          html: renderHtml(record),
        });

        if (outbound?.id) {
          await supabase.from('outbound_emails').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_id: resp.data?.id || null,
          }).eq('id', outbound.id);
        }

        sent++;
        console.log(`[demographics_backfill] sent ${record.email}`);
      } catch (err: any) {
        console.error(`Error sending to ${record.email}:`, err.message);
        await supabase.from('outbound_emails').update({
          status: 'failed',
          error_message: err.message || 'Unknown error',
        }).eq('to_email', record.email).eq('email_type', 'demographics_backfill').eq('status', 'pending');
        failed++;
      }

      if (i < toSend.length - 1) await sleep(DELAY_MS);
    }

    return new Response(JSON.stringify({ sent, failed, total: toSend.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
