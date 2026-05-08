import React from 'react'

const LoadingScreen = ({ message = 'Loading your experience...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-primary-100 rounded-full animate-pulse" />
        
        {/* Inner spinning ring */}
        <div className="absolute inset-0 w-20 h-20 border-t-4 border-primary-600 rounded-full animate-spin" />
        
        {/* Center icon or dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-ping" />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{message}</h3>
        <p className="text-slate-500 text-sm mt-2 animate-pulse">Please wait a moment</p>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200/20 blur-3xl rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 blur-3xl rounded-full -z-10" />
    </div>
  )
}

export default LoadingScreen
