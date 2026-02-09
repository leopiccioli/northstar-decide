import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SITE_CONFIG = {
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
} as const;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDiff(current: number, previous: number): string {
  const diff = current - previous;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return '=';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Record3D {
  id: string;
  email: string;
  option_name: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  comment: string | null;
  comparison: any;
  created_at: string;
}

function buildEmailContent(
  record: Record3D,
  previous: { dinero: number; desarrollo: number; diversion: number; created_at: string; comment?: string } | null
): string {
  let content = `Tu medicion de hoy:\n\n`;
  const scores = { dinero: record.dinero, desarrollo: record.desarrollo, diversion: record.diversion };

  if (record.comparison) {
    content += `${record.option_name}:\n`;
    content += `Dinero: ${scores.dinero}\nDesarrollo: ${scores.desarrollo}\nDiversion: ${scores.diversion}\n`;
    if (record.comment) content += `"${record.comment}"\n`;
    content += `\n${record.comparison.name}:\n`;
    content += `Dinero: ${record.comparison.dinero}\nDesarrollo: ${record.comparison.desarrollo}\nDiversion: ${record.comparison.diversion}\n`;
    if (record.comparison.comment) content += `"${record.comparison.comment}"\n`;
    content += `\nListo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  } else if (previous) {
    content += `Dinero: ${scores.dinero}\nDesarrollo: ${scores.desarrollo}\nDiversion: ${scores.diversion}\n`;
    if (record.comment) content += `"${record.comment}"\n`;
    content += `\nAnterior (${formatDate(previous.created_at)}):\n`;
    content += `Dinero: ${previous.dinero}\nDesarrollo: ${previous.desarrollo}\nDiversion: ${previous.diversion}\n`;
    if (previous.comment) content += `"${previous.comment}"\n`;
    content += `\nCambios:\n`;
    content += `Dinero ${formatDiff(scores.dinero, previous.dinero)}\n`;
    content += `Desarrollo ${formatDiff(scores.desarrollo, previous.desarrollo)}\n`;
    content += `Diversion ${formatDiff(scores.diversion, previous.diversion)}\n\n`;
    content += `Listo. Sigo guardando tu historial para que puedas compararte mas adelante.\n\nLeo`;
  } else {
    content += `Dinero: ${scores.dinero}\nDesarrollo: ${scores.desarrollo}\nDiversion: ${scores.diversion}\n`;
    if (record.comment) content += `"${record.comment}"\n`;
    content += `\nListo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  }
  return content;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record_ids } = await req.json() as { record_ids: string[] };

    if (!record_ids?.length) {
      return new Response(JSON.stringify({ error: "record_ids requeridos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results: { email: string; status: string; error?: string }[] = [];

    for (const recordId of record_ids) {
      try {
        // Fetch the record
        const { data: record, error: fetchErr } = await supabase
          .from('records_3d')
          .select('id, email, option_name, dinero, desarrollo, diversion, comment, comparison, created_at')
          .eq('id', recordId)
          .single();

        if (fetchErr || !record) {
          results.push({ email: recordId, status: 'error', error: 'Record not found' });
          continue;
        }

        // Find previous measurement (older than this one, same email, no comparison)
        const { data: prevRecords } = await supabase
          .from('records_3d')
          .select('dinero, desarrollo, diversion, created_at, comment')
          .eq('email', record.email)
          .is('comparison', null)
          .lt('created_at', record.created_at)
          .order('created_at', { ascending: false })
          .limit(1);

        const previous = prevRecords?.[0] || null;
        const emailContent = buildEmailContent(record as Record3D, previous);

        // Send email
        const emailResponse = await resend.emails.send({
          from: SITE_CONFIG.emailFrom,
          to: [record.email],
          reply_to: SITE_CONFIG.emailReplyTo,
          subject: 'Tu medicion 3D',
          text: emailContent,
        });

        // Log in outbound_emails
        await supabase.from('outbound_emails').insert({
          record_id: recordId,
          to_email: record.email,
          subject: 'Tu medicion 3D',
          email_type: 'measurement',
          status: 'sent',
          provider_id: emailResponse.data?.id || null,
          sent_at: new Date().toISOString(),
        });

        // Mark as sent
        await supabase.from('records_3d').update({ email_sent: true }).eq('id', recordId);

        results.push({ email: record.email, status: 'sent' });
      } catch (err: any) {
        results.push({ email: recordId, status: 'error', error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
