/**
 * import-parsed.test.ts
 *
 * inheritClassificationField() の回帰防止テスト。
 * このファイルは re-import 時の subjectId / chapterId 継承ルールを保護する。
 *
 * 背景: known_issues.md §1 / CLAUDE.md 技術メモ §1-2
 *   DATA_VERSION bump で importParsedBatch が problems / problemAttrs を
 *   ページ単位で全削除→再作成していた。再作成時に subjectCandidate が
 *   空なら subjectId が '' で保存され、科目ツリー上で問題が消える死角が出ていた。
 *   新 OCR に値が無いときは既存 existingAttr を継承するように是正したため、
 *   その優先順ルールをここで固定する。
 */

import { describe, it, expect } from 'vitest';
import { inheritClassificationField } from './import-parsed';

describe('inheritClassificationField — re-import 時の分類継承', () => {
  // ── Priority 1: 新しく確定した値 ────────────────────────────────────────

  it('新しい値があれば新しい値を使う', () => {
    expect(inheritClassificationField('gyosei-tetsuduki', 'minpou-sousoku')).toBe(
      'gyosei-tetsuduki',
    );
  });

  it('新しい値があり既存が undefined でも新しい値を使う', () => {
    expect(inheritClassificationField('gyosei-tetsuduki', undefined)).toBe('gyosei-tetsuduki');
  });

  it('新しい値があり既存が空文字でも新しい値を使う', () => {
    expect(inheritClassificationField('gyosei-tetsuduki', '')).toBe('gyosei-tetsuduki');
  });

  // ── Priority 2: 既存 existingAttr ───────────────────────────────────────

  it('新しい値が undefined なら既存値を継承する', () => {
    expect(inheritClassificationField(undefined, 'minpou-sousoku')).toBe('minpou-sousoku');
  });

  it('新しい値が null なら既存値を継承する', () => {
    expect(inheritClassificationField(null, 'minpou-sousoku')).toBe('minpou-sousoku');
  });

  it('新しい値が空文字なら既存値を継承する（空文字 = 値なし扱い）', () => {
    expect(inheritClassificationField('', 'minpou-sousoku')).toBe('minpou-sousoku');
  });

  // ── Priority 3: フォールバック ──────────────────────────────────────────

  it('新しい値も既存値も空なら既定フォールバック `` を返す', () => {
    expect(inheritClassificationField('', '')).toBe('');
  });

  it('新しい値も既存値も undefined なら既定フォールバック `` を返す', () => {
    expect(inheritClassificationField(undefined, undefined)).toBe('');
  });

  it('新しい値も既存値も null なら既定フォールバック `` を返す', () => {
    expect(inheritClassificationField(null, null)).toBe('');
  });

  it('fallback を明示指定できる', () => {
    expect(inheritClassificationField(undefined, undefined, 'UNKNOWN')).toBe('UNKNOWN');
  });

  // ── subjectId / chapterId を同じ関数で扱う前提の契約 ───────────────────

  it('chapterId の再 import シナリオ: OCR 候補が空なら既存章が残る', () => {
    // branch.chapterCandidate が undefined で入ってくるケース
    const newOcrValue: string | undefined = undefined;
    const existingChapterId = '05_行政手続法/申請と届出';
    expect(inheritClassificationField(newOcrValue, existingChapterId)).toBe(
      '05_行政手続法/申請と届出',
    );
  });

  it('subjectId の再 import シナリオ: OCR 候補が先に確定していれば既存上書き', () => {
    const newOcrValue = 'gyosei-fufuku';
    const existingSubjectId = 'gyosei-sosho'; // 以前の誤分類
    expect(inheritClassificationField(newOcrValue, existingSubjectId)).toBe('gyosei-fufuku');
  });
});
