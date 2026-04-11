/**
 * sectionNormalization.test.ts
 *
 * resolveDisplaySectionTitle() の回帰防止テスト。
 * このファイルは raw/display 二層構造の契約を保護する。
 *
 * v40→v41 で発生したバグ（sourcePageQuestion を書籍ページと誤解してページ分岐が全件失敗）
 * を早期検出するためのテスト群。
 */

import { describe, it, expect } from 'vitest';
import { resolveDisplaySectionTitle } from './sectionNormalization';

describe('resolveDisplaySectionTitle — gyosei-kokubai', () => {
  // ── EXACT_MAPPING ──────────────────────────────────────────────────────────

  it('国家賠償法1条 → 01_国家賠償法1条（要件・概念）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '国家賠償法1条', '', 'KB2025-p154-q01'),
    ).toBe('01_国家賠償法1条（要件・概念）');
  });

  it('国の損害賠償責任 → 03_国家賠償法1条（医療・追跡・立法）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '国の損害賠償責任', '', 'KB2025-p157-q01'),
    ).toBe('03_国家賠償法1条（医療・追跡・立法）');
  });

  it('02_国家賠償法2条 → 04_国家賠償法1条（求償権・共同責任）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '02_国家賠償法2条', '', 'KB2025-p159-q01'),
    ).toBe('04_国家賠償法1条（求償権・共同責任）');
  });

  it('賠償責任者、求償権 → 06_国家賠償法2条（責任者・求償権）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '賠償責任者、求償権', '', 'KB2025-p162-q01'),
    ).toBe('06_国家賠償法2条（責任者・求償権）');
  });

  it('損失補償法 → 05_国家賠償法2条（営造物責任）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償法', '', 'KB2025-p161-q01'),
    ).toBe('05_国家賠償法2条（営造物責任）');
  });

  it('民法の適用 → 07_国家賠償法（民法適用・相互保証）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '民法の適用', '', 'KB2025-p162-q04'),
    ).toBe('07_国家賠償法（民法適用・相互保証）');
  });

  it('相互保証 → 07_国家賠償法（民法適用・相互保証）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '相互保証', '', 'KB2025-p163-q01'),
    ).toBe('07_国家賠償法（民法適用・相互保証）');
  });

  it('取消訴訟と国家賠償請求訴訟との関係 → 08_国家賠償法と取消訴訟', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '取消訴訟と国家賠償請求訴訟との関係', '', 'KB2025-p163-q03'),
    ).toBe('08_国家賠償法と取消訴訟');
  });

  it('憲法上の請求権 → 09_損失補償（憲法29条）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '憲法上の請求権', '', 'KB2025-p164-q01'),
    ).toBe('09_損失補償（憲法29条）');
  });

  // ── PAGE_SPLIT_RULES: 損失補償 の3分岐 ────────────────────────────────────
  // NOTE: pageRange はファイルページ（problemId の pXXX）で判定する。
  //       sourcePageQuestion は書籍ページ番号（412, 422... 等）であり使用しない。
  //       v40→v41 バグの再発防止テスト。

  it('損失補償 + p155 → 02_国家賠償法1条（外形標準説・判例）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償', '412', 'KB2025-p155-q01'),
    ).toBe('02_国家賠償法1条（外形標準説・判例）');
  });

  it('損失補償 + p156 → 02_国家賠償法1条（外形標準説・判例）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償', '414', 'KB2025-p156-q05'),
    ).toBe('02_国家賠償法1条（外形標準説・判例）');
  });

  it('損失補償 + p160 → 05_国家賠償法2条（営造物責任）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償', '422', 'KB2025-p160-q01'),
    ).toBe('05_国家賠償法2条（営造物責任）');
  });

  it('損失補償 + p165 → 09_損失補償（憲法29条）', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償', '432', 'KB2025-p165-q04'),
    ).toBe('09_損失補償（憲法29条）');
  });

  // ── フォールバック ──────────────────────────────────────────────────────────

  it('未定義 chapter → raw をそのまま返す', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-fufuku', '審査請求先', '', 'KB2025-p100-q01'),
    ).toBe('審査請求先');
  });

  it('未定義 sectionTitle → raw をそのまま返す', () => {
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '未知のタイトル', '', 'KB2025-p999-q01'),
    ).toBe('未知のタイトル');
  });

  // ── DB残骸対応（開発中間状態で取り込まれた旧ラベル）──────────────────────

  it('01_国家賠償法1条（括弧なし・旧残骸）→ 01_国家賠償法1条（要件・概念）に吸収', () => {
    // v37開発中に括弧なしで取り込まれた可能性がある旧ラベルの回帰防止
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '01_国家賠償法1条', '', 'KB2025-p154-q01'),
    ).toBe('01_国家賠償法1条（要件・概念）');
  });

  it('損失補償 でページ帯外（フォールバック） → raw を返す', () => {
    // pageRange のどこにも属さないファイルページ
    expect(
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償', '999', 'KB2025-p999-q01'),
    ).toBe('損失補償');
  });

  it('problemId なし（undefined）でも例外を投げない', () => {
    expect(() =>
      resolveDisplaySectionTitle('gyosei-kokubai', '損失補償', '422', undefined),
    ).not.toThrow();
  });
});
