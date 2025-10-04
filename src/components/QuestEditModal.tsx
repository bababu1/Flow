'use client';

// ▼▼▼ useState와 useEffect를 import 합니다. ▼▼▼
import React, { useState, useEffect } from 'react';

// 이 컴포넌트가 받을 데이터의 타입을 정의합니다.
interface NodeData {
  id: string; // id도 포함시켜 어떤 노드인지 알 수 있게 합니다.
  title: string;
  qdd?: string; // qdd, intent, scenario는 없을 수도 있으므로 '?'를 붙입니다.
  intent?: string;
  scenario?: string;
}

interface QuestEditModalProps {
  node: NodeData | null;
  onClose: () => void;
  onSave: (nodeId: string, data: Partial<NodeData>) => void; // 어떤 노드를, 어떤 데이터로 저장할지 전달
}

export default function QuestEditModal({ node, onClose, onSave }: QuestEditModalProps) {
  // ▼▼▼ 모달 내부에서 수정되는 데이터를 관리할 상태를 만듭니다. ▼▼▼
  const [formData, setFormData] = useState({ title: '', qdd: '', intent: '', scenario: '' });

  // ▼▼▼ 모달이 열리거나 대상 노드가 바뀔 때마다 내부 상태를 초기화합니다. ▼▼▼
  useEffect(() => {
    if (node) {
      setFormData({
        title: node.title || '',
        qdd: node.qdd || '',
        intent: node.intent || '',
        scenario: node.scenario || '',
      });
    }
  }, [node]); // node prop이 바뀔 때마다 실행

  // 입력 필드가 변경될 때마다 formData 상태를 업데이트하는 함수
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 저장 버튼 클릭 시
  const handleSave = () => {
    if (node) {
      onSave(node.id, formData); // 부모에게 노드 ID와 수정된 데이터를 전달
    }
  };

  if (!node) return null;

  return (
    <div className="modal fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="modal-content bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          {/* ▼▼▼ value와 onChange를 연결하여 상태와 동기화합니다. ▼▼▼ */}
          <input
            type="text"
            name="title" // 어떤 데이터인지 식별하기 위한 name 속성
            value={formData.title}
            onChange={handleChange}
            className="text-2xl font-bold bg-transparent w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl ml-4">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {/* (탭 기능은 다음 단계에서 구현합니다) */}
          <div className="border-b border-gray-700 mb-4">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button className="tab-button active py-2 px-4 text-sm font-medium rounded-t-md">QDD</button>
              <button className="tab-button py-2 px-4 text-sm font-medium rounded-t-md">기획 의도</button>
              <button className="tab-button py-2 px-4 text-sm font-medium rounded-t-md">시나리오</button>
            </nav>
          </div>
          <div className="tab-content">
            {/* ▼▼▼ value와 onChange를 연결합니다. ▼▼▼ */}
            <textarea 
              name="qdd" // name 속성 추가
              value={formData.qdd}
              onChange={handleChange}
              className="w-full h-64 bg-gray-900 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Quest Design Document 내용을 입력하세요..."
            ></textarea>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 mt-auto flex justify-end gap-3">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">삭제</button>
          {/* ▼▼▼ 저장 버튼에 handleSave 함수를 연결합니다. ▼▼▼ */}
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">저장</button>
        </div>
      </div>
    </div>
  );
}