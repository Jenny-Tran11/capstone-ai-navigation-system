import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMobileRuntimeConfig } from '../app-config/app-config';

const PROMPT = `You are analyzing a photo to identify public transit information for blind or visually impaired users.

Look carefully at any bus, tram, or train visible in the image. Identify:
1. The route number or line name displayed on the front/side destination board
2. The destination text shown on the board

Respond ONLY with valid JSON in this exact format:
{"busNumber": "<route number or null>", "destination": "<destination text or null>"}

If no bus/transit vehicle is clearly visible, or the route number is not readable, use null for both fields.
Do not include any explanation outside the JSON.`;

export type TransitDetectResponse = {
  busNumber: string | null;
  destination: string | null;
};

export async function detectTransitFromImage(
  imageBase64: string,
): Promise<TransitDetectResponse> {
  const config = await getMobileRuntimeConfig();
  const apiKey = config.googleAiApiKey;
  const modelName = config.googleAiModel || 'gemini-2.0-flash';

  if (!apiKey) {
    throw new Error('Transit AI service not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    },
  ]);

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { busNumber: null, destination: null };
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    busNumber?: string | null;
    destination?: string | null;
  };

  return {
    busNumber: parsed.busNumber ?? null,
    destination: parsed.destination ?? null,
  };
}
