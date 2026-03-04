export interface CallRecord {
  id: number;
  created_at: string;
  file_name: string;
  agent_name: string;
  call_duration: number;
  call_date: string;
  customerName: string;
  first_name: string;
  last_name: string;
  hawksoft_url: string[];
  phone_number: string;
  call_transcript: string;
  call_direction: string;
  phone_area: string;
  call_summary: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    key_points: string[];
    main_issues: string[];
    complaint_flag: boolean;
    confusion_flag: boolean;
    issue_resolved: boolean;
    follow_up_actions: string[];
    customerName?: string;
  };
  call_time: string;
}

export interface SelectedCallRecord {
  first_name: string;
  last_name: string;
  hawksoft_url: string[];
  agentName: string;
  callTime: string;
  call_time?: string;
  duration: string;
  phone: string;
  transcript?: string;
  calldirection: string;
  area: string;
  // call_direction: "inbound" | "outbound";
  issueResolved: boolean;
  coverages: string[];
  executiveSummary: string;
  disposition: string;
  confusion: string;
  highlights: string[];
  mainIssues: string[];
  actionItems: string[];
  complaint: string;
}

export interface CallMetrics {
  totalCalls: number;
  outboundCalls: number;
  inboundCalls: number;
  averageDuration: number;
  needsAttention: number;
}

export interface CallFrequencyData {
  hour: string;
  calls: number;
}

export interface ChartData {
  insuranceData: Array<{
    name: string;
    value: number;
    color: string;
    count: number;
  }>;
  callDirectionData: Array<{
    name: string;
    inbound: number;
    outbound: number;
  }>;
  callFrequencyData: Array<{
    hour: string;
    calls: number;
  }>;

  resolutionScore: number;
}
// Call Summary Types
export interface CallSummary {
  issue_resolved: boolean;
  confusion_flag: boolean;
  complaint_flag: boolean;
}

// Call Data Type
export interface CallData {
  id: number;
  call_direction: "inbound" | "outbound";
  call_duration: number;
  call_time: string;
  call_summary: CallSummary;
}
export interface CallDetailsState {
  calls: CallRecord[];
  metrics: CallMetrics;
  chartData: ChartData;
  isLoading: boolean;
  error: string | null;
  fetchCallDetails: (type: string, date: string) => Promise<void>;
  //   getCallDetails: (callId: string) => Promise<void>;
}

export interface NewCallSummary {
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  disposition?: string;
  key_points: string[];
  main_issues: string[];
  follow_up_actions: string[];
  issue_resolved: boolean;
}

export interface NewCall {
  agent_name: string;
  call_time: string;
  first_name: string;
  last_name: string;
  hawksoft_url: string[];
  phone_number: string;
  phone_area: string;
  call_duration: number;
  call_direction: string;
  call_transcript: string;
  call_summary: NewCallSummary;
}
