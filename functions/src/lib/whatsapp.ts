const WHATSAPP_API_VERSION = "v19.0";

export interface SendTemplateParams {
  to: string; // any format; digits are extracted before sending
  templateName: string;
  languageCode?: string;
  bodyParams: string[];
}

export interface SendTemplateResult {
  ok: boolean;
  error?: string;
}

// Runs on Node's native `fetch`, available without an extra dependency
// on the Node 20 Cloud Functions runtime this repo targets (see
// functions/package.json engines.node).
//
// IMPORTANT: Meta only allows business-initiated ("proactive") messages
// like an order confirmation via a pre-approved message TEMPLATE — free
// -form text only works if the customer messaged the business within
// the last 24 hours, which isn't the case for a fresh order. Create and
// get a template approved in Meta Business Manager before this will
// actually deliver anything; see the README section this function is
// documented under for a starting template definition.
export async function sendWhatsAppTemplate(
  params: SendTemplateParams
): Promise<SendTemplateResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error:
        "WhatsApp API not configured — set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
    };
  }

  // WhatsApp's API wants the destination as digits only, no leading '+'.
  const toDigits = params.to.replace(/\D/g, "");

  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toDigits,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: params.languageCode ?? "en" },
            components: [
              {
                type: "body",
                parameters: params.bodyParams.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `WhatsApp API responded ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error calling WhatsApp API",
    };
  }
}
