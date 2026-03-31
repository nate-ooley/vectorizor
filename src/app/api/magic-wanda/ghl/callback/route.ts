import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/magic-wanda/ghl-oauth';
import { encrypt } from '@/lib/magic-wanda/encryption';
import { prisma } from '@/lib/magic-wanda/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(new URL('/magic-wanda/settings?error=missing_params', request.url));
    }

    // Decode state to get tenantId
    let tenantId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      tenantId = decoded.tenantId;
    } catch {
      return NextResponse.redirect(new URL('/magic-wanda/settings?error=invalid_state', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Encrypt tokens before storing
    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = encrypt(tokens.refresh_token);

    // Store tokens on the tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ghlAccessToken: encryptedAccess,
        ghlRefreshToken: encryptedRefresh,
        ghlTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        ghlLocationId: tokens.locationId,
        ghlScopes: tokens.scope,
      },
    });

    return NextResponse.redirect(new URL('/magic-wanda/settings?success=connected', request.url));
  } catch (error) {
    console.error('GHL callback error:', error);
    return NextResponse.redirect(new URL('/magic-wanda/settings?error=token_exchange_failed', request.url));
  }
}
