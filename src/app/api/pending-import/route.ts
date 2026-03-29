/**
 * /api/pending-import
 *
 * GET    — tmp/pending_import.json の内容を返す。ファイルなければ { pending: false }
 * DELETE — batchId を照合してから tmp/pending_import.json を削除する。
 *          照合失敗時は 409 を返し、ファイルは削除しない（二重実行防止）。
 */

import { NextRequest, NextResponse } from 'next/server';
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

export async function DELETE(req: NextRequest) {
  // リクエストボディから batchId を取得して照合する
  let requestedBatchId: string | null = null;
  try {
    const body = await req.json();
    requestedBatchId = body?.batchId ?? null;
  } catch {
    // body なし・parse失敗は batchId 未指定として扱う
  }

  if (!existsSync(PENDING_FILE)) {
    // ファイル自体がなければ取込済みとして ok
    return NextResponse.json({ ok: true, reason: 'already_deleted' });
  }

  // batchId が指定されている場合は照合する
  if (requestedBatchId !== null) {
    try {
      const raw = readFileSync(PENDING_FILE, 'utf8');
      const data = JSON.parse(raw);
      const fileBatchId: string = data?.manifest?.batchId ?? '';

      if (fileBatchId !== requestedBatchId) {
        return NextResponse.json(
          { ok: false, error: 'batchId_mismatch', expected: requestedBatchId, actual: fileBatchId },
          { status: 409 },
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: 'parse_error' },
        { status: 500 },
      );
    }
  }

  unlinkSync(PENDING_FILE);
  return NextResponse.json({ ok: true });
}
