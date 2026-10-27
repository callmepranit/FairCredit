
import { GoogleGenAI } from "@google/genai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const apiKey = Netlify.env.get("GEMINI_API_KEY");
    const body = await req.json();

    if (!apiKey) {
      return Response.json({
        fallback: true,
        data: {
          simpleExplanation:
            "Your financial profile has been assessed using the available financial indicators. This is an educational estimate, not a bank decision.",
          topContributingFactors: body.primaryFactors || [],
          positiveFinancialIndicators: body.positiveIndicators || [],
          areasRequiringAttention: body.riskFactors || [],
          practicalRecommendations: [
            "Review your monthly budget and existing debts.",
            "Keep income and loan documents ready for verification.",
            "Consult a lender for an official assessment."
          ],
          indicativeReason:
            "This is an educational assessment and not a formal lender sanction."
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Explain this educational loan assessment in simple, empathetic language. Do not change or invent the supplied numbers. Do not infer demographic traits or guarantee approval. Return JSON with keys simpleExplanation, topContributingFactors, positiveFinancialIndicators, areasRequiringAttention, practicalRecommendations, indicativeReason.

Assessment data:
${JSON.stringify(body)}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.2 }
    });

    let data;
    try {
      data = JSON.parse(result.text || "{}");
    } catch {
      data = {
        simpleExplanation: "The assessment was completed, but an AI explanation could not be formatted.",
        topContributingFactors: body.primaryFactors || [],
        positiveFinancialIndicators: body.positiveIndicators || [],
        areasRequiringAttention: body.riskFactors || [],
        practicalRecommendations: ["Review your financial details and consult a lender."],
        indicativeReason: "This is an educational estimate, not a formal bank decision."
      };
    }

    return Response.json({ fallback: false, data });
  } catch (error) {
    console.error("Gemini explanation error:", error);
    return Response.json(
      { fallback: true, error: "Unable to generate AI explanation." },
      { status: 500 }
    );
  }
};

