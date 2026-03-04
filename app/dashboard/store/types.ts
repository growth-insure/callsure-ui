export interface CallData {
  day: string;
  month: string;
  total_count: number;
  confusion_count: number;
  complaint_count: number;
}

export interface CallDataRecord {
  [date: string]: CallData;
}

export interface CallMetrics {
  totalCalls: number;
  outboundCalls: number;
  inboundCalls: number;
  averageDuration: number;
  needsAttention: number;
}

export interface CallModalData {
  agentName: string;
  callTime: string;
  phone: string;
  area: string;
  duration: string;
  issueResolved: boolean;
  coverages: string[];
  executiveSummary: string;
  disposition: string;
  confusion: string;
  highlights: string[];
  mainIssues: string[];
  actionItems: string[];
  complaint?: string;
}
