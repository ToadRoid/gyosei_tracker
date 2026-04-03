import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ReviewPackRecord } from '@/types/review-pack';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing required query param: userId' },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return NextResponse.json({ record: null });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('review_packs')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Supabase query warning (review_packs):', error.message);
      return NextResponse.json({ record: null });
    }

    if (!data) {
      return NextResponse.json({ record: null });
    }

    const record: ReviewPackRecord = {
      id: data.id,
      userId: data.user_id,
      generatedAt: data.generated_at,
      packJson: data.pack_json,
      sourceSummaryJson: data.source_summary_json,
    };

    return NextResponse.json({ record });
  } catch (err) {
    console.error('Failed to fetch latest review pack:', err);
    return NextResponse.json({ record: null });
  }
}
