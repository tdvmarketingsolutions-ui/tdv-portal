import "server-only";

export interface IndicativePrice {
  range: string;
  note: string;
}

/**
 * AI-generated price proposal shown to the client right after they submit a
 * project request — this IS the price TDV gives them in the app (the client
 * accepts or declines it directly, no separate human-prepared quote by
 * e-mail follows). Calls the Anthropic Messages API directly, same as
 * app/api/ai/chat/route.ts, so no extra SDK dependency. Never throws: a
 * missing API key, a malformed response, or a failed call all just mean no
 * price is shown, and createProjectRequest carries on without one — staff
 * then follows up manually.
 */
export async function generateIndicativePrice(
  title: string,
  description: string | undefined,
  intake?: { projectType: string; budgetIndication: string; desiredDeadline?: string }
): Promise<IndicativePrice | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        system:
          'Je bent de prijsbepaler voor TDV, een marketingbureau in België. Op basis van het type project, een ' +
          'budget-indicatie die de klant zelf aangaf, een optionele gewenste deadline en een korte omschrijving ' +
          'bepaal je de prijs die TDV de klant voorstelt voor dit project, in euro. Dit is geen vrijblijvende ' +
          'schatting maar het effectieve prijsvoorstel dat de klant meteen te zien krijgt en kan aanvaarden — ' +
          'reken daarom niet te krap. TDV positioneert zich als premium bureau: reken aan het hogere, ' +
          'realistische uiteinde van wat gelijkaardig werk in België kost, nooit aan het laagste/budget-uiteinde. ' +
          'De budget-indicatie van de klant is een signaal van wat ze verwachten, geen harde grens — wijk er ' +
          'gerust van af als het type project en de omschrijving een ander bedrag rechtvaardigen, maar leg dat ' +
          'dan kort uit in de toelichting. Een krappe deadline mag de prijs verhogen (spoedwerk). Antwoord ' +
          'UITSLUITEND met geldige JSON, exact in dit formaat, geen andere tekst: {"range": "€1.500 – €3.000", ' +
          '"note": "één korte Nederlandstalige zin die kort toelicht waarop dit prijsvoorstel gebaseerd is"}',
        messages: [
          {
            role: "user",
            content:
              `Titel: ${title}\n` +
              (intake ? `Type project: ${intake.projectType}\nBudget-indicatie van de klant: ${intake.budgetIndication}\n` : "") +
              (intake?.desiredDeadline ? `Gewenste deadline: ${intake.desiredDeadline}\n` : "") +
              `Beschrijving: ${description ?? "(geen beschrijving)"}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
    if (!text) return null;

    const parsed = JSON.parse(text) as { range?: string; note?: string };
    if (!parsed.range || !parsed.note) return null;
    return { range: parsed.range, note: parsed.note };
  } catch (err) {
    console.error("Kon geen richtprijs genereren:", err);
    return null;
  }
}
