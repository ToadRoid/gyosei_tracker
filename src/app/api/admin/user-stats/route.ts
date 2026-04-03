import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestingEmail = searchParams.get('email');

  if (!requestingEmail || !ADMIN_EMAILS.includes(requestingEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await adminClient
    .from('attempts')
    .select('user_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ユーザーごとの回答数を集計
  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1);
  }

  const stats = Array.from(countMap.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ stats });
}
