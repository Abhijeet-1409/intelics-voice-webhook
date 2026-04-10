import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());

// Gmail transporter — created once, reused for every email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Health check — useful to confirm your server is reachable
app.get('/', (req, res) => {
  res.json({ status: 'Intelices voice webhook is running' });
});

// Main webhook — Vapi hits this when lead is captured
app.post('/api/capture-lead', async (req, res) => {

  try {
    // Vapi sends tool call data in this structure
    const message = req.body?.message;
    const toolCall = message?.toolCallList?.[0];
    const args = JSON.parse(toolCall?.function?.arguments || '{}');

    const { name, contact, query } = args;

    // Basic validation — don't send empty emails
    if (!name || !contact) {
      return res.status(400).json({ result: 'Missing required fields' });
    }

    // Format current time in IST
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Send the email
    await transporter.sendMail({
      from: `"Dharampal" <${process.env.GMAIL_USER}>`,
      to: process.env.SUPPORT_EMAIL,
      subject: `New lead captured: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px;">
          <h2 style="color: #1a1a2e;">New Inbound Lead — Intelices Cloud</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:8px; background:#f5f5f5; font-weight:bold; width:30%">Name</td>
              <td style="padding:8px; border-bottom:1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px; background:#f5f5f5; font-weight:bold;">Contact</td>
              <td style="padding:8px; border-bottom:1px solid #eee;">${contact}</td>
            </tr>
            <tr>
              <td style="padding:8px; background:#f5f5f5; font-weight:bold;">Query</td>
              <td style="padding:8px; border-bottom:1px solid #eee;">${query || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding:8px; background:#f5f5f5; font-weight:bold;">Time</td>
              <td style="padding:8px;">${timestamp}</td>
            </tr>
          </table>
          <p style="color:#888; font-size:12px; margin-top:20px;">
            This lead was captured automatically by the Intelices voice agent.
          </p>
        </div>
      `
    });

    console.log(`Lead captured and emailed: ${name} | ${contact} | ${timestamp}`);

    // This response goes back to Vapi — the LLM reads it
    // and uses it to decide what to say next to the caller
    res.json({
      result: `Lead captured successfully for ${name}. Support team has been notified.`
    });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 so Vapi doesn't retry in a loop
    res.status(200).json({
      result: 'Lead noted. Our team will follow up shortly.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});