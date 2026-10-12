import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import LogsPage from './pages/LogsPage.tsx'
import ModerationPage from './pages/ModerationPage.tsx'
import SubjectsPage from './pages/SubjectsPage.tsx'
import UsersPage from './pages/UsersPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="moderation" element={<ModerationPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
