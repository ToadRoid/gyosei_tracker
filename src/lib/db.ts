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

    // v1: subjects / chapters テーブルを誤って定義していたため v2 で削除
    this.version(1).stores({
      subjects: 'id, order',
      chapters: 'id, subjectId, order',
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });

    this.version(2).stores({
      subjects: null,   // 削除
      chapters: null,   // 削除
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });
  }
}

export const db = new GyoseiDB();
