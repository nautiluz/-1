export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  labelIds?: string[];
  sizeEstimate?: number;
  threadId?: string;
}

export interface EmailStats {
  total: number;
  unread: number;
  starred: number;
  category: {
    primary: number;
    promotions: number;
    social: number;
    updates: number;
    forums: number;
  };
  storageUsed: number;
  storageTotal: number;
}

export interface SenderInfo {
  email: string;
  count: number;
  totalSize: number;
  lastEmailDate: string;
}

export interface FilterRule {
  id: string;
  name: string;
  query: string;
  action: 'delete' | 'archive' | 'mark_read' | 'apply_label';
  enabled: boolean;
}

export interface CleaningRule {
  id: string;
  name: string;
  criteria: {
    type: 'age' | 'size' | 'sender' | 'label' | 'subject';
    value: string | number;
    operator: 'greater_than' | 'less_than' | 'contains' | 'equals';
  };
  action: 'delete' | 'archive' | 'mark_read';
  enabled: boolean;
}