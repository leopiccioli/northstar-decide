import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SITE_CONFIG = {
  baseUrl: 'https://3d.ceoencamiseta.com',
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
} as const;

const MAX_ATTEMPTS = 3;
const FOLLOW_UP_DAYS = 30;
const BATCH_SIZE = 20;
const DELAY_MS = 3000;

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildReminderLink(email: string, record: any): string {
  const params = new URLSearchParams();
  params.set('email', email);

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

function computeMonthsAgo(recordCreatedAt: string): number {
  const created = new Date(recordCreatedAt);
  const now = new Date();
  const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  return Math.max(1, months);
}

function buildReminderContent(record: any, monthsAgo: number): string {
  const periodLabel = monthsAgo === 1 ? '1 mes' : `${monthsAgo} meses`;
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

    // Fetch pending reminders with dedup: one per email, oldest first
    const { data: pendingEmails, error: fetchErr } = await supabase
      .rpc('get_pending_reminders_deduped', { batch_limit: BATCH_SIZE });

    // Fallback: if RPC doesn't exist yet, use direct query
    let reminders = pendingEmails;
    if (fetchErr) {
      console.log('RPC not found, using direct query with dedup');
      const { data, error } = await supabase
        .from('outbound_emails')
        .select('id, record_id, to_email, reminder_attempt')
        .eq('email_type', 'reminder')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(BATCH_SIZE);

      if (error) {
        console.error('Fetch error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Manual dedup: keep first (oldest) per email
      const seen = new Set<string>();
      reminders = (data || []).filter((r: any) => {
        const email = r.to_email.toLowerCase();
        if (seen.has(email)) return false;
        seen.add(email);
        return true;
      });
    }

    if (!reminders?.length) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, scheduled: 0, message: 'No pending reminders' }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;
    let scheduled = 0;

    for (const pending of reminders) {
      try {
        // Fetch the original record
        const { data: record, error: recErr } = await supabase
          .from('records_3d')
          .select('email, option_name, dinero, desarrollo, diversion, comment, comparison, context, reminder_period, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid')
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

        // Check completion: any newer record from this email
        const { data: completion } = await supabase
          .from('records_3d')
          .select('id')
          .eq('email', record.email)
          .gt('created_at', record.created_at)
          .limit(1);

        if (completion && completion.length > 0) {
          // User already completed — mark as sent (no email needed), don't schedule follow-up
          console.log(`Skipping ${pending.to_email}: already completed`);
          await supabase.from('outbound_emails').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: 'Skipped: user completed',
          }).eq('id', pending.id);
          continue;
        }

        // Compute dynamic period
        const monthsAgo = computeMonthsAgo(record.created_at);
        const emailContent = buildReminderContent(record, monthsAgo);

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
        console.log(`Sent reminder #${pending.reminder_attempt} to ${pending.to_email}`);

        // Schedule follow-up if under max attempts
        const currentAttempt = pending.reminder_attempt || 1;
        if (currentAttempt < MAX_ATTEMPTS) {
          // Check no other pending reminder exists for this email
          const { data: existingPending } = await supabase
            .from('outbound_emails')
            .select('id')
            .eq('to_email', pending.to_email)
            .eq('email_type', 'reminder')
            .eq('status', 'pending')
            .limit(1);

          if (!existingPending || existingPending.length === 0) {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + FOLLOW_UP_DAYS);

            const { error: insertErr } = await supabase.from('outbound_emails').insert({
              to_email: pending.to_email,
              email_type: 'reminder',
              subject: 'Recordatorio: Medí tu 3D',
              record_id: pending.record_id,
              scheduled_for: followUpDate.toISOString(),
              reminder_attempt: currentAttempt + 1,
              status: 'pending',
            });

            if (insertErr) {
              console.error(`Failed to schedule follow-up for ${pending.to_email}:`, insertErr);
            } else {
              scheduled++;
              console.log(`Scheduled follow-up #${currentAttempt + 1} for ${pending.to_email} on ${followUpDate.toISOString()}`);
            }
          }
        }

        // Delay between emails
        if (sent < reminders.length) {
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

    return new Response(JSON.stringify({ sent, failed, scheduled, remaining: count || 0 }), {
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
