// Voice service for Cartesia TTS integration
// Note: This requires CARTESIA_API_KEY environment variable

export interface VoiceSettings {
  voiceId: string;
  model: string;
  speed: number;
  stability: number;
}

export interface PersonaVoice {
  [key: string]: VoiceSettings;
}

// Voice mappings for each persona
export const PERSONA_VOICES: PersonaVoice = {
  'friendly-raccoon': {
    voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Cartesia voice ID for energetic young voice
    model: 'sonic-english',
    speed: 1.1,
    stability: 0.8,
  },
  'wise-jellyfish': {
    voiceId: '79a125e8-cd45-4c13-8a67-188112f4dd22', // Cartesia voice ID for calm, wise voice
    model: 'sonic-english',
    speed: 0.9,
    stability: 0.9,
  },
  'chill-robot': {
    voiceId: '2ee87190-8f84-4925-97da-e52547f9462c', // Cartesia voice ID for tech-friendly voice
    model: 'sonic-english',
    speed: 1.0,
    stability: 0.8,
  },
};

export interface SynthesizeOptions {
  text: string;
  persona: string;
  childAge: number;
  whisperMode?: boolean;
}

/**
 * Synthesize speech using Cartesia TTS
 */
export async function synthesizeSpeech(
  options: SynthesizeOptions
): Promise<ArrayBuffer | null> {
  try {
    const { text, persona, childAge, whisperMode } = options;

    if (!process.env.CARTESIA_API_KEY) {
      console.warn('Cartesia API key not configured');
      return null;
    }

    // Get voice settings for persona
    let voiceSettings =
      PERSONA_VOICES[persona] || PERSONA_VOICES['friendly-raccoon'];

    // Adjust for whisper mode
    if (whisperMode) {
      voiceSettings = {
        ...voiceSettings,
        speed: voiceSettings.speed * 0.8, // Slower for calming effect
        stability: Math.min(voiceSettings.stability + 0.1, 1.0), // More stable
      };
    }

    // Adjust speed for age
    if (childAge <= 8) {
      voiceSettings.speed *= 0.9; // Slower for younger children
    }

    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': process.env.CARTESIA_API_KEY,
      },
      body: JSON.stringify({
        model_id: voiceSettings.model,
        voice: {
          mode: 'id',
          id: voiceSettings.voiceId,
        },
        transcript: text,
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
        speed: voiceSettings.speed,
        emotion: whisperMode
          ? ['calm', 'gentle']
          : ['friendly', 'enthusiastic'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Cartesia API error: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Speech synthesis error:', error);
    return null;
  }
}

/**
 * Convert audio buffer to data URL for audio element
 */
export function audioBufferToDataUrl(buffer: ArrayBuffer): string {
  const blob = new Blob([buffer], { type: 'audio/mp3' });
  return URL.createObjectURL(blob);
}

/**
 * Estimate speech duration (rough calculation)
 */
export function estimateSpeechDuration(
  text: string,
  speed: number = 1.0
): number {
  // Rough estimation: average speaking rate is ~150 words per minute
  const words = text.split(/\s+/).length;
  const baseMinutes = words / 150;
  const adjustedMinutes = baseMinutes / speed;
  return Math.max(adjustedMinutes * 60 * 1000, 500); // Minimum 500ms
}

/**
 * Clean text for better TTS pronunciation
 */
export function cleanTextForTTS(text: string): string {
  return (
    text
      // Remove markdown-style formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Convert common abbreviations
      .replace(/\bw\//g, 'with')
      .replace(/\bw\/o\b/g, 'without')
      .replace(/\bu\b/g, 'you')
      .replace(/\br\b/g, 'are')
      // Remove excessive punctuation
      .replace(/([.!?]){2,}/g, '$1')
      // Ensure proper sentence endings
      .replace(/([a-zA-Z])$/, '$1.')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Get persona voice for preview
 */
export function getPersonaVoiceId(persona: string): string {
  return (
    PERSONA_VOICES[persona]?.voiceId ||
    PERSONA_VOICES['friendly-raccoon'].voiceId
  );
}

/**
 * Check if voice synthesis is available
 */
export function isVoiceAvailable(): boolean {
  return !!process.env.CARTESIA_API_KEY;
}

/**
 * Voice-enabled chat response with audio generation
 */
export async function generateVoiceResponse(
  text: string,
  persona: string,
  childAge: number,
  whisperMode: boolean = false
): Promise<{
  text: string;
  audioUrl?: string;
  estimatedDuration: number;
}> {
  try {
    // Clean text for TTS
    const cleanedText = cleanTextForTTS(text);

    // Estimate duration
    const voiceSettings =
      PERSONA_VOICES[persona] || PERSONA_VOICES['friendly-raccoon'];
    const speed = whisperMode ? voiceSettings.speed * 0.8 : voiceSettings.speed;
    const estimatedDuration = estimateSpeechDuration(cleanedText, speed);

    // Generate audio if available
    let audioUrl: string | undefined;

    if (isVoiceAvailable()) {
      const audioBuffer = await synthesizeSpeech({
        text: cleanedText,
        persona,
        childAge,
        whisperMode,
      });

      if (audioBuffer) {
        audioUrl = audioBufferToDataUrl(audioBuffer);
      }
    }

    return {
      text: cleanedText,
      audioUrl,
      estimatedDuration,
    };
  } catch (error) {
    console.error('Voice response generation error:', error);
    return {
      text,
      estimatedDuration: estimateSpeechDuration(text),
    };
  }
}
