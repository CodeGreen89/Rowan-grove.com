const { app } = require("@azure/functions");
const { EmailClient } = require("@azure/communication-email");

const attempts = new Map();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function singleLine(value, maxLength) {
  return text(value, maxLength).replace(/[\r\n]+/g, " ");
}

function json(status, body) {
  return { status, jsonBody: body, headers: { "Cache-Control": "no-store" } };
}

function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (attempts.get(ip) || []).filter(time => now - time < windowMs);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 5;
}

app.http("contact", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "contact",
  handler: async (request, context) => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) return json(429, { message: "Too many enquiries have been sent. Please try again shortly." });

    let body;
    try {
      const contentType = request.headers.get("content-type") || "";
      body = contentType.includes("application/json")
        ? await request.json()
        : Object.fromEntries(new URLSearchParams(await request.text()));
    } catch {
      return json(400, { message: "The form data could not be read." });
    }

    if (text(body.website, 200)) return json(200, { message: "Message received." });

    const name = singleLine(body.name, 100);
    const email = text(body.email, 160).toLowerCase();
    const phone = text(body.phone, 40);
    const company = singleLine(body.company, 120);
    const message = text(body.message, 4000);
    const startedAt = Number(body.startedAt);

    if (!name || !EMAIL_PATTERN.test(email) || message.length < 10) {
      return json(400, { message: "Please provide your name, a valid email address and a short message." });
    }
    if (Number.isFinite(startedAt) && Date.now() - startedAt < 1500) {
      return json(400, { message: "Please take a moment to check your message before sending." });
    }

    const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
    const senderAddress = process.env.CONTACT_SENDER_ADDRESS;
    const recipientAddress = process.env.CONTACT_RECIPIENT_ADDRESS || "james@rowan-grove.com";
    if (!connectionString || !senderAddress) {
      context.error("Contact email settings are missing.");
      return json(503, { message: "The form is temporarily unavailable. Please email or call us instead." });
    }

    const plainText = [
      "New website enquiry",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Business: ${company || "Not provided"}`,
      "",
      "Message:",
      message
    ].join("\n");

    try {
      const client = new EmailClient(connectionString);
      const poller = await client.beginSend({
        senderAddress,
        recipients: { to: [{ address: recipientAddress }] },
        replyTo: [{ address: email, displayName: name }],
        content: {
          subject: `Website enquiry from ${name}${company ? ` at ${company}` : ""}`,
          plainText
        }
      });
      await poller.pollUntilDone();
      return json(200, { message: "Your message has been sent." });
    } catch (error) {
      context.error("Contact email failed", error);
      return json(500, { message: "Your message could not be sent. Please email or call us instead." });
    }
  }
});