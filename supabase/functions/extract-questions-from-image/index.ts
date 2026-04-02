// Created: 2026-04-02
// Extracts exercise questions from an image using OpenAI vision API.
// Requires OPENAI_API_KEY and OPENAI_MODEL secrets set on the Supabase project.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractedQuestion {
  label: string;
  text: string;
  answer?: string | null;
}

interface ExtractedData {
  weekNumber?: number | null;
  theme?: string | null;
  questions: ExtractedQuestion[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o";
    console.log(`[extract-questions] Using model: ${openaiModel}`);

    const systemPrompt = `You are an exercise question extractor for a coaching app. Given an image containing exercise questions (and optionally pre-filled answers), extract all visible questions and return them as a JSON object.

Return ONLY a valid JSON object with this exact structure:
{
  "weekNumber": <integer or null>,
  "theme": "<string or null>",
  "questions": [
    {
      "label": "<label string, e.g. 'Reflectie 1a' or 'Actie 2' or 'Vraag 1'>",
      "text": "<full question text>",
      "answer": "<answer text, use | to separate multiple lines, or null if no answer visible>"
    }
  ]
}

Rules:
- Extract every question visible in the image, in order
- Use the original question label from the image (e.g. "Reflectie 1a", "Actie 2b"); if no label is visible use "Vraag N" where N is the sequential question number
- Include the full question text verbatim
- If an answer/response is written below or near the question, include it in the "answer" field; separate multiple answer paragraphs or lines with | (pipe character)
- If no answer is visible for a question, set "answer" to null
- If a week number is visible (e.g. "Week 3"), set "weekNumber" to that integer, otherwise null
- If a theme or topic is visible (e.g. "Thema: War on Weakness"), set "theme" to that string, otherwise null
- Return only the raw JSON object — no markdown, no code fences, no extra text`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[extract-questions] OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const content: string | undefined = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[extract-questions] No content in OpenAI response:", JSON.stringify(openaiData));
      return new Response(JSON.stringify({ error: "No content returned from OpenAI" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip markdown code fences if present (some models ignore response_format)
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let extracted: ExtractedData;
    try {
      extracted = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("[extract-questions] Failed to parse OpenAI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse OpenAI response as JSON", raw: content }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ensure questions array exists
    if (!Array.isArray(extracted.questions)) {
      extracted.questions = [];
    }

    console.log(
      `[extract-questions] Extracted ${extracted.questions.length} questions, weekNumber=${extracted.weekNumber}, theme=${extracted.theme}`
    );

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[extract-questions] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
