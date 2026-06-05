import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportResult {
  total: number;
  inserted: number;
  errors: number;
  errorDetails: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminSecret = Deno.env.get("ADMIN_SECRET");
  if (!adminSecret || req.headers.get("x-admin-secret") !== adminSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { filename = "data.csv" } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Download file from storage
    console.log(`Downloading file: ${filename} from bucket: csv`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("csv")
      .download(filename);

    if (downloadError) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${downloadError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const csvText = await fileData.text();
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: "CSV file is empty or has no data rows" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());
    console.log("Headers found:", headers);

    // Map column indices
    const columnMap: Record<string, number> = {};
    const expectedColumns = ["um", "email", "fecha", "dinero", "desarrollo", "diversión", "comentario", "país de residencia"];
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (normalizedHeader === "um") columnMap.legacy_id = index;
      else if (normalizedHeader === "email") columnMap.email = index;
      else if (normalizedHeader === "fecha") columnMap.fecha = index;
      else if (normalizedHeader === "dinero") columnMap.dinero = index;
      else if (normalizedHeader === "desarrollo") columnMap.desarrollo = index;
      else if (normalizedHeader === "diversion") columnMap.diversion = index;
      else if (normalizedHeader === "comentario") columnMap.comentario = index;
      else if (normalizedHeader.includes("pais")) columnMap.pais = index;
    });

    console.log("Column mapping:", columnMap);

    const result: ImportResult = {
      total: lines.length - 1,
      inserted: 0,
      errors: 0,
      errorDetails: [],
    };

    // Process in batches
    const BATCH_SIZE = 100;
    const dataLines = lines.slice(1);

    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batch = dataLines.slice(i, i + BATCH_SIZE);
      const records: any[] = [];

      for (let j = 0; j < batch.length; j++) {
        const lineNumber = i + j + 2; // +2 for 1-indexed and header
        try {
          const values = parseCSVLine(batch[j]);

          const email = values[columnMap.email]?.trim();
          if (!email) {
            result.errors++;
            result.errorDetails.push(`Line ${lineNumber}: Empty email`);
            continue;
          }

          const record = {
            legacy_id: parseInt(values[columnMap.legacy_id]) || null,
            email: email,
            fecha: values[columnMap.fecha]?.trim() || null,
            dinero: parseInt(values[columnMap.dinero]) || null,
            desarrollo: parseInt(values[columnMap.desarrollo]) || null,
            diversion: parseInt(values[columnMap.diversion]) || null,
            comentario: values[columnMap.comentario]?.trim() || null,
            pais: values[columnMap.pais]?.trim() || null,
          };

          records.push(record);
        } catch (parseError) {
          result.errors++;
          result.errorDetails.push(`Line ${lineNumber}: Parse error - ${parseError}`);
        }
      }

      if (records.length > 0) {
        const { error: insertError } = await supabase
          .from("staging_legacy_3d")
          .insert(records);

        if (insertError) {
          console.error(`Batch insert error at line ${i + 2}:`, insertError);
          result.errors += records.length;
          result.errorDetails.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
        } else {
          result.inserted += records.length;
        }
      }

      // Log progress every 1000 records
      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= dataLines.length) {
        console.log(`Progress: ${Math.min(i + BATCH_SIZE, dataLines.length)}/${dataLines.length} processed`);
      }
    }

    // Limit error details to avoid huge response
    if (result.errorDetails.length > 50) {
      const totalErrors = result.errorDetails.length;
      result.errorDetails = result.errorDetails.slice(0, 50);
      result.errorDetails.push(`... and ${totalErrors - 50} more errors`);
    }

    console.log("Import complete:", { total: result.total, inserted: result.inserted, errors: result.errors });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});