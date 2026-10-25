export const statuses = [
  'applied',
  'first',
  'second',
  'hr',
  'other',
  'offer',
  'rejectedBefore',
  'rejectedAfter',
  'withdrawn',
] as const;
export type Status = (typeof statuses)[number];
export type Language = 'zh' | 'en';
export type Tone = 'gentle' | 'humor' | 'off';
export type Page =
  'home' | 'applications' | 'reviews' | 'favorites' | 'settings';

export interface Interview {
  id: string;
  applicationId: string;
  round: string;
  date: string;
  questions: string;
  performance: string;
  selfNote: string;
  impressions: string[];
  interviewerNote: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}
export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  priority: number;
  appliedAt: string;
  status: Status;
  url: string;
  salary: string;
  nextAction: string;
  nextDate: string;
  createdAt: string;
  updatedAt: string;
  interviews: Interview[];
}
export interface Store {
  version: 1;
  applications: Application[];
  settings: { language: Language; tone: Tone };
}
export type ApplicationInput = Omit<
  Application,
  'id' | 'createdAt' | 'updatedAt' | 'interviews'
>;
export type InterviewInput = Omit<
  Interview,
  'id' | 'applicationId' | 'createdAt' | 'updatedAt'
>;
export const interviewStatuses: Status[] = ['first', 'second', 'hr', 'other'];
export const closedStatuses: Status[] = [
  'rejectedBefore',
  'rejectedAfter',
  'withdrawn',
];
export const stageGroups = [
  { id: 'applied', statuses: ['applied'] },
  { id: 'interview', statuses: interviewStatuses },
  { id: 'offer', statuses: ['offer'] },
  { id: 'closed', statuses: closedStatuses },
] as const;

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
