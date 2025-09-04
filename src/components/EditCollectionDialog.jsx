import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const EditCollectionDialog = ({ open, onOpenChange, collection, onEditCollection }) => {
  const [name, setName] = useState(collection?.name || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("收藏组名称不能为空");
      return;
    }
    
    if (name.length > 30) {
      setError("收藏组名称不能超过30个字符");
      return;
    }
    
    onEditCollection(collection.id, name.trim());
    setName("");
    setError("");
    onOpenChange(false);
  };

  const handleInputChange = (e) => {
    setName(e.target.value);
    if (error) setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">编辑收藏组</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                收藏组名称
              </Label>
              <Input
                id="name"
                value={name}
                onChange={handleInputChange}
                placeholder="输入收藏组名称"
                className={`rounded-lg border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 ${
                  error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};