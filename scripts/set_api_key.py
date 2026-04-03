#!/usr/bin/env python3
"""
OpenAI APIキーを ~/.zshrc に安全に保存するスクリプト

使い方:
  python3 scripts/set_api_key.py
"""
import re
import sys
from pathlib import Path

ZSHRC = Path.home() / ".zshrc"

print("=== OpenAI APIキー設定 ===")
print("platform.openai.com/api-keys で新しいキーを作成してください")
print("キーを貼り付けて Enter を押してください:")
print()

key = input("> ").strip()

if not key.startswith("sk-"):
    print("エラー: キーは sk- で始まる必要があります")
    sys.exit(1)

if len(key) < 100:
    print(f"エラー: キーが短すぎます ({len(key)}文字)。正しくコピーされていません")
    sys.exit(1)

print(f"キー長: {len(key)}文字 ✓")

# ~/.zshrc の既存のOPENAI行を置き換え
content = ZSHRC.read_text(encoding="utf-8") if ZSHRC.exists() else ""
new_line = f'export OPENAI_API_KEY={key}'

if "OPENAI_API_KEY" in content:
    content = re.sub(r'export OPENAI_API_KEY=.*', new_line, content)
    print("~/.zshrc の既存キーを更新しました")
else:
    content = content.rstrip() + "\n" + new_line + "\n"
    print("~/.zshrc にキーを追加しました")

ZSHRC.write_text(content, encoding="utf-8")

print()
print("完了! 次のコマンドを実行してください:")
print("  source ~/.zshrc && python3 scripts/set_api_key.py --test")
print()
print("または直接パイプラインを実行:")
print("  source ~/.zshrc && python scripts/batch_gpt_extract.py --batch-size 5 --dry-run")

if "--test" in sys.argv:
    import os
    os.environ["OPENAI_API_KEY"] = key
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        models = client.models.list()
        print(f"API接続テスト: OK ({len(list(models))}モデル)")
    except Exception as e:
        print(f"API接続テスト失敗: {e}")
