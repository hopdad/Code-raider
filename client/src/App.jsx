import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Home     from './pages/Home';
import Lobby    from './pages/Lobby';
import Session  from './pages/Session';
import Rankings from './pages/Rankings';
import Groups   from './pages/Groups';

function RequireAuth({ children }) {
  const user = useAuth();
  if (user === undefined) return null; // still loading
  if (user === null)      return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/lobby"       element={<RequireAuth><Lobby /></RequireAuth>} />
        <Route path="/session/:id" element={<RequireAuth><Session /></RequireAuth>} />
        <Route path="/rankings"    element={<Rankings />} />
        <Route path="/groups"      element={<RequireAuth><Groups /></RequireAuth>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
