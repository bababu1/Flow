'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomConfirm from '@/components/CustomConfirm';
import ProjectItem from '@/components/ProjectItem';
// 프로젝트 데이터 구조를 위한 타입 정의
interface Project {
  id: string;
  name: string;
  createdAt: string;
  nodes: any;
  connections: any;
}


export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // 로컬 스토리지에 프로젝트 데이터 저장
  const saveProjects = (updatedProjects: Project[]) => {
    localStorage.setItem('localDataProjects', JSON.stringify(updatedProjects));
  };

  // 컴포넌트 마운트 시 로컬 스토리지에서 프로젝트 목록 로드
  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('localDataProjects');
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }
    } catch (e) {
      console.error("Failed to load projects from local storage", e);
    }
  }, []);

  // 새 프로젝트 생성 핸들러
  const handleCreateProject = () => {
    if (newProjectName.trim() === '') return;
    const newProject: Project = {
      id: 'proj_' + Date.now(),
      name: newProjectName.trim(),
      createdAt: new Date().toISOString(),
      nodes: {},
      connections: [],
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    setNewProjectName('');
  };

  // 프로젝트 이름 수정 핸들러
  const handleEditProject = (projectId: string) => {
    const newName = prompt('새로운 프로젝트 이름을 입력하세요:', projects.find(p => p.id === projectId)?.name);
    if (newName && newName.trim() !== '') {
      const updatedProjects = projects.map(p =>
        p.id === projectId ? { ...p, name: newName.trim() } : p
      );
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
    }
  };

  // 프로젝트 삭제 핸들러
  const handleDeleteProject = (projectId: string) => {
    setConfirmMessage(`정말로 '${projects.find(p => p.id === projectId)?.name}' 프로젝트를 삭제하시겠습니까?`);
    setConfirmAction(() => () => {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  // 프로젝트 로드 핸들러
  const handleLoadProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <>
      <div id="project-list-view" className="view active w-full h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-8">프로젝트 선택</h1>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">새 프로젝트 생성</h2>
            <div className="flex gap-4">
              <input 
                type="text" 
                id="new-project-name" 
                className="flex-grow bg-gray-900 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="프로젝트 이름을 입력하세요..." 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
              />
              <button 
                id="create-project-btn" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                onClick={handleCreateProject}
              >
                생성
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">기존 프로젝트</h2>
            <ul id="project-list" className="space-y-3">
              {projects.length === 0 ? (
                <li className="text-gray-500">생성된 프로젝트가 없습니다.</li>
              ) : (
                projects.map(project => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onLoad={handleLoadProject}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
      {showConfirm && (
        <CustomConfirm 
          message={confirmMessage} 
          onConfirm={confirmAction} 
          onCancel={() => setShowConfirm(false)} 
        />
      )}
    </>
  );
}