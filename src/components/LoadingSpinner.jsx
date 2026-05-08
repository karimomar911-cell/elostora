const LoadingSpinner = ({ size = 'md', center = false, message = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`
          ${sizes[size]}
          rounded-full
          border-primary-200
          border-t-primary-600
          animate-spin
        `}
      />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  )

  if (center) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner
