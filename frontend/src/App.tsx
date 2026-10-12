import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import DocumentDetailPage from './pages/DocumentDetailPage.tsx'
import DocumentsPage from './pages/DocumentsPage.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyDocumentsPage from './pages/MyDocumentsPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import UploadPage from './pages/UploadPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="me" element={<MyDocumentsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
