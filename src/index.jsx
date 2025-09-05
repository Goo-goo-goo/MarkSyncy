import { useState } from "react";
import { PlusIcon, SearchIcon, FolderIcon, TrashIcon, EditIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateCollectionDialog } from "@/components/CreateCollectionDialog";
import { CollectionCard } from "@/components/CollectionCard";
import { EditCollectionDialog } from "@/components/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/DeleteCollectionDialog";

const Index = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collections, setCollections] = useState([
    { id: 1, name: "工作文档", count: 12, color: "bg-blue-500" },
    { id: 2, name: "学习资料", count: 8, color: "bg-green-500" },
    { id: 3, name: "灵感收藏", count: 15, color: "bg-purple-500" },
  ]);

  const handleCreateCollection = (name) => {
    const newCollection = {
      id: Date.now(),
      name,
      count: 0,
      color: "bg-gray-500",
    };
    setCollections([...collections, newCollection]);
  };

  const handleEditCollection = (id, newName) => {
    setCollections(collections.map(collection => 
      collection.id === id ? { ...collection, name: newName } : collection
    ));
  };

  const handleDeleteCollection = (id) => {
    setCollections(collections.filter(collection => collection.id !== id));
  };

  const openEditDialog = (collection) => {
    setSelectedCollection(collection);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (collection) => {
    setSelectedCollection(collection);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">我的收藏</h1>
          <p className="text-gray-600">管理和组织您的收藏内容</p>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索收藏..."
              className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            新建收藏组
          </Button>
        </div>

        {/* 收藏组列表 */}
        <div className="space-y-4">
          {collections.map((collection) => (
            <div key={collection.id} className="relative group">
              <CollectionCard
                name={collection.name}
                count={collection.count}
                color={collection.color}
              />
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => openEditDialog(collection)}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => openDeleteDialog(collection)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {collections.length === 0 && (
          <div className="text-center py-16">
            <FolderIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏组</h3>
            <p className="text-gray-500 mb-6">创建您的第一个收藏组来开始组织内容</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              创建收藏组
            </Button>
          </div>
        )}
      </div>

      {/* 对话框 */}
      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateCollection={handleCreateCollection}
      />
      
      {selectedCollection && (
        <>
          <EditCollectionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            collection={selectedCollection}
            onEditCollection={handleEditCollection}
          />
          
          <DeleteCollectionDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            collection={selectedCollection}
            onDeleteCollection={handleDeleteCollection}
          />
        </>
      )}
    </div>
  );
};

export default Index;