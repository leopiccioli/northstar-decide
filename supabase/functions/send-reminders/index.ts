import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SITE_CONFIG = {
  baseUrl: 'https://3d.ceoencamiseta.com',
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
} as const;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Context-to-question mapping (duplicated from src/types/decision.ts)
const contextQuestions: Record<string, string> = {
  improve: '¿Qué querías mejorar primero?',
  change: '¿Qué cambio buscabas?',
  compare: '¿Qué te hacía dudar?',
  burnout: '¿Qué te pesaba?',
  check: '¿Algo que te hacía ruido?',
};

const BATCH_SIZE = 20;
const DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildReminderLink(email: string, record: any): string {
  const params = new URLSearchParams();
  params.set('email', email);

  // Preserve original UTMs for attribution
  if (record.utm_source) params.set('utm_source', record.utm_source);
  if (record.utm_medium) params.set('utm_medium', record.utm_medium);
  if (record.utm_campaign) params.set('utm_campaign', record.utm_campaign);
  if (record.utm_content) params.set('utm_content', record.utm_content);
  if (record.utm_term) params.set('utm_term', record.utm_term);
  if (record.gclid) params.set('gclid', record.gclid);
  if (record.fbclid) params.set('fbclid', record.fbclid);

  return `${SITE_CONFIG.baseUrl}?${params.toString()}`;
}

function formatComment(comment: string, context?: string | null): string {
  const question = context ? contextQuestions[context] : null;
  if (question) {
    return `${question}\n"${comment}"`;
  }
  return `"${comment}"`;
}

function buildReminderContent(record: any): string {
  const periodLabel = record.reminder_period === '1m' ? '1 mes' : '3 meses';
  const link = buildReminderLink(record.email, record);

  let content = `Hace ${periodLabel} mediste tu 3D:\n\n`;

  if (record.comparison) {
    const comp = record.comparison;
    content += `${record.option_name}:\n`;
    content += `Dinero: ${record.dinero}\nDesarrollo: ${record.desarrollo}\nDiversion: ${record.diversion}\n`;
    if (record.comment) {
      content += `${formatComment(record.comment, record.context)}\n`;
    }
    content += `\n${comp.name}:\n`;
    content += `Dinero: ${comp.dinero}\nDesarrollo: ${comp.desarrollo}\nDiversion: ${comp.diversion}\n`;
    if (comp.comment) {
      content += `${formatComment(comp.comment, record.context)}\n`;
    }
  } else {
    content += `Dinero: ${record.dinero}\nDesarrollo: ${record.desarrollo}\nDiversion: ${record.diversion}\n`;
    if (record.comment) {
      content += `${formatComment(record.comment, record.context)}\n`;
    }
  }

  content += `\nEntra para ver como cambio:\n${link}\n\nLeo`;

  return content;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch pending reminders that are due
    const { data: pendingEmails, error: fetchErr } = await supabase
      .from('outbound_emails')
      .select('id, record_id, to_email')
      .eq('email_type', 'reminder')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) {
      console.error('Fetch error:', fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingEmails?.length) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: 'No pending reminders' }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const pending of pendingEmails) {
      try {
        // Fetch the original record for scores, comment, context, UTMs
        const { data: record, error: recErr } = await supabase
          .from('records_3d')
          .select('email, option_name, dinero, desarrollo, diversion, comment, comparison, context, reminder_period, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid')
          .eq('id', pending.record_id)
          .single();

        if (recErr || !record) {
          console.error(`Record ${pending.record_id} not found:`, recErr);
          await supabase.from('outbound_emails').update({
            status: 'failed',
            error_message: 'Record not found',
          }).eq('id', pending.id);
          failed++;
          continue;
        }

        const emailContent = buildReminderContent(record);

        const emailResponse = await resend.emails.send({
          from: SITE_CONFIG.emailFrom,
          to: [pending.to_email],
          reply_to: SITE_CONFIG.emailReplyTo,
          subject: 'Recordatorio: Medí tu 3D',
          text: emailContent,
        });

        await supabase.from('outbound_emails').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_id: emailResponse.data?.id || null,
        }).eq('id', pending.id);

        sent++;
        console.log(`Sent reminder to ${pending.to_email}`);

        // Delay between emails to avoid rate limits
        if (sent < pendingEmails.length) {
          await sleep(DELAY_MS);
        }
      } catch (err: any) {
        console.error(`Error sending to ${pending.to_email}:`, err.message);
        await supabase.from('outbound_emails').update({
          status: 'failed',
          error_message: err.message || 'Unknown error',
        }).eq('id', pending.id);
        failed++;
      }
    }

    // Check remaining count
    const { count } = await supabase
      .from('outbound_emails')
      .select('*', { count: 'exact', head: true })
      .eq('email_type', 'reminder')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString());

    return new Response(JSON.stringify({ sent, failed, remaining: count || 0 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
