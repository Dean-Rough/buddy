import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech, cleanTextForTTS } from '@/lib/voice';

export async function POST(request: NextRequest) {
  try {
    const { text, persona, childAge, whisperMode } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.CARTESIA_API_KEY) {
      return NextResponse.json(
        { error: 'Voice synthesis not configured' },
        { status: 503 }
      );
    }

    // Clean text for TTS
    const cleanedText = cleanTextForTTS(text);

    // Generate audio
    const audioBuffer = await synthesizeSpeech({
      text: cleanedText,
      persona: persona || 'friendly-raccoon',
      childAge: childAge || 8,
      whisperMode: whisperMode || false,
    });

    if (!audioBuffer) {
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: 500 }
      );
    }

    // Return audio as response
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Voice synthesis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
