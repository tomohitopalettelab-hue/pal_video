import { NextResponse } from 'next/server';
import { listPalVideoAccountsFromPalDb } from '../../_lib/pal-video-accounts';

export const maxDuration = 60;

export async function GET() {
  try {
    const accounts = await listPalVideoAccountsFromPalDb();
    return NextResponse.json({ success: true, customers: accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '顧客一覧の取得に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
