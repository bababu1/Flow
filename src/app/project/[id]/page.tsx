'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// 프로젝트 데이터 타입 정의
interface Project {
  id: string;
  name: string;
  nodes: { [key: string]: any }; // nodes는 객체 형태임을 명시
  connections: any[];
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProjects = localStorage.getItem('localDataProjects');
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      const currentProject = projects.find((p: Project) => p.id === projectId);
      if (currentProject) {
        setProject(currentProject);
      }
    }
    setLoading(false);
  }, [projectId]);

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center"><p>로딩 중...</p></div>;
  }

  if (!project) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">프로젝트를 찾을 수 없습니다.</h1>
        <Link href="/" className="mt-4 text-blue-400 hover:underline">
          &lt; 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // --- 여기가 바뀝니다! ---
  // 데이터 확인용 UI 대신 실제 퀘스트 맵 UI를 반환합니다.
  return (
    <div id="quest-map-view">
      <div id="quest-map-container">
        <Link href="/" id="back-to-projects" className="fixed top-4 left-4 z-20 breadcrumb-link text-white font-bold text-lg cursor-pointer hover:text-blue-400">
          &lt; 프로젝트 목록
        </Link>
        <div id="quest-map">
          <svg id="connector-svg">
            <defs>
              <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280"></path></marker>
              <marker id="arrowhead-hover" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444"></path></marker>
            </defs>
          </svg>

          {/* 불러온 project 데이터의 nodes를 화면에 렌더링합니다. (지금은 0개라 아무것도 안 나옵니다) */}
          {Object.values(project.nodes).map((node: any) => (
            <div
              key={node.id}
              className="quest-node w-40 h-24 rounded-lg flex items-center justify-center text-center p-2 shadow-lg"
              style={{ position: 'absolute', left: `${node.x}px`, top: `${node.y}px` }}
            >
              <p className="font-bold pointer-events-none">{node.title || '새 챕터'}</p>
            </div>
          ))}
        </div>
      </div>
      <div id="panel-resizer"></div>
      <div id="directory-tree-panel">
        {/* 불러온 project 데이터의 name을 제목으로 사용합니다. */}
        <h2 id="project-title-in-tree" className="text-xl font-bold mb-4 pb-2 border-b border-gray-600 cursor-pointer">
          {project.name}
        </h2>
        <ul id="directory-tree"></ul>
      </div>
    </div>
  );
}