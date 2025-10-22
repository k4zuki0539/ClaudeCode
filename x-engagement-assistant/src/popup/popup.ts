/**
 * ポップアップUI
 * 設定と統計を表示
 */

import { StorageManager } from '../lib/storage';
import { UserSettings, Statistics } from '../types';

const storage = new StorageManager();

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
});

/**
 * ポップアップを初期化
 */
async function initializePopup(): Promise<void> {
  try {
    // 統計を読み込んで表示
    await loadStatistics();

    // 設定を読み込んで表示
    await loadSettings();

    // イベントリスナーを設定
    setupEventListeners();

  } catch (error) {
    console.error('初期化エラー:', error);
    showError('初期化に失敗しました');
  }
}

/**
 * 統計を読み込み
 */
async function loadStatistics(): Promise<void> {
  const stats = await storage.getStatistics();

  // 統計を表示
  setElementText('totalAnalyzed', stats.totalAnalyzed.toString());
  setElementText('totalLiked', stats.totalLiked.toString());
  setElementText('averageScore', `${stats.averageScore}点`);

  // ジャンル分布を表示
  displayGenreDistribution(stats);
}

/**
 * 設定を読み込み
 */
async function loadSettings(): Promise<void> {
  const settings = await storage.getSettings();

  // 設定フォームに値をセット
  setInputValue('targetGenres', settings.targetGenres.join(', '));
  setInputValue('keywords', settings.keywords.join(', '));
  setInputValue('excludeKeywords', settings.excludeKeywords.join(', '));
  setInputValue('minScore', settings.minScore.toString());
  setInputValue('minFollowers', settings.minFollowers.toString());
}

/**
 * ジャンル分布を表示
 */
function displayGenreDistribution(stats: Statistics): void {
  const container = document.getElementById('genreDistribution');
  if (!container) return;

  container.innerHTML = '';

  const entries = Object.entries(stats.genreDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (entries.length === 0) {
    container.innerHTML = '<p class="text-gray">データがありません</p>';
    return;
  }

  entries.forEach(([genre, count]) => {
    const item = document.createElement('div');
    item.className = 'genre-item';
    item.innerHTML = `
      <span class="genre-name">${genre}</span>
      <span class="genre-count">${count}件</span>
    `;
    container.appendChild(item);
  });
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  // タブ切り替え
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchTab((button as HTMLElement).dataset.tab || 'stats');
    });
  });

  // 設定保存ボタン
  const saveButton = document.getElementById('saveSettings');
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }

  // データクリアボタン
  const clearButton = document.getElementById('clearData');
  if (clearButton) {
    clearButton.addEventListener('click', clearData);
  }

  // 更新ボタン
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      loadStatistics();
      showSuccess('統計を更新しました');
    });
  }
}

/**
 * タブを切り替え
 */
function switchTab(tabName: string): void {
  // 全てのタブコンテンツを非表示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // 全てのタブボタンを非アクティブ
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });

  // 選択されたタブを表示
  const selectedContent = document.getElementById(`${tabName}Tab`);
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);

  if (selectedContent) selectedContent.classList.add('active');
  if (selectedButton) selectedButton.classList.add('active');
}

/**
 * 設定を保存
 */
async function saveSettings(): Promise<void> {
  try {
    const settings: UserSettings = {
      targetGenres: getInputValue('targetGenres').split(',').map(s => s.trim()).filter(Boolean),
      keywords: getInputValue('keywords').split(',').map(s => s.trim()).filter(Boolean),
      excludeKeywords: getInputValue('excludeKeywords').split(',').map(s => s.trim()).filter(Boolean),
      minScore: parseInt(getInputValue('minScore')) || 70,
      minFollowers: parseInt(getInputValue('minFollowers')) || 50,
      language: 'ja',
      aiProvider: 'local'
    };

    await storage.saveSettings(settings);
    showSuccess('設定を保存しました');

    // ページをリロードして設定を反映
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });

  } catch (error) {
    console.error('設定保存エラー:', error);
    showError('設定の保存に失敗しました');
  }
}

/**
 * データをクリア
 */
async function clearData(): Promise<void> {
  if (!confirm('全てのデータをクリアしますか？この操作は取り消せません。')) {
    return;
  }

  try {
    await storage.clearAll();
    showSuccess('データをクリアしました');

    // 統計を再読み込み
    setTimeout(() => {
      loadStatistics();
      loadSettings();
    }, 500);

  } catch (error) {
    console.error('データクリアエラー:', error);
    showError('データのクリアに失敗しました');
  }
}

/**
 * ユーティリティ関数
 */
function setElementText(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function setInputValue(id: string, value: string): void {
  const input = document.getElementById(id) as HTMLInputElement;
  if (input) input.value = value;
}

function getInputValue(id: string): string {
  const input = document.getElementById(id) as HTMLInputElement;
  return input?.value || '';
}

function showSuccess(message: string): void {
  showMessage(message, 'success');
}

function showError(message: string): void {
  showMessage(message, 'error');
}

function showMessage(message: string, type: 'success' | 'error'): void {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}
