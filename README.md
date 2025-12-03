# Instagram Stories → Google Sheets スクレイパー

Instagramのストーリー投稿をスクレイピングし、投稿日時、メディアURL、閲覧数、リーチ数などをGoogle Spreadsheetsに自動的に記録するPythonツールです。

## 機能

- ✅ Instagram認証（ログイン情報使用）
- ✅ 過去のストーリー投稿を取得（デフォルト: 7日間）
- ✅ 取得情報：
  - 投稿日時
  - メディアタイプ（画像/動画）
  - メディアURL
  - 閲覧数（インプレッション）
  - リーチ数
  - 返信数
  - キャプション
- ✅ Google Spreadsheetsへの自動アップロード
- ✅ 重複データの自動スキップ
- ✅ セッション永続化（ログイン情報保存）

## 前提条件

- Python 3.8以上
- Instagramアカウント
- Googleアカウント
- Google Cloud Platformプロジェクト

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd ClaudeCode
```

### 2. 仮想環境の作成と有効化

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 4. Google Cloud Platform の設定

#### 4.1 プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成

#### 4.2 Google Sheets APIの有効化

1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. "Google Sheets API" を検索して有効化
3. "Google Drive API" も同様に有効化

#### 4.3 サービスアカウントの作成

1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例: instagram-scraper）
4. 「作成して続行」をクリック
5. ロールは不要なのでスキップ
6. 「完了」をクリック

#### 4.4 サービスアカウントキーの作成

1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」を選択
4. キーのタイプで「JSON」を選択
5. 「作成」をクリック
6. ダウンロードされたJSONファイルを `credentials.json` としてプロジェクトルートに保存

### 5. Google Spreadsheetsの準備

1. [Google Sheets](https://sheets.google.com/)で新しいスプレッドシートを作成
2. URLから **スプレッドシートID** をコピー
   - URL形式: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. スプレッドシートを `credentials.json` のサービスアカウントメールアドレスと共有
   - `credentials.json` 内の `client_email` をコピー
   - スプレッドシートの「共有」ボタンから編集者として追加

### 6. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集して必要な情報を入力：

```env
# Instagram認証情報
INSTAGRAM_USERNAME=あなたのInstagramユーザー名
INSTAGRAM_PASSWORD=あなたのInstagramパスワード

# Google Sheets設定
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials.json
SPREADSHEET_ID=スプレッドシートIDをここに貼り付け
WORKSHEET_NAME=Stories

# オプション設定
DAYS_TO_FETCH=7
```

## 使い方

### 基本的な実行

```bash
python main.py
```

### 実行フロー

1. Instagram にログイン
2. 過去7日間（デフォルト）のストーリーを取得
3. ストーリーのインサイト情報（閲覧数、リーチ数）を取得
4. Google Sheets に自動アップロード
5. 重複するストーリーは自動的にスキップ

### スプレッドシートの構造

| ストーリーID | 投稿日時 | メディアタイプ | メディアURL | サムネイルURL | 閲覧数 | リーチ数 | 返信数 | キャプション |
|-------------|---------|--------------|------------|--------------|-------|---------|-------|------------|
| 123456...   | 2025-12-03 10:30:00 | Photo | https://... | https://... | 1234 | 890 | 5 | テキスト... |

## トラブルシューティング

### Instagramのログインエラー

- 2段階認証を無効にするか、アプリパスワードを使用してください
- ログインに失敗する場合は、ブラウザで一度ログインしてから再試行してください
- レート制限を避けるため、頻繁な実行は控えてください

### Google Sheets API エラー

- `credentials.json` が正しい場所にあることを確認
- スプレッドシートがサービスアカウントと共有されていることを確認
- Google Sheets API と Google Drive API が有効化されていることを確認

### セッションエラー

セッションファイルに問題がある場合は削除して再ログイン：

```bash
rm instagram_session.json
```

## 注意事項

- このツールは教育目的で作成されています
- Instagramの利用規約を遵守してください
- 頻繁なスクレイピングはアカウント制限の原因になる可能性があります
- 認証情報（`.env`, `credentials.json`）は絶対に公開しないでください

## プロジェクト構造

```
ClaudeCode/
├── src/
│   ├── __init__.py
│   ├── config.py              # 設定管理
│   ├── instagram_scraper.py   # Instagramスクレイパー
│   └── sheets_uploader.py     # Google Sheetsアップローダー
├── main.py                    # メインスクリプト
├── requirements.txt           # 依存パッケージ
├── .env.example              # 環境変数テンプレート
├── .env                      # 環境変数（作成が必要）
├── credentials.json          # Google認証情報（作成が必要）
└── README.md                 # このファイル
```

## ライセンス

このプロジェクトは教育目的で作成されています。

## サポート

問題が発生した場合は、Issueを作成してください。
