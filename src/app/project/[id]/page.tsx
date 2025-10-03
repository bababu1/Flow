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
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // --- 데이터 불러오기 & 저장 ---

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

  // --- 맵 인터랙션 핸들러 ---

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

  // --- 노드 인터랙션 핸들러 ---

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

  const handleNodeDrag = (nodeId: string, newPosition: { x: number, y: number }) => {
    setProject(prevProject => {
      if (!prevProject) return null;
      return { ...prevProject, nodes: { ...prevProject.nodes, [nodeId]: { ...prevProject.nodes[nodeId], ...newPosition } } };
    });
  };
  
  const handleNodeDragEnd = (nodeId: string, finalPosition: { x: number, y: number }) => {
    if (project) { saveProject(project); }
  };

  // --- 연결선 인터랙션 핸들러 ---
  
  const handleDeleteConnection = () => {
    if (!connectionToDelete || !project) return;
    const updatedConnections = project.connections.filter(c => c.id !== connectionToDelete);
    const updatedProject = { ...project, connections: updatedConnections };
    
    setProject(updatedProject);
    saveProject(updatedProject);
    
    setShowDeleteConfirm(false);
    setConnectionToDelete(null);
  };

  const handleLineMouseDown = (e: MouseEvent, connectionId: string) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      setConnectionToDelete(connectionId);
      setShowDeleteConfirm(true);
    }, 500);
  };

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
        <Link href="/" id="back-to-projects" className="fixed top-4 left-4 z-20 breadcrumb-link text-white font-bold text-lg cursor-pointer hover:text-blue-400">&lt; 프로젝트 목록</Link>
        
        <div id="quest-map">
          <svg id="connector-svg" className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
              </marker>
            </defs>
            
            {/* ▼▼▼ 쌍방향 연결선을 그리기 위한 렌더링 로직 ▼▼▼ */}
            {(() => {
              if (!project) return null; // project가 null일 경우를 대비
              const processedConnections = new Set<string>();
              const lines = [];
              // 선 두께
              const LINE_STROKE_WIDTH = 4;

              for (const conn of project.connections) {
                if (processedConnections.has(conn.id)) continue;

                const fromNode = project.nodes[conn.from];
                const toNode = project.nodes[conn.to];
                if (!fromNode || !toNode) continue;
                
                const reverseConn = project.connections.find(c => c.from === conn.to && c.to === conn.from);

                const nodeWidth = 160;
                const nodeHeight = 96;
                const startPoint = { x: fromNode.x + nodeWidth / 2, y: fromNode.y + nodeHeight / 2 };
                const endPoint = { x: toNode.x + nodeWidth / 2, y: toNode.y + nodeHeight / 2 };
                
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist === 0) continue;

                if (reverseConn) {
                  // --- 쌍방향 연결일 경우 ---
                  processedConnections.add(reverseConn.id);
                  const perpDx = -dy / dist;
                  const perpDy = dx / dist;
                  const offset = 8;

                  // ▼▼▼ 화살촉 위치 계산 로직을 쌍방향일 때도 적용합니다. ▼▼▼
                  const angle = Math.atan2(dy, dx);
                  const endMagnitude = (nodeWidth / 2 * Math.abs(Math.sin(angle)) <= nodeHeight / 2 * Math.abs(Math.cos(angle))) ? nodeWidth / 2 / Math.abs(Math.cos(angle)) : nodeHeight / 2 / Math.abs(Math.sin(angle));

                  // 1. A -> B 방향의 선 (위쪽 간격)
                  const p1_start = { x: startPoint.x + perpDx * offset, y: startPoint.y + perpDy * offset };
                  const p1_end = { x: endPoint.x + perpDx * offset, y: endPoint.y + perpDy * offset };
                  const p1_finalX = p1_end.x - Math.cos(angle) * endMagnitude;
                  const p1_finalY = p1_end.y - Math.sin(angle) * endMagnitude;
                  lines.push(
                    <line key={conn.id} x1={p1_start.x} y1={p1_start.y} x2={p1_finalX} y2={p1_finalY} stroke="#6b7280" strokeWidth={LINE_STROKE_WIDTH} markerEnd="url(#arrowhead)" className="cursor-pointer hover:stroke-red-500 transition-colors" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleLineMouseDown(e, conn.id)} onMouseUp={handleLineMouseUp}/>
                  );
                  
                  // 2. B -> A 방향의 선 (아래쪽 간격)
                  const p2_start = { x: endPoint.x - perpDx * offset, y: endPoint.y - perpDy * offset };
                  const p2_end = { x: startPoint.x - perpDx * offset, y: startPoint.y - perpDy * offset };
                  const p2_finalX = p2_end.x + Math.cos(angle) * endMagnitude;
                  const p2_finalY = p2_end.y + Math.sin(angle) * endMagnitude;
                  lines.push(
                    <line key={reverseConn.id} x1={p2_start.x} y1={p2_start.y} x2={p2_finalX} y2={p2_finalY} stroke="#6b7280" strokeWidth={LINE_STROKE_WIDTH} markerEnd="url(#arrowhead)" className="cursor-pointer hover:stroke-red-500 transition-colors" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleLineMouseDown(e, reverseConn.id)} onMouseUp={handleLineMouseUp}/>
                  );

                } else {
                  const angle = Math.atan2(dy, dx);
                  const endMagnitude = (nodeWidth / 2 * Math.abs(Math.sin(angle)) <= nodeHeight / 2 * Math.abs(Math.cos(angle))) ? nodeWidth / 2 / Math.abs(Math.cos(angle)) : nodeHeight / 2 / Math.abs(Math.sin(angle));
                  const finalX = endPoint.x - Math.cos(angle) * endMagnitude;
                  const finalY = endPoint.y - Math.sin(angle) * endMagnitude;
                  lines.push(
                    <line key={conn.id} x1={startPoint.x} y1={startPoint.y} x2={finalX} y2={finalY} stroke="#6b7280" strokeWidth={LINE_STROKE_WIDTH} markerEnd="url(#arrowhead)" className="cursor-pointer hover:stroke-red-500 transition-colors" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleLineMouseDown(e, conn.id)} onMouseUp={handleLineMouseUp}/>
                  );
                }
              }
              return lines;
            })()}
          </svg>

          {Object.values(project.nodes).map((node) => (
            <QuestNode 
              key={node.id} node={node} 
              onPositionChange={handleNodeDrag} onDragEnd={handleNodeDragEnd}
              isSelected={selectedNodeId === node.id} onSelect={handleNodeSelect}
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
        <h2 id="project-title-in-tree" className="text-xl font-bold mb-4 pb-2 border-b border-gray-600 cursor-pointer">{project.name}</h2>
        <ul id="directory-tree"></ul>
      </div>
      
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