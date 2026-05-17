import { google } from 'googleapis';
import type { WeekDay, CandidateProfile, CandidateNotes } from './types';

const DAY_NAMES = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

// ── 既存の 作戦/フィードバック を読み取る ──────────────────────────

export async function readExistingNotes(
  auth: any,
  docId: string,
): Promise<Map<string, CandidateNotes>> {
  const notes = new Map<string, CandidateNotes>();
  try {
    const drive = google.drive({ version: 'v3', auth });
    const res = await drive.files.export({ fileId: docId, mimeType: 'text/plain' });
    parseNotes(res.data as string, notes);
  } catch {
    // ドキュメントが読めない場合は空で続行
  }
  return notes;
}

function parseNotes(text: string, notes: Map<string, CandidateNotes>) {
  // 【HH:MM　名前（都道府県）】ブロックを検出
  const blockRe = /【\d{2}:\d{2}[　\s]+([^（】\n]+?)(?:（[^）]*）)?】([\s\S]*?)(?=【|\n■|$)/g;
  let match;
  while ((match = blockRe.exec(text)) !== null) {
    const name = match[1].trim();
    const block = match[2];
    const strategy = extractField(block, '作戦（前田）');
    const feedback = extractField(block, 'フィードバック（上司・秘書）');
    if (strategy || feedback) {
      notes.set(name, { strategy, feedback });
    }
  }
}

function extractField(text: string, label: string): string {
  const escaped = label.replace(/[（）]/g, c => `\\${c}`);
  const re = new RegExp(`${escaped}[：:](.*?)(?=\\n　[^\\s]|\\n■|$)`, 's');
  const match = text.match(re);
  return match ? match[1].trim() : '';
}

// ── ドキュメント本文を生成 ──────────────────────────────────────

export function buildContent(
  weekDays: WeekDay[],
  profiles: Map<string, CandidateProfile>,
  notes: Map<string, CandidateNotes>,
  offerCount = '',
): string {
  const total = weekDays.reduce((sum, d) => sum + d.interviews.length, 0);
  const lines: string[] = [];

  lines.push('週間面談スケジュール（前田）\n');
  lines.push('──────────────────────────────────');
  lines.push('このドキュメントについて');
  lines.push('──────────────────────────────────');
  lines.push('担当者が毎週月曜日に更新します。');
  lines.push('上司・秘書の方はフィードバック欄にコメントをお願いします。\n');

  lines.push('■今週の概要');
  lines.push(`・今月のオファー承諾数：${offerCount}／17`);
  lines.push(`・今週の面談総数：${total}件\n`);

  for (const day of weekDays) {
    lines.push(`■${DAY_NAMES[day.weekday]}（${day.month}/${day.day}）`);

    if (day.interviews.length === 0) {
      lines.push('面談予定なし\n');
      continue;
    }

    for (const iv of day.interviews) {
      const profile = profiles.get(iv.name);
      const note = notes.get(iv.name) ?? { strategy: '', feedback: '' };
      const pref = profile?.found ? profile.prefecture : '－';

      lines.push(`　【${iv.time}　${iv.name}（${pref}）】`);

      if (profile?.found) {
        lines.push(`　${profile.category}／${profile.language}／${profile.tools}／${profile.companies}／${profile.years}／${profile.prefecture}`);
        lines.push(`　職務経歴書：${profile.resumeUrl}`);
      } else {
        lines.push('　※職務経歴書未特定');
        lines.push('　職務経歴書：');
      }

      lines.push(`　作戦（前田）：${note.strategy}`);
      lines.push(`　フィードバック（上司・秘書）：${note.feedback}\n`);
    }
  }

  return lines.join('\n');
}

// ── Google Doc を上書き更新 ────────────────────────────────────

export async function updateDocument(auth: any, docId: string, content: string): Promise<void> {
  const docs = google.docs({ version: 'v1', auth });

  const doc = await docs.documents.get({ documentId: docId });
  const bodyContent = doc.data.body?.content ?? [];
  const lastEl = bodyContent[bodyContent.length - 1];
  const endIndex = (lastEl?.endIndex ?? 2) - 1;

  const requests: object[] = [];

  if (endIndex > 1) {
    requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex } } });
  }
  requests.push({ insertText: { location: { index: 1 }, text: content } });

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests },
  });
}
