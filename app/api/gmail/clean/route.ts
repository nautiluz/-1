import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail/auth';
import { GmailService } from '@/lib/gmail/service';
import { CleaningRule } from '@/lib/gmail/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokens = JSON.parse(Buffer.from(body.tokens, 'base64').toString());
    const gmail = getGmailClient(tokens);
    const service = new GmailService(gmail);
    const rule: CleaningRule = body.rule;
    const result = await service.executeCleaningRule(rule);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error executing cleaning rule' }, { status: 500 });
  }
}