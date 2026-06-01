import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DeleteTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
  TranscribeClient,
} from '@aws-sdk/client-transcribe';

export type AssistantInteractionInput = {
  audioBase64: string;
  mimeType?: string;
  mode?: string;
  lastDetections?: string[];
  activeRouteStep?: string;
};

export type AssistantInteractionResponse = {
  transcript: string;
  replyText: string;
  intent?: string | null;
  latencyMs?: number;
};

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-2',
});
const transcribe = new TranscribeClient({
  region: process.env.TRANSCRIBE_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2',
});
const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2',
});

function inferMediaFormat(mimeType?: string): 'mp3' | 'mp4' | 'wav' | 'ogg' {
  if (!mimeType) return 'mp4';
  const lower = mimeType.toLowerCase();
  if (lower.includes('wav')) return 'wav';
  if (lower.includes('ogg')) return 'ogg';
  if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3';
  return 'mp4';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeClip(
  audioBase64: string,
  mimeType?: string,
): Promise<string> {
  const bucket = process.env.FILE_BUCKET_NAME;
  if (!bucket) {
    throw new Error('FILE_BUCKET_NAME is required for voice interaction');
  }

  const mediaFormat = inferMediaFormat(mimeType);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const objectKey = `assistant-audio/${stamp}-${rand}.${mediaFormat}`;
  const jobName = `assist-${stamp}-${rand}`.slice(0, 200);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: Buffer.from(audioBase64, 'base64'),
      ContentType: mimeType ?? 'audio/mp4',
    }),
  );

  try {
    await transcribe.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        Media: {
          MediaFileUri: `s3://${bucket}/${objectKey}`,
        },
        MediaFormat: mediaFormat,
        LanguageCode:
          (process.env.TRANSCRIBE_LANGUAGE_CODE as
            | 'en-AU'
            | 'en-US'
            | 'en-GB'
            | undefined) ?? 'en-AU',
      }),
    );

    for (let i = 0; i < 20; i++) {
      await sleep(1200);
      const status = await transcribe.send(
        new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName,
        }),
      );
      const state = status.TranscriptionJob?.TranscriptionJobStatus;
      if (state === 'FAILED') {
        throw new Error(
          `Transcribe failed: ${
            status.TranscriptionJob?.FailureReason ?? 'unknown error'
          }`,
        );
      }
      if (state === 'COMPLETED') {
        const uri = status.TranscriptionJob?.Transcript?.TranscriptFileUri;
        if (!uri) throw new Error('Transcript file URI missing');
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Failed to fetch transcript');
        const json = (await response.json()) as {
          results?: { transcripts?: Array<{ transcript?: string }> };
        };
        const transcript =
          json.results?.transcripts?.[0]?.transcript?.trim() ?? '';
        return transcript;
      }
    }
    throw new Error('Transcription timeout');
  } finally {
    await Promise.allSettled([
      s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      ),
      transcribe.send(
        new DeleteTranscriptionJobCommand({
          TranscriptionJobName: jobName,
        }),
      ),
    ]);
  }
}

function buildAssistantPrompt(input: {
  transcript: string;
  mode?: string;
  lastDetections?: string[];
  activeRouteStep?: string;
}): string {
  const detections =
    input.lastDetections && input.lastDetections.length > 0
      ? input.lastDetections.join(', ')
      : 'none';
  const routeStep = input.activeRouteStep?.trim() || 'none';
  return `You are a mobility assistant for blind users.
Keep response short, actionable, and safety-first.
Never override urgent hazard/crossing guidance.

User transcript: "${input.transcript}"
Mode: "${input.mode ?? 'unknown'}"
Recent detections: "${detections}"
Active route step: "${routeStep}"

Return JSON only:
{"replyText":"...","intent":"repeat_last_alert|scan_now|where_am_i_heading|what_bus_is_this|stop_speaking|null"}`;
}

async function getAssistantReply(input: {
  transcript: string;
  mode?: string;
  lastDetections?: string[];
  activeRouteStep?: string;
}): Promise<{ replyText: string; intent: string | null }> {
  const modelId =
    process.env.BEDROCK_ASSISTANT_MODEL_ID ??
    process.env.BEDROCK_MODEL_ID ??
    'apac.amazon.nova-lite-v1:0';
  const prompt = buildAssistantPrompt(input);
  const result = await bedrock.send(
    new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        temperature: 0.2,
        maxTokens: 220,
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
    return {
      replyText:
        input.transcript.length > 0
          ? `I heard: ${input.transcript}. Please repeat if you need a route or hazard action.`
          : 'I could not hear clearly. Please try again.',
      intent: null,
    };
  }
  const parsed = JSON.parse(jsonMatch[0]) as {
    replyText?: string;
    intent?: string | null;
  };
  return {
    replyText:
      parsed.replyText?.trim() ||
      'I could not process that safely. Please try again.',
    intent: parsed.intent ?? null,
  };
}

export async function interactWithVoice(
  input: AssistantInteractionInput,
): Promise<AssistantInteractionResponse> {
  const startedAt = Date.now();
  const transcript = await transcribeClip(input.audioBase64, input.mimeType);
  const { replyText, intent } = await getAssistantReply({
    transcript,
    mode: input.mode,
    lastDetections: input.lastDetections,
    activeRouteStep: input.activeRouteStep,
  });
  return {
    transcript,
    replyText,
    intent,
    latencyMs: Date.now() - startedAt,
  };
}

