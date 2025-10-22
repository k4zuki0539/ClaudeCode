import { TweetExtractor } from './tweet-extractor';
import { UIInjector } from './ui-injector';
import { AIAnalyzer } from '../lib/analyzer';
import { StorageManager } from '../lib/storage';
import { Tweet, AnalysisResult } from '../types';

/**
 * メインのコンテンツスクリプト
 * X (Twitter)のページでDOM監視と分析を実行
 */
class XEngagementAssistant {
  private tweetExtractor: TweetExtractor;
  private uiInjector: UIInjector;
  private analyzer: AIAnalyzer | null = null;
  private storage: StorageManager;
  private observer: MutationObserver | null = null;
  private processedTweets: Set<string> = new Set();

  constructor() {
    this.tweetExtractor = new TweetExtractor();
    this.uiInjector = new UIInjector();
    this.storage = new StorageManager();

    this.initialize();
  }

  /**
   * 初期化
   */
  private async initialize(): Promise<void> {
    console.log('🤖 X Engagement Assistant 起動中...');

    try {
      // 設定を読み込み
      const settings = await this.storage.getSettings();
      this.analyzer = new AIAnalyzer(settings);

      // DOM監視を開始
      this.startObserving();

      // 既存の投稿を処理
      this.processExistingTweets();

      console.log('✅ X Engagement Assistant 準備完了');
    } catch (error) {
      console.error('❌ 初期化エラー:', error);
    }
  }

  /**
   * DOM監視を開始
   */
  private startObserving(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNode(node as Element);
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('👀 DOM監視を開始しました');
  }

  /**
   * 既存の投稿を処理
   */
  private processExistingTweets(): void {
    const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
    console.log(`📊 ${tweetElements.length}件の既存投稿を発見`);

    tweetElements.forEach((element) => {
      this.processNode(element);
    });
  }

  /**
   * ノードを処理
   */
  private async processNode(node: Element): Promise<void> {
    // 投稿要素かチェック
    if (!this.tweetExtractor.isTweetElement(node)) {
      return;
    }

    const element = node as HTMLElement;

    // 既に処理済みかチェック
    if (this.uiInjector.isInjected(element)) {
      return;
    }

    try {
      // 投稿データを抽出
      const tweet = this.tweetExtractor.extractTweet(element);
      if (!tweet) {
        return;
      }

      // 重複チェック
      if (this.processedTweets.has(tweet.id)) {
        return;
      }

      this.processedTweets.add(tweet.id);

      // キャッシュをチェック
      let analysis = await this.storage.getCachedAnalysis(tweet.id);

      // キャッシュになければ分析実行
      if (!analysis && this.analyzer) {
        analysis = await this.analyzer.analyze(tweet);

        // キャッシュに保存
        await this.storage.cacheAnalysis(tweet.id, analysis);

        // 統計を更新
        await this.updateStatistics(analysis);
      }

      if (!analysis) {
        return;
      }

      // UIを注入
      this.injectUI(element, tweet, analysis);

      // 注入済みマークを付ける
      this.uiInjector.markAsInjected(element);

    } catch (error) {
      console.error('投稿処理エラー:', error);
    }
  }

  /**
   * UIを注入
   */
  private injectUI(element: HTMLElement, tweet: Tweet, analysis: AnalysisResult): void {
    // スコアバッジを追加
    this.uiInjector.addScoreBadge(element, analysis);

    // クイックアクションボタンを追加
    this.uiInjector.addQuickActionButton(
      element,
      analysis,
      () => this.handleLike(element, tweet, analysis)
    );
  }

  /**
   * いいねアクションを処理
   */
  private async handleLike(element: HTMLElement, tweet: Tweet, analysis: AnalysisResult): Promise<void> {
    try {
      console.log(`👍 いいね実行: ${tweet.id}`);

      // 既にいいね済みかチェック
      if (this.tweetExtractor.isLiked(element)) {
        console.log('✓ 既にいいね済みです');
        return;
      }

      // いいねボタンを取得してクリック
      const likeButton = this.tweetExtractor.getLikeButton(element);
      if (likeButton) {
        likeButton.click();

        // アクション履歴を保存
        await this.storage.addHistory({
          id: `action-${Date.now()}`,
          tweetId: tweet.id,
          action: 'like',
          timestamp: new Date(),
          score: analysis.score,
          genre: analysis.genre
        });

        // 統計を更新
        const stats = await this.storage.getStatistics();
        await this.storage.updateStatistics({
          totalLiked: stats.totalLiked + 1
        });

        console.log('✅ いいね完了');
      } else {
        console.warn('⚠️ いいねボタンが見つかりません');
      }
    } catch (error) {
      console.error('❌ いいねエラー:', error);
    }
  }

  /**
   * 統計を更新
   */
  private async updateStatistics(analysis: AnalysisResult): Promise<void> {
    const stats = await this.storage.getStatistics();

    // ジャンル分布を更新
    const genreDistribution = { ...stats.genreDistribution };
    genreDistribution[analysis.genre] = (genreDistribution[analysis.genre] || 0) + 1;

    // 平均スコアを計算
    const totalAnalyzed = stats.totalAnalyzed + 1;
    const averageScore = (stats.averageScore * stats.totalAnalyzed + analysis.score) / totalAnalyzed;

    await this.storage.updateStatistics({
      totalAnalyzed,
      averageScore: Math.round(averageScore),
      genreDistribution
    });
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log('🛑 X Engagement Assistant 停止');
  }
}

// 拡張機能を起動
let assistant: XEngagementAssistant | null = null;

// ページ読み込み完了後に起動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    assistant = new XEngagementAssistant();
  });
} else {
  assistant = new XEngagementAssistant();
}

// ページ離脱時にクリーンアップ
window.addEventListener('beforeunload', () => {
  if (assistant) {
    assistant.destroy();
  }
});
