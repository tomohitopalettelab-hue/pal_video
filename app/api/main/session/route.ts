import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionValue, isExpired, MAIN_SESSION_COOKIE_NAME } from '../../../../lib/auth-session';
import { getJobsByPaletteId } from '../../_lib/pal-video-store';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(MAIN_SESSION_COOKIE_NAME)?.value;
    const session = parseSessionValue(cookieValue);

    if (!session || isExpired(session) || session.role !== 'customer' || !session.customerId) {
      return NextResponse.json({ authenticated: false, paletteId: null, jobs: [] });
    }

    const paletteId = session.customerId;
    const jobs = await getJobsByPaletteId(paletteId, 20);

    return NextResponse.json({ authenticated: true, paletteId, jobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'セッション確認に失敗しました。';
    return NextResponse.json({ authenticated: false, paletteId: null, jobs: [], error: message }, { status: 500 });
  }
}
