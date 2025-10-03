'use client';

import React from 'react';

// Project 데이터 구조와 이벤트 핸들러를 props로 받습니다.
interface Project {
  id: string;
  name: string;
}

interface ProjectItemProps {
  project: Project;
  onLoad: (projectId: string) => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectItem({ project, onLoad, onEdit, onDelete }: ProjectItemProps) {
  return (
    <li key={project.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
      <span onClick={() => onLoad(project.id)} className="font-semibold cursor-pointer hover:text-blue-400">
        {project.name}
      </span>
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); onEdit(project.id); }} className="text-gray-400 hover:text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="text-gray-400 hover:text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </li>
  );
}