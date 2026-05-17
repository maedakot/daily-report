export interface Interview {
  name: string;
  time: string;    // HH:MM
  isoDate: string; // YYYY-MM-DD
  month: number;
  day: number;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
}

export interface CandidateProfile {
  found: boolean;
  category: string;   // 区分（インフラ/開発）
  language: string;   // 言語
  tools: string;      // 使用ツール
  companies: string;  // 経験社数
  years: string;      // 経験年数
  prefecture: string; // 住所（都道府県）
  resumeUrl: string;
}

export interface CandidateNotes {
  strategy: string; // 作戦（前田）
  feedback: string; // フィードバック（上司・秘書）
}

export interface WeekDay {
  weekday: number;
  month: number;
  day: number;
  isoDate: string;
  interviews: Interview[];
}
