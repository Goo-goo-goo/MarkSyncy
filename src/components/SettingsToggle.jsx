import React, { useState } from 'react';
import { SettingsIcon, CloudIcon, GithubIcon } from 'lucide-react';

const SettingsToggle = ({ onSyncClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-20 z-50">
      {/* Settings Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-3 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        title="设置"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {/* Settings Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-48 animate-fade-in">
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onSyncClick();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <CloudIcon className="w-4 h-4" />
            <span>同步设置</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsToggle;