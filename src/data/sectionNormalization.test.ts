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

// ══════════════════════════════════════════════════════════════════════════════
// gyosei-ippan: 行政法の一般的な法理論
// ══════════════════════════════════════════════════════════════════════════════
describe('resolveDisplaySectionTitle — gyosei-ippan', () => {
  const r = (raw: string) => resolveDisplaySectionTitle('gyosei-ippan', raw, '', 'KB2025-p020-q01');

  // 番号付き → display
  it('番号付き 02_行政機関と権限 → identity', () => expect(r('02_行政機関と権限')).toBe('02_行政機関と権限'));
  it('番号付き 05_附款・裁量 → 07_附款・裁量', () => expect(r('05_附款・裁量')).toBe('07_附款・裁量'));
  it('番号付き 06_行政立法… → 08_行政立法…調査', () => expect(r('06_行政立法・契約・指導・調査')).toBe('08_行政立法・契約・指導・調査'));
  it('番号付き 07_行政上の強制執行 → 09_行政上の強制措置（総論）', () => expect(r('07_行政上の強制執行')).toBe('09_行政上の強制措置（総論）'));
  it('番号付き 09_行政罰 → 12_行政罰', () => expect(r('09_行政罰')).toBe('12_行政罰'));

  // 番号なし → 番号付き display に統合
  it('行政法の一般的な法理論 → 01_行政法総論', () => expect(r('行政法の一般的な法理論')).toBe('01_行政法総論'));
  it('行政行為 → 04_行政行為（総論）', () => expect(r('行政行為')).toBe('04_行政行為（総論）'));
  it('行政行為論 → 04_行政行為（総論）', () => expect(r('行政行為論')).toBe('04_行政行為（総論）'));
  it('代執行 → 10_行政代執行', () => expect(r('代執行')).toBe('10_行政代執行'));
  it('行政代執行法 → 10_行政代執行', () => expect(r('行政代執行法')).toBe('10_行政代執行'));

  // singleton → 概念群に吸収
  it('singleton 公定力 → 05_行政行為の効力', () => expect(r('公定力')).toBe('05_行政行為の効力'));
  it('singleton 拘束力 → 05_行政行為の効力', () => expect(r('拘束力')).toBe('05_行政行為の効力'));
  it('singleton 不可争力 → 05_行政行為の効力', () => expect(r('不可争力')).toBe('05_行政行為の効力'));
  it('singleton 公営住宅 → 01_行政法総論', () => expect(r('公営住宅')).toBe('01_行政法総論'));
  it('singleton 強制徴収 → 11_直接強制…', () => expect(r('強制徴収')).toBe('11_直接強制・即時強制・強制徴収'));
  it('singleton 認可 → 04_行政行為（総論）', () => expect(r('認可')).toBe('04_行政行為（総論）'));

  // 撤回・瑕疵系
  it('無効な行政行為 → 06_取消し・撤回・瑕疵', () => expect(r('無効な行政行為')).toBe('06_取消し・撤回・瑕疵'));
  it('違法行為の承継 → 06_取消し・撤回・瑕疵', () => expect(r('違法行為の承継')).toBe('06_取消し・撤回・瑕疵'));

  // display 名修正: 調査 を含む
  it('06_行政立法… → 08_行政立法・契約・指導・調査', () => expect(r('06_行政立法・契約・指導・調査')).toBe('08_行政立法・契約・指導・調査'));
  it('行政契約 → 08_行政立法・契約・指導・調査', () => expect(r('行政契約')).toBe('08_行政立法・契約・指導・調査'));

  // PROBLEM_ID_OVERRIDES
  it('p058-q08 不明 → 10_行政代執行（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-ippan', '不明', '', 'KB2025-p058-q08')).toBe('10_行政代執行');
  });
  it('p051-q05 (空) → 08_行政立法・契約・指導・調査（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-ippan', '', '', 'KB2025-p051-q05')).toBe('08_行政立法・契約・指導・調査');
  });
  it('不明（override対象外）→ raw フォールバック', () => {
    expect(resolveDisplaySectionTitle('gyosei-ippan', '不明', '', 'KB2025-p999-q01')).toBe('不明');
  });

  // フォールバック
  it('未定義 raw → raw のまま', () => expect(r('未知のテーマ')).toBe('未知のテーマ'));
});

// ══════════════════════════════════════════════════════════════════════════════
// minpo-sosoku: 民法総則
// ══════════════════════════════════════════════════════════════════════════════
describe('resolveDisplaySectionTitle — minpo-sosoku', () => {
  const r = (raw: string) => resolveDisplaySectionTitle('minpo-sosoku', raw, '', 'KB2025-p213-q01');

  // 番号付き → display
  it('01_権利能力・行為能力 → 02_権利能力・行為能力', () => expect(r('01_権利能力・行為能力')).toBe('02_権利能力・行為能力'));
  it('02_意思表示と瑕疵 → 04_意思表示と瑕疵', () => expect(r('02_意思表示と瑕疵')).toBe('04_意思表示と瑕疵'));
  it('03_代理 → 05_代理', () => expect(r('03_代理')).toBe('05_代理'));
  it('04_無効・取消し… → 06_無効・取消し…', () => expect(r('04_無効・取消し・条件・期限')).toBe('06_無効・取消し・条件・期限'));
  it('05_人・法人・物 → 03_人・法人・物', () => expect(r('05_人・法人・物')).toBe('03_人・法人・物'));
  it('06_時効 → 07_時効', () => expect(r('06_時効')).toBe('07_時効'));

  // 番号なし → 統合先
  it('行為能力 → 02_権利能力・行為能力', () => expect(r('行為能力')).toBe('02_権利能力・行為能力'));
  it('被補助人 → 02_権利能力・行為能力', () => expect(r('被補助人')).toBe('02_権利能力・行為能力'));
  it('心裡留保 → 04_意思表示と瑕疵', () => expect(r('心裡留保')).toBe('04_意思表示と瑕疵'));
  it('詐欺および強迫 → 04_意思表示と瑕疵', () => expect(r('詐欺および強迫')).toBe('04_意思表示と瑕疵'));
  it('任意代理人 → 05_代理', () => expect(r('任意代理人')).toBe('05_代理'));
  it('無効・取消し → 06_無効・取消し…', () => expect(r('無効・取消し')).toBe('06_無効・取消し・条件・期限'));
  it('総則（override対象外 helper）→ raw フォールバック', () => expect(r('総則')).toBe('総則'));
  it('取得時効 → 07_時効', () => expect(r('取得時効')).toBe('07_時効'));

  // singleton → 統合先
  it('singleton 意思能力 → 02_', () => expect(r('意思能力')).toBe('02_権利能力・行為能力'));
  it('singleton 被保佐人 → 02_', () => expect(r('被保佐人')).toBe('02_権利能力・行為能力'));
  it('singleton 物 → 03_', () => expect(r('物')).toBe('03_人・法人・物'));
  it('singleton 消滅時効 → 07_', () => expect(r('消滅時効')).toBe('07_時効'));
  it('singleton 代理権の範囲 → 05_', () => expect(r('代理権の範囲')).toBe('05_代理'));

  // PROBLEM_ID_OVERRIDES
  it('p234-q01 総則 → 05_代理（override）', () => {
    expect(resolveDisplaySectionTitle('minpo-sosoku', '総則', '', 'KB2025-p234-q01')).toBe('05_代理');
  });
  it('p234-q05 総則 → 05_代理（override）', () => {
    expect(resolveDisplaySectionTitle('minpo-sosoku', '総則', '', 'KB2025-p234-q05')).toBe('05_代理');
  });
  it('p239-q01 総則 → 06_無効・取消し…（override）', () => {
    expect(resolveDisplaySectionTitle('minpo-sosoku', '総則', '', 'KB2025-p239-q01')).toBe('06_無効・取消し・条件・期限');
  });
  it('p239-q03 総則 → 07_時効（override）', () => {
    expect(resolveDisplaySectionTitle('minpo-sosoku', '総則', '', 'KB2025-p239-q03')).toBe('07_時効');
  });
  it('p239-q06 総則 → 07_時効（override）', () => {
    expect(resolveDisplaySectionTitle('minpo-sosoku', '総則', '', 'KB2025-p239-q06')).toBe('07_時効');
  });
  it('総則（override対象外）→ raw フォールバック', () => {
    expect(resolveDisplaySectionTitle('minpo-sosoku', '総則', '', 'KB2025-p999-q01')).toBe('総則');
  });

  // フォールバック
  it('未定義 raw → raw のまま', () => expect(r('未知のテーマ')).toBe('未知のテーマ'));
});

// ══════════════════════════════════════════════════════════════════════════════
// gyosei-chiho: 地方自治法
// ══════════════════════════════════════════════════════════════════════════════
describe('resolveDisplaySectionTitle — gyosei-chiho', () => {
  const r = (raw: string) => resolveDisplaySectionTitle('gyosei-chiho', raw, '', 'KB2025-p167-q01');

  // prefix付き → display
  it('01_地方公共団体の種類・組織 → identity', () => expect(r('01_地方公共団体の種類・組織')).toBe('01_地方公共団体の種類・組織'));
  it('03_議会（組織・権限・運営）→ 03_議会', () => expect(r('03_議会（組織・権限・運営）')).toBe('03_議会'));
  it('10_住民監査請求・住民訴訟 → identity', () => expect(r('10_住民監査請求・住民訴訟')).toBe('10_住民監査請求・住民訴訟'));
  it('12_国地方関係・広域連携 → identity', () => expect(r('12_国地方関係・広域連携')).toBe('12_国地方関係・広域連携'));

  // 番号なし → 統合先
  it('普通地方公共団体 → 01_', () => expect(r('普通地方公共団体')).toBe('01_地方公共団体の種類・組織'));
  it('特別区 → 01_', () => expect(r('特別区')).toBe('01_地方公共団体の種類・組織'));
  it('境界 → 01_', () => expect(r('境界')).toBe('01_地方公共団体の種類・組織'));
  it('地域自治区 → 02_', () => expect(r('地域自治区')).toBe('02_地方公共団体の事務'));
  it('議会 → 03_議会', () => expect(r('議会')).toBe('03_議会'));
  it('請願 → 03_議会', () => expect(r('請願')).toBe('03_議会'));
  it('議員の地位 → 03_議会', () => expect(r('議員の地位')).toBe('03_議会'));
  it('議会との関係 → 04_', () => expect(r('議会との関係')).toBe('04_長と議会の関係'));
  it('地方公共団体の機関 → 05_', () => expect(r('地方公共団体の機関')).toBe('05_執行機関・長・委員会'));
  it('通則 → 05_', () => expect(r('通則')).toBe('05_執行機関・長・委員会'));
  it('条例 → 06_', () => expect(r('条例')).toBe('06_条例・規則'));
  it('規程・要綱 → 06_', () => expect(r('規程・要綱')).toBe('06_条例・規則'));
  it('予算 → 07_', () => expect(r('予算')).toBe('07_財務・契約・監査'));
  it('時効 → 07_', () => expect(r('時効')).toBe('07_財務・契約・監査'));
  it('地縁団体 → 08_', () => expect(r('地縁団体')).toBe('08_住民・地縁団体'));
  it('住民の権利 → 09_', () => expect(r('住民の権利')).toBe('09_直接請求'));
  it('解散及び解職の請求 → 09_', () => expect(r('解散及び解職の請求')).toBe('09_直接請求'));
  it('住民による監査請求および訴訟 → 10_', () => expect(r('住民による監査請求および訴訟')).toBe('10_住民監査請求・住民訴訟'));
  it('公の施設 → 11_', () => expect(r('公の施設')).toBe('11_公の施設'));
  it('紛争処理 → 12_', () => expect(r('紛争処理')).toBe('12_国地方関係・広域連携'));

  // PROBLEM_ID_OVERRIDES
  it('p196-q01 → 08_住民・地縁団体（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-chiho', '01_地方公共団体の種類・組織', '', 'KB2025-p196-q01')).toBe('08_住民・地縁団体');
  });
  it('p208-q06 (空) → 12_国地方関係・広域連携（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-chiho', '', '', 'KB2025-p208-q06')).toBe('12_国地方関係・広域連携');
  });

  // フォールバック
  it('未定義 raw → raw のまま', () => expect(r('未知のテーマ')).toBe('未知のテーマ'));
});

// ══════════════════════════════════════════════════════════════════════════════
// gyosei-jiken: 行政事件訴訟法
// ══════════════════════════════════════════════════════════════════════════════
describe('resolveDisplaySectionTitle — gyosei-jiken', () => {
  const r = (raw: string) => resolveDisplaySectionTitle('gyosei-jiken', raw, '', 'KB2025-p122-q01');

  // prefix付き → display
  it('01_行政事件訴訟の種類 → identity', () => expect(r('01_行政事件訴訟の種類')).toBe('01_行政事件訴訟の種類'));
  it('02_処分性 → identity', () => expect(r('02_処分性')).toBe('02_処分性'));
  it('05_取消訴訟の審理 → identity', () => expect(r('05_取消訴訟の審理')).toBe('05_取消訴訟の審理'));
  it('06_判決 → identity', () => expect(r('06_判決')).toBe('06_判決'));
  it('08_無効等確認… → identity', () => expect(r('08_無効等確認・不作為違法確認訴訟')).toBe('08_無効等確認・不作為違法確認訴訟'));
  it('11_教示 → 12_教示', () => expect(r('11_教示')).toBe('12_教示'));

  // 番号なし → 統合先
  it('抗告訴訟 → 01_', () => expect(r('抗告訴訟')).toBe('01_行政事件訴訟の種類'));
  it('争点訴訟 → 01_', () => expect(r('争点訴訟')).toBe('01_行政事件訴訟の種類'));
  it('行政法 → 02_処分性', () => expect(r('行政法')).toBe('02_処分性'));
  it('狭義の訴えの利益 → 03_', () => expect(r('狭義の訴えの利益')).toBe('03_原告適格・訴えの利益'));
  it('裁判管轄 → 04_', () => expect(r('裁判管轄')).toBe('04_被告適格・管轄・出訴期間'));
  it('出訴期間 → 04_', () => expect(r('出訴期間')).toBe('04_被告適格・管轄・出訴期間'));
  it('取消訴訟と審査請求との関係 → 05_', () => expect(r('取消訴訟と審査請求との関係')).toBe('05_取消訴訟の審理'));
  it('取消訴訟の判決には… → 06_判決', () => expect(r('取消訴訟の判決には、既判力を生じない。')).toBe('06_判決'));
  it('執行停止 → 07_', () => expect(r('執行停止')).toBe('07_執行停止'));
  it('無効等確認訴訟 → 08_', () => expect(r('無効等確認訴訟')).toBe('08_無効等確認・不作為違法確認訴訟'));
  it('義務付け訴訟 → 09_', () => expect(r('義務付け訴訟')).toBe('09_義務付け・差止め・仮の救済'));
  it('差止め訴訟 → 09_', () => expect(r('差止め訴訟')).toBe('09_義務付け・差止め・仮の救済'));
  it('仮の義務付け・仮の差止め → 09_', () => expect(r('仮の義務付け・仮の差止め')).toBe('09_義務付け・差止め・仮の救済'));
  it('形式的当事者訴訟 → 10_当事者訴訟', () => expect(r('形式的当事者訴訟')).toBe('10_当事者訴訟'));
  it('実質的当事者訴訟 → 10_当事者訴訟', () => expect(r('実質的当事者訴訟')).toBe('10_当事者訴訟'));
  it('10_当事者訴訟・客観訴訟 → 10_当事者訴訟', () => expect(r('10_当事者訴訟・客観訴訟')).toBe('10_当事者訴訟'));
  it('民衆訴訟 → 11_客観訴訟', () => expect(r('民衆訴訟')).toBe('11_客観訴訟（民衆訴訟・機関訴訟）'));
  it('機関訴訟 → 11_客観訴訟', () => expect(r('機関訴訟')).toBe('11_客観訴訟（民衆訴訟・機関訴訟）'));

  // PROBLEM_ID_OVERRIDES: 取消訴訟の訴訟要件 split
  it('p125-q01 取消訴訟の訴訟要件 → 02_処分性（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-jiken', '取消訴訟の訴訟要件', '', 'KB2025-p125-q01')).toBe('02_処分性');
  });
  it('p125-q04 取消訴訟の訴訟要件 → 02_処分性（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-jiken', '取消訴訟の訴訟要件', '', 'KB2025-p125-q04')).toBe('02_処分性');
  });
  it('p132-q01 取消訴訟の訴訟要件 → 03_原告適格（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-jiken', '取消訴訟の訴訟要件', '', 'KB2025-p132-q01')).toBe('03_原告適格・訴えの利益');
  });
  it('p132-q06 取消訴訟の訴訟要件 → 03_原告適格（override）', () => {
    expect(resolveDisplaySectionTitle('gyosei-jiken', '取消訴訟の訴訟要件', '', 'KB2025-p132-q06')).toBe('03_原告適格・訴えの利益');
  });
  it('取消訴訟の訴訟要件（override対象外）→ raw フォールバック', () => {
    expect(resolveDisplaySectionTitle('gyosei-jiken', '取消訴訟の訴訟要件', '', 'KB2025-p999-q01')).toBe('取消訴訟の訴訟要件');
  });

  // フォールバック
  it('未定義 raw → raw のまま', () => expect(r('未知のテーマ')).toBe('未知のテーマ'));
});
