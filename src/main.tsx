import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "@/App"
import { AuthProvider } from "@/contexts/AuthContext"
import { ConfiguracaoProvider } from "@/contexts/ConfiguracaoContext"
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext"
import { ToastProvider } from "@/contexts/ToastContext"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfiguracaoProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <App />
            </ConfirmDialogProvider>
          </ToastProvider>
        </ConfiguracaoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
