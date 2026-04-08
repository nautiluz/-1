import { NextRequest, NextResponse } from 'next/server';
import { createOAuth2Client, getAuthUrl } from '@/lib/gmail/auth';

export async function GET() {
  try {
    const oauth2Client = await createOAuth2Client();
    const url = getAuthUrl(oauth2Client);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: 'Error generating auth URL' }, { status: 500 });
  }
}