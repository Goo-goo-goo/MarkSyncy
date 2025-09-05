import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const DeleteCollectionDialog = ({ open, onOpenChange, collection, onDeleteCollection }) => {
  const handleDelete = () => {
    onDeleteCollection(collection.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">删除收藏组</DialogTitle>
          <DialogDescription className="text-gray-500">
            您确定要删除收藏组 "{collection?.name}" 吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};