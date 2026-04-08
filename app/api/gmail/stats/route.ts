import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail/auth';
import { GmailService } from '@/lib/gmail/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokens = JSON.parse(Buffer.from(body.tokens, 'base64').toString());
    const gmail = getGmailClient(tokens);
    const service = new GmailService(gmail);
    const stats = await service.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
  }
}