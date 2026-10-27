
import { GoogleGenAI } from "@google/genai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { stats, disparitySummary } = await req.json();
    const apiKey = Netlify.env.get("GEMINI_API_KEY");

    const fallbackData = {
      executiveSummary:
        "This dashboard summarizes the synthetic loan portfolio and its eligibility outcomes.",
      fairnessAuditTakeaway:
        "Review selection-rate differences across audit groups. Differences alone do not establish discrimination.",
      riskAndQualityObservations: [
        "Review applicants with high debt-to-income ratios.",
        "Check missing financial information carefully.",
        "Use consistent assessment criteria."
      ],
      responsibleAIGuidelines: [
        "Keep demographic attributes separate from eligibility scoring.",
        "Explain decisions clearly.",
        "Provide human review for borderline cases."
      ]
    };

    if (!apiKey) {
      return Response.json({ fallback: true, data: fallbackData });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a responsible AI lending auditor. Analyze these aggregate synthetic loan statistics and fairness metrics. Do not invent numbers or claim that correlation proves discrimination. Return JSON with keys executiveSummary, fairnessAuditTakeaway, riskAndQualityObservations (array), and responsibleAIGuidelines (array).

Statistics:
${JSON.stringify(stats)}

Fairness metrics:
${JSON.stringify(disparitySummary)}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 }
    });

    try {
      return Response.json({
        fallback: false,
        data: JSON.parse(result.text || "{}")
      });
    } catch {
      return Response.json({ fallback: true, data: fallbackData });
    }
  } catch (error) {
    console.error("Gemini insights error:", error);
    return Response.json(
      { fallback: true, error: "Unable to generate portfolio insights." },
      { status: 500 }
    );
  }
};
