// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    setupSearch();
    setupGroups();
    setupFilters();
    setupViewControls();
});

// 加载收藏数据
async function loadBookmarks() {
    try {
        const result = await chrome.storage.local.get(['bookmarks']);
        const bookmarks = result.bookmarks || [];
        
        updateStats(bookmarks);
        displayBookmarks(bookmarks);
    } catch (error) {
        console.error('加载收藏失败:', error);
        showError('加载收藏失败');
    }
}

// 更新统计信息
function updateStats(bookmarks) {
    const totalElement = document.getElementById('totalBookmarks');
    const todayElement = document.getElementById('todayBookmarks');
    
    totalElement.textContent = bookmarks.length;
    
    // 计算今日新增的收藏
    const today = new Date().toDateString();
    const todayBookmarks = bookmarks.filter(bookmark => {
        const bookmarkDate = new Date(bookmark.timestamp).toDateString();
        return bookmarkDate === today;
    });
    
    todayElement.textContent = todayBookmarks.length;
}

// 显示收藏列表
function displayBookmarks(bookmarks) {
    const container = document.getElementById('bookmarksContainer');
    
    if (bookmarks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div>📖</div>
                <p>还没有收藏任何网页</p>
                <p>右键点击网页选择"收藏此网页"开始使用</p>
            </div>
        `;
        return;
    }
    
    // 按时间倒序排列
    const sortedBookmarks = bookmarks.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const bookmarksHTML = sortedBookmarks.map(bookmark => {
        const date = new Date(bookmark.timestamp);
        const formattedDate = date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const currentView = document.getElementById('bookmarksContainer').classList.contains('grid-view') ? 'grid' : 'list';
        
        const faviconHtml = getFaviconHtml(bookmark);

        return `
            <div class="bookmark-item ${currentView}-view" data-url="${bookmark.url}">
                <div class="bookmark-favicon">
                    ${faviconHtml}
                </div>
                <div class="bookmark-content">
                    <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
                    <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
                    <div class="bookmark-meta">
                        <span>${formattedDate}</span>
                        <div class="bookmark-actions">
                            <button class="btn" onclick="openBookmark('${bookmark.url}')">打开</button>
                            <button class="btn btn-danger" onclick="deleteBookmark('${bookmark.url}')">删除</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = bookmarksHTML;
}

// 设置搜索功能
function setupSearch() {
    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterBookmarks(searchTerm);
    });
}

// 过滤收藏
async function filterBookmarks(searchTerm) {
    try {
        const result = await chrome.storage.local.get(['bookmarks']);
        const bookmarks = result.bookmarks || [];
        
        if (!searchTerm) {
            displayBookmarks(bookmarks);
            return;
        }
        
        const filteredBookmarks = bookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(searchTerm) ||
            bookmark.url.toLowerCase().includes(searchTerm)
        );
        
        displayBookmarks(filteredBookmarks);
    } catch (error) {
        console.error('搜索失败:', error);
    }
}

// 打开收藏的网页
function openBookmark(url) {
    chrome.tabs.create({ url: url });
}

// 删除收藏
async function deleteBookmark(url) {
    if (!confirm('确定要删除这个收藏吗？')) {
        return;
    }
    
    try {
        const result = await chrome.storage.local.get(['bookmarks']);
        const bookmarks = result.bookmarks || [];
        
        const updatedBookmarks = bookmarks.filter(bookmark => bookmark.url !== url);
        await chrome.storage.local.set({ bookmarks: updatedBookmarks });
        
        // 重新加载显示
        loadBookmarks();
        
        // 显示成功消息
        showSuccess('收藏已删除');
    } catch (error) {
        console.error('删除收藏失败:', error);
        showError('删除收藏失败');
    }
}

// 显示成功消息
function showSuccess(message) {
    // 这里可以添加一个简单的通知系统
    console.log('成功:', message);
}

// 显示错误消息
function showError(message) {
    // 这里可以添加一个简单的通知系统
    console.error('错误:', message);
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 获取favicon HTML
function getFaviconHtml(bookmark) {
    if (bookmark.favicon) {
        // 尝试多个favicon源
        const faviconUrls = [
            bookmark.favicon,
            `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`,
            `https://favicon.ico/${new URL(bookmark.url).hostname}`,
            `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(bookmark.url)}&size=32`
        ];
        
        return `
            <img src="${faviconUrls[0]}" alt="网站图标" 
                 onerror="this.onerror=null; this.src='${faviconUrls[1]}'; this.onerror=this.onerror=null; this.src='${faviconUrls[2]}'; this.onerror=this.onerror=null; this.src='${faviconUrls[3]}'; this.onerror=this.parentNode.innerHTML='<div class=\\'default-icon\\'>🌐</div>'">
        `;
    } else {
        // 如果没有favicon，尝试从URL生成
        try {
            const hostname = new URL(bookmark.url).hostname;
            const firstLetter = hostname.charAt(0).toUpperCase();
            return `<div class="default-icon">${firstLetter}</div>`;
        } catch (e) {
            return `<div class="default-icon">🌐</div>`;
        }
    }
}

// 设置分组管理
function setupGroups() {
    // 加载分组数据并显示分组过滤器
    loadGroups();
}

// 加载分组列表
async function loadGroups() {
    try {
        const result = await chrome.storage.local.get(['groups']);
        const groups = result.groups || [];
        
        // 确保默认分组存在
        if (!groups.find(g => g.id === "default")) {
            const defaultGroup = { id: "default", name: "默认分组", color: "#667eea", createdAt: new Date().toISOString() };
            const updatedGroups = [defaultGroup, ...groups];
            await chrome.storage.local.set({ groups: updatedGroups });
            displayGroups(updatedGroups);
        } else {
            displayGroups(groups);
        }
    } catch (error) {
        console.error('加载分组失败:', error);
    }
}

// 显示分组列表
function displayGroups(groups) {
    const groupsContainer = document.getElementById('groupsContainer');
    if (!groupsContainer) return;
    
    const groupsHTML = groups.map(group => {
        const count = getGroupBookmarkCount(group.id);
        return `
            <div class="group-item" data-group-id="${group.id}">
                <div class="group-color" style="background-color: ${group.color}"></div>
                <div class="group-name">${group.name}</div>
                <div class="group-count">${count}</div>
            </div>
        `;
    }).join('');
    
    groupsContainer.innerHTML = groupsHTML;
    
    // 绑定分组点击事件
    groupsContainer.querySelectorAll('.group-item').forEach(item => {
        item.addEventListener('click', () => {
            const groupId = item.dataset.groupId;
            selectGroup(groupId);
        });
    });
}

// 获取分组中的收藏数量
async function getGroupBookmarkCount(groupId) {
    try {
        const result = await chrome.storage.local.get(['bookmarks']);
        const bookmarks = result.bookmarks || [];
        return bookmarks.filter(bookmark => bookmark.group === groupId).length;
    } catch (error) {
        console.error('获取分组收藏数量失败:', error);
        return 0;
    }
}

// 选择分组
function selectGroup(groupId) {
    // 更新分组选择状态
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedItem = document.querySelector(`[data-group-id="${groupId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // 根据分组筛选收藏
    filterBookmarksByGroup(groupId);
}

// 根据分组筛选收藏
async function filterBookmarksByGroup(groupId) {
    try {
        const result = await chrome.storage.local.get(['bookmarks']);
        const bookmarks = result.bookmarks || [];
        
        const filteredBookmarks = groupId === 'all' 
            ? bookmarks 
            : bookmarks.filter(bookmark => bookmark.group === groupId);
        
        displayBookmarks(filteredBookmarks);
    } catch (error) {
        console.error('根据分组筛选收藏失败:', error);
    }
}

// 绑定分组事件
function bindGroupEvents() {
    // 分组事件已在 displayGroups 中绑定
}

// 设置筛选器
function setupFilters() {
    // 筛选功能暂时跳过
}

// 应用筛选器
function applyFilters() {
    // 筛选功能暂时跳过
    loadBookmarks();
}

// 设置视图控制
function setupViewControls() {
    // 默认使用列表视图
    switchView('list');
}

// 切换视图
function switchView(viewType) {
    const container = document.getElementById('bookmarksContainer');
    
    // 移除所有视图类
    container.classList.remove('list-view', 'grid-view');
    
    // 添加选中的视图类
    container.classList.add(`${viewType}-view`);
    
    // 重新显示收藏（应用新的视图样式）
    loadBookmarks();
}

// 监听存储变化，实时更新界面
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        if (changes.bookmarks) {
            loadBookmarks();
        }
        if (changes.groups) {
            loadGroups();
        }
    }
});

// 切换视图（列表/网格）
function toggleView() {
    const container = document.getElementById('bookmarksContainer');
    const currentView = container.classList.contains('grid-view') ? 'list' : 'grid';
    switchView(currentView);
}

// 导出收藏
async function exportBookmarks() {
    try {
        const result = await chrome.storage.local.get(['bookmarks']);
        const bookmarks = result.bookmarks || [];
        
        if (bookmarks.length === 0) {
            alert('没有收藏可以导出');
            return;
        }
        
        const dataStr = JSON.stringify(bookmarks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bookmarks_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showSuccess('收藏已导出');
    } catch (error) {
        console.error('导出失败:', error);
        showError('导出失败');
    }
}

// 清空所有收藏
async function clearAll() {
    if (!confirm('确定要清空所有收藏吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        await chrome.storage.local.set({ bookmarks: [] });
        showSuccess('所有收藏已清空');
        loadBookmarks();
    } catch (error) {
        console.error('清空失败:', error);
        showError('清空失败');
    }
}


