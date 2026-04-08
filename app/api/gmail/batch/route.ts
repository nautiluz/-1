import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail/auth';
import { GmailService } from '@/lib/gmail/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokens = JSON.parse(Buffer.from(body.tokens, 'base64').toString());
    const gmail = getGmailClient(tokens);
    const service = new GmailService(gmail);
    
    let result;
    switch (body.action) {
      case 'delete':
        result = await service.deleteMessages(body.ids);
        break;
      case 'archive':
        result = await service.archiveMessages(body.ids);
        break;
      case 'mark_read':
        result = await service.markAsRead(body.ids);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error performing action' }, { status: 500 });
  }
}