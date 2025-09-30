import React, { useState } from 'react';
import { CloudIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon, SettingsIcon, GithubIcon, GitBranchIcon } from 'lucide-react';

const SyncSettingsModal = ({ isOpen, onClose, bookmarks, groups }) => {
  const [syncProvider, setSyncProvider] = useState('gitee'); // 'gitee' or 'github'
  const [giteeToken, setGiteeToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  // Gitee API 配置
  const GITEE_API_BASE = 'https://gitee.com/api/v5';
  const GITHUB_API_BASE = 'https://api.github.com';
  const REPO_NAME = 'marksyncy-bookmarks';
  const FILE_PATH = 'bookmarks.json';

  // 验证 Token 并获取用户信息
  const validateTokenAndGetUser = async (token, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      const response = await fetch(`${apiBase}/user`, {
        headers: {
          'Authorization': authHeader,
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
      console.log('用户登录名:', userData.login);
      console.log('用户显示名:', userData.name);
      console.log('用户类型:', userData.type);
      return userData;
    } catch (error) {
      throw new Error(`Token 验证失败: ${error.message}`);
    }
  };

  // 检查仓库是否存在
  const checkRepositoryExists = async (token, username, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      const repoUrl = `${apiBase}/repos/${username}/${REPO_NAME}`;
      console.log(`=== 仓库检查诊断信息 ===`);
      console.log(`检查仓库: ${username}/${REPO_NAME} (${provider})`);
      console.log(`检查URL: ${repoUrl}`);
      console.log(`认证方式: ${provider === 'github' ? 'Bearer' : 'token'}`);

      const response = await fetch(repoUrl, {
        headers: {
          'Authorization': authHeader,
        },
      });

      console.log(`仓库检查响应状态: ${response.status}`);
      console.log(`仓库检查响应头:`, Object.fromEntries(response.headers.entries()));

      if (response.status === 404) {
        console.log(`仓库 ${username}/${REPO_NAME} 不存在`);

        // 对于 GitHub，额外验证用户信息和仓库列表
        if (provider === 'github') {
          try {
            // 验证用户信息
            const userUrl = `${apiBase}/user`;
            const userResponse = await fetch(userUrl, {
              headers: {
                'Authorization': authHeader,
              },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log(`当前 GitHub 用户: ${userData.login} (${userData.name})`);
            }

            // 列出用户的仓库
            const reposUrl = `${apiBase}/user/repos?per_page=10`;
            const reposResponse = await fetch(reposUrl, {
              headers: {
                'Authorization': authHeader,
              },
            });
            if (reposResponse.ok) {
              const repos = await reposResponse.json();
              console.log(`用户拥有的仓库:`, repos.map(r => r.full_name));

              // 检查是否有相似的仓库名
              const similarRepo = repos.find(r =>
                r.name.toLowerCase().includes(REPO_NAME.toLowerCase()) ||
                REPO_NAME.toLowerCase().includes(r.name.toLowerCase())
              );
              if (similarRepo) {
                console.log(`发现相似仓库名: ${similarRepo.full_name}`);
              }
            }
          } catch (error) {
            console.log(`GitHub 诊断检查失败:`, error);
          }
        }

        return { exists: false };
      } else if (!response.ok) {
        console.log(`检查仓库失败: ${response.status} - ${response.statusText}`);
        throw new Error(`检查仓库失败 (${response.status})`);
      }

      const repoData = await response.json();
      console.log(`仓库详细信息:`, {
        name: repoData.name,
        full_name: repoData.full_name,
        private: repoData.private,
        default_branch: repoData.default_branch,
        html_url: repoData.html_url
      });

      console.log(`仓库 ${username}/${REPO_NAME} 存在`);
      return { exists: true, data: repoData };
    } catch (error) {
      console.log(`检查仓库时出错:`, error);
      throw error;
    }
  };

  // 创建仓库
  const createRepository = async (token, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      const body = provider === 'github' ? {
        name: REPO_NAME,
        description: 'MarkSyncy bookmarks sync repository',
        private: false,
        auto_init: true,
      } : {
        name: REPO_NAME,
        description: 'MarkSyncy 书签同步仓库',
        private: false,
        auto_init: true,
      };

      const url = `${apiBase}/user/repos`;
      console.log('创建仓库请求:', url);
      console.log('请求体:', JSON.stringify(body, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log('创建仓库响应状态:', response.status);
      console.log('创建仓库响应内容:', responseText);

      if (!response.ok) {
        try {
          const error = JSON.parse(responseText);
          console.log('创建仓库错误详情:', error);

          if (error.message && (
            error.message.includes('已存在同地址仓库') ||
            error.message.includes('name already exists') ||
            error.message.includes('repository already exists') ||
            (error.errors && error.errors.some(e => e.message.includes('already exists')))
          )) {
            console.log('仓库已存在，返回 exists: true');
            return { exists: true }; // 仓库已存在，这不是错误
          }

          // 特殊处理 GitHub 的权限错误
          if (provider === 'github' && response.status === 403) {
            throw new Error('GitHub Token 权限不足，请确保 Token 有 repo 权限');
          }

          // 特殊处理 GitHub 的认证错误
          if (provider === 'github' && response.status === 401) {
            throw new Error('GitHub Token 无效或已过期');
          }

          throw new Error(error.message || `创建仓库失败 (${response.status})`);
        } catch (parseError) {
          if (parseError.message) {
            throw parseError; // 重新抛出已格式化的错误
          }
          throw new Error(`创建仓库失败: ${responseText.substring(0, 100)}`);
        }
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // 检查文件是否存在并获取 SHA
  const getFileSHA = async (token, username, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      const url = `${apiBase}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`;
      console.log(`检查文件SHA: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader,
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
      if (provider === 'gitee' && Array.isArray(data) && data.length === 0) {
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

  // 获取仓库的默认分支
  const getDefaultBranch = async (token, username, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      const response = await fetch(`${apiBase}/repos/${username}/${REPO_NAME}`, {
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        console.log(`获取默认分支失败: ${response.status}`);
        return provider === 'github' ? 'main' : 'master'; // 返回默认值
      }

      const repoData = await response.json();
      const defaultBranch = repoData.default_branch;
      console.log(`仓库默认分支: ${defaultBranch}`);
      return defaultBranch;
    } catch (error) {
      console.log(`获取默认分支时出错:`, error);
      return provider === 'github' ? 'main' : 'master'; // 返回默认值
    }
  };

  // 上传/更新文件
  const uploadFile = async (token, username, content, sha = null, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      // 获取默认分支
      const defaultBranch = await getDefaultBranch(token, username, provider);
      console.log(`使用默认分支: ${defaultBranch}`);

      const requestBody = {
        content: content,
        message: `Update bookmarks - ${new Date().toISOString()}`,
        branch: defaultBranch,
      };

      const url = `${apiBase}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`;
      console.log(`=== uploadFile 诊断信息 ===`);
      console.log(`上传URL: ${url}`);
      console.log(`用户名: ${username}`);
      console.log(`仓库名称: ${REPO_NAME}`);
      console.log(`文件路径: ${FILE_PATH}`);
      console.log(`认证头: ${authHeader.substring(0, 20)}...`);
      console.log(`请求体:`, JSON.stringify(requestBody, null, 2));

      let method;
      if (sha && sha.trim() !== '') {
        // 文件存在，使用 PUT 方法更新
        requestBody.sha = sha;
        method = 'PUT';
        console.log('文件存在，使用 PUT 方法更新');
      } else {
        // 文件不存在，GitHub API 也使用 PUT 方法创建
        method = 'PUT';
        console.log('文件不存在，使用 PUT 方法创建');
      }

      console.log(`请求方法: ${method}`);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.log(`=== 上传失败诊断信息 ===`);
        console.log(`响应状态: ${response.status}`);
        console.log(`响应头:`, Object.fromEntries(response.headers.entries()));
        console.log(`响应内容: ${responseText}`);

        // 对于 404 错误，提供更具体的诊断
        if (response.status === 404) {
          console.log(`404 错误可能原因:`);
          console.log(`1. 仓库 ${username}/${REPO_NAME} 不存在`);
          console.log(`2. 用户名 ${username} 不正确`);
          console.log(`3. Token 权限不足`);
          console.log(`4. 仓库名称格式错误`);

          throw new Error(`仓库不存在或访问被拒绝。请检查:\n1. 仓库 ${username}/${REPO_NAME} 是否存在\n2. GitHub Token 是否有足够的 repo 权限\n3. 用户名 ${username} 是否正确`);
        }

        try {
          const error = JSON.parse(responseText);
          throw new Error(error.message || `上传失败 (${response.status})`);
        } catch (parseError) {
          if (parseError.message) {
            throw parseError;
          }
          throw new Error(`上传失败: ${responseText.substring(0, 100)}`);
        }
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // 下载文件
  const downloadFile = async (token, username, provider) => {
    try {
      const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const authHeader = provider === 'github'
        ? `Bearer ${token}`
        : `token ${token}`;

      const response = await fetch(`${apiBase}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`, {
        headers: {
          'Authorization': authHeader,
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
    const token = syncProvider === 'github' ? githubToken : giteeToken;
    const providerName = syncProvider === 'github' ? 'GitHub' : 'Gitee';

    if (!token.trim()) {
      setSyncStatus('error');
      setSyncMessage(`请输入 ${providerName} Access Token`);
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('正在验证 Token...');

    try {
      // 1. 验证 Token 并获取用户信息
      const user = await validateTokenAndGetUser(token, syncProvider);
      console.log('用户信息:', user); // 调试信息
      setSyncMessage(`正在检查仓库 (${user.login})...`);

      // 2. 检查仓库是否存在
      const repoCheck = await checkRepositoryExists(token, user.login, syncProvider);
      console.log('仓库检查结果:', repoCheck); // 调试信息

      if (!repoCheck.exists) {
        console.log('仓库不存在，尝试创建新仓库...');
        setSyncMessage('正在创建仓库...');
        const createResult = await createRepository(token, syncProvider);
        console.log('仓库创建结果:', createResult);

        // 再次检查仓库是否真的创建成功
        const retryCheck = await checkRepositoryExists(token, user.login, syncProvider);
        console.log('创建后再次检查仓库:', retryCheck);

        if (!retryCheck.exists) {
          throw new Error('仓库创建失败，请检查您的Token权限');
        }

        setSyncMessage('仓库创建成功，正在上传书签...');
      } else {
        console.log('仓库已存在，准备上传书签...');
        console.log('仓库详细信息:', repoCheck.data);
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
      const fileCheck = await getFileSHA(token, user.login, syncProvider);
      console.log('文件检查结果:', fileCheck); // 调试信息

      // 5. 上传文件
      const content = safeBase64Encode(JSON.stringify(bookmarksData, null, 2));
      const apiBase = syncProvider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;
      const uploadUrl = `${apiBase}/repos/${user.login}/${REPO_NAME}/contents/${FILE_PATH}`;

      console.log('=== 上传文件诊断信息 ===');
      console.log('用户信息:', user);
      console.log('用户登录名:', user.login);
      console.log('仓库名称:', REPO_NAME);
      console.log('完整上传URL:', uploadUrl);
      console.log('文件检查结果:', fileCheck);

      // 对于 GitHub，添加额外的验证
      if (syncProvider === 'github') {
        // 验证仓库名称是否符合 GitHub 规范
        console.log('验证仓库名称规范...');
        const repoNameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!repoNameRegex.test(REPO_NAME)) {
          throw new Error(`仓库名称 "${REPO_NAME}" 包含无效字符。GitHub 仓库名称只能包含字母、数字、点、下划线和连字符。`);
        }

        // 验证用户是否能访问自己的仓库列表
        try {
          const reposUrl = `${GITHUB_API_BASE}/user/repos?per_page=5`;
          console.log('检查用户仓库列表:', reposUrl);
          const reposResponse = await fetch(reposUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (reposResponse.ok) {
            const repos = await reposResponse.json();
            console.log('用户仓库列表前5个:', repos.map(r => r.full_name));

            // 检查是否已存在同名仓库
            const existingRepo = repos.find(r => r.name === REPO_NAME);
            if (existingRepo) {
              console.log('发现已存在的同名仓库:', existingRepo.full_name);
            }

            // 验证用户名是否与仓库路径匹配
            console.log('验证用户名格式...');
            if (!user.login || typeof user.login !== 'string') {
              throw new Error('无法获取有效的 GitHub 用户名');
            }

            // 尝试直接访问仓库 API 来验证路径
            const testRepoUrl = `${GITHUB_API_BASE}/repos/${user.login}/${REPO_NAME}`;
            console.log('测试仓库访问:', testRepoUrl);
            const testResponse = await fetch(testRepoUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            console.log('仓库访问测试状态:', testResponse.status);
            if (testResponse.status === 200) {
              console.log('仓库已存在，可以访问');
            } else if (testResponse.status === 404) {
              console.log('仓库不存在，需要创建');
            } else {
              console.log('仓库访问异常:', testResponse.status);
            }
          } else {
            console.log('获取仓库列表失败:', reposResponse.status);
            const errorText = await reposResponse.text();
            console.log('错误详情:', errorText);
          }
        } catch (error) {
          console.log('检查仓库列表时出错:', error);
          throw new Error(`验证 GitHub 权限失败: ${error.message}`);
        }
      }

      await uploadFile(token, user.login, content, fileCheck.sha, syncProvider);

      setSyncStatus('success');
      setSyncMessage('同步成功！');
      setLastSyncTime(new Date());

      // 保存同步状态
      await chrome.storage.local.set({
        syncProvider: syncProvider,
        giteeSyncToken: syncProvider === 'gitee' ? giteeToken : '',
        githubSyncToken: syncProvider === 'github' ? githubToken : '',
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
    const token = syncProvider === 'github' ? githubToken : giteeToken;
    const providerName = syncProvider === 'github' ? 'GitHub' : 'Gitee';

    if (!token.trim()) {
      setSyncStatus('error');
      setSyncMessage(`请输入 ${providerName} Access Token`);
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('正在验证 Token...');

    try {
      // 1. 验证 Token 并获取用户信息
      const user = await validateTokenAndGetUser(token, syncProvider);
      setSyncMessage('正在检查仓库...');

      // 2. 检查仓库是否存在
      const repoCheck = await checkRepositoryExists(token, user.login, syncProvider);

      if (!repoCheck.exists) {
        setSyncStatus('error');
        setSyncMessage('云端没有找到书签数据，请先同步到云端');
        return;
      }

      setSyncMessage('正在下载书签...');

      // 3. 下载文件
      const fileDownload = await downloadFile(token, user.login, syncProvider);

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

      // 触发页面更新（如果存在更新函数）
      if (window.updateBookmarksAndGroups) {
        window.updateBookmarksAndGroups(data.bookmarks || [], data.groups || []);
      }

      setSyncStatus('success');
      setSyncMessage('从云端同步成功！');
      setLastSyncTime(new Date());

      // 保存同步状态
      await chrome.storage.local.set({
        syncProvider: syncProvider,
        giteeSyncToken: syncProvider === 'gitee' ? giteeToken : '',
        githubSyncToken: syncProvider === 'github' ? githubToken : '',
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(`同步失败: ${error.message}`);
    }
  };

  // 加载保存的 token 和设置
  React.useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const result = await chrome.storage.local.get(['syncProvider', 'giteeSyncToken', 'githubSyncToken', 'lastSyncTime', 'autoSyncEnabled']);
        if (result.syncProvider) {
          setSyncProvider(result.syncProvider);
        }
        if (result.giteeSyncToken) {
          setGiteeToken(result.giteeSyncToken);
        }
        if (result.githubSyncToken) {
          setGithubToken(result.githubSyncToken);
        }
        if (result.lastSyncTime) {
          setLastSyncTime(new Date(result.lastSyncTime));
        }
        if (result.autoSyncEnabled !== undefined) {
          setAutoSyncEnabled(result.autoSyncEnabled);
        }
      } catch (error) {
        console.error('加载保存的设置失败:', error);
      }
    };

    if (isOpen) {
      loadSavedSettings();
    }
  }, [isOpen]);

  // 保存自动同步设置
  const saveAutoSyncSetting = async (enabled) => {
    try {
      setAutoSyncEnabled(enabled);
      await chrome.storage.local.set({ autoSyncEnabled: enabled });
    } catch (error) {
      console.error('保存自动同步设置失败:', error);
    }
  };

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
          {/* 同步方式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择同步平台
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSyncProvider('gitee')}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                  syncProvider === 'gitee'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <GitBranchIcon className="w-8 h-8 mb-2 text-red-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Gitee</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">国内平台</span>
              </button>
              <button
                onClick={() => setSyncProvider('github')}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                  syncProvider === 'github'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <GithubIcon className="w-8 h-8 mb-2 text-gray-900 dark:text-white" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">GitHub</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">全球平台</span>
              </button>
            </div>
          </div>

          {/* Token 设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {syncProvider === 'github' ? 'GitHub Access Token' : 'Gitee Access Token'}
            </label>
            <input
              type="password"
              value={syncProvider === 'github' ? githubToken : giteeToken}
              onChange={(e) => syncProvider === 'github' ? setGithubToken(e.target.value) : setGiteeToken(e.target.value)}
              placeholder={`输入您的 ${syncProvider === 'github' ? 'GitHub' : 'Gitee'} Access Token`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            {syncProvider === 'github' ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  在 GitHub Settings -&gt; Developer settings -&gt; Personal access tokens 中创建 Classic Token：
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mt-1 list-disc list-inside">
                  <li>repo (仓库读写权限)</li>
                  <li>user (用户信息权限)</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Token 创建后请立即复制，关闭页面后将无法再次查看
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
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

          {/* 自动同步开关 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <CloudIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  自动同步
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                添加收藏或调整分组时自动同步到云端
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => saveAutoSyncSetting(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

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
              <li>同步到云端: 将本地书签上传到 {syncProvider === 'github' ? 'GitHub' : 'Gitee'}</li>
              <li>从云端恢复: 从 {syncProvider === 'github' ? 'GitHub' : 'Gitee'} 下载书签到本地</li>
              <li>请妥善保管您的 Access Token</li>
              <li>首次使用建议先点击"同步到云端"</li>
              <li>GitHub 使用 main 分支，Gitee 使用 master 分支</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettingsModal;