import { GoogleGenAI } from "@google/genai";
import { LawArticle, DebateQuote, AnalysisResponse } from "../types";

// Note: In a real app, this would be a backend service (FastAPI as per spec).
// Since this is a frontend-only demo, we simulate the RAG engine here.

const ANALYSIS_SYSTEM_PROMPT = `
Vous êtes LexOrigin, un assistant juridique spécialisé dans l'interprétation téléologique (l'esprit de la loi).
Votre objectif : Synthétiser l'intention du législateur.

RÈGLES :
1. Utilisez un ton formel, objectif et analytique.
2. Ne basez votre analyse QUE sur les extraits de débats (Hansard) fournis dans le contexte.
3. Si les débats montrent un désaccord fort, mentionnez-le explicitement (Controverse).
4. Si l'article a été adopté sans débat majeur, indiquez "Consensus technique".

FORMAT DE RÉPONSE JSON REQUIS :
{
  "synthesis": "Explication claire de pourquoi cette règle existe...",
  "controversy_score": (int 1-10),
  "key_arguments": ["argument 1", "argument 2"],
  "consensus_color": "red" | "yellow" | "green"
}
`;

const ASSISTANT_SYSTEM_PROMPT = `
You are the LexOrigin Legal Research Assistant. 
Your goal is to help users find specific laws and understand legal rules based on the provided corpus.

RULES:
1. Answer the user's question clearly and concisely.
2. You MUST cite the specific Law ID in brackets (e.g., [CRIM-CODE-229]) when referencing a rule. 
3. Only use the provided laws in the context. If the answer is not in the laws provided, state that it is outside the current corpus.
4. If multiple laws apply, list them all with their IDs.
`;

export const analyzeLegislativeIntent = async (
  law: LawArticle,
  debates: DebateQuote[]
): Promise<AnalysisResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 1. Prepare Context (Simulating the retrieved documents from ChromaDB)
    const debatesContext = debates.map(d => 
      `Speaker: ${d.speakerName} (${d.party})\nDate: ${d.date}\nQuote: "${d.text}"`
    ).join("\n\n---\n\n");

    const prompt = `
      ARTICLE DE LOI:
      ${law.title} (Section ${law.section})
      "${law.content}"

      EXTRAITS DES DÉBATS PARLEMENTAIRES (HANSARD):
      ${debatesContext}

      TÂCHE:
      Explique l'intention du législateur pour cet article de loi en te basant uniquement sur les extraits de débats fournis.
    `;

    // 2. Call LLM
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.3, // Low temperature for factual/analytical output
      }
    });

    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("No response generated");
    }

    // 3. Parse JSON
    return JSON.parse(responseText) as AnalysisResponse;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const askLegalAssistant = async (
  query: string,
  laws: LawArticle[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Prepare RAG Context (Simulating vector search by providing all mock laws)
    const corpusContext = laws.map(l => 
      `ID: [${l.id}]\nSection: ${l.section}\nTitle: ${l.title}\nContent: ${l.content}`
    ).join("\n\n---\n\n");

    const prompt = `
      LEGAL CORPUS:
      ${corpusContext}

      USER QUERY:
      ${query}
    `;

    // 2. Call LLM
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ASSISTANT_SYSTEM_PROMPT,
        temperature: 0.2,
      }
    });

    return response.text || "I apologize, I could not generate a response.";

  } catch (error) {
    console.error("Gemini Assistant Failed:", error);
    return "I am currently unable to access the legal corpus. Please try again later.";
  }
};