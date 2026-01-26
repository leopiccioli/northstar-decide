import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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

interface SaveResultRequest {
  email: string;
  optionName: string;
  scores: Scores;
  comment?: string;
  comparison?: Comparison;
  reminderPeriod?: '1m' | '3m';
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

// Build email content
function buildEmailContent(
  currentName: string,
  currentScores: Scores,
  comparison: Comparison | null,
  previousMeasurement: { dinero: number; desarrollo: number; diversion: number } | null
): string {
  let content = `Tu medicion de hoy:\n\n`;

  if (comparison) {
    content += `${currentName}:\n`;
    content += `Dinero: ${currentScores.dinero}\n`;
    content += `Desarrollo: ${currentScores.desarrollo}\n`;
    content += `Diversion: ${currentScores.diversion}\n\n`;

    content += `${comparison.name}:\n`;
    content += `Dinero: ${comparison.dinero}\n`;
    content += `Desarrollo: ${comparison.desarrollo}\n`;
    content += `Diversion: ${comparison.diversion}\n\n`;

    content += `Listo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  } else if (previousMeasurement) {
    content += `Dinero: ${currentScores.dinero}\n`;
    content += `Desarrollo: ${currentScores.desarrollo}\n`;
    content += `Diversion: ${currentScores.diversion}\n\n`;

    content += `Anterior:\n`;
    content += `Dinero: ${previousMeasurement.dinero}\n`;
    content += `Desarrollo: ${previousMeasurement.desarrollo}\n`;
    content += `Diversion: ${previousMeasurement.diversion}\n\n`;

    content += `Cambios:\n`;
    content += `Dinero ${formatDiff(currentScores.dinero, previousMeasurement.dinero)}\n`;
    content += `Desarrollo ${formatDiff(currentScores.desarrollo, previousMeasurement.desarrollo)}\n`;
    content += `Diversion ${formatDiff(currentScores.diversion, previousMeasurement.diversion)}\n\n`;

    content += `Listo. Sigo guardando tu historial para que puedas compararte mas adelante.\n\nLeo`;
  } else {
    content += `Dinero: ${currentScores.dinero}\n`;
    content += `Desarrollo: ${currentScores.desarrollo}\n`;
    content += `Diversion: ${currentScores.diversion}\n\n`;

    content += `Listo. Lo guarde para que puedas volver cuando quieras.\n\nLeo`;
  }

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
      from: "3D <3d@3d.ceoencamiseta.com>",
      to: [email],
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

    // Rate limiting: max 10 saves per hour per IP
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentCount } = await supabase
      .from('records_3d')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo);

    if (recentCount && recentCount >= 10) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Intenta mas tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find previous measurement for this email (only non-comparison ones for history)
    const { data: previousMeasurements } = await supabase
      .from('records_3d')
      .select('dinero, desarrollo, diversion, created_at')
      .eq('email', body.email.toLowerCase())
      .is('comparison', null)
      .order('created_at', { ascending: false })
      .limit(1);

    const previousMeasurement = previousMeasurements && previousMeasurements.length > 0 
      ? previousMeasurements[0] 
      : null;

    // Calculate reminder date if needed
    const reminderDate = body.reminderPeriod 
      ? calculateReminderDate(body.reminderPeriod)
      : null;

    // Insert record into records_3d (email_sent defaults to false)
    const { data: insertedRecord, error: insertError } = await supabase
      .from('records_3d')
      .insert({
        email: body.email.toLowerCase(),
        option_name: body.optionName,
        dinero: body.scores.dinero,
        desarrollo: body.scores.desarrollo,
        diversion: body.scores.diversion,
        comment: body.comment || null,
        comparison: body.comparison || null,
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
      body.optionName,
      body.scores,
      body.comparison || null,
      previousMeasurement
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

    // Respond immediately with success
    return new Response(
      JSON.stringify({ 
        success: true, 
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
