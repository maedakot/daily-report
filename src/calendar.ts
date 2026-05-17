import { google } from 'googleapis';
import type { Interview } from './types';

// 除外パターン（内部MTG・個人ブロック・会食）
const EXCLUDE_PATTERNS = [
  '朝礼', '代表MTG', '営業インプット', 'クラウドワークス',
  'OFF', '予定あり', '対応不可', '会食',
];

export async function getWeekInterviews(auth: any, calendarId: string): Promise<Interview[]> {
  const calendar = google.calendar({ version: 'v3', auth });

  const { start, end } = getThisWeekRange();

  const res = await calendar.events.list({
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    timeZone: 'Asia/Tokyo',
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = res.data.items ?? [];
  const interviews: Interview[] = [];

  for (const event of events) {
    const title = event.summary ?? '';

    if (EXCLUDE_PATTERNS.some(p => title.includes(p))) continue;
    if (!event.start?.dateTime) continue; // 終日イベントはスキップ

    const jstStart = toJST(new Date(event.start.dateTime));

    interviews.push({
      name: extractName(title),
      time: `${pad(jstStart.getHours())}:${pad(jstStart.getMinutes())}`,
      isoDate: formatDate(jstStart),
      month: jstStart.getMonth() + 1,
      day: jstStart.getDate(),
      weekday: jstStart.getDay(),
    });
  }

  return interviews;
}

function getThisWeekRange() {
  const now = toJST(new Date());
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function extractName(title: string): string {
  return title
    .replace(/との?面談.*/u, '')
    .replace(/[　\s]面談.*/u, '')
    .replace(/[（(][^）)]*[）)]/gu, '')
    .trim();
}

function toJST(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
