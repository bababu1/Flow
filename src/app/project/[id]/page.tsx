'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold">프로젝트 페이지</h1>
      <p className="mt-2 text-lg">현재 보고 있는 프로젝트 ID: <span className="text-yellow-400">{projectId}</span></p>
      <Link href="/" className="mt-8 text-blue-400 hover:underline">
        &lt; 프로젝트 목록으로 돌아가기
      </Link>
    </div>
  );
}