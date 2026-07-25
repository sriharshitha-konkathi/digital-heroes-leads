import { NextRequest } from 'next/server'
 /* eslint-disable */

// Mock Supabase
const mockUser = {
  id: 'admin-user-id',
  email: 'admin@digitalheroesco.com',
}

const mockProfile = {
  id: 'admin-user-id',
  role: 'admin',
  full_name: 'Admin User',
}

const mockLead = {
  id: 'lead-123',
  name: 'Test Lead',
  email: 'test@example.com',
  company: 'Test Company',
  phone: null,
  message: null,
  status: 'new',
  assigned_to: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock the supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: mockUser },
      })),
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({
        data: table === 'profiles' ? mockProfile : mockLead,
        error: null,
      })),
      then: jest.fn(() => ({
        data: [mockLead],
        count: 1,
        error: null,
      })),
    })),
  })),
}))

describe('GET /api/leads', () => {
  it('returns 401 when user is not authenticated', async () => {
    // Override mock to return no user
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as jest.Mock).mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn(() => ({ data: { user: null } })),
      },
      from: jest.fn(),
    }))

    const { GET } = await import('@/app/api/leads/route')
    const request = new NextRequest('http://localhost:3000/api/leads')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 for invalid status filter', async () => {
    const { GET } = await import('@/app/api/leads/route')
    const request = new NextRequest(
      'http://localhost:3000/api/leads?status=invalid_status'
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Invalid status')
  })

  it('returns 400 for invalid pagination', async () => {
    const { GET } = await import('@/app/api/leads/route')
    const request = new NextRequest(
      'http://localhost:3000/api/leads?page=0'
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
  })
})

describe('POST /api/leads', () => {
  it('returns 400 when name is missing', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const request = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Name is required')
  })

  it('returns 400 when email is invalid', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const request = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'not-an-email' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Valid email is required')
  })

  it('returns 400 when body is empty', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const request = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})