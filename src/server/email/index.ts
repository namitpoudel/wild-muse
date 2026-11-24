import "server-only";

/**
 * Email adapter. EMAIL_DRIVER selects the transport:
 *   console – development: prints the email to the server log (default outside production)
 *   resend  – production: Resend HTTP API (RESEND_API_KEY, EMAIL_FROM). Wired and tested in Stage 5.
 * Sending failures are logged and never leak to customers.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const outbox: EmailMessage[] = [];
/** Test helper: emails captured by the console driver in this process. */
export function getConsoleOutbox() {
  return outbox;
}

async function sendConsole(msg: EmailMessage): Promise<EmailResult> {
  outbox.push(msg);
  if (outbox.length > 50) outbox.shift();
  console.info(`\n[email:console] To: ${msg.to}\nSubject: ${msg.subject}\n${msg.text}\n`);
  return { ok: true, id: `console-${outbox.length}` };
}

async function sendResend(msg: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, error: "RESEND_API_KEY / EMAIL_FROM not configured" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      reply_to: msg.replyTo,
      tags: msg.tags ? Object.entries(msg.tags).map(([name, value]) => ({ name, value })) : undefined,
    }),
  });
  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const driver = process.env.EMAIL_DRIVER ?? (process.env.NODE_ENV === "production" ? "resend" : "console");
  try {
    const result = driver === "resend" ? await sendResend(msg) : await sendConsole(msg);
    if (!result.ok) console.error(`[email] failed to send "${msg.subject}": ${result.error}`);
    return result;
  } catch (e) {
    console.error(`[email] error sending "${msg.subject}":`, e);
    return { ok: false, error: "send failed" };
  }
}
