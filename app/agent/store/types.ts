export interface CallData {
  day: string;
  total_count: number;
  confusion_count: number;
  complaint_count: number;
  // confusions: number;
  // complaints: number;
  // total: number;
}

export interface CallDataRecord {
  [date: string]: CallData;
}

export interface AgentDailySummary {
  day: string;
  month: string;
  total_calls: number;
  total_confusion_calls: number;
  total_complaint_calls: number;
}

export interface CallDetails {
  id: string;
  type: "inbound" | "outbound";
  phone: string;
  time: string;
  customerName: string;
  disposition: string;
}

export interface CallSummary {
  direction: string;
  time: string;
  resolved: string;
  duration: string;
  area: string;
  phone: string;
  executiveSummary: string;
  actionItems: string[];
  highlights: string[];
}

export interface AudioFile {
  id: number;
  created_at: string;
  file_name: string;
  agent_name: string;
  call_duration: number;
  call_date: string;
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
    todoItems: string[];
    key_points: string[];
    disposition: string;
    main_issues: string[];
    customerName: string;
    complaint_flag: boolean;
    confusion_flag: boolean;
    issue_resolved: boolean;
    follow_up_actions: string[];
  };
  call_time: string;
}

export interface AgentStore {
  dailySummaries: AgentDailySummary[];
  selectedDate: string | null;
  callDetails: CallDetails[];
  callSummary: CallSummary | null;
  audioFiles: AudioFile[];
  selectedAudioFile: AudioFile | null;
  isLoading: boolean;
  error: string | null;
  fetchDailySummaries: (agentName: string, month: string) => Promise<void>;
  fetchAudioFiles: (date: string, agentName: string) => Promise<void>;
  setSelectedAudioFile: (file: AudioFile | null) => void;
  setSelectedDate: (date: string | null) => void;
}
