import { Component } from 'react'

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const errorCount = this.state.errorCount + 1
    
    // Log to console in development
    console.error('Error caught by boundary:', error)
    console.error('Error info:', errorInfo)
    
    // Log to external service in production (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      this.reportErrorToService(error, errorInfo, errorCount)
    }

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))
  }

  reportErrorToService = (error, errorInfo, errorCount) => {
    // TODO: Integrate with Sentry, LogRocket, or your error tracking service
    console.log('Report to error tracking service:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorCount,
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV
      const errorCount = this.state.errorCount

      // Show different UI for too many errors
      if (errorCount > 3) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Multiple Errors Detected
              </h1>
              <p className="text-slate-600 mb-6">
                The application has encountered multiple errors. Please reload the page or contact support.
              </p>
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
              {isDevelopment && (
                <details className="mt-6 text-left bg-slate-50 p-4 rounded border border-slate-200">
                  <summary className="font-mono text-sm font-bold cursor-pointer text-slate-700">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-64 text-red-600 font-mono whitespace-pre-wrap break-words">
                    {this.state.error?.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      }

      // Normal error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
            <div className="text-5xl mb-4 text-center">😢</div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              Oops! Something went wrong
            </h1>
            
            <p className="text-slate-600 mb-6 text-center">
              We encountered an unexpected error. Our team has been notified. 
              Please try refreshing the page or going back to the home screen.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
            </div>

            {isDevelopment && (
              <details className="text-left bg-red-50 p-4 rounded border border-red-200">
                <summary className="font-mono text-sm font-bold cursor-pointer text-red-700 hover:text-red-800">
                  Error Details (Development Only)
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                      Error Message
                    </p>
                    <pre className="text-xs bg-slate-900 text-red-300 p-2 rounded overflow-auto max-h-32 font-mono">
                      {this.state.error?.toString()}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                      Component Stack
                    </p>
                    <pre className="text-xs bg-slate-900 text-yellow-300 p-2 rounded overflow-auto max-h-32 font-mono whitespace-pre-wrap break-words">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            <p className="text-xs text-slate-500 text-center mt-6">
              Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary