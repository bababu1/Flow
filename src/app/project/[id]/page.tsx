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


  const handleNodeSelect = (nodeId: string) => {
    // 이미 선택된 노드가 있다면 (연결을 만들어야 할 때)
    if (selectedNodeId && selectedNodeId !== nodeId) {
      if (!project) return;

      // 이미 같은 연결이 있는지 확인 (중복 방지)
      const connectionExists = project.connections.some(
        c => c.from === selectedNodeId && c.to === nodeId
      );

      if (!connectionExists) {
        const newConnection = {
          id: 'conn_' + Date.now(),
          from: selectedNodeId,
          to: nodeId
        };
        const updatedProject = {
          ...project,
          connections: [...project.connections, newConnection]
        };
        setProject(updatedProject);
        saveProject(updatedProject);
      }
      
      // 연결을 만든 후에는 선택 상태를 해제합니다.
      setSelectedNodeId(null);

    } else {
      // 선택된 노드가 없다면, 그냥 이 노드를 선택합니다.
      setSelectedNodeId(nodeId);
    }
  };

  const handleNodeDrag = (nodeId: string, newPosition: { x: number, y: number }) => {
    setProject(prevProject => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        nodes: {
          ...prevProject.nodes,
          [nodeId]: { ...prevProject.nodes[nodeId], ...newPosition }
        }
      };
    });
  };
  
  // 드래그가 '끝났을 때'만 호출될 함수입니다.
  // 여기서 전체 프로젝트 상태를 업데이트하고 localStorage에 저장합니다.
  const handleNodeDragEnd = (nodeId: string, finalPosition: { x: number, y: number }) => {
    if (project) {
      saveProject(project);
    }
  };

  if (loading) { return <div>로딩 중...</div>; }
  if (!project) { return <div>프로젝트를 찾을 수 없습니다.</div>; }

  return (
    <div id="quest-map-view" onClick={handleMapClick}>
      <div id="quest-map-container" onContextMenu={handleContextMenu}>
        <Link href="/" id="back-to-projects" className="fixed top-4 left-4 z-20 breadcrumb-link text-white font-bold text-lg cursor-pointer hover:text-blue-400">&lt; 프로젝트 목록</Link>
        <div id="quest-map">
        <svg id="connector-svg" className="absolute top-0 left-0 w-full h-full pointer-events-none">
  {/* ▼▼▼ 화살촉 모양을 정의하는 <defs> 태그 추가 ▼▼▼ */}
  <defs>
  <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
  </marker>
  </defs>
  
  {/* ▼▼▼ project.connections 배열을 순회하며 선을 그리는 코드 추가 ▼▼▼ */}
  {project.connections.map(conn => {
  const fromNode = project.nodes[conn.from];
  const toNode = project.nodes[conn.to];

  if (!fromNode || !toNode) return null;

  // ▼▼▼ 여기부터 계산 로직이 복잡해집니다 ▼▼▼

  // 1. 각 노드의 너비(160), 높이(96), 중심점 좌표 계산
  const nodeWidth = 160;
  const nodeHeight = 96;
  const startPoint = { x: fromNode.x + nodeWidth / 2, y: fromNode.y + nodeHeight / 2 };
  const endPoint = { x: toNode.x + nodeWidth / 2, y: toNode.y + nodeHeight / 2 };

  // 2. 두 노드 간의 각도와 거리 계산
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(dy, dx);
  
  // 3. 끝 노드의 테두리에서 선이 멈추도록 최종 좌표 계산
  const endMagnitude = (nodeWidth / 2 * Math.abs(Math.sin(angle)) <= nodeHeight / 2 * Math.abs(Math.cos(angle)))
    ? nodeWidth / 2 / Math.abs(Math.cos(angle))
    : nodeHeight / 2 / Math.abs(Math.sin(angle));
  
  const finalX = endPoint.x - Math.cos(angle) * endMagnitude;
  const finalY = endPoint.y - Math.sin(angle) * endMagnitude;


  return (
    <line
      key={conn.id}
      x1={startPoint.x}
      y1={startPoint.y}
      x2={finalX} // 끝점 X 좌표 수정
      y2={finalY} // 끝점 Y 좌표 수정
      stroke="#6b7280"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
  );
})}
</svg>
          
          {Object.values(project.nodes).map((node) => (
            <QuestNode 
              key={node.id} 
              node={node} 
              onPositionChange={handleNodeDrag}

              // onPositionChange prop을 제거하고 onDragEnd만 남깁니다.
              onDragEnd={handleNodeDragEnd}
              isSelected={selectedNodeId === node.id}
              onSelect={handleNodeSelect}
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