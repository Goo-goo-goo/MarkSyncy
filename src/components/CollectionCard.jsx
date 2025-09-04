import { FolderIcon, ChevronRightIcon } from "lucide-react";

export const CollectionCard = ({ name, count, color }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <FolderIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <p className="text-gray-500 text-sm">{count} 个项目</p>
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </div>
  );
};