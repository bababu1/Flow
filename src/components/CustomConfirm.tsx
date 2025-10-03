'use client';

import React from 'react';

interface CustomConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomConfirm({ message, onConfirm, onCancel }: CustomConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
        <p className="text-lg mb-4">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">예</button>
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">아니요</button>
        </div>
      </div>
    </div>
  );
}