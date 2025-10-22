import { Tweet, AnalysisResult, UserSettings } from '../types';

/**
 * AI分析エンジン
 * フェーズ1では簡易的なルールベース分析を実装
 * 将来的にはLLM APIを統合可能
 */
export class AIAnalyzer {
  private settings: UserSettings;

  constructor(settings: UserSettings) {
    this.settings = settings;
  }

  /**
   * 投稿を分析してスコアリング
   */
  async analyze(tweet: Tweet): Promise<AnalysisResult> {
    const content = tweet.content.toLowerCase();

    // スパム判定
    const isSpam = this.detectSpam(content);
    if (isSpam) {
      return {
        score: 0,
        genre: 'スパム',
        keywords: [],
        relevance: 0,
        sentiment: 'negative',
        isSpam: true,
        reason: 'スパムと判定されました'
      };
    }

    // キーワードマッチング
    const matchedKeywords = this.extractKeywords(content);
    const relevance = this.calculateRelevance(content, matchedKeywords);

    // ジャンル分類
    const genre = this.classifyGenre(content, matchedKeywords);

    // センチメント分析
    const sentiment = this.analyzeSentiment(content);

    // 総合スコア計算
    const score = this.calculateScore(tweet, relevance, sentiment);

    // スコアの理由を生成
    const reason = this.generateReason(score, matchedKeywords, genre);

    return {
      score,
      genre,
      keywords: matchedKeywords,
      relevance,
      sentiment,
      isSpam: false,
      reason
    };
  }

  /**
   * スパム検知
   */
  private detectSpam(content: string): boolean {
    const spamPatterns = [
      ...this.settings.excludeKeywords.map(k => k.toLowerCase()),
      '絶対稼げる',
      '100%',
      '今すぐ',
      '無料で稼ぐ',
      '簡単に稼げる',
      'DM下さい',
      'ライン追加'
    ];

    return spamPatterns.some(pattern => content.includes(pattern));
  }

  /**
   * キーワード抽出
   */
  private extractKeywords(content: string): string[] {
    const matched: string[] = [];

    for (const keyword of this.settings.keywords) {
      if (content.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    }

    return matched;
  }

  /**
   * 関連性計算
   */
  private calculateRelevance(content: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    // キーワードマッチ率を計算
    const matchRatio = keywords.length / this.settings.keywords.length;

    // コンテンツの質も考慮（長さ、構造など）
    const qualityScore = this.assessQuality(content);

    return Math.min(1, (matchRatio * 0.7 + qualityScore * 0.3));
  }

  /**
   * コンテンツの質を評価
   */
  private assessQuality(content: string): number {
    let score = 0.5; // ベーススコア

    // 適度な長さ（50-280文字）
    const length = content.length;
    if (length >= 50 && length <= 280) {
      score += 0.2;
    } else if (length < 20) {
      score -= 0.3;
    }

    // URLが含まれている（情報源あり）
    if (content.match(/https?:\/\//)) {
      score += 0.1;
    }

    // ハッシュタグの数（1-3個が適切）
    const hashtags = (content.match(/#/g) || []).length;
    if (hashtags >= 1 && hashtags <= 3) {
      score += 0.1;
    } else if (hashtags > 5) {
      score -= 0.2;
    }

    // 絵文字の過度な使用
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    if (emojiCount > 10) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * ジャンル分類
   */
  private classifyGenre(content: string, keywords: string[]): string {
    const genreKeywords: Record<string, string[]> = {
      'AI開発': ['ai', 'claude', 'chatgpt', 'llm', '機械学習', 'ml', 'deep learning'],
      'プログラミング': ['プログラミング', 'コーディング', 'javascript', 'python', 'typescript', '開発'],
      'テクノロジー': ['テクノロジー', 'tech', '技術', 'スタートアップ', 'saas'],
      'マーケティング': ['マーケティング', 'seo', 'sns', '集客', 'ブランディング'],
      'ビジネス': ['ビジネス', '起業', '経営', '売上', 'マネタイズ']
    };

    let bestGenre = 'その他';
    let maxMatches = 0;

    for (const [genre, genreKeys] of Object.entries(genreKeywords)) {
      const matches = genreKeys.filter(key => content.includes(key.toLowerCase())).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestGenre = genre;
      }
    }

    return bestGenre;
  }

  /**
   * センチメント分析（簡易版）
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['良い', '素晴らしい', '便利', '最高', '成功', '改善', '効果的', '優れた'];
    const negativeWords = ['悪い', '問題', 'バグ', 'エラー', '失敗', '困難', '難しい'];

    const positiveCount = positiveWords.filter(w => content.includes(w)).length;
    const negativeCount = negativeWords.filter(w => content.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 総合スコア計算
   */
  private calculateScore(tweet: Tweet, relevance: number, sentiment: 'positive' | 'neutral' | 'negative'): number {
    let score = relevance * 100; // ベーススコア（0-100）

    // センチメントボーナス
    if (sentiment === 'positive') {
      score += 10;
    } else if (sentiment === 'negative') {
      score -= 10;
    }

    // エンゲージメント評価
    const engagementScore = Math.min(20, (tweet.likes + tweet.retweets * 2) / 10);
    score += engagementScore;

    // 最終スコアを0-100に正規化
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * スコアの理由を生成
   */
  private generateReason(score: number, keywords: string[], genre: string): string {
    if (score >= 80) {
      return `高関連性: ${keywords.join(', ')} に関する質の高い投稿`;
    } else if (score >= 60) {
      return `関連性あり: ${genre} ジャンルの投稿`;
    } else if (score >= 40) {
      return `やや関連: 一部キーワードがマッチ`;
    } else {
      return `低関連性: ターゲットジャンルと異なる`;
    }
  }

  /**
   * 設定を更新
   */
  updateSettings(settings: UserSettings): void {
    this.settings = settings;
  }
}
