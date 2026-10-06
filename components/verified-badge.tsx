import { BadgeCheck, Users } from 'lucide-react'

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-primary">
      <BadgeCheck aria-hidden className="size-3.5" />
      Verified employer
    </span>
  )
}

export function CommunityBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-caution/40 px-1.5 py-0.5 text-xs text-caution">
      <Users aria-hidden className="size-3.5" />
      Community-reported · not official
    </span>
  )
}
