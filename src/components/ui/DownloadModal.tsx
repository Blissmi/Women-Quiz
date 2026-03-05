import React, { useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  status: 'idle' | 'in-progress' | 'success' | 'failed'
  message?: string
  onClose: () => void
  onOpenPrint?: () => void
}

export function DownloadModal({ status, message, onClose }: Props) {
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(onClose, 3000)
      return () => clearTimeout(t)
    }
  }, [status])

  if (status === 'idle') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 w-[min(92%,420px)] shadow-lg text-center">
        {status === 'in-progress' && (
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <h3 className="text-lg font-medium">Preparing your snapshot…</h3>
            <p className="text-sm text-neutral-600">This may take a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
            <h3 className="text-lg font-medium">Snapshot downloaded</h3>
            <p className="text-sm text-neutral-600">Check your Downloads folder for the PDF.</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-rose-600" />
            <h3 className="text-lg font-medium">Failed to create snapshot</h3>
            <p className="text-sm text-neutral-600">{message ?? 'Something went wrong during PDF creation.'}</p>
            <div className="flex gap-3 mt-3">
              {onOpenPrint && (
                <button onClick={onOpenPrint} className="bg-white text-rose-600 px-4 py-2 rounded-full border border-rose-200">Open Print View</button>
              )}
              <button onClick={onClose} className="bg-rose-600 text-white px-4 py-2 rounded-full">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DownloadModal
