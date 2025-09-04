// 内容脚本 - 在每个网页中运行
(function() {
    'use strict';

    // 检查当前页面是否已经被收藏
    async function checkBookmarkStatus() {
        try {
            const result = await chrome.storage.local.get(['bookmarks']);
            const bookmarks = result.bookmarks || [];
            const currentUrl = window.location.href;
            
            const isBookmarked = bookmarks.some(bookmark => bookmark.url === currentUrl);
            
            // 如果页面已经被收藏，可以添加视觉提示
            if (isBookmarked) {
                addBookmarkIndicator();
            }
        } catch (error) {
            console.error('检查收藏状态失败:', error);
        }
    }

    // 添加收藏指示器
    function addBookmarkIndicator() {
        // 创建一个小的收藏指示器
        const indicator = document.createElement('div');
        indicator.innerHTML = '📚';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 8px;
            border-radius: 50%;
            font-size: 16px;
            z-index: 10000;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        indicator.title = '此页面已被收藏';
        
        // 悬停效果
        indicator.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.background = 'rgba(76, 175, 80, 1)';
        });
        
        indicator.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.background = 'rgba(76, 175, 80, 0.9)';
        });
        
        // 点击显示收藏信息
        indicator.addEventListener('click', function() {
            showBookmarkInfo();
        });
        
        document.body.appendChild(indicator);
    }

    // 显示收藏信息
    async function showBookmarkInfo() {
        try {
            const result = await chrome.storage.local.get(['bookmarks']);
            const bookmarks = result.bookmarks || [];
            const currentUrl = window.location.href;
            
            const bookmark = bookmarks.find(b => b.url === currentUrl);
            if (bookmark) {
                const date = new Date(bookmark.timestamp);
                const formattedDate = date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // 创建信息弹窗
                const infoBox = document.createElement('div');
                infoBox.innerHTML = `
                    <div style="padding: 16px; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 300px;">
                        <h3 style="margin: 0 0 12px 0; color: #333;">📚 收藏信息</h3>
                        <p style="margin: 8px 0; color: #666;"><strong>标题:</strong> ${bookmark.title}</p>
                        <p style="margin: 8px 0; color: #666;"><strong>收藏时间:</strong> ${formattedDate}</p>
                        <button id="removeBookmark" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 12px;">取消收藏</button>
                        <button id="closeInfo" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 12px; margin-left: 8px;">关闭</button>
                    </div>
                `;
                
                infoBox.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10001;
                    background: rgba(0,0,0,0.5);
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                
                document.body.appendChild(infoBox);
                
                // 绑定事件
                document.getElementById('removeBookmark').addEventListener('click', function() {
                    removeBookmark();
                    document.body.removeChild(infoBox);
                });
                
                document.getElementById('closeInfo').addEventListener('click', function() {
                    document.body.removeChild(infoBox);
                });
                
                // 点击背景关闭
                infoBox.addEventListener('click', function(e) {
                    if (e.target === infoBox) {
                        document.body.removeChild(infoBox);
                    }
                });
            }
        } catch (error) {
            console.error('显示收藏信息失败:', error);
        }
    }

    // 取消收藏
    async function removeBookmark() {
        try {
            const result = await chrome.storage.local.get(['bookmarks']);
            const bookmarks = result.bookmarks || [];
            const currentUrl = window.location.href;
            
            const updatedBookmarks = bookmarks.filter(bookmark => bookmark.url !== currentUrl);
            await chrome.storage.local.set({ bookmarks: updatedBookmarks });
            
            // 刷新页面以移除指示器
            location.reload();
        } catch (error) {
            console.error('取消收藏失败:', error);
        }
    }

    // 页面加载完成后检查收藏状态
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkBookmarkStatus);
    } else {
        checkBookmarkStatus();
    }

    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'checkBookmarkStatus') {
            checkBookmarkStatus();
            sendResponse({ success: true });
        }
    });

})();
