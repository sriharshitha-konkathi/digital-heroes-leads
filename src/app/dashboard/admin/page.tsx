import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function assignLead(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('leadId') as string
  const assignedTo = formData.get('assignedTo') as string
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('leads')
    .update({ assigned_to: assignedTo || null })
    .eq('id', leadId)

  await supabase
    .from('activity_log')
    .insert({
      lead_id: leadId,
      actor_id: user!.id,
      action: assignedTo ? 'Lead assigned to team member' : 'Lead unassigned',
      metadata: { assigned_to: assignedTo },
    })

  revalidatePath('/dashboard/admin')
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only admins can access this page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all leads with assigned profile
  const { data: leads } = await supabase
    .from('leads')
    .select('*, profiles!leads_assigned_to_fkey(full_name)')
    .order('created_at', { ascending: false })

  // Fetch all members for assignment dropdown
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name')

  // Stats
  const total = leads?.length || 0
  const unassigned = leads?.filter(l => !l.assigned_to).length || 0
  const closedWon = leads?.filter(l => l.status === 'closed_won').length || 0
  const newLeads = leads?.filter(l => l.status === 'new').length || 0

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: total, color: 'bg-blue-50 text-blue-700' },
          { label: 'New', value: newLeads, color: 'bg-purple-50 text-purple-700' },
          { label: 'Unassigned', value: unassigned, color: 'bg-orange-50 text-orange-700' },
          { label: 'Closed Won', value: closedWon, color: 'bg-green-50 text-green-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
        <div className="divide-y divide-gray-100">
          {members?.map((member) => {
            const assignedCount = leads?.filter(l => l.assigned_to === member.id).length || 0
            return (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {assignedCount} lead{assignedCount !== 1 ? 's' : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lead Assignment Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Assign Leads</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Assign To</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads?.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">
                    {lead.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <form action={assignLead} className="flex items-center gap-2">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <select
                      name="assignedTo"
                      defaultValue={lead.assigned_to || ''}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Assign
                    </button>
                  </form>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`/dashboard/leads/${lead.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}