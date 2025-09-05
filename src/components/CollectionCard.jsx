import { FolderIcon, ChevronRightIcon } from "lucide-react";

export const CollectionCard = ({ name, count, color }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-up relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center transform transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110`}>
            <FolderIcon className="h-6 w-6 text-white animate-pulse-gentle" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <p className="text-gray-500 text-sm">{count} 个项目</p>
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </div>
  );
};