import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { PlusIcon, SearchIcon, FolderIcon, TrashIcon, EditIcon, ExternalLinkIcon, ClockIcon, GlobeIcon, UploadIcon, ListIcon, GridIcon, CheckSquareIcon, SquareIcon, XIcon, DownloadIcon, SettingsIcon } from 'lucide-react';
import { importBookmarksFromFile, exportBookmarksToFile } from './utils/bookmarkParser';
import { ThemeProvider } from './contexts/ThemeContext';
import DarkModeToggle from './components/DarkModeToggle';
import SettingsToggle from './components/SettingsToggle';
import SyncSettingsModal from './components/SyncSettingsModal';

// 简化的UI组件
const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:ring-gray-500'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className} transform transition-all duration-200 hover:scale-105 active:scale-95`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, className = '', ...props }) => {
  return (
    <input
      type="text"
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:scale-105 focus:shadow-lg ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="modal-content bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-scale-up transform transition-all duration-300 hover:shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// 列表视图的书签项组件
const BookmarkListItem = ({ bookmark, group, onDelete, onEdit, selectionMode, isSelected, onToggleSelect }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`list-item bg-white dark:bg-gray-800 border rounded-lg p-3 hover:shadow-md transition-all duration-300 animate-slide-up group ${
      isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
    }`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 选择框 */}
          {selectionMode && (
            <div className="flex-shrink-0">
              <button
                onClick={() => onToggleSelect(bookmark.id)}
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 hover:border-blue-400'
                }"
              >
                {isSelected && <CheckSquareIcon className="w-3 h-3" />}
              </button>
            </div>
          )}
          
          {/* 图标 */}
          <div className="flex-shrink-0">
            {bookmark.favicon ? (
              <img 
                src={bookmark.favicon} 
                alt="favicon" 
                className="w-5 h-5 rounded"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <GlobeIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
          
          {/* 标题 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={bookmark.title}>
              {bookmark.title}
            </h3>
          </div>
          
          {/* 分组标签 */}
          {group && (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                   style={{ backgroundColor: group.color + '20', color: group.color }}>
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: group.color }}
                />
                <span className="truncate max-w-16" title={group.name}>{group.name}</span>
              </div>
            </div>
          )}
          
          {/* 日期 */}
          <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {formatDate(bookmark.timestamp)}
          </div>
        </div>
        
        {/* 操作按钮 */}
        {!selectionMode && (
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(bookmark.url, '_blank')}
              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
              title="打开链接"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(bookmark)}
              className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
              title="编辑"
            >
              <EditIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(bookmark.id)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title="删除"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// 画廊视图的书签项组件
const BookmarkGalleryItem = ({ bookmark, group, onDelete, onEdit, selectionMode, isSelected, onToggleSelect }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取域名用于显示
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className={`gallery-item bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-scale-up ${
      isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl'
    } flex flex-col relative overflow-hidden group`}>
      <div className="flex flex-col flex-1">
        {/* 装饰性光效 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* 选择框 */}
        {selectionMode && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => onToggleSelect(bookmark.id)}
              className="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-300 hover:border-blue-400'
              }"
            >
              {isSelected && <CheckSquareIcon className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* 头部：图标和标题 */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            {bookmark.favicon ? (
              <img 
                src={bookmark.favicon} 
                alt="favicon" 
                className="w-8 h-8 rounded-lg"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <GlobeIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1" title={bookmark.title}>
              {bookmark.title}
            </h3>
            {group && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium inline-flex"
                   style={{ backgroundColor: group.color + '20', color: group.color }}>
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: group.color }}
                />
                <span className="truncate max-w-20" title={group.name}>{group.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* URL信息 */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">网址</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={bookmark.url}>
            {bookmark.url}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {getDomain(bookmark.url)}
          </p>
        </div>

        {/* 时间信息 */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">添加时间</p>
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <ClockIcon className="w-3 h-3" />
            {formatDate(bookmark.timestamp)}
          </div>
        </div>

        {/* 操作按钮 */}
        {!selectionMode && (
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(bookmark.url, '_blank')}
                className="px-3 py-1.5 text-xs"
              >
                <ExternalLinkIcon className="w-3 h-3 mr-1" />
                打开
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(bookmark)}
                className="px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <EditIcon className="w-3 h-3 mr-1" />
                编辑
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(bookmark.id)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title="删除"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// 书签项组件（根据视图模式选择）
const BookmarkItem = ({ bookmark, group, onDelete, onEdit, viewMode, selectionMode, isSelected, onToggleSelect }) => {
  if (viewMode === 'gallery') {
    return <BookmarkGalleryItem bookmark={bookmark} group={group} onDelete={onDelete} onEdit={onEdit} selectionMode={selectionMode} isSelected={isSelected} onToggleSelect={onToggleSelect} />;
  }
  return <BookmarkListItem bookmark={bookmark} group={group} onDelete={onDelete} onEdit={onEdit} selectionMode={selectionMode} isSelected={isSelected} onToggleSelect={onToggleSelect} />;
};

// 主管理页面组件
const ManagePage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '', group: 'default' });
  const [newGroup, setNewGroup] = useState({ name: '', color: '#667eea' });
  const [importStatus, setImportStatus] = useState({ loading: false, message: '', error: '' });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'gallery'
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBookmarks, setSelectedBookmarks] = useState(new Set());
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 加载收藏数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await chrome.storage.local.get(['bookmarks', 'groups', 'viewMode']);
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
      
      // 为每个收藏添加唯一ID
      const bookmarksWithId = bookmarks.map((bookmark, index) => ({
        ...bookmark,
        id: bookmark.id || `bookmark_${index}_${Date.now()}`,
        group: bookmark.group || 'default'
      }));
      
      setBookmarks(bookmarksWithId);
      setGroups(groups);
      setViewMode(result.viewMode || 'list');
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const saveGroups = async (newGroups) => {
    try {
      await chrome.storage.local.set({ groups: newGroups });
      setGroups(newGroups);
    } catch (error) {
      console.error('保存分组失败:', error);
    }
  };

  const saveBookmarks = async (newBookmarks) => {
    try {
      await chrome.storage.local.set({ bookmarks: newBookmarks });
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('保存收藏失败:', error);
    }
  };

  const handleCreateBookmark = async () => {
    if (!newBookmark.title || !newBookmark.url) return;
    
    const bookmark = {
      ...newBookmark,
      id: `bookmark_${Date.now()}`,
      timestamp: new Date().toISOString(),
      favicon: '',
      group: newBookmark.group || 'default'
    };
    
    const updatedBookmarks = [...bookmarks, bookmark];
    await saveBookmarks(updatedBookmarks);
    
    setNewBookmark({ title: '', url: '', group: 'default' });
    setIsCreateModalOpen(false);
  };

  const handleEditBookmark = async () => {
    if (!editingBookmark || !editingBookmark.title || !editingBookmark.url) return;
    
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === editingBookmark.id ? editingBookmark : bookmark
    );
    
    await saveBookmarks(updatedBookmarks);
    setIsEditModalOpen(false);
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = async (id) => {
    if (!confirm('确定要删除这个收藏吗？')) return;
    
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    await saveBookmarks(updatedBookmarks);
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    
    const group = {
      id: `group_${Date.now()}`,
      name: newGroup.name.trim(),
      color: newGroup.color,
      createdAt: new Date().toISOString()
    };
    
    const updatedGroups = [...groups, group];
    await saveGroups(updatedGroups);
    
    setNewGroup({ name: '', color: '#667eea' });
    setIsCreateGroupModalOpen(false);
  };

  const handleImportBookmarks = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportStatus({ loading: true, message: '正在导入书签...', error: '' });

    try {
      const { bookmarks: importedBookmarks, folders: importedFolders } = await importBookmarksFromFile(file);
      
      // 合并文件夹（检查重复名称）
      const existingFolderNames = groups.map(g => g.name);
      const newFolders = importedFolders.filter(folder => 
        !existingFolderNames.includes(folder.name)
      );
      
      // 为新文件夹创建名称到ID的映射
      const folderNameToIdMap = {};
      newFolders.forEach(folder => {
        folderNameToIdMap[folder.name] = folder.id;
      });
      
      const updatedGroups = [...groups, ...newFolders];
      
      // 合并书签（检查重复URL）
      const existingUrls = bookmarks.map(b => b.url);
      const newBookmarks = importedBookmarks.filter(bookmark => 
        !existingUrls.includes(bookmark.url)
      );
      
      // 如果书签引用了已存在的文件夹（通过名称），则更新书签的group ID
      const finalBookmarks = newBookmarks.map(bookmark => {
        if (bookmark.group && bookmark.group !== 'default') {
          // 查找书签所属文件夹的名称
          const bookmarkFolder = importedFolders.find(f => f.id === bookmark.group);
          if (bookmarkFolder) {
            // 在现有文件夹中查找同名的文件夹
            const existingFolder = groups.find(g => g.name === bookmarkFolder.name);
            if (existingFolder) {
              return { ...bookmark, group: existingFolder.id };
            }
          }
        }
        return bookmark;
      });
      
      const updatedBookmarks = [...bookmarks, ...finalBookmarks];
      
      // 保存到存储
      await chrome.storage.local.set({ groups: updatedGroups });
      await chrome.storage.local.set({ bookmarks: updatedBookmarks });
      
      setGroups(updatedGroups);
      setBookmarks(updatedBookmarks);
      
      setImportStatus({ 
        loading: false, 
        message: `成功导入 ${finalBookmarks.length} 个书签和 ${newFolders.length} 个文件夹`, 
        error: '' 
      });
      
      // 3秒后关闭模态框
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStatus({ loading: false, message: '', error: '' });
      }, 3000);
      
    } catch (error) {
      setImportStatus({ 
        loading: false, 
        message: '', 
        error: error.message 
      });
    }
  };

  const handleExportBookmarks = () => {
    try {
      // 生成文件名
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `bookmarks_${dateStr}.html`;
      
      // 导出书签
      exportBookmarksToFile(bookmarks, groups, filename);
      
      // 显示成功消息
      alert(`书签已成功导出到 ${filename}`);
    } catch (error) {
      console.error('导出书签失败:', error);
      alert('导出书签失败，请重试');
    }
  };

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    try {
      await chrome.storage.local.set({ viewMode: mode });
    } catch (error) {
      console.error('保存视图模式失败:', error);
    }
  };

  // 选择模式相关函数
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedBookmarks(new Set());
  };

  const toggleBookmarkSelection = (bookmarkId) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(bookmarkId)) {
      newSelected.delete(bookmarkId);
    } else {
      newSelected.add(bookmarkId);
    }
    setSelectedBookmarks(newSelected);
  };

  const selectAllBookmarks = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      const allIds = new Set(filteredBookmarks.map(b => b.id));
      setSelectedBookmarks(allIds);
    }
  };

  // 批量操作函数
  const handleBatchDelete = async () => {
    if (selectedBookmarks.size === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedBookmarks.size} 个收藏吗？`)) return;
    
    try {
      const updatedBookmarks = bookmarks.filter(bookmark => 
        !selectedBookmarks.has(bookmark.id)
      );
      
      await chrome.storage.local.set({ bookmarks: updatedBookmarks });
      setBookmarks(updatedBookmarks);
      setSelectedBookmarks(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  const handleBatchOpen = () => {
    if (selectedBookmarks.size === 0) return;
    
    const selectedBookmarkData = bookmarks.filter(bookmark => 
      selectedBookmarks.has(bookmark.id)
    );
    
    selectedBookmarkData.forEach(bookmark => {
      window.open(bookmark.url, '_blank');
    });
  };

  const handleBatchMove = async (targetGroupId) => {
    if (selectedBookmarks.size === 0) return;
    
    try {
      const updatedBookmarks = bookmarks.map(bookmark => 
        selectedBookmarks.has(bookmark.id) 
          ? { ...bookmark, group: targetGroupId }
          : bookmark
      );
      
      await chrome.storage.local.set({ bookmarks: updatedBookmarks });
      setBookmarks(updatedBookmarks);
      setSelectedBookmarks(new Set());
      setSelectionMode(false);
      setIsBatchMoveModalOpen(false);
    } catch (error) {
      console.error('批量移动失败:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (groupId === 'default') {
      alert('默认分组不能删除');
      return;
    }
    
    if (!confirm('确定要删除这个分组吗？该分组下的所有收藏将移动到默认分组。')) return;
    
    // 将该分组下的收藏移动到默认分组
    const updatedBookmarks = bookmarks.map(bookmark => 
      bookmark.group === groupId ? { ...bookmark, group: 'default' } : bookmark
    );
    
    const updatedGroups = groups.filter(group => group.id !== groupId);
    
    await saveBookmarks(updatedBookmarks);
    await saveGroups(updatedGroups);
    
    if (selectedGroup === groupId) {
      setSelectedGroup('all');
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || bookmark.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const getGroupById = (groupId) => {
    return groups.find(g => g.id === groupId);
  };

  const getGroupBookmarkCount = (groupId) => {
    return bookmarks.filter(bookmark => bookmark.group === groupId).length;
  };

  return (
    <div className="manage-container flex flex-col bg-gray-50 dark:bg-gray-900 animate-fade-in" style={{ height: '100vh' }}>
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-blue-600 mr-3 animate-pulse-gentle" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100"> 🐳 MarkSyncy ~ 🐳</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {bookmarks.length} 个收藏
              </span>
              
              {/* 选择模式按钮 */}
              <Button
                variant={selectionMode ? 'primary' : 'outline'}
                size="sm"
                onClick={toggleSelectionMode}
                className="px-3 py-2"
                title={selectionMode ? '退出选择模式' : '进入选择模式'}
              >
                {selectionMode ? <CheckSquareIcon className="w-4 h-4" /> : <SquareIcon className="w-4 h-4" />}
              </Button>
              
              {/* 视图模式切换 */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="px-3 py-2"
                  title="列表视图"
                  disabled={selectionMode}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'gallery' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('gallery')}
                  className="px-3 py-2"
                  title="画廊视图"
                  disabled={selectionMode}
                >
                  <GridIcon className="w-4 h-4" />
                </Button>
              </div>
              
              {/* 添加和导入按钮 */}
              <Button onClick={() => setIsCreateModalOpen(true)} disabled={selectionMode}>
                <PlusIcon className="w-4 h-4 mr-2" />
                添加收藏
              </Button>
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)} disabled={selectionMode}>
                <UploadIcon className="w-4 h-4 mr-2" />
                导入收藏
              </Button>
              <Button variant="outline" onClick={handleExportBookmarks} disabled={selectionMode}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                导出收藏
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 批量操作工具栏 */}
      {selectionMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex-shrink-0 animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  已选择 {selectedBookmarks.size} 个收藏
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllBookmarks}
                  className="px-3 py-1 text-xs"
                >
                  {selectedBookmarks.size === filteredBookmarks.length ? '取消全选' : '全选'}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchOpen}
                  disabled={selectedBookmarks.size === 0}
                  className="px-3 py-1 text-xs"
                  title="批量打开"
                >
                  <ExternalLinkIcon className="w-3 h-3 mr-1" />
                  打开 ({selectedBookmarks.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchMoveModalOpen(true)}
                  disabled={selectedBookmarks.size === 0}
                  className="px-3 py-1 text-xs"
                  title="批量移动"
                >
                  <FolderIcon className="w-3 h-3 mr-1" />
                  移动 ({selectedBookmarks.size})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBatchDelete}
                  disabled={selectedBookmarks.size === 0}
                  className="px-3 py-1 text-xs"
                  title="批量删除"
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  删除 ({selectedBookmarks.size})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="px-2 py-1 text-xs"
                  title="退出选择模式"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 分组管理 */}
        <div className="sidebar w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800 animate-slide-in-left">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">分组</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="px-2 py-1"
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <button
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  selectedGroup === 'all' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md scale-105' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md'
                }`}
                onClick={() => setSelectedGroup('all')}
              >
                <div className="flex items-center justify-between">
                  <span>全部收藏</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{bookmarks.length}</span>
                </div>
              </button>
              
              {groups.map((group) => (
                <div key={group.id} className="flex items-center group">
                  <button
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 group-item ${
                      selectedGroup === group.id 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 active shadow-md scale-105' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full animate-pulse-gentle transform transition-transform duration-200 group-hover:scale-125" 
                          style={{ backgroundColor: group.color }}
                        />
                        <span>{group.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getGroupBookmarkCount(group.id)}
                      </span>
                    </div>
                  </button>
                  {group.id !== 'default' && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <TrashIcon className="w-3 h-3 transform transition-transform duration-200 hover:rotate-12" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="main-content flex-1 overflow-hidden flex flex-col animate-slide-in-right">
          {/* 搜索栏 */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="px-6 py-4">
              <div className="relative max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 animate-pulse-gentle" />
                <Input
                  placeholder="搜索收藏..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                {bookmarks.length === 0 ? (
                  <>
                    <FolderIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-float" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 animate-slide-up">暂无收藏</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>开始添加您的第一个收藏吧！</p>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="animate-bounce-in"
                      style={{ animationDelay: '0.2s' }}
                    >
                      添加收藏
                    </Button>
                  </>
                ) : (
                  <>
                    <SearchIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-pulse-gentle" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 animate-slide-up">未找到匹配的收藏</h3>
                    <p className="text-gray-500 dark:text-gray-400 animate-slide-up" style={{ animationDelay: '0.1s' }}>尝试使用不同的搜索关键词</p>
                  </>
                )}
              </div>
            ) : (
              <div className={viewMode === 'gallery' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start pb-8' : 'space-y-3'}>
                {filteredBookmarks.map((bookmark, index) => (
                  <div 
                    key={bookmark.id} 
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <BookmarkItem
                      bookmark={bookmark}
                      group={getGroupById(bookmark.group)}
                      onDelete={handleDeleteBookmark}
                      onEdit={(bookmark) => {
                        setEditingBookmark(bookmark);
                        setIsEditModalOpen(true);
                      }}
                      viewMode={viewMode}
                      selectionMode={selectionMode}
                      isSelected={selectedBookmarks.has(bookmark.id)}
                      onToggleSelect={toggleBookmarkSelection}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建收藏模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="添加新收藏"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标题
            </label>
            <Input
              placeholder="输入收藏标题"
              value={newBookmark.title}
              onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <Input
              placeholder="输入网页地址"
              value={newBookmark.url}
              onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分组
            </label>
            <select
              value={newBookmark.group}
              onChange={(e) => setNewBookmark({ ...newBookmark, group: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateBookmark}>
              添加
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑收藏模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑收藏"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标题
            </label>
            <Input
              placeholder="输入收藏标题"
              value={editingBookmark?.title || ''}
              onChange={(e) => setEditingBookmark({ ...editingBookmark, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <Input
              placeholder="输入网页地址"
              value={editingBookmark?.url || ''}
              onChange={(e) => setEditingBookmark({ ...editingBookmark, url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分组
            </label>
            <select
              value={editingBookmark?.group || 'default'}
              onChange={(e) => setEditingBookmark({ ...editingBookmark, group: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditBookmark}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 创建分组模态框 */}
      <Modal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        title="创建新分组"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分组名称
            </label>
            <Input
              placeholder="输入分组名称"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分组颜色
            </label>
            <div className="color-picker flex gap-2 flex-wrap">
              {['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'].map((color, index) => (
                <button
                  key={color}
                  className={`color-option w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 transform transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                    newGroup.color === color ? 'selected ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-lg' : ''
                  }`}
                  style={{ 
                    backgroundColor: color,
                    animationDelay: `${index * 50}ms`
                  }}
                  onClick={() => setNewGroup({ ...newGroup, color })}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateGroupModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批量移动模态框 */}
      <Modal
        isOpen={isBatchMoveModalOpen}
        onClose={() => setIsBatchMoveModalOpen(false)}
        title="批量移动收藏"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              将选中的 {selectedBookmarks.size} 个收藏移动到：
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleBatchMove(group.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{group.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {getGroupBookmarkCount(group.id)} 个收藏
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsBatchMoveModalOpen(false)}>
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 导入收藏模态框 */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportStatus({ loading: false, message: '', error: '' });
        }}
        title="导入收藏"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              选择书签文件
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              支持 Edge、Chrome、Firefox 等浏览器导出的书签文件（HTML 格式）
            </p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <UploadIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleImportBookmarks}
                className="hidden"
                id="bookmark-file-input"
                disabled={importStatus.loading}
              />
              <label
                htmlFor="bookmark-file-input"
                className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  importStatus.loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {importStatus.loading ? '导入中...' : '选择文件'}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                或拖拽文件到此处
              </p>
            </div>
          </div>
          
          {/* 状态信息 */}
          {importStatus.message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <div className="flex items-center">
                <div className="text-green-800 dark:text-green-300 text-sm">{importStatus.message}</div>
              </div>
            </div>
          )}
          
          {importStatus.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex items-center">
                <div className="text-red-800 dark:text-red-300 text-sm">{importStatus.error}</div>
              </div>
            </div>
          )}
          
          {importStatus.loading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <div className="text-blue-800 dark:text-blue-300 text-sm">{importStatus.message}</div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 夜间模式切换按钮 */}
      <DarkModeToggle />
      
      {/* 设置按钮 */}
      <SettingsToggle onSyncClick={() => setIsSyncModalOpen(true)} />
      
      {/* 同步设置模态框 */}
      <SyncSettingsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        bookmarks={bookmarks}
        groups={groups}
      />
    </div>
  );
};

// 用主题提供者包装的ManagePage组件
const ManagePageWithTheme = () => (
  <ThemeProvider>
    <ManagePage />
  </ThemeProvider>
);

// 导出包装后的组件
export default ManagePageWithTheme;
