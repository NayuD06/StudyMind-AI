import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import AccountPage from './pages/AccountPage.tsx'
import DocumentDetailPage from './pages/DocumentDetailPage.tsx'
import DocumentsPage from './pages/DocumentsPage.tsx'
import EditDocumentPage from './pages/EditDocumentPage.tsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyDocumentsPage from './pages/MyDocumentsPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import ResetPasswordPage from './pages/ResetPasswordPage.tsx'
import UploadPage from './pages/UploadPage.tsx'
import UserPage from './pages/UserPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="documents/:id/edit" element={<EditDocumentPage />} />
        <Route path="users/:id" element={<UserPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="me" element={<MyDocumentsPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
