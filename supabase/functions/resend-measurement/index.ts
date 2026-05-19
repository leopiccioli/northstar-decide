import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SITE_CONFIG = {
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
} as const;

// Libros — mantener en sync con src/config/urls.ts y save-result/index.ts
const BOOKS = {
  rajar: 'https://comorajaratujefe.com',
  ceo: 'https://setupropioceo.com',
  finanzas: 'https://finanzasellibro.com',
} as const;

type Dimension = 'dinero' | 'desarrollo' | 'diversion';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Context-to-question mapping (sync con save-result)
const contextQuestions: Record<string, string> = {
  improve: '¿Qué querés mejorar primero?',
  change: '¿Qué cambio buscás?',
  compare: '¿Qué te hace dudar?',
  burnout: '¿Qué te pesa hoy?',
  check: '¿Algo que te haga ruido?',
};

function formatComment(comment: string, context?: string | null): string {
  const question = context ? contextQuestions[context] : null;
  if (question) return `${question}\n"${comment}"`;
  return `"${comment}"`;
}

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

// Empate: prioridad Diversion > Desarrollo > Dinero
function pickLowestDimension(
  scores: { dinero: number; desarrollo: number; diversion: number },
  comparison: any | null
): { dim: Dimension; value: number } {
  const candidates: Array<{ dim: Dimension; value: number }> = [
    { dim: 'diversion', value: scores.diversion },
    { dim: 'desarrollo', value: scores.desarrollo },
    { dim: 'dinero', value: scores.dinero },
  ];
  if (comparison) {
    candidates.push(
      { dim: 'diversion', value: comparison.diversion },
      { dim: 'desarrollo', value: comparison.desarrollo },
      { dim: 'dinero', value: comparison.dinero },
    );
  }
  return candidates.reduce((min, c) => (c.value < min.value ? c : min), candidates[0]);
}

function buildBookUrl(url: string, dim: Dimension, email: string): string {
  const params = new URLSearchParams({
    email,
    utm_source: '3d',
    utm_medium: 'email',
    utm_campaign: 'measurement_ps',
    utm_content: dim,
  });
  return `${url}/?${params.toString()}`;
}

function buildBookPS(
  scores: { dinero: number; desarrollo: number; diversion: number },
  comparison: any | null,
  email: string
): string {
  const { dim, value } = pickLowestDimension(scores, comparison);
  if (value >= 9) return '';

  const rajarUrl = buildBookUrl(BOOKS.rajar, dim, email);
  const ceoUrl = buildBookUrl(BOOKS.ceo, dim, email);
  const finanzasUrl = buildBookUrl(BOOKS.finanzas, dim, email);

  if (dim === 'diversion') {
    return `\n\nP.S. Pusiste un ${value} en Diversion. Para ese numero escribi un libro:\nComo RAJAR a tu jefe. No es lo que te imaginas.\n${rajarUrl}`;
  }
  if (dim === 'dinero') {
    return `\n\nP.S. Pusiste un ${value} en Dinero. Tengo un libro para eso:\nFINANZAS. Lo que no te enseñaron en la escuela.\n${finanzasUrl}\n\nAunque si atras de ese numero hay un jefe, empeza por:\nComo RAJAR a tu jefe — ${rajarUrl}`;
  }
  return `\n\nP.S. Pusiste un ${value} en Desarrollo. Tengo un libro para eso:\nSe tu propio CEO.\n${ceoUrl}\n\nAunque si lo que frena tu crecimiento tiene nombre y apellido,\nprimero lee: Como RAJAR a tu jefe — ${rajarUrl}`;
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
  context: string | null;
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
    if (record.comment) content += `${formatComment(record.comment, record.context)}\n`;
    content += `\n${record.comparison.name}:\n`;
    content += `Dinero: ${record.comparison.dinero}\nDesarrollo: ${record.comparison.desarrollo}\nDiversion: ${record.comparison.diversion}\n`;
    if (record.comparison.comment) content += `${formatComment(record.comparison.comment, record.context)}\n`;
    content += `\nListo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  } else if (previous) {
    content += `Dinero: ${scores.dinero}\nDesarrollo: ${scores.desarrollo}\nDiversion: ${scores.diversion}\n`;
    if (record.comment) content += `${formatComment(record.comment, record.context)}\n`;
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
    if (record.comment) content += `${formatComment(record.comment, record.context)}\n`;
    content += `\nListo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  }

  content += buildBookPS(scores, record.comparison, record.email);

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
        const { data: record, error: fetchErr } = await supabase
          .from('records_3d')
          .select('id, email, option_name, dinero, desarrollo, diversion, comment, comparison, context, created_at')
          .eq('id', recordId)
          .single();

        if (fetchErr || !record) {
          results.push({ email: recordId, status: 'error', error: 'Record not found' });
          continue;
        }

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

        const emailResponse = await resend.emails.send({
          from: SITE_CONFIG.emailFrom,
          to: [record.email],
          reply_to: SITE_CONFIG.emailReplyTo,
          subject: 'Tu medicion 3D',
          text: emailContent,
        });

        await supabase.from('outbound_emails').insert({
          record_id: recordId,
          to_email: record.email,
          subject: 'Tu medicion 3D',
          email_type: 'measurement',
          status: 'sent',
          provider_id: emailResponse.data?.id || null,
          sent_at: new Date().toISOString(),
        });

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
