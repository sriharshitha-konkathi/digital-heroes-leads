import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Lead, Note, ActivityLog } from '@/types'

type Assignee = { full_name: string } | null
type LeadWithAssignee = Lead & { profiles: Assignee }
type NoteWithAuthor = Note & { profiles: Assignee }
type ActivityWithActor = ActivityLog & { profiles: Assignee }

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

async function updateStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('leadId') as string
  const status = formData.get('status') as string
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  await supabase
    .from('activity_log')
    .insert({
      lead_id: leadId,
      actor_id: user!.id,
      action: `Status changed to ${STATUS_LABELS[status]}`,
      metadata: { status },
    })

  revalidatePath(`/dashboard/leads/${leadId}`)
}

async function addNote(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('leadId') as string
  const content = formData.get('content') as string
  const { data: { user } } = await supabase.auth.getUser()

  if (!content?.trim()) return

  await supabase
    .from('notes')
    .insert({
      lead_id: leadId,
      author_id: user!.id,
      content: content.trim(),
    })

  await supabase
    .from('activity_log')
    .insert({
      lead_id: leadId,
      actor_id: user!.id,
      action: 'Note added',
      metadata: {},
    })

  revalidatePath(`/dashboard/leads/${leadId}`)
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Fetch lead
  const { data: lead } = await supabase
    .from('leads')
    .select('*, profiles!leads_assigned_to_fkey(full_name)')
    .eq('id', id)
    .single<LeadWithAssignee>()

  if (!lead) notFound()

  // Members can only view leads assigned to them
  if (profile?.role === 'member' && lead.assigned_to !== user.id) {
    notFound()
  }

  // Fetch notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*, profiles(full_name)')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .overrideTypes<NoteWithAuthor[], { merge: false }>()

  // Fetch activity log
  const { data: activity } = await supabase
    .from('activity_log')
    .select('*, profiles(full_name)')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .overrideTypes<ActivityWithActor[], { merge: false }>()

  return (
    <div>
      {/* Back link */}
      <a
        href="/dashboard"
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1"
      >
        ← Back to Leads
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">

        {/* Left Column — Lead Info */}
        <div className="lg:col-span-1 space-y-4">

          {/* Lead Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                {STATUS_LABELS[lead.status]}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📧 {lead.email}</p>
              {lead.company && <p>🏢 {lead.company}</p>}
              {lead.phone && <p>📞 {lead.phone}</p>}
              <p>📅 {new Date(lead.created_at).toLocaleDateString()}</p>
              <p>👤 Assigned to: {lead.profiles?.full_name || 'Unassigned'}</p>
            </div>
            {lead.message && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                <p className="text-sm text-gray-700">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
            <form action={updateStatus} className="space-y-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <select
                name="status"
                defaultValue={lead.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Update Status
              </button>
            </form>
          </div>
        </div>

        {/* Right Column — Notes + Activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* Add Note */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Add Note</h3>
            <form action={addNote} className="space-y-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                name="content"
                rows={3}
                placeholder="Add a note about this lead..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 bg-white"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add Note
              </button>
            </form>
          </div>

          {/* Notes List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Notes ({notes?.length || 0})
            </h3>
            {notes && notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border-l-2 border-blue-200 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {note.profiles?.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No notes yet</p>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Activity ({activity?.length || 0})
            </h3>
            {activity && activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">{log.action}</p>
                      <p className="text-xs text-gray-400">
                        {log.profiles?.full_name || 'System'} •{' '}
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}