import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../core/auth/AuthProvider'
import AppRouter from './AppRouter'
import SupportAssistant from '../components/SupportAssistant'
import ErrorBoundary from '../components/ErrorBoundary'

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <SupportAssistant />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              borderRadius: '10px',
              padding: '12px 16px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' }, duration: 5000 },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
)

export default App