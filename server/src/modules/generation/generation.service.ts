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

export async function handleSummarize(comments: any[], level: string): Promise<string> {
    const commentsText = JSON.stringify(comments, null, 2);
    const prompt = `
    You are a professional editor.
    Summarize the following list of comments into one concise, set of bullet points.
    Correct grammar and spelling, and make it professional.
    Generate the response in HTML (SKIP HTML, BODY, HEAD tag), use HTML list, headings and <b></b> tags for bold for key insights.
    Do not change the collective meaning. Do not provide multiple options.
 
    Comments Data:
    ${commentsText}
    `;
    return runGemini(prompt);
}