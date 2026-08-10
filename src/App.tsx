import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useAppData } from '@/store/actions';
import HomePage from '@/routes/HomePage';
import SessionPage from '@/routes/SessionPage';
import PlanPage from '@/routes/PlanPage';
import ReviewPage from '@/routes/ReviewPage';
import StatsPage from '@/routes/StatsPage';
import ParentPage from '@/routes/ParentPage';
import SettingsPage from '@/routes/SettingsPage';
import NotFoundPage from '@/routes/NotFoundPage';
import './styles/components.css';

const NAV = [
  { to: '/', label: '오늘', end: true },
  { to: '/plan', label: '6주 계획', end: false },
  { to: '/review', label: '복습', end: false },
  { to: '/stats', label: '성장 기록', end: false },
  { to: '/parent', label: '부모', end: false },
  { to: '/settings', label: '설정', end: false },
];

export default function App() {
  const { settings, profile } = useAppData();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="topbar__brand">
            영어 60분
            <small>{profile.name ? `${profile.name}의 공부방` : '읽고 · 생각하고 · 말하기'}</small>
          </NavLink>
          <div className="topbar__spacer" />
          <nav className="navbar" aria-label="주요 메뉴">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/day/:dayId" element={<SessionPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/parent" element={<ParentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
