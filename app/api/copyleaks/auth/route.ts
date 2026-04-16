import { NextResponse } from 'next/server'
import { getCopyleaksToken } from '@/lib/copyleaks'

export async function POST() {
  try {
    const token = await getCopyleaksToken()
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate with Copyleaks' },
      { status: 500 }
    )
  }
}