const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestCounts = new Map();

function getClientAddress(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  return typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "unknown";
}

function isRateLimited(clientAddress) {
  const now = Date.now();

  for (const [address, entry] of requestCounts) {
    if (entry.resetAt <= now) requestCounts.delete(address);
  }

  // Keep this best-effort, per-instance limiter bounded if attackers forge addresses.
  if (requestCounts.size >= 5_000 && !requestCounts.has(clientAddress)) requestCounts.clear();

  const entry = requestCounts.get(clientAddress);
  if (!entry || entry.resetAt <= now) {
    requestCounts.set(clientAddress, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function isSameOriginRequest(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const host = request.headers["x-forwarded-host"] || request.headers.host;
  const protocol = request.headers["x-forwarded-proto"] || "https";
  return typeof host === "string" && origin === `${protocol}://${host}`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isSameOriginRequest(request)) {
    return response.status(403).json({ error: "Invalid request origin." });
  }

  if (isRateLimited(getClientAddress(request))) {
    response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_MS / 1_000));
    return response.status(429).json({ error: "Too many submissions. Please try again later." });
  }

  const { name, email, message, website } = request.body || {};
  if (website) return response.status(400).json({ error: "Invalid submission" });
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    (website !== undefined && typeof website !== "string") ||
    !name.trim() ||
    !EMAIL_PATTERN.test(email) ||
    !message.trim() ||
    name.length > 120 ||
    email.length > 254 ||
    message.length > 5000
  ) {
    return response.status(400).json({ error: "Please provide valid form details." });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return response.status(503).json({ error: "Contact service is not configured." });

  try {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 10_000);
    try {
      const upstream = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: accessKey, name: name.trim(), email: email.trim(), message: message.trim() }),
        signal: abortController.signal
      });
      const data = await upstream.json().catch(() => ({}));
      return response.status(upstream.ok && data.success !== false ? 200 : 502).json({
        success: upstream.ok && data.success !== false,
        message: upstream.ok && data.success !== false ? "Message sent successfully." : "Submission failed."
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return response.status(502).json({ error: "Contact service is temporarily unavailable." });
  }
}
