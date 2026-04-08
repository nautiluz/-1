import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail/auth';
import { GmailService } from '@/lib/gmail/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokens = JSON.parse(Buffer.from(body.tokens, 'base64').toString());
    const gmail = getGmailClient(tokens);
    const service = new GmailService(gmail);
    const topSenders = await service.getTopSenders(20);
    return NextResponse.json(topSenders);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching top senders' }, { status: 500 });
  }
}