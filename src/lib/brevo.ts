interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in environment variables");
  }
  
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      sender: { name: "Partiu Turismo - oTHEBALDI", email: "suporte@othebaldi.me" },
      to,
      subject,
      htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo API error:", errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }

  return response.json();
}

export async function addContactToBrevo(email: string, attributes?: Record<string, any>) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn("BREVO_API_KEY is not set, skipping contact creation.");
    return;
  }
  
  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      email,
      attributes,
      updateEnabled: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo Contact API error:", errorText);
  }
}

