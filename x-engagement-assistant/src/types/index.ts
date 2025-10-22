// 投稿データの型定義
export interface Tweet {
  id: string;
  author: string;
  authorHandle: string;
  content: string;
  timestamp: Date;
  likes: number;
  retweets: number;
  replies: number;
  element?: HTMLElement;
}

// AI分析結果の型定義
export interface AnalysisResult {
  score: number;           // 0-100のスコア
  genre: string;           // ジャンル分類
  keywords: string[];      // 抽出されたキーワード
  relevance: number;       // 関連性スコア (0-1)
  sentiment: 'positive' | 'neutral' | 'negative';
  isSpam: boolean;         // スパム判定
  reason: string;          // スコアの理由
}

// ユーザー設定の型定義
export interface UserSettings {
  targetGenres: string[];           // 対象ジャンル
  keywords: string[];               // 関心キーワード
  excludeKeywords: string[];        // 除外キーワード
  minScore: number;                 // 最小スコア (0-100)
  minFollowers: number;             // 最小フォロワー数
  language: string;                 // 言語設定
  aiProvider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;                  // APIキー
}

// アクション履歴の型定義
export interface ActionHistory {
  id: string;
  tweetId: string;
  action: 'like' | 'retweet' | 'reply' | 'follow';
  timestamp: Date;
  score: number;
  genre: string;
}

// 統計データの型定義
export interface Statistics {
  totalAnalyzed: number;
  totalLiked: number;
  totalRetweeted: number;
  averageScore: number;
  genreDistribution: Record<string, number>;
  dailyActions: Record<string, number>;
  lastUpdated: Date;
}

// ストレージデータの型定義
export interface StorageData {
  settings: UserSettings;
  history: ActionHistory[];
  statistics: Statistics;
  cache: Record<string, AnalysisResult>;
}

// メッセージの型定義
export interface Message {
  type: 'analyze' | 'action' | 'getStats' | 'updateSettings';
  data?: any;
}

// デフォルト設定
export const DEFAULT_SETTINGS: UserSettings = {
  targetGenres: ['AI開発', 'テクノロジー', 'プログラミング'],
  keywords: ['AI', 'Claude', 'ChatGPT', 'LLM', '機械学習', '開発'],
  excludeKeywords: ['スパム', '詐欺', '怪しい', '稼げる'],
  minScore: 70,
  minFollowers: 50,
  language: 'ja',
  aiProvider: 'local'
};

export const DEFAULT_STATISTICS: Statistics = {
  totalAnalyzed: 0,
  totalLiked: 0,
  totalRetweeted: 0,
  averageScore: 0,
  genreDistribution: {},
  dailyActions: {},
  lastUpdated: new Date()
};
