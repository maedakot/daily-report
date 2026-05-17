import 'dotenv/config';
import { getAuth } from './auth';
import { getWeekInterviews } from './calendar';
import { getCandidateProfile } from './candidates';
import { readExistingNotes, buildContent, updateDocument } from './document';
import type { CandidateProfile, WeekDay } from './types';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? 'primary';
const DOC_ID = process.env.GOOGLE_DOC_ID ?? '';

async function main() {
  if (!DOC_ID) throw new Error('GOOGLE_DOC_ID is not set');

  const auth = getAuth();

  console.log('📅 Google Calendar から今週の面談を取得中...');
  const interviews = await getWeekInterviews(auth, CALENDAR_ID);
  console.log(`   ${interviews.length} 件の面談を検出`);

  console.log('👤 候補者プロフィールを取得中...');
  const profiles = new Map<string, CandidateProfile>();
  for (const iv of interviews) {
    const profile = await getCandidateProfile(iv.name);
    profiles.set(iv.name, profile);
    console.log(`   ${profile.found ? '✓' : '-'} ${iv.name}`);
  }

  console.log('📝 既存の作戦/フィードバックを読み取り中...');
  const notes = await readExistingNotes(auth, DOC_ID);
  console.log(`   ${notes.size} 件の既存メモを保持`);

  const weekDays = buildWeekDays(interviews);
  const content = buildContent(weekDays, profiles, notes);

  console.log('🔄 Google Doc を更新中...');
  await updateDocument(auth, DOC_ID, content);

  console.log('✅ 完了');
}

function buildWeekDays(interviews: ReturnType<typeof Array.prototype.filter>): WeekDay[] {
  const now = toJST(new Date());
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isoDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    days.push({
      weekday: d.getDay(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      isoDate,
      interviews: interviews.filter((iv: any) => iv.isoDate === isoDate),
    });
  }
  return days;
}

function toJST(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
