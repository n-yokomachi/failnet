# やらかし共有プラットフォーム - 概要設計書

## 1. システム概要

### 1.1 プロダクト名
**FailShare（フェイルシェア）**

### 1.2 目的・ミッション
- 組織内のやらかし体験を匿名で安全に共有できるプラットフォーム
- やらかしを恥ではなく組織の学びに変換
- 事業部間・職種間の情報共有促進と心理的安全性の向上

### 1.3 解決する課題
- 事業部間、エンジニア間での情報共有不足
- やらかしによる孤独感・孤立感
- 「自分だけがこんなミスをしている」という思い込み
- 他部署の業務実態が見えない問題

---

## 2. システム構成

### 2.1 全体アーキテクチャ
```
[フロントエンド] → [API Gateway] → [Lambda Functions] → [DynamoDB]
      ↓                                    ↓
[Slack連携]                        [Amazon Bedrock]
                                   (AI機能・エージェント)
```

### 2.2 技術スタック

#### フロントエンド
- **Next.js 15.4** (2025年7月最新版)
  - React 19 (Stable)
  - Turbopack 100% integration test compatibility
  - Streaming metadata サポート
- **TypeScript**
- **Tailwind CSS v4.1** (2025年4月最新版)
  - Text shadow utilities
  - Mask support
  - パフォーマンス向上

#### バックエンド（サーバーレス）
- **AWS Lambda**
- **API Gateway** 
- **DynamoDB**
- **Amazon Bedrock**
  - Claude 3.7 Sonnet (2025年8月最新版)
    - Hybrid reasoning model
    - Extended thinking capabilities
    - Frontier AI safety features

#### インフラ・デプロイ
- **AWS Amplify Gen 2** (2025年フルスタック TypeScript対応)
  - TypeScript-first フルスタック開発
  - AWS CDK built-in
  - Per-developer cloud sandboxes
  - Zero-config fullstack branches
- **GitHub Actions**

#### 外部連携
- **Slack API**

---

## 3. 機能設計

### 3.1 MVP機能（優先度：High）

#### 3.1.1 投稿機能

**データ構造:**
投稿には一意のID、投稿内容、AI自動分類されるカテゴリ、タイムスタンプ、リアクション数、匿名設定（固定）、AI分析結果が含まれる。

**カテゴリ分類:**
- 技術系
- コミュニケーション系
- 作業系  
- 判断系
- その他

**機能詳細:**
- 匿名での体験投稿
- AI自動カテゴリ分類
- リアルタイム投稿・表示
- センシティブ情報検出

#### 3.1.2 閲覧機能

**リアクション種類:**
- 😅 あるある！
- 🙏 助かった  
- 😰 ヒヤッとした
- 💡 なるほど
- 🤝 お疲れ様

**機能詳細:**
- タイムライン形式での投稿表示
- 多様なリアクション機能
- リアルタイム更新

#### 3.1.3 Slack連携機能
- 各投稿への直リンク生成
- 投稿共有用テンプレートの自動生成
- ワンクリックでSlackに投稿内容をコピー

### 3.2 拡張機能（優先度：Medium）

#### 3.2.1 AI機能強化
- **コンテキスト保持型センシティブ情報検出**
  - 過去の検出パターンを学習・記憶
  - 組織固有の機密情報パターンの自動学習
  - 投稿前アラート機能の精度向上
- **類似やらかし推薦**
  - 類似性判定による関連投稿の推薦
  - 過去の投稿からの学習型推薦
- **日次分析レポート**
  - 組織のやらかし傾向分析

#### 3.2.2 管理機能
- 投稿の統計情報表示
- カテゴリ別集計
- 反応数ランキング

---

## 4. データベース設計

### 4.1 DynamoDBテーブル構成

#### Posts テーブル
```
PK: POST#{postId}
SK: TIMESTAMP#{timestamp}

Attributes:
- postId (String)
- content (String)
- category (String)
- timestamp (Number)
- reactions (Map)
- aiAnalysis (Map) // AI分析結果
- sensitiveFlags (List) // 検出された機密情報フラグ
```

#### Reactions テーブル
```
PK: POST#{postId}
SK: REACTION#{reactionType}

Attributes:
- postId (String)
- reactionType (String)
- count (Number)
```

#### AIMemory テーブル（新規：AgentCore Memory用）
```
PK: MEMORY#{sessionId}
SK: CONTEXT#{timestamp}

Attributes:
- sessionId (String)
- contextType (String) // "sensitive_patterns", "category_patterns"
- memoryData (Map)
- ttl (Number) // 自動削除用
```

---

## 5. API設計

### 5.1 RESTful API エンドポイント

```
POST   /api/posts                 # 投稿作成
GET    /api/posts                 # 投稿一覧取得
GET    /api/posts/{id}            # 投稿詳細取得
PUT    /api/posts/{id}/reactions  # リアクション追加
GET    /api/categories            # カテゴリ一覧取得
POST   /api/ai/analyze            # AI分析実行
POST   /api/ai/categorize         # AgentCore分類実行
GET    /api/slack/template/{id}   # Slack投稿テンプレート生成
```

### 5.2 リクエスト/レスポンス例

#### 投稿作成API
リクエスト例:
POST /api/posts
{
  "content": "今日、本番環境でDBのテーブルを間違って削除してしまいました..."
}

レスポンス例:
{
  "postId": "post_123",
  "content": "今日、本番環境でDBの...",
  "category": "技術系",
  "timestamp": 1692123456789,
  "reactions": {},
  "aiAnalysis": {
    "sensitiveInfoDetected": false,
    "confidenceScore": 0.95,
    "modelUsed": "claude-3.7-sonnet",
    "processingTime": 150
  }
}

---

## 6. AI機能詳細設計

### 6.1 Amazon Bedrock構成

#### 使用モデル
- **Claude 3.7 Sonnet**: メインのAI処理
- カテゴリ分類、センシティブ情報検出、コンテンツ分析

#### AI処理フロー
1. 投稿内容をAmazon Bedrockに送信
2. Claude 3.7 Sonnetでセンシティブ情報検出実行
3. Claude 3.7 Sonnetでカテゴリ分類実行
4. 問題がある場合はアラート表示
5. 結果をDynamoDBに保存 + フロントエンドに返却

#### 主な機能
- **カテゴリ分類**: やらかし体験を適切なカテゴリに自動分類
- **センシティブ情報検出**: 個人情報や機密情報の自動検出とアラート
- **類似投稿推薦**: 過去の投稿から類似体験を推薦

---

