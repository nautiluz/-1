import { gmail_v1 } from 'googleapis';
import { Email, EmailStats, SenderInfo, CleaningRule } from './types';

export class GmailService {
  private gmail: gmail_v1.Gmail;

  constructor(gmail: gmail_v1.Gmail) {
    this.gmail = gmail;
  }

  async getProfile(): Promise<gmail_v1.Schema$Profile> {
    const response = await this.gmail.users.getProfile({ userId: 'me' });
    return response.data;
  }

  async getMessages(query: string = '', maxResults: number = 100): Promise<Email[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    const messages = response.data.messages || [];
    const emails: Email[] = [];

    for (const msg of messages) {
      if (msg.id) {
        const detail = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
        });
        const headers = detail.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value;

        emails.push({
          id: msg.id,
          subject: getHeader('Subject') || '(Sin asunto)',
          from: getHeader('From') || '',
          to: getHeader('To') || '',
          date: getHeader('Date') || '',
          snippet: detail.data.snippet || '',
          labelIds: detail.data.labelIds,
          sizeEstimate: detail.data.sizeEstimate,
          threadId: detail.data.threadId,
        });
      }
    }

    return emails;
  }

  async getStats(): Promise<EmailStats> {
    const profile = await this.getProfile();
    const total = parseInt(profile.messagesTotal || '0', 10);
    const storageTotal = 15 * 1024 * 1024 * 1024;

    const [unread, starred] = await Promise.all([
      this.getMessages('is:unread', 1),
      this.getMessages('is:starred', 1),
    ]);

    const categoryPromises = ['category:primary', 'category:promotions', 'category:social', 'category:updates', 'category:forums'];
    const categoryLabels = ['primary', 'promotions', 'social', 'updates', 'forums'];
    
    const categories = await Promise.all(
      categoryPromises.map(q => this.getMessages(q, 1))
    );

    const category: any = {};
    categoryLabels.forEach((label, i) => {
      category[label] = categories[i].length > 0 ? 100 : 0;
    });

    return {
      total,
      unread: profile.messagesTotalThreads || 0,
      starred: starred.length > 0 ? 100 : 0,
      category,
      storageUsed: parseInt(profile.messagesTotal || '0') * 50000,
      storageTotal,
    };
  }

  async getTopSenders(limit: number = 20): Promise<SenderInfo[]> {
    const messages = await this.getMessages('', 500);
    const senderMap = new Map<string, SenderInfo>();

    for (const email of messages) {
      const match = email.from.match(/<(.+)>/) || [null, email.from];
      const sender = match[1] || email.from;
      
      if (senderMap.has(sender)) {
        const info = senderMap.get(sender)!;
        info.count++;
        info.totalSize += email.sizeEstimate || 0;
      } else {
        senderMap.set(sender, {
          email: sender,
          count: 1,
          totalSize: email.sizeEstimate || 0,
          lastEmailDate: email.date,
        });
      }
    }

    return Array.from(senderMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async deleteMessages(ids: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.gmail.users.messages.delete({ userId: 'me', id });
        deleted++;
      } catch {
        failed++;
      }
    }

    return { deleted, failed };
  }

  async archiveMessages(ids: string[]): Promise<{ archived: number; failed: number }> {
    let archived = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id,
          requestBody: { removeLabelIds: ['INBOX'] },
        });
        archived++;
      } catch {
        failed++;
      }
    }

    return { archived, failed };
  }

  async markAsRead(ids: string[]): Promise<{ marked: number; failed: number }> {
    let marked = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id,
          requestBody: { removeLabelIds: ['UNREAD'] },
        });
        marked++;
      } catch {
        failed++;
      }
    }

    return { marked, failed };
  }

  async applyLabel(ids: string[], labelId: string): Promise<{ applied: number; failed: number }> {
    let applied = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id,
          requestBody: { addLabelIds: [labelId] },
        });
        applied++;
      } catch {
        failed++;
      }
    }

    return { applied, failed };
  }

  async executeCleaningRule(rule: CleaningRule): Promise<{ processed: number; deleted: number }> {
    let query = '';
    const { criteria } = rule;

    switch (criteria.type) {
      case 'age':
        const days = criteria.value as number;
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = `before:${date.toISOString().split('T')[0]}`;
        break;
      case 'size':
        const sizeInBytes = criteria.value as number;
        query = `size:${Math.floor(sizeInBytes / 1024)}k`;
        break;
      case 'sender':
        query = criteria.operator === 'contains' 
          ? `from:${criteria.value}` 
          : `from:${criteria.value}`;
        break;
      case 'subject':
        query = criteria.operator === 'contains'
          ? `subject:${criteria.value}`
          : `subject:"${criteria.value}"`;
        break;
    }

    const messages = await this.getMessages(query, 500);
    const ids = messages.map(m => m.id);

    if (rule.action === 'delete') {
      return await this.deleteMessages(ids);
    } else if (rule.action === 'archive') {
      return await this.archiveMessages(ids);
    } else {
      return await this.markAsRead(ids);
    }
  }

  async getLabels(): Promise<gmail_v1.Schema$Label[]> {
    const response = await this.gmail.users.labels.list({ userId: 'me' });
    return response.data.labels || [];
  }

  async createLabel(name: string): Promise<string> {
    const response = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });
    return response.data.id || '';
  }
}