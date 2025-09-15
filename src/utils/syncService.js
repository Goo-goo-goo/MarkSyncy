// 同步服务 - 处理自动同步功能

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
    this.messageQueue = [];
    this.isShowingMessage = false;
  }

  // 添加同步状态回调
  addSyncCallback(callback) {
    this.syncCallbacks.push(callback);
  }

  // 移除同步状态回调
  removeSyncCallback(callback) {
    this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
  }

  // 通知同步状态变化
  notifySyncStatus(status, message) {
    this.syncCallbacks.forEach(callback => callback(status, message));
  }

  // 检查是否启用了自动同步
  async isAutoSyncEnabled() {
    try {
      const result = await chrome.storage.local.get(['autoSyncEnabled']);
      return result.autoSyncEnabled || false;
    } catch (error) {
      console.error('检查自动同步设置失败:', error);
      return false;
    }
  }

  // 获取同步配置
  async getSyncConfig() {
    try {
      const result = await chrome.storage.local.get(['giteeSyncToken', 'autoSyncEnabled']);
      return {
        token: result.giteeSyncToken || '',
        enabled: result.autoSyncEnabled || false
      };
    } catch (error) {
      console.error('获取同步配置失败:', error);
      return { token: '', enabled: false };
    }
  }

  // 显示同步状态消息
  showSyncMessage(message, type = 'info') {
    // 添加到消息队列
    this.messageQueue.push({ message, type });
    
    // 如果没有正在显示的消息，立即显示
    if (!this.isShowingMessage) {
      this.processMessageQueue();
    }
  }

  // 处理消息队列
  processMessageQueue() {
    if (this.messageQueue.length === 0) {
      this.isShowingMessage = false;
      return;
    }

    this.isShowingMessage = true;
    const { message, type } = this.messageQueue.shift();

    // 移除之前的消息
    const existingContainers = document.querySelectorAll('.sync-message-container');
    existingContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.className = 'sync-message-container fixed top-4 right-4 z-50 space-y-2';
    
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `sync-message flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
      type === 'success' ? 'bg-green-50/90 dark:bg-green-900/80 border-green-200/50 dark:border-green-700/50 text-green-800 dark:text-green-200' :
      type === 'error' ? 'bg-red-50/90 dark:bg-red-900/80 border-red-200/50 dark:border-red-700/50 text-red-800 dark:text-red-200' :
      type === 'warning' ? 'bg-yellow-50/90 dark:bg-yellow-900/80 border-yellow-200/50 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200' :
      'bg-blue-50/90 dark:bg-blue-900/80 border-blue-200/50 dark:border-blue-700/50 text-blue-800 dark:text-blue-200'
    }`;

    // 添加图标
    const iconEl = document.createElement('div');
    iconEl.className = `flex-shrink-0 w-5 h-5 ${
      type === 'success' ? 'text-green-500' :
      type === 'error' ? 'text-red-500' :
      type === 'warning' ? 'text-yellow-500' :
      'text-blue-500'
    }`;
    
    // SVG图标
    const iconSvg = this.getIconSvg(type);
    iconEl.innerHTML = iconSvg;
    
    // 添加消息文本
    const textEl = document.createElement('div');
    textEl.className = 'text-sm font-medium';
    textEl.textContent = message;
    
    // 添加进度条
    const progressEl = document.createElement('div');
    progressEl.className = 'absolute bottom-0 left-0 h-0.5 bg-current opacity-20 rounded-b-lg';
    progressEl.style.animation = 'progress-shrink 2.5s linear forwards';
    
    // 组装消息
    messageEl.appendChild(iconEl);
    messageEl.appendChild(textEl);
    messageEl.appendChild(progressEl);
    messageEl.style.position = 'relative';
    messageEl.style.overflow = 'hidden';
    
    messageContainer.appendChild(messageEl);
    document.body.appendChild(messageContainer);
    
    // 2.5秒后自动移除，然后处理下一个消息
    setTimeout(() => {
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(100%) scale(0.95)';
      setTimeout(() => {
        if (messageContainer.parentNode) {
          messageContainer.parentNode.removeChild(messageContainer);
        }
        // 处理队列中的下一个消息
        setTimeout(() => {
          this.processMessageQueue();
        }, 200);
      }, 300);
    }, 2500);
  }

  // 获取图标SVG
  getIconSvg(type) {
    const icons = {
      success: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>`,
      error: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
      </svg>`,
      warning: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>`,
      info: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>`
    };
    return icons[type] || icons.info;
  }

  // 自动同步到云端
  async autoSyncToCloud(bookmarks, groups) {
    if (this.isSyncing) {
      console.log('同步正在进行中，跳过');
      return false;
    }

    const config = await this.getSyncConfig();
    if (!config.enabled || !config.token) {
      console.log('自动同步未启用或未配置Token');
      return false;
    }

    this.isSyncing = true;
    this.notifySyncStatus('syncing', '正在自动同步到云端...');
    this.showSyncMessage('正在自动同步到云端...', 'info');

    try {
      // 调用同步到云端的逻辑
      const success = await this.syncToCloudImpl(config.token, bookmarks, groups);
      
      if (success) {
        this.notifySyncStatus('success', '自动同步完成');
        this.showSyncMessage('自动同步完成', 'success');
        
        // 保存同步时间
        await chrome.storage.local.set({
          lastSyncTime: new Date().toISOString()
        });
      } else {
        this.notifySyncStatus('error', '自动同步失败');
        this.showSyncMessage('自动同步失败', 'error');
      }
      
      return success;
    } catch (error) {
      console.error('自动同步失败:', error);
      this.notifySyncStatus('error', '自动同步失败');
      this.showSyncMessage('自动同步失败', 'error');
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // 自动从云端同步
  async autoSyncFromCloud(skipReload = false) {
    if (this.isSyncing) {
      console.log('同步正在进行中，跳过');
      return false;
    }

    const config = await this.getSyncConfig();
    if (!config.enabled || !config.token) {
      console.log('自动同步未启用或未配置Token');
      return false;
    }

    // 检查上次同步时间，避免频繁同步
    const lastSyncResult = await chrome.storage.local.get(['lastSyncTime']);
    if (lastSyncResult.lastSyncTime) {
      const lastSyncTime = new Date(lastSyncResult.lastSyncTime);
      const now = new Date();
      const timeDiff = now - lastSyncTime; // 毫秒
      
      // 如果距离上次同步不到1分钟，跳过同步
      if (timeDiff < 1 * 60 * 1000) {
        console.log('距离上次同步时间太短，跳过自动同步');
        return false;
      }
    }

    this.isSyncing = true;
    this.notifySyncStatus('syncing', '正在从云端同步...');
    this.showSyncMessage('正在从云端同步...', 'info');

    try {
      // 调用从云端同步的逻辑
      const success = await this.syncFromCloudImpl(config.token);
      
      if (success) {
        this.notifySyncStatus('success', '从云端同步完成');
        this.showSyncMessage('从云端同步完成', 'success');
        
        // 保存同步时间
        await chrome.storage.local.set({
          lastSyncTime: new Date().toISOString()
        });
        
        // 只有在需要时才刷新页面
        if (!skipReload) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        this.notifySyncStatus('error', '从云端同步失败');
        this.showSyncMessage('从云端同步失败', 'error');
      }
      
      return success;
    } catch (error) {
      console.error('从云端同步失败:', error);
      this.notifySyncStatus('error', '从云端同步失败');
      this.showSyncMessage('从云端同步失败', 'error');
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // 同步到云端实现（从SyncSettingsModal复制并修改）
  async syncToCloudImpl(token, bookmarks, groups) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    const FILE_PATH = 'bookmarks.json';

    try {
      // 1. 验证 Token 并获取用户信息
      const user = await this.validateTokenAndGetUser(token);
      
      // 2. 检查仓库是否存在
      const repoCheck = await this.checkRepositoryExists(token, user.login);
      
      if (!repoCheck.exists) {
        await this.createRepository(token);
      }

      // 3. 准备书签数据
      const bookmarksData = {
        bookmarks: bookmarks,
        groups: groups,
        syncTime: new Date().toISOString(),
        version: '1.0',
      };

      // 4. 检查文件是否存在
      const fileCheck = await this.getFileSHA(token, user.login);
      
      // 5. 上传文件
      const content = this.safeBase64Encode(JSON.stringify(bookmarksData, null, 2));
      await this.uploadFile(token, user.login, content, fileCheck.sha);

      return true;
    } catch (error) {
      console.error('同步到云端失败:', error);
      return false;
    }
  }

  // 从云端同步实现（从SyncSettingsModal复制并修改）
  async syncFromCloudImpl(token) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    const FILE_PATH = 'bookmarks.json';

    try {
      // 1. 验证 Token 并获取用户信息
      const user = await this.validateTokenAndGetUser(token);
      
      // 2. 检查仓库是否存在
      const repoCheck = await this.checkRepositoryExists(token, user.login);
      
      if (!repoCheck.exists) {
        return false;
      }

      // 3. 下载文件
      const fileDownload = await this.downloadFile(token, user.login);
      
      if (!fileDownload.exists) {
        return false;
      }

      // 4. 解析数据
      const content = this.safeBase64Decode(fileDownload.content);
      const data = JSON.parse(content);

      // 5. 更新本地数据
      await chrome.storage.local.set({
        bookmarks: data.bookmarks || [],
        groups: data.groups || [],
      });

      // 6. 触发数据更新事件，通知页面更新
      if (window.updateBookmarksAndGroups) {
        window.updateBookmarksAndGroups(data.bookmarks || [], data.groups || []);
      }

      return true;
    } catch (error) {
      console.error('从云端同步失败:', error);
      return false;
    }
  }

  // 以下方法从SyncSettingsModal复制
  async validateTokenAndGetUser(token) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    
    try {
      const response = await fetch(`${GITEE_API_BASE}/user`, {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token 无效或已过期');
        }
        throw new Error(`Token 验证失败 (${response.status})`);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      throw new Error(`Token 验证失败: ${error.message}`);
    }
  }

  async checkRepositoryExists(token, username) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    
    try {
      const response = await fetch(`${GITEE_API_BASE}/repos/${username}/${REPO_NAME}`, {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      if (response.status === 404) {
        return { exists: false };
      } else if (!response.ok) {
        throw new Error(`检查仓库失败 (${response.status})`);
      }

      return { exists: true };
    } catch (error) {
      throw error;
    }
  }

  async createRepository(token) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    
    try {
      const response = await fetch(`${GITEE_API_BASE}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: REPO_NAME,
          description: 'MarkSyncy 书签同步仓库',
          private: false,
          auto_init: true,
        }),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        try {
          const error = JSON.parse(responseText);
          if (error.message && error.message.includes('已存在同地址仓库')) {
            return { exists: true };
          }
          throw new Error(error.message || `创建仓库失败 (${response.status})`);
        } catch (parseError) {
          throw new Error(`创建仓库失败: ${responseText.substring(0, 100)}`);
        }
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getFileSHA(token, username) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    const FILE_PATH = 'bookmarks.json';
    
    try {
      const url = `${GITEE_API_BASE}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      if (response.status === 404) {
        return { exists: false, sha: null };
      } else if (!response.ok) {
        throw new Error(`检查文件失败 (${response.status})`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length === 0) {
        return { exists: false, sha: null };
      }
      
      return { exists: true, sha: data.sha };
    } catch (error) {
      throw error;
    }
  }

  async uploadFile(token, username, content, sha = null) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    const FILE_PATH = 'bookmarks.json';
    
    try {
      const requestBody = {
        content: content,
        message: `Auto sync bookmarks - ${new Date().toISOString()}`,
        branch: 'master',
      };

      const url = `${GITEE_API_BASE}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`;

      let method;
      if (sha && sha.trim() !== '') {
        requestBody.sha = sha;
        method = 'PUT';
      } else {
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.message || `上传失败 (${response.status})`);
        } catch (parseError) {
          throw new Error(`上传失败: ${responseText.substring(0, 100)}`);
        }
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async downloadFile(token, username) {
    const GITEE_API_BASE = 'https://gitee.com/api/v5';
    const REPO_NAME = 'marksyncy-bookmarks';
    const FILE_PATH = 'bookmarks.json';
    
    try {
      const response = await fetch(`${GITEE_API_BASE}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`, {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      if (response.status === 404) {
        return { exists: false };
      } else if (!response.ok) {
        throw new Error(`下载失败 (${response.status})`);
      }

      const data = await response.json();
      return { exists: true, content: data.content };
    } catch (error) {
      throw error;
    }
  }

  safeBase64Encode(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
      throw new Error('内容编码失败');
    }
  }

  safeBase64Decode(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (error) {
      throw new Error('内容解码失败');
    }
  }
}

// 创建全局同步服务实例
const syncService = new SyncService();

// 导出同步服务
window.syncService = syncService;

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateX(0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes fade-out {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
  
  @keyframes progress-shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
  
  @keyframes message-appear {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .sync-message {
    max-width: 320px;
    word-wrap: break-word;
    animation: slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .sync-message-container {
    animation: message-appear 0.3s ease-out;
  }
  
  .sync-message:hover {
    transform: scale(1.02);
    box-shadow: 
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05),
      0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  /* 深色模式优化 */
  @media (prefers-color-scheme: dark) {
    .sync-message {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  }
  
  /* 响应式设计 */
  @media (max-width: 640px) {
    .sync-message-container {
      right: 1rem;
      left: 1rem;
    }
    
    .sync-message {
      max-width: none;
    }
  }
`;

if (document.head) {
  document.head.appendChild(style);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(style);
  });
}