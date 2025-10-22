/**
 * バックグラウンドスクリプト
 * 拡張機能の初期化とメッセージハンドリング
 */

import { StorageManager } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../types';

const storage = new StorageManager();

// インストール時の初期化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('X Engagement Assistant インストール完了');

  if (details.reason === 'install') {
    // 初回インストール時にデフォルト設定を保存
    await storage.saveSettings(DEFAULT_SETTINGS);
    console.log('デフォルト設定を保存しました');

    // ウェルカムページを開く（オプション）
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('拡張機能が更新されました');
  }
});

// メッセージハンドリング
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('メッセージ受信:', message);

  // 非同期処理のためにPromiseを返す
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('メッセージ処理エラー:', error);
      sendResponse({ error: error.message });
    });

  // 非同期レスポンスを有効化
  return true;
});

/**
 * メッセージを処理
 */
async function handleMessage(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
  switch (message.type) {
    case 'getSettings':
      return await storage.getSettings();

    case 'saveSettings':
      await storage.saveSettings(message.data);
      return { success: true };

    case 'getStatistics':
      return await storage.getStatistics();

    case 'getHistory':
      return await storage.getHistory();

    case 'clearData':
      await storage.clearAll();
      await storage.saveSettings(DEFAULT_SETTINGS);
      return { success: true };

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// アイコンクリック時のアクション
chrome.action.onClicked.addListener((tab) => {
  console.log('拡張機能アイコンがクリックされました');
});

console.log('X Engagement Assistant バックグラウンドスクリプト起動');
