import { BadgeCheck } from 'lucide-react'

export default function BottomBanner() {
  return (
    <div className="fixed inset-x-0 bottom-3 z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 p-3 shadow ring-1 ring-black/5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-gray-800">
            Go Pro for ₹49/month for No Ads & Verified Badge
          </p>
        </div>
      </div>
    </div>
  )
}
