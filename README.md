# AI Student Admissions Assistant

A conversational AI assistant that guides prospective students through program discovery, collects their information naturally, generates a personalized learning roadmap, saves the lead to Airtable CRM, and sends a summary via WhatsApp.

---

## Files

| File | What it does |
|---|---|
| `server.js` | The Express backend — handles `/chat` requests, calls Gemini AI, writes to Airtable, sends WhatsApp via Twilio |
| `public/index.html` | The chat frontend — a single HTML page with built-in CSS & JS, no build step needed |
| `.env` | Your secret API keys (never commit this to Git!) |
| `.env.example` | A template showing which keys you need — copy it to `.env` and fill in your values |
| `package.json` | Node.js project config & dependency list |

---

## Setup (Step by Step)

### Prerequisites

1. **Install Node.js** — Download from [nodejs.org](https://nodejs.org/) (pick the LTS version). This also installs `npm` (the package manager).

### Step 1: Get Your API Keys

#### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key — it looks like `AIzaSy...`

#### Airtable API Key + Base ID
1. Go to [airtable.com](https://airtable.com/) and create a free account
2. Create a new **Base** (like a database). Name it anything, e.g. "Student Leads"
3. In your base, create a table (or rename the default one) with these columns:
   - `Name` (Single line text)
   - `Phone` (Single line text)
   - `Email` (Email)
   - `Interest` (Single line text)
   - `City` (Single line text)
   - `Experience Level` (Single line text)
   - `Course Recommendation` (Long text)
   - `Conversation Summary` (Long text)
4. Get your **Personal Access Token**: Go to [airtable.com/create/tokens](https://airtable.com/create/tokens) → Create a token → give it `data.records:write` scope on your base → copy the token
5. Get your **Base ID**: Open your base in the browser — the URL looks like `https://airtable.com/appXXXXXXXXXXXXXX/...` — the `appXXX...` part is your Base ID
6. The **Table Name** is whatever you named your table (default is `"Leads"`)

#### Twilio WhatsApp Sandbox
1. Go to [twilio.com](https://www.twilio.com/) and create a free account
2. From your [Twilio Console](https://console.twilio.com/), copy your **Account SID** and **Auth Token**
3. Go to **Messaging → Try it out → Send a WhatsApp message** in the left sidebar
4. Follow the instructions to join the sandbox (you'll send a message like `join <word>-<word>` from your WhatsApp to the Twilio sandbox number)
5. The sandbox number is usually `+14155238886` (Twilio will show it)
6. Your **MY_WHATSAPP_TO** is your own phone number in format `whatsapp:+923001234567`

### Step 2: Configure Environment Variables

Copy the example env file and fill in your keys:

```
copy .env.example .env
```

Then open `.env` in any text editor and replace the placeholder values with your actual keys.

### Step 3: Install Dependencies & Run

Open a terminal/command prompt in this project folder and run:

```
npm install
npm start
```

You should see:
```
✅ Admissions Assistant server running at http://localhost:3000
```

### Step 4: Open the Chat

Open your browser and go to: **http://localhost:3000**

That's it! Start chatting with the assistant.

---

## How It Works

1. You type a message in the chat window
2. The frontend sends it to `POST /chat` on the backend
3. The backend adds it to the conversation history and calls the Gemini API with a detailed system prompt
4. Gemini replies as a friendly admissions counselor, naturally gathering student information
5. Once it has the student's name, phone, and interest (+ enough context), Gemini outputs a structured JSON with a personalized roadmap
6. The backend detects this JSON and:
   - Saves the lead to Airtable
   - Sends a personalized WhatsApp message via Twilio
   - Shows the student a success message + their roadmap in the chat

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `MODULE_NOT_FOUND` error | Run `npm install` again |
| "Cannot connect to server" in chat | Make sure the server is running (`npm start`) |
| Gemini returns errors | Check your `GEMINI_API_KEY` in `.env` is correct |
| Airtable error in console | Verify Base ID, Table Name, and that column names match exactly |
| WhatsApp not received | Make sure you've joined the Twilio sandbox first, and your number format includes `whatsapp:+` prefix |
