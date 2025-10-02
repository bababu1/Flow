// src/components/QuestNode.tsx

'use client';

import { useState, MouseEvent, useEffect } from 'react'; // useEffect 추가

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface QuestNodeProps {
  node: Node;
  onPositionChange: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onDragEnd: (nodeId: string, finalPosition: { x: number; y: number }) => void;
}

export default function QuestNode({ node, onPositionChange, onDragEnd }: QuestNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // ▼▼▼ 1. 마우스를 움직일 때 실행될 함수 (변경 없음) ▼▼▼
  const handleMouseMove = (e: globalThis.MouseEvent) => {
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    onPositionChange(node.id, { x: newX, y: newY });
  };

  // ▼▼▼ 2. 마우스를 뗄 때 실행될 함수 (변경 없음) ▼▼▼
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // ▼▼▼ 3. 마우스를 처음 클릭했을 때 실행될 함수 (변경됨) ▼▼▼
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  // ▼▼▼ 4. isDragging 상태가 바뀔 때마다 실행되는 useEffect 훅 추가 ▼▼▼
  useEffect(() => {
    if (isDragging) {
      // 드래그가 시작되면, window 전체에 이벤트 리스너를 추가합니다.
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      // 드래그가 끝나면, window에서 이벤트 리스너를 제거합니다. (매우 중요!)
      // 그리고 최종 위치를 부모에게 알려줍니다.
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      onDragEnd(node.id, { x: node.x, y: node.y });
    }

    // 컴포넌트가 사라질 때를 대비한 정리(cleanup) 함수
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]); // isDragging 값이 바뀔 때만 이 함수가 실행됩니다.


  return (
    <div
      className={`quest-node w-40 h-24 rounded-lg flex items-center justify-center text-center p-2 shadow-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ position: 'absolute', left: `${node.x}px`, top: `${node.y}px`, zIndex: isDragging ? 11 : 10 }}
      // ▼▼▼ 5. 이제 노드 자체에는 onMouseDown 이벤트만 남깁니다. ▼▼▼
      onMouseDown={handleMouseDown}
    >
      <p className="font-bold pointer-events-none">{node.title || '새 챕터'}</p>
    </div>
  );
}