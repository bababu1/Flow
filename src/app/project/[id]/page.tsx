'use client';

import { useState, useEffect, MouseEvent, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QuestNode from '@/components/QuestNode';
import CustomConfirm from '@/components/CustomConfirm';

// --- 타입(Data Structure) 정의 ---
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
  connections: Array<{ id: string; from: string; to: string }>;
}
interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
}

export default function ProjectPage() {
  // --- 상태(State) 관리 ---
  // 이 페이지에서 사용되는 모든 데이터를 상태로 관리합니다.
  // 상태가 변경되면 React가 알아서 화면을 다시 그려줍니다.
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null); // 현재 프로젝트의 모든 데이터 (노드, 연결선 등)
  const [loading, setLoading] = useState(true); // 데이터 로딩 중인지 여부
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0 }); // 맵 배경 우클릭 메뉴
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null); // 현재 선택(활성화)된 노드의 ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 연결선 삭제 확인 창 표시 여부
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null); // 삭제할 연결선의 ID
  const longPressTimer = useRef<NodeJS.Timeout>(null); // 연결선 길게 누르기 감지를 위한 타이머

  // --- 데이터 불러오기 & 저장 ---

  // 페이지가 처음 로드될 때 localStorage에서 프로젝트 데이터를 불러옵니다.
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

  // 변경된 프로젝트 데이터를 localStorage에 저장합니다.
  const saveProject = (updatedProject: Project) => {
    const storedProjects = localStorage.getItem('localDataProjects');
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      const updatedProjects = projects.map((p: Project) => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('localDataProjects', JSON.stringify(updatedProjects));
    }
  };

  // --- 맵 인터랙션 핸들러 ---

  // 맵의 빈 공간을 우클릭했을 때 컨텍스트 메뉴를 엽니다.
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  // 맵의 빈 공간을 클릭했을 때 모든 메뉴를 닫고, 노드 선택을 해제합니다.
  const handleMapClick = () => {
    setContextMenu({ ...contextMenu, visible: false });
    setSelectedNodeId(null);
  };

  // 컨텍스트 메뉴에서 '챕터 생성'을 클릭했을 때 새 노드를 만듭니다.
  const handleCreateNode = () => {
    if (!project) return;
    const newNode: Node = { id: 'node_' + Date.now(), title: '새 챕터', x: contextMenu.x, y: contextMenu.y, };
    const updatedProject = { ...project, nodes: { ...project.nodes, [newNode.id]: newNode, }, };
    setProject(updatedProject);
    saveProject(updatedProject);
    handleMapClick();
  };

  // --- 노드 인터랙션 핸들러 ---

  // 노드 클릭 시 호출됩니다. 선택된 노드가 없으면 선택하고, 있으면 연결선을 만듭니다.
  const handleNodeSelect = (nodeId: string) => {
    if (selectedNodeId && selectedNodeId !== nodeId) {
      if (!project) return;
      const connectionExists = project.connections.some(c => c.from === selectedNodeId && c.to === nodeId);
      if (!connectionExists) {
        const newConnection = { id: 'conn_' + Date.now(), from: selectedNodeId, to: nodeId };
        const updatedProject = { ...project, connections: [...project.connections, newConnection] };
        setProject(updatedProject);
        saveProject(updatedProject);
      }
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  // 노드를 드래그하는 '중'에 실시간으로 위치를 업데이트합니다.
  const handleNodeDrag = (nodeId: string, newPosition: { x: number, y: number }) => {
    setProject(prevProject => {
      if (!prevProject) return null;
      return { ...prevProject, nodes: { ...prevProject.nodes, [nodeId]: { ...prevProject.nodes[nodeId], ...newPosition } } };
    });
  };
  
  // 노드 드래그가 '끝났을 때' 최종 상태를 저장합니다.
  const handleNodeDragEnd = (nodeId: string, finalPosition: { x: number, y: number }) => {
    if (project) { saveProject(project); }
  };

  // --- 연결선 인터랙션 핸들러 ---
  
  // '삭제 확인' 창에서 '예'를 눌렀을 때 연결선을 실제로 삭제합니다.
  const handleDeleteConnection = () => {
    if (!connectionToDelete || !project) return;
    const updatedConnections = project.connections.filter(c => c.id !== connectionToDelete);
    const updatedProject = { ...project, connections: updatedConnections };
    
    setProject(updatedProject);
    saveProject(updatedProject);
    
    setShowDeleteConfirm(false);
    setConnectionToDelete(null);
  };

  // 연결선 위에서 마우스를 '누르기 시작'했을 때 타이머를 설정합니다.
  const handleLineMouseDown = (e: MouseEvent, connectionId: string) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      setConnectionToDelete(connectionId);
      setShowDeleteConfirm(true);
    }, 500);
  };

  // 연결선 위에서 마우스를 '뗐을 때' 타이머를 취소합니다.
  const handleLineMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // --- 렌더링(화면 그리기) 로직 ---

  if (loading) { return <div>로딩 중...</div>; }
  if (!project) { return <div>프로젝트를 찾을 수 없습니다.</div>; }

  return (
    <div id="quest-map-view" onClick={handleMapClick}>
      <div id="quest-map-container" onContextMenu={handleContextMenu}>
        {/* 상단 뒤로가기 링크 */}
        <Link href="/" id="back-to-projects" className="fixed top-4 left-4 z-20 breadcrumb-link text-white font-bold text-lg cursor-pointer hover:text-blue-400">&lt; 프로젝트 목록</Link>
        
        <div id="quest-map">
          {/* SVG 영역: 연결선과 화살촉을 그립니다. */}
          <svg id="connector-svg" className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
              </marker>
            </defs>
            {project.connections.map(conn => {
              const fromNode = project.nodes[conn.from];
              const toNode = project.nodes[conn.to];
              if (!fromNode || !toNode) return null;
              const nodeWidth = 160; const nodeHeight = 96;
              const startPoint = { x: fromNode.x + nodeWidth / 2, y: fromNode.y + nodeHeight / 2 };
              const endPoint = { x: toNode.x + nodeWidth / 2, y: toNode.y + nodeHeight / 2 };
              const dx = endPoint.x - startPoint.x; const dy = endPoint.y - startPoint.y;
              const angle = Math.atan2(dy, dx);
              const endMagnitude = (nodeWidth / 2 * Math.abs(Math.sin(angle)) <= nodeHeight / 2 * Math.abs(Math.cos(angle))) ? nodeWidth / 2 / Math.abs(Math.cos(angle)) : nodeHeight / 2 / Math.abs(Math.sin(angle));
              const finalX = endPoint.x - Math.cos(angle) * endMagnitude;
              const finalY = endPoint.y - Math.sin(angle) * endMagnitude;
              return (
                <line
                  key={conn.id} x1={startPoint.x} y1={startPoint.y} x2={finalX} y2={finalY}
                  stroke="#6b7280" strokeWidth="5" markerEnd="url(#arrowhead)"
                  className="cursor-pointer hover:stroke-red-500 transition-colors"
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleLineMouseDown(e, conn.id)}
                  onMouseUp={handleLineMouseUp}
                />
              );
            })}
          </svg>

          {/* 노드 렌더링: project.nodes에 있는 모든 노드를 화면에 그립니다. */}
          {Object.values(project.nodes).map((node) => (
            <QuestNode 
              key={node.id} node={node} 
              onPositionChange={handleNodeDrag} onDragEnd={handleNodeDragEnd}
              isSelected={selectedNodeId === node.id} onSelect={handleNodeSelect}
            />
          ))}
        </div>

        {/* 맵 배경 우클릭 메뉴 렌더링 */}
        {contextMenu.visible && (
          <div className="fixed bg-gray-700 text-white rounded-md shadow-lg py-1 z-50" style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}>
            <ul>
              <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer" onClick={handleCreateNode}>챕터 생성</li>
              <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer">이미지 추가</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* 오른쪽 패널 */}
      <div id="panel-resizer"></div>
      <div id="directory-tree-panel">
        <h2 id="project-title-in-tree" className="text-xl font-bold mb-4 pb-2 border-b border-gray-600 cursor-pointer">{project.name}</h2>
        <ul id="directory-tree"></ul>
      </div>
      
      {/* 연결선 삭제 확인 창 렌더링 */}
      {showDeleteConfirm && (
        <CustomConfirm
          message="이 연결을 삭제하시겠습니까?"
          onConfirm={handleDeleteConnection}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}