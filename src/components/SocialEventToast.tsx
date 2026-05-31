import { useEffect } from 'react'
import { useCampaignStore } from '@/store/campaignStore'

const TOAST_ICONS: Record<string, string> = {
  viral:           '🚀',
  review_bomb:     '💢',
  dev_diary:       '📝',
  community_event: '🎉',
}

const TOAST_COLORS: Record<string, string> = {
  viral:           'border-green-500 bg-green-900/80',
  review_bomb:     'border-red-500 bg-red-900/80',
  dev_diary:       'border-blue-500 bg-blue-900/80',
  community_event: 'border-yellow-500 bg-yellow-900/80',
}

export default function SocialEventToast() {
  const pendingToast = useCampaignStore((s) => s.pendingToast)
  const clearToast   = useCampaignStore((s) => s.clearToast)

  useEffect(() => {
    if (!pendingToast) return
    const timer = setTimeout(clearToast, 4000)
    return () => clearTimeout(timer)
  }, [pendingToast, clearToast])

  if (!pendingToast) return null

  const icon  = TOAST_ICONS[pendingToast.type] ?? '📣'
  const color = TOAST_COLORS[pendingToast.type] ?? 'border-gray-500 bg-gray-900/80'

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 border rounded-xl px-5 py-3 shadow-2xl pointer-events-none ${color}`}>
      <p className="text-white text-sm font-medium">
        {icon} {pendingToast.message}
      </p>
    </div>
  )
}
