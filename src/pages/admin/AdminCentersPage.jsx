import { useState, useEffect } from 'react'
import { useAuth } from '../../core/auth/AuthProvider'
import { fetchServiceCenter } from '../../services/centerService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AdminCentersPage = () => {
  const { profile } = useAuth()
  const centerId = profile?.service_center_id

  const [center, setCenter]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!centerId) { setLoading(false); return }
    const load = async () => {
      try {
        const data = await fetchServiceCenter(centerId)
        setCenter(data)
      } catch (err) {
        toast.error('Failed to load service center.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [centerId])

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  if (!center) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">No service center assigned to your account.</p>
        <p className="text-sm text-gray-400 mt-1">Contact a developer to assign you to a center.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Service Center</h1>
        <p className="page-subtitle">Your assigned service center details</p>
      </div>

      <div className="max-w-xl">
        <div className="card space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary-50 border-2 border-primary-100
                            flex items-center justify-center overflow-hidden flex-shrink-0">
              {center.logo_url ? (
                <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-700 font-bold text-3xl">
                  {center.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{center.name}</h2>
              <p className="text-sm text-gray-400">
                Created {new Date(center.created_at).toLocaleDateString()}
              </p>
              <span className="badge badge-green mt-2">Active</span>
            </div>
          </div>

          {/* Info rows */}
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between py-3 text-sm">
              <span className="text-gray-500 font-medium">Center ID</span>
              <span className="text-gray-700 font-mono text-xs truncate max-w-[220px]">{center.id}</span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-gray-500 font-medium">Name</span>
              <span className="text-gray-900 font-semibold">{center.name}</span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-gray-500 font-medium">Status</span>
              <span className="badge badge-green">Active</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            To update center details or logo, contact a developer account.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminCentersPage
