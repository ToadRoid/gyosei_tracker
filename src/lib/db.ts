import Dexie, { type EntityTable } from 'dexie';
import type { Question, Attempt, Import } from '@/types';

// 科目・章マスタは src/data/master.ts を唯一の正とする。
// Dexie テーブルとしては持たない（静的データのため DB 不要）。

class GyoseiDB extends Dexie {
  questions!: EntityTable<Question, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;
  imports!: EntityTable<Import, 'id'>;

  constructor() {
    super('gyosei_tracker');

    // v1: 初期スキーマ（subjects / chapters テーブルを誤って定義）
    this.version(1).stores({
      subjects: 'id, order',
      chapters: 'id, subjectId, order',
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });

    // v2: subjects / chapters を削除
    this.version(2).stores({
      subjects: null,
      chapters: null,
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });

    // v3: attempts に [questionId+lapNo] 複合インデックスを追加
    //     → upsertAttempt での重複チェックに使用
    this.version(3).stores({
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, [questionId+lapNo], answeredAt',
      imports: '++id, status, importedAt',
    });
  }
}

export const db = new GyoseiDB();

/**
 * attempt の upsert（1周につき1問題1記録）
 * questionId + lapNo が既存なら上書き、なければ追加。
 * リロード・誤再開による重複を防ぐ。
 */
export async function upsertAttempt(
  data: Omit<Attempt, 'id'>,
): Promise<void> {
  const existing = await db.attempts
    .where('[questionId+lapNo]')
    .equals([data.questionId, data.lapNo])
    .first();

  if (existing?.id !== undefined) {
    await db.attempts.update(existing.id, {
      userAnswer: data.userAnswer,
      isCorrect: data.isCorrect,
      responseTimeSec: data.responseTimeSec,
      answeredAt: data.answeredAt,
    });
  } else {
    await db.attempts.add(data);
  }
}
