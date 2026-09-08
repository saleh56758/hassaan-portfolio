export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message, website } = request.body || {};
  if (website) return response.status(400).json({ error: "Invalid submission" });
  if (!name || !email || !message || name.length > 120 || email.length > 254 || message.length > 5000) {
    return response.status(400).json({ error: "Please provide valid form details." });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return response.status(503).json({ error: "Contact service is not configured." });

  try {
    const upstream = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_key: accessKey, name, email, message })
    });
    const data = await upstream.json();
    return response.status(upstream.ok && data.success !== false ? 200 : 502).json({
      success: upstream.ok && data.success !== false,
      message: upstream.ok && data.success !== false ? "Message sent successfully." : "Submission failed."
    });
  } catch {
    return response.status(502).json({ error: "Contact service is temporarily unavailable." });
  }
}
