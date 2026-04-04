import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { buildGptPrompt } from '@/lib/review-pack-builder';
import type { ReviewPackInput, ReviewPack } from '@/types/review-pack';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean);

const COOLDOWN_HOURS = 24;

export async function POST(req: NextRequest) {
  let body: { userId?: string; userEmail?: string; input?: ReviewPackInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, userEmail, input } = body;
  if (!userId || !input) {
    return NextResponse.json(
      { error: 'Missing required fields: userId and input' },
      { status: 400 },
    );
  }

  const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail);

  // 非管理者: 24h クールダウンチェック
  if (!isAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data } = await supabase
          .from('review_packs')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data?.created_at) {
          const lastGenAt = new Date(data.created_at).getTime();
          const elapsedMs = Date.now() - lastGenAt;
          const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
          if (elapsedMs < cooldownMs) {
            const remainingMs = cooldownMs - elapsedMs;
            const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
            return NextResponse.json(
              {
                error: `生成は${COOLDOWN_HOURS}時間に1回までです。あと約${remainingHours}時間後に再生成できます。`,
                retryAfterMs: remainingMs,
              },
              { status: 429 },
            );
          }
        }
      } catch {
        // Supabase check失敗は無視してそのまま続行
      }
    }
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
            'あなたは行政書士試験の熟練講師です。提供された問題文と解説テキストを基に、体系的で深い理解を促す復習教材を生成してください。指定されたJSONスキーマに従い、正確なJSONのみを返してください。マークダウンのコードブロックは使わないでください。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 8192,
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
