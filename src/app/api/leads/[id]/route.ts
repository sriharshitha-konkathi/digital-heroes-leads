import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/leads/:id — get single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*, profiles!leads_assigned_to_fkey(full_name)')
      .eq('id', id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ data: lead }, { status: 200 })

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/leads/:id — update lead status or assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, assigned_to } = body

    // Validate status if provided
    if (status) {
      const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const updates: Record<string, string> = {}
    if (status) updates.status = status
    if (assigned_to !== undefined) updates.assigned_to = assigned_to

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      lead_id: id,
      actor_id: user.id,
      action: `Lead updated via API`,
      metadata: updates,
    })

    return NextResponse.json({ data: lead }, { status: 200 })

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}