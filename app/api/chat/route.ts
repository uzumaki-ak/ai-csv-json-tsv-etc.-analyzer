import { type NextRequest, NextResponse } from "next/server"

function extractTextFromGeminiResponse(data: any) {
  try {
    if (!data) return ""
    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      const cand = data.candidates[0]
      if (cand?.content?.parts?.length) {
        return cand.content.parts.map((p: any) => p.text || "").join("\n")
      }
      if (cand?.output?.text) return cand.output.text
      if (cand?.content?.[0]?.text) return cand.content[0].text
    }
    if (data?.output?.text) return data.output.text
    return typeof data === "string" ? data : JSON.stringify(data)
  } catch (e) {
    return String(data || "")
  }
}

function extractTextFromOpenAIResponse(data: any) {
  try {
    if (!data) return ""
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      const ch = data.choices[0]
      if (ch?.message?.content) return ch.message.content
      if (ch?.text) return ch.text
    }
    return typeof data === "string" ? data : JSON.stringify(data)
  } catch (e) {
    return String(data || "")
  }
}

function extractTextFromEuronResponse(data: any) {
  try {
    if (!data) return ""
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      const ch = data.choices[0]
      if (ch?.message?.content) return ch.message.content
      if (ch?.text) return ch.text
    }
    return typeof data === "string" ? data : JSON.stringify(data)
  } catch (e) {
    return String(data || "")
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, apiProvider, openaiKey, geminiKey, euronKey } = await request.json()

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || geminiKey
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || openaiKey
    const EURON_API_KEY = process.env.EURON_API_KEY || euronKey

    if (!model) {
      return NextResponse.json({ error: "Missing `model` in request body" }, { status: 400 })
    }

    let extractedText = ""

    // Use backend API keys if available, otherwise use frontend keys
    if (apiProvider === "backend" || !apiProvider) {
      // Try Euron first (backend)
      if (EURON_API_KEY) {
        try {
          const res = await fetch("https://api.euron.one/api/v1/euri/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${EURON_API_KEY}`,
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: prompt }],
              model: "gpt-4.1-nano",
              max_tokens: 1000,
              temperature: 0.7,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            extractedText = extractTextFromEuronResponse(data)
          }
        } catch (e) {
          console.error("Euron API error:", e)
        }
      }

      // Fallback to Gemini
      if (!extractedText && GEMINI_API_KEY) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            },
          )

          if (res.ok) {
            const data = await res.json()
            extractedText = extractTextFromGeminiResponse(data)
          }
        } catch (e) {
          console.error("Gemini API error:", e)
        }
      }

      // Fallback to OpenAI
      if (!extractedText && OPENAI_API_KEY) {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [{ role: "user", content: prompt }],
            }),
          })

          if (res.ok) {
            const data = await res.json()
            extractedText = extractTextFromOpenAIResponse(data)
          }
        } catch (e) {
          console.error("OpenAI API error:", e)
        }
      }
    } else {
      // Frontend API provider
      if (model === "euron" && euronKey) {
        try {
          const res = await fetch("https://api.euron.one/api/v1/euri/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${euronKey}`,
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: prompt }],
              model: "gpt-4.1-nano",
              max_tokens: 1000,
              temperature: 0.7,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            extractedText = extractTextFromEuronResponse(data)
          }
        } catch (e) {
          console.error("Euron API error:", e)
        }
      } else if (model === "gemini" && geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            },
          )

          if (res.ok) {
            const data = await res.json()
            extractedText = extractTextFromGeminiResponse(data)
          }
        } catch (e) {
          console.error("Gemini API error:", e)
        }
      } else if (model === "openai" && openaiKey) {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [{ role: "user", content: prompt }],
            }),
          })

          if (res.ok) {
            const data = await res.json()
            extractedText = extractTextFromOpenAIResponse(data)
          }
        } catch (e) {
          console.error("OpenAI API error:", e)
        }
      }
    }

    if (!extractedText) {
      return NextResponse.json({ error: "No API key configured or API call failed" }, { status: 400 })
    }

    return NextResponse.json({
      response: extractedText,
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}
