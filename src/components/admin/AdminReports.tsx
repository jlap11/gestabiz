import React from 'react'
import { User } from '@/types'
import ComprehensiveReports from './ComprehensiveReports'

interface AdminReportsProps {
  user: User
}

export default function AdminReports({ user }: AdminReportsProps) {
  return <ComprehensiveReports user={user} />
}
