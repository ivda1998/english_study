import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="stack">
      <h1 className="page-title">여기에는 아무것도 없어요</h1>
      <p className="muted">주소가 바뀌었거나 아직 만들지 않은 화면이에요.</p>
      <div>
        <Link className="btn btn--primary" to="/">
          오늘 학습으로 가기
        </Link>
      </div>
    </div>
  );
}
