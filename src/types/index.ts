export type Role = 'admin' | 'member'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'closed_won'
  | 'closed_lost'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  created_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  message: string | null
  status: LeadStatus
  assigned_to: string | null
  created_at: string
  updated_at: string
  profiles?: Profile // joined data
}

export interface Note {
  id: string
  lead_id: string
  author_id: string | null
  content: string
  created_at: string
  profiles?: Profile // joined data
}

export interface ActivityLog {
  id: string
  lead_id: string
  actor_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles?: Profile // joined data
}