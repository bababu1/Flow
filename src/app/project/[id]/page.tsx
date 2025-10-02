// src/app/project/[id]/page.tsx

'use client';

import { useState, useEffect, MouseEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QuestNode from '@/components/QuestNode';

// --- 타입 정의 ---
interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
}
interface Project {
  id: string;
  name: string;
  nodes: { [key: string]: Node };
  connections: any[];
}
interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const storedProjects = localStorage.getItem('localDataProjects');
    if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const currentProject = projects.find((p: Project) => p.id === projectId);
        if (currentProject) { setProject(currentProject); }
    }
    setLoading(false);
  }, [projectId]);

  const saveProject = (updatedProject: Project) => {
    const storedProjects = localStorage.getItem('localDataProjects');
    if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const updatedProjects = projects.map((p: Project) => p.id === updatedProject.id ? updatedProject : p);
        localStorage.setItem('localDataProjects', JSON.stringify(updatedProjects));
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handleMapClick = () => {
    setContextMenu({ ...contextMenu, visible: false });
    setSelectedNodeId(null);
  };

  const handleCreateNode = () => {
    if (!project) return;
    const newNode: Node = { id: 'node_' + Date.now(), title: '새 챕터', x: contextMenu.x, y: contextMenu.y, };
    const updatedProject = { ...project, nodes: { ...project.nodes, [newNode.id]: newNode, }, };
    setProject(updatedProject);
    saveProject(updatedProject);
    handleMapClick();
  };
  
  // 드래그가 '끝났을 때'만 호출될 함수입니다.
  // 여기서 전체 프로젝트 상태를 업데이트하고 localStorage에 저장합니다.
  const handleNodeDragEnd = (nodeId: string, finalPosition: { x: number, y: number }) => {
    setProject(prevProject => {
      if (!prevProject) return null;

      const updatedNodes = {
        ...prevProject.nodes,
        [nodeId]: { ...prevProject.nodes[nodeId], ...finalPosition }
      };

      const updatedProject = { ...prevProject, nodes: updatedNodes };
      
      // 상태 업데이트와 저장을 한번에 처리
      saveProject(updatedProject);
      
      return updatedProject;
    });
  };

  if (loading) { return <div>로딩 중...</div>; }
  if (!project) { return <div>프로젝트를 찾을 수 없습니다.</div>; }

  return (
    <div id="quest-map-view" onClick={handleMapClick}>
      <div id="quest-map-container" onContextMenu={handleContextMenu}>
        <Link href="/" id="back-to-projects" className="fixed top-4 left-4 z-20 breadcrumb-link text-white font-bold text-lg cursor-pointer hover:text-blue-400">&lt; 프로젝트 목록</Link>
        <div id="quest-map">
          <svg id="connector-svg">{/* 커넥터 로직은 추후 추가 */}</svg>
          
          {Object.values(project.nodes).map((node) => (
            <QuestNode 
              key={node.id} 
              node={node} 
              // onPositionChange prop을 제거하고 onDragEnd만 남깁니다.
              onDragEnd={handleNodeDragEnd}
              isSelected={selectedNodeId === node.id}
              onSelect={setSelectedNodeId}
            />
          ))}
        </div>
        {contextMenu.visible && (
          <div className="fixed bg-gray-700 text-white rounded-md shadow-lg py-1 z-50" style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}>
            <ul>
              <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer" onClick={handleCreateNode}>챕터 생성</li>
              <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer">이미지 추가</li>
            </ul>
          </div>
        )}
      </div>
      <div id="panel-resizer"></div>
      <div id="directory-tree-panel">
        <h2 id="project-title-in-tree" className="text-xl font-bold mb-4 pb-2 border-b border-gray-600 cursor-pointer">
          {project.name}
        </h2>
        <ul id="directory-tree"></ul>
      </div>
    </div>
  );
}