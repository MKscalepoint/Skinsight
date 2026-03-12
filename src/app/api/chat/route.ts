import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompt';
import { Message, UserProfile } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { messages, profile }: { messages: Message[]; profile?: UserProfile } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: buildSystemPrompt(profile || {}),
        messages,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
