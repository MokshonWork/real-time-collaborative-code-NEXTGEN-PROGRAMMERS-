import React, { useState } from 'react';
import { FileNode, getLanguageFromFileName } from '../types/collaboration';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (fileId: string) => void;
}

const FileIcon: React.FC<{ fileName: string; isFolder?: boolean; isOpen?: boolean }> = ({ 
  fileName, 
  isFolder, 
  isOpen 
}) => {
  if (isFolder) {
    return isOpen ? (
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
        <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }

  const lang = getLanguageFromFileName(fileName);
  const colors: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    html: '#e34c26',
    css: '#264de4',
    python: '#3776ab',
    json: '#292929',
    markdown: '#083fa1',
    java: '#b07219',
    cpp: '#00599C',
    go: '#00ADD8',
    rust: '#dea584',
    ruby: '#CC342D',
    php: '#777BB4',
  };

  const color = colors[lang] || '#6b7280';

  return (
    <svg className="w-4 h-4" fill={color} viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
};

const FileTreeItem: React.FC<{
  node: FileNode;
  depth: number;
  activeFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onDeleteFile: (fileId: string) => void;
}> = ({ node, depth, activeFileId, onFileSelect, onDeleteFile }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node);
    }
  };

  const isActive = node.id === activeFileId;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors ${
          isActive ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {node.type === 'folder' && (
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        <FileIcon fileName={node.name} isFolder={node.type === 'folder'} isOpen={isOpen} />
        <span className="text-sm text-gray-300 truncate flex-1">{node.name}</span>
        
        {isHovered && node.type === 'file' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.id);
            }}
            className="p-0.5 hover:bg-red-500/20 rounded"
          >
            <svg className="w-3 h-3 text-gray-500 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
}) => {
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && isCreating) {
      onCreateFile(newName.trim(), isCreating);
      setNewName('');
      setIsCreating(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 uppercase tracking-wider border-b border-[#3c3c3c]">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating('file')}
            className="p-1 hover:bg-[#3c3c3c] rounded"
            title="New File"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={() => setIsCreating('folder')}
            className="p-1 hover:bg-[#3c3c3c] rounded"
            title="New Folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* New File/Folder Input */}
      {isCreating && (
        <form onSubmit={handleCreate} className="px-2 py-2 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2">
            <FileIcon fileName={isCreating === 'folder' ? '' : newName || '.txt'} isFolder={isCreating === 'folder'} />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isCreating === 'file' ? 'filename.js' : 'folder name'}
              className="flex-1 bg-[#3c3c3c] text-sm text-white px-2 py-1 rounded outline-none focus:ring-1 focus:ring-[#007acc]"
              autoFocus
              onBlur={() => {
                if (!newName.trim()) setIsCreating(null);
              }}
            />
          </div>
        </form>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto py-2">
        {files.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            depth={0}
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
            onDeleteFile={onDeleteFile}
          />
        ))}
      </div>
    </div>
  );
};
