# Intelices Voice Webhook

A lightweight Express webhook server that listens for lead capture events from a [Vapi](https://vapi.ai) voice agent and instantly sends a formatted email notification via Gmail using Nodemailer.

When a caller interacts with your Vapi voice agent and their details are captured, Vapi calls this webhook with the lead's name, contact, and query — the server emails your support team and responds back to Vapi with a confirmation message.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) enabled (2FA required)
- A [Vapi](https://vapi.ai) account with a configured voice assistant

---

## Installation

1. **Clone or download** this repository and navigate into the project folder:

   ```bash
   cd intelices-voice-webhook
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables** by copying the sample file:

   ```bash
   cp sample.env .env
   ```

   Then open `.env` and fill in your values:

   ```env
   GMAIL_USER=youremail@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char Gmail App Password
   SUPPORT_EMAIL=support@yourdomain.com
   PORT=3000
   ```

   > **Important:** Never commit `.env` to Git. Add it to your `.gitignore`.

4. **Start the server:**

   ```bash
   # Production
   npm start

   # Development (auto-restarts on file changes)
   npm run dev
   ```

   You should see:
   ```
   Webhook server running on port 3000
   ```

5. **Verify it's running** by visiting:
   ```
   http://localhost:3000
   ```
   You should get: `{ "status": "Intelices voice webhook is running" }`

---

## Exposing Locally with ngrok

Vapi needs a **public HTTPS URL** to call your webhook. ngrok creates a secure tunnel from the internet to your local server.

### Install ngrok

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Windows (Chocolatey):**
```bash
choco install ngrok
```

**Linux / Manual:**
```bash
# Download from https://ngrok.com/download and unzip
sudo mv ngrok /usr/local/bin
```

Or install via npm:
```bash
npm install -g ngrok
```

### Authenticate ngrok

Sign up at [ngrok.com](https://ngrok.com) (free), then grab your auth token from the dashboard and run:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Start the tunnel

Make sure your webhook server is running on port 3000, then in a **separate terminal**:

```bash
ngrok http 3000
```

You'll see output like:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the `https://` URL — this is your public webhook URL.

---

## Integrating with Vapi

1. Open your [Vapi Dashboard](https://dashboard.vapi.ai) and select your assistant.

2. Go to **Tools** and create a new **Function** tool with the following settings:

   - **Name:** `capture_lead` (or any name you prefer)
   - **Description:** `Captures the caller's name, contact number, and query to notify the support team.`
   - **Server URL:** `https://abc123.ngrok-free.app/api/capture-lead`

3. Define the function **parameters:**

   | Parameter | Type   | Required | Description                  |
   |-----------|--------|----------|------------------------------|
   | `name`    | string | Yes      | Full name of the caller      |
   | `contact` | string | Yes      | Phone number or email        |
   | `query`   | string | No       | What the caller is asking about |

4. Add this tool to your assistant's prompt so the LLM knows when to use it. Example:

   > *"When the caller provides their name and contact details, use the `capture_lead` tool to record their information."*

5. Save and publish your assistant. Test a call — the webhook will fire, and your support email will receive a notification within seconds.

---

## API Reference

### `GET /`
Health check endpoint.

**Response:**
```json
{ "status": "Intelices voice webhook is running" }
```

### `POST /api/capture-lead`
Receives a Vapi tool call payload, sends an email, and returns a confirmation string for the LLM to read aloud.

**Expected body (Vapi format):**
```json
{
  "message": {
    "toolCallList": [{
      "function": {
        "arguments": "{\"name\": \"John Doe\", \"contact\": \"9876543210\", \"query\": \"Cloud pricing\"}"
      }
    }]
  }
}
```

**Response:**
```json
{ "result": "Lead captured successfully for John Doe. Support team has been notified." }
```

---

## Project Structure

```
intelices-voice-webhook/
├── index.js        # Main server and webhook handler
├── package.json    # Dependencies and scripts
├── sample.env      # Environment variable template
└── .env            # Your local secrets (do not commit)
```
