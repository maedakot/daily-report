import type { CandidateProfile } from './types';

// ----------------------------------------------------------------
// TODO: 明日の作業 — 下記を社内API呼び出しに置き換える
//
//   const res = await fetch(`${process.env.INTERNAL_API_URL}/candidates?name=${name}`, {
//     headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` },
//   });
//   const data = await res.json();
//   return {
//     found: true,
//     category:   data.category,   // 区分（インフラ/開発）
//     language:   data.language,   // 言語
//     tools:      data.tools,      // 使用ツール
//     companies:  data.companies,  // 経験社数
//     years:      data.years,      // 経験年数
//     prefecture: data.prefecture, // 住所（都道府県）
//     resumeUrl:  data.resumeUrl,
//   };
// ----------------------------------------------------------------

export async function getCandidateProfile(name: string): Promise<CandidateProfile> {
  return {
    found: false,
    category: '',
    language: '',
    tools: '',
    companies: '',
    years: '',
    prefecture: '',
    resumeUrl: '',
  };
}
