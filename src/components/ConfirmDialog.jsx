// ConfirmDialog — enterprise-grade confirmation modal
// Props:
//   open          : boolean  — controls visibility
//   title         : string   — dialog heading
//   message       : string   — body copy
//   confirmLabel  : string   — confirm button text (default: 'Confirm')
//   confirmText   : string   — alias for confirmLabel (backward compat)
//   onConfirm     : function — called when user clicks confirm
//   onCancel      : function — called when user clicks cancel or backdrop
//   loading       : boolean  — shows spinner and disables both buttons
//   danger        : boolean  — renders confirm button in red
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  confirmText,   // backward-compat alias
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) => {
  if (!open) return null

  // Resolve label — prefer explicit confirmLabel; fall back to confirmText, then default
  const label = confirmLabel ?? confirmText ?? 'Confirm'

  // Block backdrop dismissal while an async operation is running
  const handleBackdropClick = () => {
    if (!loading) onCancel()
  }

  const confirmBtnClass = danger
    ? 'btn-danger'
    : 'btn-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            <svg
              className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-amber-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmBtnClass} disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              label
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
