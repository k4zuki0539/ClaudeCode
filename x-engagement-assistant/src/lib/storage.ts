import { StorageData, UserSettings, ActionHistory, Statistics, DEFAULT_SETTINGS, DEFAULT_STATISTICS, AnalysisResult } from '../types';

/**
 * Chrome Storage APIのラッパークラス
 * ローカルストレージでデータを管理
 */
export class StorageManager {
  private static readonly KEYS = {
    SETTINGS: 'settings',
    HISTORY: 'history',
    STATISTICS: 'statistics',
    CACHE: 'cache'
  };

  /**
   * 設定を取得
   */
  async getSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(StorageManager.KEYS.SETTINGS);
    return result[StorageManager.KEYS.SETTINGS] || DEFAULT_SETTINGS;
  }

  /**
   * 設定を保存
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    await chrome.storage.local.set({
      [StorageManager.KEYS.SETTINGS]: settings
    });
  }

  /**
   * アクション履歴を取得
   */
  async getHistory(): Promise<ActionHistory[]> {
    const result = await chrome.storage.local.get(StorageManager.KEYS.HISTORY);
    return result[StorageManager.KEYS.HISTORY] || [];
  }

  /**
   * アクション履歴を追加
   */
  async addHistory(action: ActionHistory): Promise<void> {
    const history = await this.getHistory();
    history.push(action);

    // 最新1000件のみ保持
    const trimmedHistory = history.slice(-1000);

    await chrome.storage.local.set({
      [StorageManager.KEYS.HISTORY]: trimmedHistory
    });
  }

  /**
   * 統計を取得
   */
  async getStatistics(): Promise<Statistics> {
    const result = await chrome.storage.local.get(StorageManager.KEYS.STATISTICS);
    return result[StorageManager.KEYS.STATISTICS] || DEFAULT_STATISTICS;
  }

  /**
   * 統計を更新
   */
  async updateStatistics(updates: Partial<Statistics>): Promise<void> {
    const stats = await this.getStatistics();
    const updatedStats = { ...stats, ...updates, lastUpdated: new Date() };

    await chrome.storage.local.set({
      [StorageManager.KEYS.STATISTICS]: updatedStats
    });
  }

  /**
   * キャッシュから分析結果を取得
   */
  async getCachedAnalysis(tweetId: string): Promise<AnalysisResult | null> {
    const result = await chrome.storage.local.get(StorageManager.KEYS.CACHE);
    const cache = result[StorageManager.KEYS.CACHE] || {};
    return cache[tweetId] || null;
  }

  /**
   * 分析結果をキャッシュに保存
   */
  async cacheAnalysis(tweetId: string, analysis: AnalysisResult): Promise<void> {
    const result = await chrome.storage.local.get(StorageManager.KEYS.CACHE);
    const cache = result[StorageManager.KEYS.CACHE] || {};

    cache[tweetId] = analysis;

    // キャッシュサイズを制限（最新500件）
    const entries = Object.entries(cache);
    if (entries.length > 500) {
      const trimmedCache = Object.fromEntries(entries.slice(-500));
      await chrome.storage.local.set({
        [StorageManager.KEYS.CACHE]: trimmedCache
      });
    } else {
      await chrome.storage.local.set({
        [StorageManager.KEYS.CACHE]: cache
      });
    }
  }

  /**
   * 全データをクリア
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  }
}
