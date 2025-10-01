import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>홈 화면</h1>
      <p>여기는 홈(/)입니다. 상세 페이지로 이동해 테스트해 보세요.</p>
      
      {/* <a> 태그 대신 <Link> 컴포넌트 사용 */}
      <Link href="/project/demo-id" style={{ color: '#63b5e0' }}>
        /project/demo-id 로 이동
      </Link>
    </main>
  );
}