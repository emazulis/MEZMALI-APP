'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export const TimeDisplay = ({ startTime }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-4">
      <p className="text-lg">
        Current session: {formatDistanceToNow(startTime, { includeSeconds: true })}
      </p>
    </div>
  )
}