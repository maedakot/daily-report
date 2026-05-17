/**
 * Google OAuth2 初期認証スクリプト
 * 初回のみ実行してリフレッシュトークンを取得する
 *
 * 実行方法:
 *   1. .env に GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET を設定
 *   2. npx ts-node scripts/setup-auth.ts
 *   3. ブラウザで URL を開いて認証
 *   4. 表示された GOOGLE_REFRESH_TOKEN を .env と GitHub Secrets に保存
 */
import 'dotenv/config';
import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import { SCOPES } from '../src/auth';

const REDIRECT_URI = 'http://localhost:3000/callback';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET を .env に設定してください');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\nブラウザで以下の URL を開いてください:');
console.log(authUrl);
console.log('\nhttp://localhost:3000 でコールバックを待機中...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/callback')) return;

  const code = url.parse(req.url, true).query.code as string;
  res.end('<h1>認証完了。ターミナルを確認してください。</h1>');
  server.close();

  const { tokens } = await oauth2Client.getToken(code);
  console.log('='.repeat(60));
  console.log('GOOGLE_REFRESH_TOKEN を以下の値で設定してください:');
  console.log(tokens.refresh_token);
  console.log('='.repeat(60));
});

server.listen(3000);
