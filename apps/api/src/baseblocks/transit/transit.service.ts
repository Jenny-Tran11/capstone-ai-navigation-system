import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

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

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2',
});

export async function detectTransitFromImage(
  imageBase64: string,
): Promise<TransitDetectResponse> {
  const modelId =
    process.env.BEDROCK_MODEL_ID ??
    'apac.amazon.nova-lite-v1:0';

  const result = await bedrockClient.send(
    new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [
            { text: PROMPT },
            {
              image: {
                format: 'jpeg',
                source: {
                  bytes: Buffer.from(imageBase64, 'base64'),
                },
              },
            },
          ],
        },
      ],
      inferenceConfig: {
        temperature: 0,
        maxTokens: 200,
      },
    }),
  );

  const text =
    result.output?.message?.content
      ?.map((c) => ('text' in c && c.text ? c.text : ''))
      .join('\n')
      .trim() ?? '';
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
