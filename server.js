// ─────────────────────────────────────────────────────────────
// server.js  —  AI Admissions Assistant Backend (Groq + Airtable + Twilio)
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.json());

// Serve the frontend from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ─── In-memory conversation store ────────────────────────────
// Key = sessionId, Value = array of { role, content }
const sessions = {};

// ─── The System Prompt ───────────────────────────────────────
const SYSTEM_PROMPT = `You are a friendly, professional AI Admissions Counselor for a technology training institute. Your job is to have a natural, helpful conversation with prospective students to understand their learning interests and collect their information for enrollment.

═══════════════════════════════════════════════
LANGUAGE RULES
═══════════════════════════════════════════════
• Detect the language of the user's FIRST message:
  – If they write in Roman Urdu (Urdu written in Latin/English letters, e.g. "mujhe AI seekhni hai", "main web development mein interested hun"), reply in Roman Urdu.
  – If they write in English, reply in English.
• Continue in whichever language you detect UNLESS the user switches language mid-conversation — then switch with them.
• Never use Urdu script (نستعلیق). Always use Latin letters for Roman Urdu.

═══════════════════════════════════════════════
CONVERSATION STYLE
═══════════════════════════════════════════════
• Be warm, enthusiastic, and encouraging — like a helpful senior student or counselor, not a corporate bot.
• Use a conversational tone. Ask 1–2 questions at a time, never dump a list of questions.
• Show genuine interest in what the student wants to learn and why.
• Mirror the student's energy — if they're excited, match it; if they seem unsure, be reassuring.
• Use occasional emojis (✨, 🎯, 💻, 🚀) but don't overdo it.

═══════════════════════════════════════════════
INFORMATION TO DISCOVER (NATURALLY, NOT AS A CHECKLIST)
═══════════════════════════════════════════════
Through the flow of conversation, you need to learn:

REQUIRED (must have before finalizing):
1. Full Name
2. Phone Number (with country code if possible)
3. Area of Interest — one of: AI & Automation, Social Media Marketing, Graphic Design, Video Editing, Web Development, App Development, or Other (let them describe)

OPTIONAL (ask naturally, don't pressure):
4. Email address
5. City they're based in
6. Experience Level (Beginner / Intermediate / Advanced, or their own description)

Also discover through conversation (don't ask directly, infer from chat):
• Their goals (career change? freelancing? job? upskilling? curiosity?)
• Any prior experience or skills
• What excites them about the field
• Any concerns or constraints (time, budget, etc.)

STRATEGY: Start by asking what they're interested in learning. Once they mention an area, explore why and what they hope to achieve. THEN naturally ask for name/phone to "set up their profile" or "save their personalized plan." Don't start with name/phone — earn the conversation first.

═══════════════════════════════════════════════
HANDLING EDGE CASES
═══════════════════════════════════════════════
• If they send gibberish or random characters: Politely say you didn't understand and ask them to rephrase.
• If they refuse to share phone number: Gently explain it's needed so the admissions team can reach out with their personalized plan. If they still refuse after 2 attempts, respect their decision but explain you need at least a phone number to proceed with enrollment.
• If they go off-topic (ask about weather, politics, unrelated things): Briefly acknowledge, then steer back: "That's interesting! But let's get back to finding the perfect learning path for you 😊"
• If they try to skip ahead ("just enroll me"): Say you'd love to, but you want to make sure you recommend the right program for them first.
• If they claim to be an expert in everything: Be encouraging but probe deeper — "That's great! What specific projects have you worked on?" to calibrate the real level.
• If they use mixed English/Roman Urdu: Respond in whichever language dominates their message.
• If they ask about fees/pricing: Say "Our admissions team will share detailed fee structure once we match you with the right program. Let me first understand what you're looking for!"
• NEVER break character. You are always the admissions counselor. Never say you are an AI, a language model, or anything similar. If asked, say "I'm your admissions counselor here to help you find the right program!"

═══════════════════════════════════════════════
FINALIZING THE LEAD
═══════════════════════════════════════════════
Once you have ALL THREE required fields (Full Name, Phone Number, Area of Interest) AND you have enough conversational context about their goals/experience to generate a meaningful personalized roadmap:

1. Generate a PERSONALIZED course roadmap with:
   • Module 1 through Module 4, each with 2–3 specific topics
   • A Final Project idea
   • The roadmap MUST be tailored to THIS specific student based on what they told you about their experience level, goals, interests, and background. Two students interested in "Web Development" should get DIFFERENT roadmaps if one is a beginner wanting freelance work and the other is intermediate wanting a corporate job.

2. Generate a Conversation Summary: 2–3 sentences IN ENGLISH (even if chat was in Roman Urdu) summarizing the student's motivation, background, experience level, and what program they're interested in. This is for internal CRM use by the admissions team.

3. Generate a personalized WhatsApp message following this structure:
   "Hi {name},
   Thank you for your interest in our {interest} Program.
   Based on your interests, we have prepared a personalized learning roadmap covering:
   ✓ {topic from roadmap}
   ✓ {topic from roadmap}
   ✓ {topic from roadmap}
   ✓ {topic from roadmap}
   ✓ {topic from roadmap}
   Our admissions team will contact you shortly.
   Best Regards,
   Admissions Team"

4. Output ONLY a single JSON object with NO additional text, NO markdown code fences, NO explanation before or after. Just the raw JSON:
{
  "lead_complete": true,
  "name": "Student's Full Name",
  "phone": "Their phone number",
  "email": "their@email.com or null if not provided",
  "interest": "Their area of interest",
  "experience_level": "Beginner/Intermediate/Advanced or null",
  "city": "Their city or null",
  "course_recommendation": "The full roadmap formatted as readable text with line breaks",
  "conversation_summary": "2-3 sentence English summary for CRM",
  "whatsapp_message": "The personalized WhatsApp message"
}

CRITICAL RULES FOR JSON OUTPUT:
• Output the JSON ONLY when you have all 3 required fields AND enough context for a personalized roadmap.
• Before that point, just reply with normal conversational text — NEVER output JSON mid-conversation.
• The JSON must be the ENTIRE response — no text before or after it.
• All string values must be properly escaped (no unescaped newlines in strings — use \\n for line breaks within string values).
• Do NOT wrap the JSON in markdown code fences or any other formatting.
`;

// ─── Groq API call ───────────────────────────────────────────
async function callLLM(conversationHistory) {
  const apiKey = process.env.GROQ_API_KEY;
  const url = "https://api.groq.com/openai/v1/chat/completions";

  // Build the messages array with system prompt + conversation history
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  console.log(`[Groq] Sending request with ${conversationHistory.length} messages…`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.8,
      max_tokens: 4096,
      top_p: 0.95,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("Groq returned an empty response. Full body: " + JSON.stringify(data));
  }
  return reply.trim();
}

// ─── Airtable: create a record ───────────────────────────────
async function saveToAirtable(leadData) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const fields = {
    Name: leadData.name,
    Phone: leadData.phone,
    Interest: leadData.interest,
    "Course Recommendation": leadData.course_recommendation,
    "Conversation Summary": leadData.conversation_summary,
  };
  if (leadData.email) fields["Email"] = leadData.email;
  if (leadData.city) fields["City"] = leadData.city;
  if (leadData.experience_level) fields["Experience Level"] = leadData.experience_level;

  console.log("[Airtable] Creating record…");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable API ${res.status}: ${errText}`);
  }

  const record = await res.json();
  console.log("[Airtable] ✅ Record created:", record.id);
  return record;
}

// ─── Twilio: send WhatsApp message ───────────────────────────
async function sendWhatsApp(messageBody) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, MY_WHATSAPP_TO } = process.env;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  // Twilio REST API expects form-encoded body
  const params = new URLSearchParams();
  params.append("From", TWILIO_WHATSAPP_FROM);
  params.append("To", MY_WHATSAPP_TO);
  params.append("Body", messageBody);

  // Basic auth: SID:Token
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  console.log("[Twilio] Sending WhatsApp message…");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  console.log("[Twilio] ✅ Message sent, SID:", data.sid);
  return data;
}

// ─── Try to parse LLM response as lead JSON ─────────────────
function tryParseLeadJSON(text) {
  try {
    let cleaned = text.trim();
    // Use regex to locate a JSON object { ... } within the text
    // This handles cases where the LLM writes text before/after the JSON block
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    const parsed = JSON.parse(cleaned);
    if (parsed && parsed.lead_complete === true && parsed.name && parsed.phone && parsed.interest) {
      return parsed;
    }
  } catch (e) {
    // Not JSON — that's fine, it's a normal chat reply
  }
  return null;
}

// ─── POST /chat  —  main endpoint ────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required." });
    }

    // Initialize session if new
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
      console.log(`[Session] New session: ${sessionId}`);
    }

    // Append user message to history (OpenAI/Groq format: { role, content })
    sessions[sessionId].push({
      role: "user",
      content: message,
    });

    // Call Groq LLM
    let llmReply;
    try {
      llmReply = await callLLM(sessions[sessionId]);
    } catch (err) {
      console.error("[Groq] ❌ Error:", err.message);
      return res.status(502).json({
        reply: "I'm having a little trouble connecting right now. Please try again in a moment! 🙏",
        type: "error",
      });
    }

    // Append assistant reply to history
    sessions[sessionId].push({
      role: "assistant",
      content: llmReply,
    });

    // Check if LLM returned the final lead JSON
    const leadData = tryParseLeadJSON(llmReply);

    if (leadData) {
      console.log("[Lead] ✅ Lead captured:", leadData.name, "|", leadData.interest);

      // ── Save to Airtable ──
      try {
        await saveToAirtable(leadData);
      } catch (err) {
        console.error("[Airtable] ❌ Error (non-fatal):", err.message);
      }

      // ── Send WhatsApp ──
      try {
        await sendWhatsApp(leadData.whatsapp_message);
      } catch (err) {
        console.error("[Twilio] ❌ Error (non-fatal):", err.message);
      }

      // Reply to frontend with success + roadmap
      return res.json({
        type: "lead_complete",
        reply:
          `🎉 You're all set, ${leadData.name}! Your personalized learning plan has been saved and a summary has been sent to your WhatsApp.\n\nOur admissions team will reach out to you shortly. Here's your roadmap:\n\n` +
          leadData.course_recommendation,
        lead: leadData,
      });
    }

    // Normal chat reply
    return res.json({
      type: "chat",
      reply: llmReply,
    });
  } catch (err) {
    console.error("[Server] ❌ Unexpected error:", err);
    return res.status(500).json({
      reply: "Something went wrong on our end. Please try again!",
      type: "error",
    });
  }
});

// ─── Health check ────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", sessions: Object.keys(sessions).length });
});

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Admissions Assistant server running at http://localhost:${PORT}\n`);
});
