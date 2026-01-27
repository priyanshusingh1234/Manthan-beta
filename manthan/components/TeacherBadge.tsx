import React from 'react'

type Props = { size?: number }

export default function TeacherBadge({ size = 24 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block ml-1"
      aria-label="Verified Teacher"
    >
      <path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
