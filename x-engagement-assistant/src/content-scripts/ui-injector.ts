import { AnalysisResult } from '../types';

/**
 * UIコンポーネントをX (Twitter)のDOMに注入するクラス
 */
export class UIInjector {
  private readonly INJECTED_CLASS = 'xea-injected';
  private readonly BADGE_CLASS = 'xea-score-badge';
  private readonly BUTTON_CLASS = 'xea-quick-action';

  /**
   * 既に注入済みかチェック
   */
  isInjected(element: HTMLElement): boolean {
    return element.classList.contains(this.INJECTED_CLASS);
  }

  /**
   * 注入済みマークを付ける
   */
  markAsInjected(element: HTMLElement): void {
    element.classList.add(this.INJECTED_CLASS);
  }

  /**
   * スコアバッジを追加
   */
  addScoreBadge(element: HTMLElement, analysis: AnalysisResult): void {
    // 既存のバッジを削除
    const existingBadge = element.querySelector(`.${this.BADGE_CLASS}`);
    if (existingBadge) {
      existingBadge.remove();
    }

    // スコアに応じた色を決定
    const color = this.getScoreColor(analysis.score);
    const stars = this.getStarRating(analysis.score);

    // バッジHTML
    const badge = document.createElement('div');
    badge.className = this.BADGE_CLASS;
    badge.innerHTML = `
      <div class="xea-badge-container" style="
        background: ${color};
        color: white;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin: 8px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <span class="xea-stars">${stars}</span>
        <span class="xea-score">${analysis.score}点</span>
        <span class="xea-genre" style="
          background: rgba(255,255,255,0.3);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
        ">${analysis.genre}</span>
      </div>
      <div class="xea-reason" style="
        font-size: 11px;
        color: #536471;
        margin-top: 4px;
        padding: 0 4px;
      ">${analysis.reason}</div>
    `;

    // 投稿の上部に挿入
    const insertPoint = this.findInsertionPoint(element);
    if (insertPoint) {
      insertPoint.insertAdjacentElement('afterbegin', badge);
    }
  }

  /**
   * クイックアクションボタンを追加
   */
  addQuickActionButton(element: HTMLElement, analysis: AnalysisResult, onLike: () => void): void {
    // 既存のボタンを削除
    const existingButton = element.querySelector(`.${this.BUTTON_CLASS}`);
    if (existingButton) {
      existingButton.remove();
    }

    // スコアが閾値以下なら表示しない
    if (analysis.score < 60) {
      return;
    }

    // ボタンHTML
    const button = document.createElement('button');
    button.className = this.BUTTON_CLASS;
    button.innerHTML = `
      <span style="margin-right: 4px;">⚡</span>
      <span>いいね</span>
    `;
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin: 8px 0;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
    `;

    // ホバーエフェクト
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
    });

    // クリックイベント
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // ボタンを一時的に無効化
      button.disabled = true;
      button.innerHTML = '<span>✓ 完了</span>';
      button.style.background = '#10b981';

      // いいねアクション実行
      onLike();

      // 3秒後に元に戻す
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<span style="margin-right: 4px;">⚡</span><span>いいね</span>';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 3000);
    });

    // 挿入
    const badge = element.querySelector(`.${this.BADGE_CLASS}`);
    if (badge) {
      badge.insertAdjacentElement('afterend', button);
    }
  }

  /**
   * スコアに応じた色を返す
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // 緑
    if (score >= 60) return '#3b82f6'; // 青
    if (score >= 40) return '#f59e0b'; // オレンジ
    return '#6b7280'; // グレー
  }

  /**
   * スコアに応じた星評価を返す
   */
  private getStarRating(score: number): string {
    if (score >= 90) return '⭐⭐⭐⭐⭐';
    if (score >= 75) return '⭐⭐⭐⭐';
    if (score >= 60) return '⭐⭐⭐';
    if (score >= 40) return '⭐⭐';
    return '⭐';
  }

  /**
   * 挿入位置を探す
   */
  private findInsertionPoint(element: HTMLElement): HTMLElement | null {
    // 投稿のコンテンツ部分を探す
    const contentSelectors = [
      '[data-testid="tweetText"]',
      '[lang]',
      '.tweet-text'
    ];

    for (const selector of contentSelectors) {
      const content = element.querySelector(selector);
      if (content && content.parentElement) {
        return content.parentElement as HTMLElement;
      }
    }

    return element;
  }

  /**
   * 全ての注入要素を削除
   */
  removeInjectedElements(element: HTMLElement): void {
    const badge = element.querySelector(`.${this.BADGE_CLASS}`);
    const button = element.querySelector(`.${this.BUTTON_CLASS}`);

    if (badge) badge.remove();
    if (button) button.remove();

    element.classList.remove(this.INJECTED_CLASS);
  }
}
