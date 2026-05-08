import { useNavigate } from 'react-router-dom'

const UnauthorizedPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-8xl font-bold text-red-500 mb-4">403</p>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Access denied</h1>
        <p className="text-slate-400 font-medium mb-8 uppercase tracking-widest text-[10px]">You don&apos;t have the required clearance level to access this terminal node.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mr-3">
          Go back
        </button>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go home
        </button>
      </div>
    </div>
  )
}

export default UnauthorizedPage
