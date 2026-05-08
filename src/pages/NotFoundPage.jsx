import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <p className="text-8xl font-bold text-primary-600 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Page not found</h1>
      <p className="text-slate-400 font-medium mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved to another dimension.</p>
      <Link to="/" className="btn-primary">
        Go home
      </Link>
    </div>
  </div>
)

export default NotFoundPage
