# 🎓 AI Student Admissions Assistant

> An intelligent conversational assistant that guides prospective students through program discovery, collects their information naturally through chat, generates personalized learning roadmaps, saves leads to Airtable CRM, and sends summaries via WhatsApp.

<br>

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI-Powered Conversations** | Natural, human-like chat powered by Llama 3.3 70B via Groq — detects English & Roman Urdu automatically |
| 📋 **Smart Lead Capture** | Gathers student name, phone, interest, experience level, and goals through natural conversation — no rigid forms |
| 🗺️ **Personalized Roadmaps** | Dynamically generates Module 1–4 + Final Project tailored to each student's background, goals, and experience |
| 📊 **Airtable CRM Integration** | Automatically saves leads with all collected data + conversation summary to Airtable |
| 📱 **WhatsApp Notifications** | Sends personalized enrollment summary to the student's WhatsApp via Twilio Sandbox |
| 🌙 **Modern Dark UI** | Sleek, responsive chat interface with animated typing indicators, gradient bubbles, and a polished design |
| 🌐 **Bilingual Support** | Detects and responds in English or Roman Urdu (Urdu written in Latin script) seamlessly |

<br>

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express |
| **LLM** | Groq API (Llama 3.3 70B Versatile) — free tier |
| **CRM** | Airtable REST API |
| **Messaging** | Twilio WhatsApp Sandbox REST API |
| **Frontend** | Vanilla HTML + CSS + JavaScript (no build step) |

<br>

## 📁 Project Structure

```
ai-admissions-assistant/
├── server.js            # Express backend — /chat endpoint, Groq, Airtable, Twilio
├── public/
│   └── index.html       # Chat frontend — dark-themed, responsive, animated
├── .env                 # Your secret API keys (never commit this!)
├── .env.example         # Template showing which keys you need
├── .gitignore           # Keeps node_modules & .env out of Git
├── package.json         # Dependencies & scripts
└── README.md            # You are here
```

<br>

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+) — Download from [nodejs.org](https://nodejs.org/) (LTS version)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR-USERNAME/ai-admissions-assistant.git
cd ai-admissions-assistant
npm install
```

### 2. Set Up API Keys

Copy the environment template and fill in your keys:

```bash
cp .env.example .env
```

Then open `.env` and add your keys (see [API Key Setup](#-api-key-setup) below).

### 3. Run

```bash
npm start
```

Open **http://localhost:3000** in your browser — start chatting! 🎉

<br>

## 🔑 API Key Setup

### Groq API Key (Free — No Credit Card)

1. Go to [console.groq.com](https://console.groq.com/) → sign up with Google
2. Navigate to [console.groq.com/keys](https://console.groq.com/keys)
3. Click **"Create API Key"** → copy it (starts with `gsk_...`)

### Airtable (CRM)

1. Create a free account at [airtable.com](https://airtable.com/)
2. Create a new Base → rename the default table to **`Leads`**
3. Add these columns:

   | Column Name | Type |
   |---|---|
   | `Name` | Single line text |
   | `Phone` | Single line text |
   | `Email` | Email |
   | `Interest` | Single line text |
   | `City` | Single line text |
   | `Experience Level` | Single line text |
   | `Course Recommendation` | Long text |
   | `Conversation Summary` | Long text |

4. Get your **Personal Access Token**: [airtable.com/create/tokens](https://airtable.com/create/tokens) → create token with `data.records:write` scope
5. Get your **Base ID**: from the URL when your base is open — it's the `appXXX...` part

### Twilio WhatsApp Sandbox

1. Create a free account at [twilio.com](https://www.twilio.com/)
2. From the [Console Dashboard](https://console.twilio.com/), copy your **Account SID** (`AC...`) and **Auth Token** (click the eye icon 👁️)
3. Go to **Messaging → Try it out → Send a WhatsApp message**
4. Join the sandbox by sending the provided code (e.g., `join hungry-cat`) from your WhatsApp to `+14155238886`

<br>

## ⚙️ Environment Variables

| Variable | Example | Description |
|---|---|---|
| `GROQ_API_KEY` | `gsk_abc123...` | Your Groq API key |
| `AIRTABLE_API_KEY` | `patXyz789...` | Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | `appABC123` | Found in your Airtable base URL |
| `AIRTABLE_TABLE_NAME` | `Leads` | Must match your table name exactly |
| `TWILIO_ACCOUNT_SID` | `AC1a2b3c...` | From Twilio Console dashboard |
| `TWILIO_AUTH_TOKEN` | `xyz789...` | From Twilio Console (click eye icon) |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Twilio sandbox number |
| `MY_WHATSAPP_TO` | `whatsapp:+923001234567` | Your WhatsApp number for testing |

<br>

## 🔄 How It Works

```
┌──────────────┐     POST /chat      ┌──────────────┐     API Call     ┌──────────────┐
│              │ ──────────────────→  │              │ ──────────────→  │              │
│   Frontend   │  { sessionId, msg } │   Express    │  conversation   │   Groq API   │
│   (Chat UI)  │ ←──────────────────  │   Backend    │  history +      │  (Llama 3.3) │
│              │    { reply }         │              │ ←────────────── │              │
└──────────────┘                      └──────┬───────┘   AI response   └──────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │  On lead_complete JSON:     │
                              │                             │
                        ┌─────▼─────┐               ┌──────▼──────┐
                        │  Airtable │               │   Twilio    │
                        │  (Save    │               │  (WhatsApp  │
                        │   Lead)   │               │   Message)  │
                        └───────────┘               └─────────────┘
```

1. Student types a message in the chat UI
2. Frontend sends it to `POST /chat` on the backend
3. Backend appends it to session history and calls Groq with the system prompt
4. The AI replies naturally, gathering information through conversation
5. Once name + phone + interest are collected (with enough context), the AI outputs a structured JSON
6. Backend detects the JSON and:
   - ✅ Saves the lead to **Airtable**
   - 📱 Sends a personalized summary to **WhatsApp** via Twilio
   - 🗺️ Shows the student their **personalized roadmap** in the chat

<br>

## 🧠 System Prompt Highlights

The system prompt is the core of this project (~120 lines). Key capabilities:

- **Language Detection** — Automatically detects English vs Roman Urdu and responds accordingly
- **Natural Flow** — Discovers interests, goals, and experience through conversation, not forms
- **Edge Case Handling** — Gracefully handles gibberish, off-topic questions, refusals, and mixed languages
- **Dynamic Roadmaps** — Two students with the same interest get different roadmaps based on their unique background
- **Structured Output** — Outputs a strict JSON schema only when all required data is collected

<br>

## 🌐 Deployment

This app can be deployed for free on **[Render.com](https://render.com/)**:

1. Push your code to GitHub
2. Create a new **Web Service** on Render → connect your repo
3. Set **Build Command**: `npm install` | **Start Command**: `node server.js`
4. Add all environment variables from your `.env` in Render's dashboard
5. Deploy — your app will be live at `https://your-app.onrender.com`

> **Note:** Free tier sleeps after 15 min of inactivity. First visit after sleep takes ~30s to wake up.

<br>

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| `MODULE_NOT_FOUND` | Run `npm install` again |
| "Can't connect to server" in chat | Make sure server is running (`npm start`) |
| Groq API errors in console | Verify `GROQ_API_KEY` in `.env` is correct |
| Airtable errors | Check Base ID, Table Name, and that column names match exactly |
| WhatsApp not received | Make sure you've joined the Twilio sandbox first |
| Port already in use | Another instance is running — close it or use a different port: `PORT=3001 npm start` |

<br>

## 📄 License

MIT — feel free to use, modify, and distribute.

<br>

---

<p align="center">
  Built with ❤️ using Node.js, Groq AI, Airtable, and Twilio
</p>
