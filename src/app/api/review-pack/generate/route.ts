import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { buildGptPrompt } from '@/lib/review-pack-builder';
import type { ReviewPackInput, ReviewPack } from '@/types/review-pack';

export async function POST(req: NextRequest) {
  let body: { userId?: string; input?: ReviewPackInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, input } = body;
  if (!userId || !input) {
    return NextResponse.json(
      { error: 'Missing required fields: userId and input' },
      { status: 400 },
    );
  }

  // Call OpenAI GPT-4o
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey });
  const prompt = buildGptPrompt(input);

  let parsedPack: ReviewPack;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'あなたは行政書士試験の学習アドバイザーです。指定されたJSONスキーマに従い、正確なJSONのみを返してください。マークダウンのコードブロックは使わないでください。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    parsedPack = JSON.parse(cleaned) as ReviewPack;
  } catch (err) {
    console.error('GPT generation or parse error:', err);
    return NextResponse.json(
      { error: 'Failed to generate or parse review pack from GPT' },
      { status: 500 },
    );
  }

  // Save to Supabase (best-effort — if table doesn't exist, still return pack)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.from('review_packs').insert({
        user_id: userId,
        generated_at: parsedPack.generatedAt ?? new Date().toISOString(),
        pack_json: parsedPack,
        source_summary_json: input,
      });
      if (error) {
        console.warn('Supabase insert warning (review_packs):', error.message);
      }
    } catch (err) {
      console.warn('Supabase save failed (non-fatal):', err);
    }
  }

  return NextResponse.json({ pack: parsedPack });
}
