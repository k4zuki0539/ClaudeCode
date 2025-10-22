import { Tweet } from '../types';

/**
 * X (Twitter)のDOMから投稿情報を抽出するクラス
 */
export class TweetExtractor {
  /**
   * 投稿要素かどうかを判定
   */
  isTweetElement(element: Element): boolean {
    // X (Twitter)の投稿要素のセレクタ
    // 注: XのDOM構造は頻繁に変更されるため、複数のパターンに対応
    return (
      element.getAttribute('data-testid') === 'tweet' ||
      element.querySelector('[data-testid="tweet"]') !== null ||
      element.classList.contains('tweet') ||
      element.hasAttribute('data-tweet-id')
    );
  }

  /**
   * 投稿要素からTweetオブジェクトを抽出
   */
  extractTweet(element: HTMLElement): Tweet | null {
    try {
      const id = this.extractId(element);
      const author = this.extractAuthor(element);
      const authorHandle = this.extractAuthorHandle(element);
      const content = this.extractContent(element);
      const timestamp = this.extractTimestamp(element);
      const likes = this.extractLikes(element);
      const retweets = this.extractRetweets(element);
      const replies = this.extractReplies(element);

      if (!id || !content) {
        return null;
      }

      return {
        id,
        author: author || 'Unknown',
        authorHandle: authorHandle || '',
        content,
        timestamp: timestamp || new Date(),
        likes,
        retweets,
        replies,
        element
      };
    } catch (error) {
      console.error('Tweet extraction failed:', error);
      return null;
    }
  }

  /**
   * 投稿IDを抽出
   */
  private extractId(element: HTMLElement): string | null {
    // data-tweet-id属性から取得
    const tweetId = element.getAttribute('data-tweet-id');
    if (tweetId) return tweetId;

    // URLから抽出
    const links = element.querySelectorAll('a[href*="/status/"]');
    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/status\/(\d+)/);
        if (match) return match[1];
      }
    }

    // フォールバック: 要素のユニークなIDを生成
    return `tweet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 著者名を抽出
   */
  private extractAuthor(element: HTMLElement): string | null {
    // 複数のセレクタパターンを試す
    const selectors = [
      '[data-testid="User-Name"] span',
      '.tweet-author',
      '[dir="ltr"] span[dir="ltr"]'
    ];

    for (const selector of selectors) {
      const authorElement = element.querySelector(selector);
      if (authorElement?.textContent) {
        return authorElement.textContent.trim();
      }
    }

    return null;
  }

  /**
   * ユーザーハンドルを抽出
   */
  private extractAuthorHandle(element: HTMLElement): string | null {
    const links = element.querySelectorAll('a[href^="/"]');
    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (href && href.match(/^\/[a-zA-Z0-9_]+$/)) {
        return href.substring(1);
      }
    }
    return null;
  }

  /**
   * 投稿内容を抽出
   */
  private extractContent(element: HTMLElement): string | null {
    const selectors = [
      '[data-testid="tweetText"]',
      '[lang]',
      '.tweet-text'
    ];

    for (const selector of selectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement?.textContent) {
        return contentElement.textContent.trim();
      }
    }

    return null;
  }

  /**
   * タイムスタンプを抽出
   */
  private extractTimestamp(element: HTMLElement): Date | null {
    const timeElement = element.querySelector('time');
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime');
      if (datetime) {
        return new Date(datetime);
      }
    }
    return null;
  }

  /**
   * いいね数を抽出
   */
  private extractLikes(element: HTMLElement): number {
    return this.extractEngagementCount(element, 'like');
  }

  /**
   * リツイート数を抽出
   */
  private extractRetweets(element: HTMLElement): number {
    return this.extractEngagementCount(element, 'retweet');
  }

  /**
   * 返信数を抽出
   */
  private extractReplies(element: HTMLElement): number {
    return this.extractEngagementCount(element, 'reply');
  }

  /**
   * エンゲージメント数を抽出（汎用）
   */
  private extractEngagementCount(element: HTMLElement, type: 'like' | 'retweet' | 'reply'): number {
    const selectors: Record<string, string[]> = {
      like: ['[data-testid="like"]', '[aria-label*="いいね"]', '[aria-label*="Like"]'],
      retweet: ['[data-testid="retweet"]', '[aria-label*="リツイート"]', '[aria-label*="Retweet"]'],
      reply: ['[data-testid="reply"]', '[aria-label*="返信"]', '[aria-label*="Reply"]']
    };

    for (const selector of selectors[type]) {
      const engagementElement = element.querySelector(selector);
      if (engagementElement) {
        const ariaLabel = engagementElement.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/(\d+)/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
      }
    }

    return 0;
  }

  /**
   * いいねボタン要素を取得
   */
  getLikeButton(element: HTMLElement): HTMLElement | null {
    const selectors = [
      '[data-testid="like"]',
      '[aria-label*="いいね"]',
      '[aria-label*="Like"]'
    ];

    for (const selector of selectors) {
      const button = element.querySelector(selector) as HTMLElement;
      if (button) return button;
    }

    return null;
  }

  /**
   * いいね済みかどうかを判定
   */
  isLiked(element: HTMLElement): boolean {
    const likeButton = this.getLikeButton(element);
    if (!likeButton) return false;

    const ariaLabel = likeButton.getAttribute('aria-label');
    return ariaLabel?.includes('いいね済み') || ariaLabel?.includes('Unlike') || false;
  }
}
