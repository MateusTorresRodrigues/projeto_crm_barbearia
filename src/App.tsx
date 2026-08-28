import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Agenda from "@/pages/Agenda"
import Clientes from "@/pages/Clientes"
import Comandas from "@/pages/Comandas"
import Comissao from "@/pages/Comissao"
import Configuracoes from "@/pages/Configuracoes"
import Dashboard from "@/pages/Dashboard"
import Leads from "@/pages/Leads"
import Login from "@/pages/Login"
import Logs from "@/pages/Logs"
import NotFound from "@/pages/NotFound"
import Profissionais from "@/pages/Profissionais"
import Retorno from "@/pages/Retorno"
import Servicos from "@/pages/Servicos"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/profissionais" element={<Profissionais />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/comandas" element={<Comandas />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/comissao" element={<Comissao />} />
          <Route path="/retorno" element={<Retorno />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
