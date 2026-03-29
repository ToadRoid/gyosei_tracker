/**
 * /api/pending-import
 *
 * GET  — tmp/pending_import.json の内容を返す。ファイルなければ { pending: false }
 * DELETE — tmp/pending_import.json を削除（import完了後に呼ぶ）
 */

import { NextResponse } from 'next/server';
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const PENDING_FILE = join(process.cwd(), 'tmp', 'pending_import.json');

export async function GET() {
  if (!existsSync(PENDING_FILE)) {
    return NextResponse.json({ pending: false });
  }

  try {
    const raw = readFileSync(PENDING_FILE, 'utf8');
    const data = JSON.parse(raw);
    return NextResponse.json({ pending: true, ...data });
  } catch {
    return NextResponse.json({ pending: false, error: 'parse_error' });
  }
}

export async function DELETE() {
  if (existsSync(PENDING_FILE)) {
    unlinkSync(PENDING_FILE);
  }
  return NextResponse.json({ ok: true });
}
