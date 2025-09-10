import React, { useState } from 'react';
import { CloudIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon, SettingsIcon } from 'lucide-react';

const SyncSettingsModal = ({ isOpen, onClose, bookmarks, groups }) => {
  const [giteeToken, setGiteeToken] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Gitee API 配置
  const GITEE_API_BASE = 'https://gitee.com/api/v5';
  const REPO_NAME = 'marksyncy-bookmarks';
  const FILE_PATH = 'bookmarks.json';

  // 验证 Token 并获取用户信息
  const validateTokenAndGetUser = async (token) => {
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
      console.log('获取到的用户信息:', userData); // 调试信息
      return userData;
    } catch (error) {
      throw new Error(`Token 验证失败: ${error.message}`);
    }
  };

  // 检查仓库是否存在
  const checkRepositoryExists = async (token, username) => {
    try {
      console.log(`检查仓库: ${username}/${REPO_NAME}`);
      const response = await fetch(`${GITEE_API_BASE}/repos/${username}/${REPO_NAME}`, {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      if (response.status === 404) {
        console.log(`仓库 ${username}/${REPO_NAME} 不存在`);
        return { exists: false };
      } else if (!response.ok) {
        console.log(`检查仓库失败: ${response.status} - ${response.statusText}`);
        throw new Error(`检查仓库失败 (${response.status})`);
      }

      console.log(`仓库 ${username}/${REPO_NAME} 存在`);
      return { exists: true };
    } catch (error) {
      console.log(`检查仓库时出错:`, error);
      throw error;
    }
  };

  // 创建仓库
  const createRepository = async (token) => {
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
            return { exists: true }; // 仓库已存在，这不是错误
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
  };

  // 检查文件是否存在并获取 SHA
  const getFileSHA = async (token, username) => {
    try {
      const url = `${GITEE_API_BASE}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`;
      console.log(`检查文件SHA: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      console.log(`文件检查响应状态: ${response.status}`);
      
      if (response.status === 404) {
        console.log(`文件 ${FILE_PATH} 不存在`);
        return { exists: false, sha: null };
      } else if (!response.ok) {
        console.log(`检查文件失败: ${response.status} - ${response.statusText}`);
        throw new Error(`检查文件失败 (${response.status})`);
      }

      const data = await response.json();
      console.log(`API响应数据:`, data);
      
      // Gitee API 返回空数组表示文件不存在
      if (Array.isArray(data) && data.length === 0) {
        console.log(`文件 ${FILE_PATH} 不存在 (API返回空数组)`);
        return { exists: false, sha: null };
      }
      
      console.log(`文件存在，SHA: ${data.sha}`);
      return { exists: true, sha: data.sha };
    } catch (error) {
      console.log(`检查文件SHA时出错:`, error);
      throw error;
    }
  };

  // 上传/更新文件
  const uploadFile = async (token, username, content, sha = null) => {
    try {
      const requestBody = {
        content: content,
        message: `Update bookmarks - ${new Date().toISOString()}`,
        branch: 'master',
      };

      const url = `${GITEE_API_BASE}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`;
      console.log(`上传文件到: ${url}`);
      console.log(`请求体:`, JSON.stringify(requestBody, null, 2));

      let method;
      if (sha && sha.trim() !== '') {
        // 文件存在，使用 PUT 方法更新
        requestBody.sha = sha;
        method = 'PUT';
        console.log('文件存在，使用 PUT 方法更新');
      } else {
        // 文件不存在，使用 POST 方法创建
        method = 'POST';
        console.log('文件不存在，使用 POST 方法创建');
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
        console.log(`上传失败: ${response.status} - ${responseText}`);
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
  };

  // 下载文件
  const downloadFile = async (token, username) => {
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
  };

  // 安全的 base64 编码
  const safeBase64Encode = (str) => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
      throw new Error('内容编码失败');
    }
  };

  // 安全的 base64 解码
  const safeBase64Decode = (str) => {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (error) {
      throw new Error('内容解码失败');
    }
  };

  // 同步到云端
  const syncToCloud = async () => {
    if (!giteeToken.trim()) {
      setSyncStatus('error');
      setSyncMessage('请输入 Gitee Access Token');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('正在验证 Token...');

    try {
      // 1. 验证 Token 并获取用户信息
      const user = await validateTokenAndGetUser(giteeToken);
      console.log('用户信息:', user); // 调试信息
      setSyncMessage(`正在检查仓库 (${user.login})...`);

      // 2. 检查仓库是否存在
      const repoCheck = await checkRepositoryExists(giteeToken, user.login);
      console.log('仓库检查结果:', repoCheck); // 调试信息
      
      if (!repoCheck.exists) {
        setSyncMessage('正在创建仓库...');
        await createRepository(giteeToken);
        setSyncMessage('仓库创建成功，正在上传书签...');
      } else {
        setSyncMessage('仓库已存在，正在上传书签...');
      }

      // 3. 准备书签数据
      const bookmarksData = {
        bookmarks: bookmarks,
        groups: groups,
        syncTime: new Date().toISOString(),
        version: '1.0',
      };

      // 4. 检查文件是否存在
      const fileCheck = await getFileSHA(giteeToken, user.login);
      console.log('文件检查结果:', fileCheck); // 调试信息
      
      // 5. 上传文件
      const content = safeBase64Encode(JSON.stringify(bookmarksData, null, 2));
      console.log('正在上传文件到:', `${GITEE_API_BASE}/repos/${user.login}/${REPO_NAME}/contents/${FILE_PATH}`); // 调试信息
      await uploadFile(giteeToken, user.login, content, fileCheck.sha);

      setSyncStatus('success');
      setSyncMessage('同步成功！');
      setLastSyncTime(new Date());
      
      // 保存同步状态
      await chrome.storage.local.set({
        giteeSyncToken: giteeToken,
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error('同步错误:', error); // 调试信息
      setSyncStatus('error');
      setSyncMessage(`同步失败: ${error.message}`);
    }
  };

  // 从云端同步
  const syncFromCloud = async () => {
    if (!giteeToken.trim()) {
      setSyncStatus('error');
      setSyncMessage('请输入 Gitee Access Token');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('正在验证 Token...');

    try {
      // 1. 验证 Token 并获取用户信息
      const user = await validateTokenAndGetUser(giteeToken);
      setSyncMessage('正在检查仓库...');

      // 2. 检查仓库是否存在
      const repoCheck = await checkRepositoryExists(giteeToken, user.login);
      
      if (!repoCheck.exists) {
        setSyncStatus('error');
        setSyncMessage('云端没有找到书签数据，请先同步到云端');
        return;
      }

      setSyncMessage('正在下载书签...');
      
      // 3. 下载文件
      const fileDownload = await downloadFile(giteeToken, user.login);
      
      if (!fileDownload.exists) {
        setSyncStatus('error');
        setSyncMessage('云端没有找到书签数据');
        return;
      }

      // 4. 解析数据
      const content = safeBase64Decode(fileDownload.content);
      const data = JSON.parse(content);

      // 5. 更新本地数据
      await chrome.storage.local.set({
        bookmarks: data.bookmarks || [],
        groups: data.groups || [],
      });

      setSyncStatus('success');
      setSyncMessage('从云端同步成功！');
      setLastSyncTime(new Date());
      
      // 保存同步状态
      await chrome.storage.local.set({
        giteeSyncToken: giteeToken,
        lastSyncTime: new Date().toISOString(),
      });

      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(`同步失败: ${error.message}`);
    }
  };

  // 加载保存的 token
  React.useEffect(() => {
    const loadSavedToken = async () => {
      try {
        const result = await chrome.storage.local.get(['giteeSyncToken', 'lastSyncTime']);
        if (result.giteeSyncToken) {
          setGiteeToken(result.giteeSyncToken);
        }
        if (result.lastSyncTime) {
          setLastSyncTime(new Date(result.lastSyncTime));
        }
      } catch (error) {
        console.error('加载保存的 token 失败:', error);
      }
    };

    if (isOpen) {
      loadSavedToken();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CloudIcon className="w-5 h-5" />
            同步设置
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Gitee Token 设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gitee Access Token
            </label>
            <input
              type="password"
              value={giteeToken}
              onChange={(e) => setGiteeToken(e.target.value)}
              placeholder="输入您的 Gitee Access Token"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              在 Gitee 设置 -&gt; 私有令牌 中创建，需要以下权限：
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 mt-1 list-disc list-inside">
              <li>projects (仓库读写权限)</li>
              <li>pull_requests (拉取请求权限)</li>
              <li>user_info (用户信息权限)</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Token 创建后请立即复制，关闭页面后将无法再次查看
            </p>
          </div>

          {/* 同步状态 */}
          {syncStatus !== 'idle' && (
            <div className={`p-3 rounded-lg ${
              syncStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
              syncStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
              'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {syncStatus === 'success' && <CheckCircleIcon className="w-4 h-4" />}
                {syncStatus === 'error' && <AlertCircleIcon className="w-4 h-4" />}
                {syncStatus === 'syncing' && <LoaderIcon className="w-4 h-4 animate-spin" />}
                <span className="text-sm">{syncMessage}</span>
              </div>
            </div>
          )}

          {/* 最后同步时间 */}
          {lastSyncTime && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              最后同步时间: {lastSyncTime.toLocaleString('zh-CN')}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={syncToCloud}
              disabled={syncStatus === 'syncing'}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncStatus === 'syncing' ? '同步中...' : '同步到云端'}
            </button>
            <button
              onClick={syncFromCloud}
              disabled={syncStatus === 'syncing'}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncStatus === 'syncing' ? '同步中...' : '从云端恢复'}
            </button>
          </div>

          {/* 说明 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="mb-1">📌 同步说明：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>仓库名称将自动创建为: {REPO_NAME}</li>
              <li>同步到云端: 将本地书签上传到 Gitee</li>
              <li>从云端恢复: 从 Gitee 下载书签到本地</li>
              <li>请妥善保管您的 Access Token</li>
              <li>首次使用建议先点击"同步到云端"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettingsModal;