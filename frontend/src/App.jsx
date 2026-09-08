import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CategoriasProvider } from './context/CategoriasContext'
import PrivateRoute from './components/PrivateRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Goals from './pages/Goals'
import Budgets from './pages/Budgets'
import Recurring from './pages/Recurring'
import Contas from './pages/Contas'
import Categorias from './pages/Categorias'
import Familia from './pages/Familia'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CategoriasProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              <Route path="/redefinir-senha" element={<ResetPassword />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/relatorios" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/metas" element={<PrivateRoute><Goals /></PrivateRoute>} />
              <Route path="/orcamentos" element={<PrivateRoute><Budgets /></PrivateRoute>} />
              <Route path="/recorrencias" element={<PrivateRoute><Recurring /></PrivateRoute>} />
              <Route path="/contas" element={<PrivateRoute><Contas /></PrivateRoute>} />
              <Route path="/categorias" element={<PrivateRoute><Categorias /></PrivateRoute>} />
              <Route path="/familia" element={<PrivateRoute><Familia /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CategoriasProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
