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

// URL configuration (Edge Functions can't import from src/)
const SITE_CONFIG = {
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
} as const;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
};

interface Scores {
  dinero: number;
  desarrollo: number;
  diversion: number;
}

interface Comparison {
  name: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  comment?: string;
}

// Context-to-question mapping (duplicated from src/types/decision.ts - edge functions can't import from src/)
const contextQuestions: Record<string, string> = {
  improve: '¿Qué querés mejorar primero?',
  change: '¿Qué cambio buscás?',
  compare: '¿Qué te hace dudar?',
  burnout: '¿Qué te pesa hoy?',
  check: '¿Algo que te haga ruido?',
};

interface SaveResultRequest {
  email: string;
  country?: string;
  optionName: string;
  scores: Scores;
  comment?: string;
  context?: string;
  comparison?: Comparison;
  reminderPeriod?: '1m' | '3m';
  honeypot?: string; // Anti-bot field - should always be empty
  tracking: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    gclid?: string;
    fbclid?: string;
    referrer?: string;
  };
}

// Sanitize text input: trim, limit length, strip HTML tags
function sanitizeText(text: string | undefined | null, maxLength: number): string | null {
  if (!text) return null;
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>]/g, ''); // Remove any remaining angle brackets
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate scores are 1-10
function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 10;
}

// Calculate reminder date
function calculateReminderDate(period: '1m' | '3m'): Date {
  const now = new Date();
  const months = period === '1m' ? 1 : 3;
  return new Date(now.setMonth(now.getMonth() + months));
}

// Format score diff for email
function formatDiff(current: number, previous: number): string {
  const diff = current - previous;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return '=';
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Build email content
function formatComment(comment: string, context?: string): string {
  const question = context ? contextQuestions[context] : null;
  if (question) {
    return `${question}\n"${comment}"`;
  }
  return `"${comment}"`;
}

// Libros — mantener en sync con src/config/urls.ts (SITE_CONFIG.books)
const BOOKS = {
  rajar: 'https://comorajaratujefe.com',
  ceo: 'https://setupropioceo.com',
  finanzas: 'https://finanzasellibro.com',
} as const;

type Dimension = 'dinero' | 'desarrollo' | 'diversion';

// Empate: prioridad Diversion > Desarrollo > Dinero (privilegia el pitch del libro estrella).
function pickLowestDimension(
  currentScores: Scores,
  comparison: Comparison | null
): { dim: Dimension; value: number } {
  const candidates: Array<{ dim: Dimension; value: number }> = [
    { dim: 'diversion', value: currentScores.diversion },
    { dim: 'desarrollo', value: currentScores.desarrollo },
    { dim: 'dinero', value: currentScores.dinero },
  ];
  if (comparison) {
    candidates.push(
      { dim: 'diversion', value: comparison.diversion },
      { dim: 'desarrollo', value: comparison.desarrollo },
      { dim: 'dinero', value: comparison.dinero },
    );
  }
  // El orden del array ya resuelve empates segun la prioridad pedida.
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

// Devuelve '' si la D mas baja es >= 9 (no hay nada para vender).
function buildBookPS(
  currentScores: Scores,
  comparison: Comparison | null,
  email: string
): string {
  const { dim, value } = pickLowestDimension(currentScores, comparison);
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
  // desarrollo
  return `\n\nP.S. Pusiste un ${value} en Desarrollo. Tengo un libro para eso:\nSe tu propio CEO.\n${ceoUrl}\n\nAunque si lo que frena tu crecimiento tiene nombre y apellido,\nprimero lee: Como RAJAR a tu jefe — ${rajarUrl}`;
}

// WhatsApp recommend block — mantener en sync con src/config/urls.ts
function buildWhatsAppRecommendUrl(variant: 'email' | 'reminder_1m' | 'reminder_2m' | 'reminder_3m'): string {
  const msgs = {
    email: { msg: 'Te mando esto porque creo que te puede servir. Son 2 minutos y te ordena la cabeza.', campaign: 'share_email', content: 'ps_recommend' },
    reminder_1m: { msg: 'Yo uso esto cada tanto para ver cómo estoy en el trabajo. Puede servirte.', campaign: 'share_reminder', content: '1m' },
    reminder_2m: { msg: 'Yo uso esto cada tanto para ver cómo estoy en el trabajo. Puede servirte.', campaign: 'share_reminder', content: '2m' },
    reminder_3m: { msg: 'Yo uso esto cada tanto para ver cómo estoy en el trabajo. Puede servirte.', campaign: 'share_reminder', content: '3m' },
  } as const;
  const m = msgs[variant];
  const url = new URL('https://3d.ceoencamiseta.com');
  url.searchParams.set('utm_source', 'whatsapp');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', m.campaign);
  url.searchParams.set('utm_content', m.content);
  const text = `${m.msg}\n${url.toString()}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function buildWhatsAppEmailBlock(): string {
  return `\n\n---\n¿Conocés a alguien que debería hacer esto?\nRecomendarlo por WhatsApp: ${buildWhatsAppRecommendUrl('email')}`;
}

function buildEmailContent(
  currentName: string,
  currentScores: Scores,
  currentComment: string | undefined,
  comparison: Comparison | null,
  previousMeasurement: { dinero: number; desarrollo: number; diversion: number; created_at: string; comment?: string } | null,
  context: string | undefined,
  email: string
): string {
  let content = `Tu medicion de hoy:\n\n`;

  if (comparison) {
    content += `${currentName}:\n`;
    content += `Dinero: ${currentScores.dinero}\n`;
    content += `Desarrollo: ${currentScores.desarrollo}\n`;
    content += `Diversion: ${currentScores.diversion}\n`;
    if (currentComment) {
      content += `${formatComment(currentComment, context)}\n`;
    }
    content += `\n`;

    content += `${comparison.name}:\n`;
    content += `Dinero: ${comparison.dinero}\n`;
    content += `Desarrollo: ${comparison.desarrollo}\n`;
    content += `Diversion: ${comparison.diversion}\n`;
    if (comparison.comment) {
      content += `${formatComment(comparison.comment, context)}\n`;
    }
    content += `\n`;

    content += `Listo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  } else if (previousMeasurement) {
    content += `Dinero: ${currentScores.dinero}\n`;
    content += `Desarrollo: ${currentScores.desarrollo}\n`;
    content += `Diversion: ${currentScores.diversion}\n`;
    if (currentComment) {
      content += `${formatComment(currentComment, context)}\n`;
    }
    content += `\n`;

    content += `Anterior (${formatDate(previousMeasurement.created_at)}):\n`;
    content += `Dinero: ${previousMeasurement.dinero}\n`;
    content += `Desarrollo: ${previousMeasurement.desarrollo}\n`;
    content += `Diversion: ${previousMeasurement.diversion}\n`;
    if (previousMeasurement.comment) {
      content += `"${previousMeasurement.comment}"\n`;
    }
    content += `\n`;

    content += `Cambios:\n`;
    content += `Dinero ${formatDiff(currentScores.dinero, previousMeasurement.dinero)}\n`;
    content += `Desarrollo ${formatDiff(currentScores.desarrollo, previousMeasurement.desarrollo)}\n`;
    content += `Diversion ${formatDiff(currentScores.diversion, previousMeasurement.diversion)}\n\n`;

    content += `Listo. Sigo guardando tu historial para que puedas compararte mas adelante.\n\nLeo`;
  } else {
    content += `Dinero: ${currentScores.dinero}\n`;
    content += `Desarrollo: ${currentScores.desarrollo}\n`;
    content += `Diversion: ${currentScores.diversion}\n`;
    if (currentComment) {
      content += `${formatComment(currentComment, context)}\n`;
    }
    content += `\n`;

    content += `Listo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  }

  content += buildBookPS(currentScores, comparison, email);

  return content;
}

// Async function to send email and update tables (fire-and-forget)
async function sendEmailAsync(
  supabase: any, // Use any to avoid type issues with new tables
  recordId: string,
  email: string,
  emailContent: string,
  reminderPeriod?: '1m' | '3m'
): Promise<void> {
  const subject = "Tu medicion 3D";
  
  try {
    // Create outbound_emails record for the measurement email
    const { data: outboundEmail, error: insertError } = await supabase
      .from('outbound_emails')
      .insert({
        record_id: recordId,
        to_email: email,
        subject: subject,
        email_type: 'measurement',
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating outbound_emails record:', insertError);
    }

    // If there's a reminder period, create a scheduled reminder email
    if (reminderPeriod) {
      const reminderDate = calculateReminderDate(reminderPeriod);
      await supabase
        .from('outbound_emails')
        .insert({
          record_id: recordId,
          to_email: email,
          subject: 'Recordatorio: Medí tu 3D',
          email_type: 'reminder',
          status: 'pending',
          scheduled_for: reminderDate.toISOString(),
        });
    }

    // Try to send email via Resend
    const emailResponse = await resend.emails.send({
      from: SITE_CONFIG.emailFrom,
      to: [email],
      reply_to: SITE_CONFIG.emailReplyTo,
      subject: subject,
      text: emailContent,
    });

    // Update outbound_emails with success
    if (outboundEmail?.id) {
      await supabase
        .from('outbound_emails')
        .update({
          status: 'sent',
          provider_id: emailResponse.data?.id || null,
          sent_at: new Date().toISOString(),
        })
        .eq('id', outboundEmail.id);
    }

    // Update records_3d.email_sent = true
    await supabase
      .from('records_3d')
      .update({ email_sent: true })
      .eq('id', recordId);

    console.log('Email sent successfully:', emailResponse.data?.id);

  } catch (emailError: any) {
    console.error('Email error:', emailError);

    // Update outbound_emails with failure
    await supabase
      .from('outbound_emails')
      .update({
        status: 'failed',
        error_message: emailError.message || 'Unknown error',
      })
      .eq('record_id', recordId)
      .eq('email_type', 'measurement')
      .eq('status', 'pending');
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SaveResultRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.optionName || !body.scores) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email
    if (!isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({ error: "Email invalido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Honeypot check - if filled, it's a bot
    if (body.honeypot) {
      // Silently reject but return success to not tip off the bot
      console.log('Honeypot triggered, rejecting submission');
      return new Response(
        JSON.stringify({ success: true, id: 'blocked' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate scores
    const { dinero, desarrollo, diversion } = body.scores;
    if (!isValidScore(dinero) || !isValidScore(desarrollo) || !isValidScore(diversion)) {
      return new Response(
        JSON.stringify({ error: "Los scores deben ser numeros enteros entre 1 y 10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate comparison scores if present
    if (body.comparison) {
      if (!isValidScore(body.comparison.dinero) || 
          !isValidScore(body.comparison.desarrollo) || 
          !isValidScore(body.comparison.diversion)) {
        return new Response(
          JSON.stringify({ error: "Los scores de comparacion deben ser numeros entre 1 y 10" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get IP and user agent
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
                   || req.headers.get('cf-connecting-ip') 
                   || 'unknown';
    const userAgent = req.headers.get('user-agent') || null;

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limiting: stricter limits to prevent abuse
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const fifteenMinutesAgo = new Date(Date.now() - 900000).toISOString();
    const normalizedEmail = body.email.toLowerCase();

    // Run rate limit checks and history query in parallel for faster response
    const [ipResult, emailResult, historyResult] = await Promise.all([
      // Check per-IP rate limit: max 3 submissions per hour
      supabase
        .from('records_3d')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', oneHourAgo),
      
      // Check per-email rate limit: max 1 submission per 15 minutes
      supabase
        .from('records_3d')
        .select('*', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .gte('created_at', fifteenMinutesAgo),
      
      // Find previous measurement for this email (only non-comparison ones for history)
      supabase
        .from('records_3d')
        .select('dinero, desarrollo, diversion, created_at, comment')
        .eq('email', body.email.toLowerCase())
        .is('comparison', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    // Validate rate limits after parallel queries complete
    if (ipResult.count && ipResult.count >= 3) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes desde esta conexion. Intenta mas tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (emailResult.count && emailResult.count >= 1) {
      return new Response(
        JSON.stringify({ error: "Ya guardaste una medicion recientemente. Espera 15 minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const previousMeasurement = historyResult.data?.[0] || null;

    // Calculate reminder date if needed
    const reminderDate = body.reminderPeriod 
      ? calculateReminderDate(body.reminderPeriod)
      : null;

    // Sanitize text inputs before insertion
    const sanitizedOptionName = sanitizeText(body.optionName, 100) || 'Situación actual';
    const sanitizedComment = sanitizeText(body.comment, 500);
    const sanitizedComparison: Comparison | null = body.comparison ? {
      ...body.comparison,
      name: sanitizeText(body.comparison.name, 100) || 'Opción',
      comment: sanitizeText(body.comparison.comment, 500) || undefined,
    } : null;

    // Insert record into records_3d (email_sent defaults to false)
    const { data: insertedRecord, error: insertError } = await supabase
      .from('records_3d')
      .insert({
        email: body.email.toLowerCase(),
        country: body.country || null,
        option_name: sanitizedOptionName,
        dinero: body.scores.dinero,
        desarrollo: body.scores.desarrollo,
        diversion: body.scores.diversion,
        comment: sanitizedComment,
        comparison: sanitizedComparison,
        context: body.context || null,
        reminder_period: body.reminderPeriod || null,
        reminder_date: reminderDate,
        utm_source: body.tracking.utm_source || null,
        utm_medium: body.tracking.utm_medium || null,
        utm_campaign: body.tracking.utm_campaign || null,
        utm_content: body.tracking.utm_content || null,
        utm_term: body.tracking.utm_term || null,
        gclid: body.tracking.gclid || null,
        fbclid: body.tracking.fbclid || null,
        referrer: body.tracking.referrer || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        email_sent: false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: "Error guardando la medicion" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content for async sending
    const emailContent = buildEmailContent(
      sanitizedOptionName,
      body.scores,
      sanitizedComment || undefined,
      sanitizedComparison,
      previousMeasurement,
      body.context,
      body.email.toLowerCase()
    );

    // Fire-and-forget: send email asynchronously without blocking the response
    // We use EdgeRuntime.waitUntil if available, otherwise just fire and forget
    const emailPromise = sendEmailAsync(
      supabase,
      insertedRecord.id,
      body.email.toLowerCase(),
      emailContent,
      body.reminderPeriod
    );

    // Try to use waitUntil if available (Deno Deploy / Supabase Edge Functions)
    // @ts-ignore - waitUntil may not be typed
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(emailPromise);
    } else {
      // Fire and forget - don't await
      emailPromise.catch(err => console.error('Background email error:', err));
    }

    // Respond immediately with success, including the record ID for sharing
    return new Response(
      JSON.stringify({ 
        success: true, 
        id: insertedRecord.id,
        hasHistory: !!previousMeasurement,
        emailPending: true // Frontend knows email is being sent in background
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
