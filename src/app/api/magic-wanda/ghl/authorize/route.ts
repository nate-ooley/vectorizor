import { NextResponse } from 'next/server';
import { auth } from '@/lib/magic-wanda/auth';
import { buildAuthUrl } from '@/lib/magic-wanda/ghl-oauth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = (session as { tenantId: string }).tenantId;

    // Encode tenantId as state for the callback to identify the tenant
    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64url');
    const authUrl = buildAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('GHL authorize error:', error);
    return NextResponse.json({ error: 'Failed to start GHL authorization' }, { status: 500 });
  }
}
