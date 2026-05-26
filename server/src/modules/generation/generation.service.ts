import { Storage } from '@google-cloud/storage';
import { VertexAI } from '@google-cloud/vertexai';
import path from 'path';
import fs from 'fs';

const PROJECT_ID = process.env.PROJECT_ID || "vf-grp-aib-dev-hk07-sbx-alpha";
const LOCATION = "us-central1";
const BUCKET_NAME = "gcf-v2-sources-83794410236-europe-west1";
const PATH_PREFIX = "writeback/dashboard_image";
const MOUNT_PATH = "/gcs-bucket-vol";

const storage = new Storage();
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

export async function handleGetUploadUrl(fileName: string) {
    const fullBlobPath = `${PATH_PREFIX}/${fileName}`;
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fullBlobPath);

    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: 'image/png',
    });

    return { url, fullPath: fullBlobPath };
}

export async function handleGenerateComment(fullPathStr: string) {
    const localImagePath = path.join(MOUNT_PATH, fullPathStr);
    
    // Read the image from the FUSE mount into a base64 string for Gemini
    const imageBuffer = fs.readFileSync(localImagePath);
    const base64Image = imageBuffer.toString('base64');

    const generativeModel = vertexAI.getGenerativeModel({
        model: 'gemini-1.5-flash-002',
    });

    const prompt = "Analyze this dashboard image. Summarize key trends and point out any anomalies in the charts or tables.";
    
    const result = await generativeModel.generateContent({
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { data: base64Image, mimeType: 'image/png' } },
                { text: prompt }
            ]
        }]
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { comment: text };
}