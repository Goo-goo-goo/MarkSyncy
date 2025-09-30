// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 初始化菜单项集合
  currentMenuItems.clear();
  
  // 创建父菜单
  chrome.contextMenus.create({
    id: "bookmarkParent",
    title: "收藏此网页到...",
    contexts: ["page"]
  });
  
  // 创建默认分组选项
  chrome.contextMenus.create({
    id: "bookmark_default",
    parentId: "bookmarkParent",
    title: "默认分组",
    contexts: ["page"]
  });
  
  currentMenuItems.add("bookmark_default");
  
  // 延迟更新分组菜单
  setTimeout(updateBookmarkMenu, 1000);
});

// 存储当前菜单项ID，用于后续删除
let currentMenuItems = new Set();

// 动态更新分组菜单
async function updateBookmarkMenu() {
  try {
    const result = await chrome.storage.local.get(['groups']);
    const groups = result.groups || [];
    
    // 删除之前创建的自定义分组菜单项（保留默认分组）
    currentMenuItems.forEach(menuId => {
      if (menuId !== "bookmark_default") {
        try {
          chrome.contextMenus.remove(menuId);
        } catch (e) {
          // 忽略删除不存在的菜单项的错误
        }
      }
    });
    
    // 清空集合
    currentMenuItems.clear();
    currentMenuItems.add("bookmark_default");
    
    // 添加新的分组菜单项
    groups.forEach(group => {
      if (group.id !== "default") {
        const menuId = `bookmark_${group.id}`;
        chrome.contextMenus.create({
          id: menuId,
          parentId: "bookmarkParent",
          title: group.name,
          contexts: ["page"]
        });
        currentMenuItems.add(menuId);
      }
    });
    
    console.log('分组菜单已更新，当前分组：', groups.map(g => g.name));
  } catch (error) {
    console.error('更新分组菜单失败:', error);
  }
}

// 监听存储变化，更新菜单
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.groups) {
    updateBookmarkMenu();
  }
});

// 初始化时更新菜单
chrome.runtime.onStartup.addListener(() => {
  updateBookmarkMenu();
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 处理分组收藏
  if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('bookmark_')) {
    const groupId = info.menuItemId.replace('bookmark_', '');
    await bookmarkToGroup(tab, groupId);
  }
});

// 收藏到指定分组
async function bookmarkToGroup(tab, groupId) {
  try {
    // 获取当前页面的信息
    const pageInfo = {
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString(),
      favicon: tab.favIconUrl || "",
      group: groupId
    };

    // 从存储中获取现有的收藏和分组
    const result = await chrome.storage.local.get(['bookmarks', 'groups']);
    const bookmarks = result.bookmarks || [];
    let groups = result.groups || [];
    
    // 确保默认分组存在
    if (!groups.find(g => g.id === "default")) {
      groups = [
        { id: "default", name: "默认分组", color: "#667eea", createdAt: new Date().toISOString() },
        ...groups
      ];
      await chrome.storage.local.set({ groups: groups });
    }
    
    // 获取分组名称
    const group = groups.find(g => g.id === groupId);
    const groupName = group ? group.name : "默认分组";
    
    // 检查是否已经收藏过这个URL
    const existingIndex = bookmarks.findIndex(bookmark => bookmark.url === pageInfo.url);
    
    if (existingIndex !== -1) {
      // 如果已经存在，更新收藏信息
      bookmarks[existingIndex] = pageInfo;
    } else {
      // 如果不存在，添加新的收藏
      bookmarks.push(pageInfo);
    }

    // 保存到存储
    await chrome.storage.local.set({ bookmarks: bookmarks });

    // 自动同步到云端（如果启用了自动同步）
    const autoSyncResult = await chrome.storage.local.get(['autoSyncEnabled', 'syncProvider', 'giteeSyncToken', 'githubSyncToken']);
    const { autoSyncEnabled, syncProvider, giteeSyncToken, githubSyncToken } = autoSyncResult;

    if (autoSyncEnabled) {
      const provider = syncProvider || 'gitee';
      const token = provider === 'github' ? githubSyncToken : giteeSyncToken;

      if (token) {
        try {
          // 这里需要简化版的同步逻辑，因为background script无法直接访问完整的DOM
          await autoSyncInBackground(bookmarks, groups);
        } catch (syncError) {
          console.error('自动同步失败:', syncError);
        }
      }
    }

    // 显示成功消息
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    
    // 3秒后清除徽章
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 3000);

    console.log(`已收藏到"${groupName}"分组`);
  } catch (error) {
    console.error('收藏页面时出错:', error);
    // 显示错误消息
    chrome.action.setBadgeText({ text: "✗" });
    chrome.action.setBadgeBackgroundColor({ color: "#F44336" });
    
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 3000);
  }
}

// 后台自动同步功能
async function autoSyncInBackground(bookmarks, groups) {
  const GITEE_API_BASE = 'https://gitee.com/api/v5';
  const GITHUB_API_BASE = 'https://api.github.com';
  const REPO_NAME = 'marksyncy-bookmarks';
  const FILE_PATH = 'bookmarks.json';

  try {
    // 获取同步配置
    const result = await chrome.storage.local.get(['syncProvider', 'giteeSyncToken', 'githubSyncToken', 'autoSyncEnabled']);
    const { syncProvider, giteeSyncToken, githubSyncToken, autoSyncEnabled } = result;

    if (!autoSyncEnabled) return;

    // 确定使用的平台和token
    const provider = syncProvider || 'gitee';
    const token = provider === 'github' ? githubSyncToken : giteeSyncToken;
    const apiBase = provider === 'github' ? GITHUB_API_BASE : GITEE_API_BASE;

    if (!token) return;

    // 验证 Token
    const authHeader = provider === 'github' ? `Bearer ${token}` : `token ${token}`;
    const userResponse = await fetch(`${apiBase}/user`, {
      headers: { 'Authorization': authHeader }
    });

    if (!userResponse.ok) return;

    const user = await userResponse.json();

    // 检查仓库
    const repoResponse = await fetch(`${apiBase}/repos/${user.login}/${REPO_NAME}`, {
      headers: { 'Authorization': authHeader }
    });

    let repoExists = repoResponse.ok;

    // 如果仓库不存在，创建仓库
    if (!repoExists) {
      const createBody = provider === 'github' ? {
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

      await fetch(`${apiBase}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createBody),
      });
    }

    // 获取默认分支
    const defaultBranchResponse = await fetch(`${apiBase}/repos/${user.login}/${REPO_NAME}`, {
      headers: { 'Authorization': authHeader }
    });

    let defaultBranch = provider === 'github' ? 'main' : 'master';
    if (defaultBranchResponse.ok) {
      const repoData = await defaultBranchResponse.json();
      defaultBranch = repoData.default_branch || defaultBranch;
    }

    // 准备数据
    const bookmarksData = {
      bookmarks: bookmarks,
      groups: groups,
      syncTime: new Date().toISOString(),
      version: '1.0',
    };

    // 检查文件是否存在
    const fileResponse = await fetch(`${apiBase}/repos/${user.login}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': authHeader }
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      if (provider === 'gitee') {
        if (!Array.isArray(fileData)) {
          sha = fileData.sha;
        }
      } else {
        sha = fileData.sha;
      }
    }

    // 上传文件
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(bookmarksData, null, 2))));
    const requestBody = {
      content: content,
      message: `Auto sync bookmarks - ${new Date().toISOString()}`,
      branch: defaultBranch,
    };

    if (sha) {
      requestBody.sha = sha;
    }

    // GitHub API 必须使用 PUT 方法
    const method = provider === 'github' ? 'PUT' : (sha ? 'PUT' : 'POST');

    await fetch(`${apiBase}/repos/${user.login}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`${provider} 后台自动同步成功`);
  } catch (error) {
    console.error('后台自动同步失败:', error);
  }
}

// 处理扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 打开新的扩展页面
  chrome.tabs.create({
    url: chrome.runtime.getURL('manage.html')
  });
});
