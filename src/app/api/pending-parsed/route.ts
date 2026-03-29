/**
 * /api/pending-parsed
 *
 * GET    — tmp/pending_parsed.json の内容を返す。ファイルなければ { pending: false }
 * DELETE — batchId を照合してから tmp/pending_parsed.json を削除する。
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const PENDING_FILE = join(process.cwd(), 'tmp', 'pending_parsed.json');

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

export async function DELETE(req: NextRequest) {
  let requestedBatchId: string | null = null;
  try {
    const body = await req.json();
    requestedBatchId = body?.batchId ?? null;
  } catch {
    // body なし・parse失敗は batchId 未指定として扱う
  }

  if (!existsSync(PENDING_FILE)) {
    return NextResponse.json({ ok: true, reason: 'already_deleted' });
  }

  if (requestedBatchId !== null) {
    try {
      const raw = readFileSync(PENDING_FILE, 'utf8');
      const data = JSON.parse(raw);
      const fileBatchId: string = data?.batchId ?? '';

      if (fileBatchId !== requestedBatchId) {
        return NextResponse.json(
          { ok: false, error: 'batchId_mismatch', expected: requestedBatchId, actual: fileBatchId },
          { status: 409 },
        );
      }
    } catch {
      return NextResponse.json({ ok: false, error: 'parse_error' }, { status: 500 });
    }
  }

  unlinkSync(PENDING_FILE);
  return NextResponse.json({ ok: true });
}
