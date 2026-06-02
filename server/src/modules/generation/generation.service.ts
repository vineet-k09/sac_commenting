import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.PROJECT_ID || "vf-grp-aib-prd-mc2-in-lab";
const REGION = process.env.REGION || "europe-west1";
const MODEL_NAME = process.env.MODEL_NAME || "gemini-2.5-flash-lite";

const vertexAI = new VertexAI({ project: PROJECT_ID, location: REGION });
const generativeModel = vertexAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { maxOutputTokens: 512, temperature: 0.2 }
});

async function runGemini(prompt: string): Promise<string> {
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim();
}

export async function handleRephrase(userComment: string): Promise<string> {
    const prompt = `
    You are a professional editor.
    Rephrase the following user comment into ONE polished version.
    Correct grammar and spelling, and make it professional.
    Do not change the meaning. Do not provide multiple options.

    User Comment:
    ${userComment}
    `;
    return runGemini(prompt);
}

export async function handleSummarize(userComment: string): Promise<string> {
    const prompt = `
    You are a professional editor.
    Summarize the following user comment into ONE concise, polished statement.
    Correct grammar and spelling, and make it professional.
    Do not change the meaning. Do not provide multiple options.

    User Comment:
    ${userComment}
    `;
    return runGemini(prompt);
}
