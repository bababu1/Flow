// src/components/QuestNode.tsx

'use client';

import { useState, MouseEvent, useEffect, useRef } from 'react';

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface QuestNodeProps {
  node: Node;
  onDragEnd: (nodeId: string, finalPosition: { x: number; y: number }) => void;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

export default function QuestNode({ node, onDragEnd, isSelected, onSelect }: QuestNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: node.x, y: node.y });
  const hasMoved = useRef(false);

  useEffect(() => {
    setPosition({ x: node.x, y: node.y });
  }, [node.x, node.y]);

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    hasMoved.current = true;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onDragEnd(node.id, position);
  };
  
  const handleMouseDown = (e: MouseEvent) => {
    hasMoved.current = false;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);


  return (
    <div
      className={`quest-node w-40 h-24 rounded-lg flex items-center justify-center text-center p-2 shadow-lg
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${isSelected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.7)] border-2' : 'border-gray-600 border'}`}
      style={{ position: 'absolute', left: `${position.x}px`, top: `${position.y}px`, zIndex: isDragging ? 11 : 10 }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasMoved.current) {
            onSelect(node.id);
          }
      }}
    >
      <p className="font-bold pointer-events-none">{node.title || '새 챕터'}</p>
    </div>
  );
}