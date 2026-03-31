const GHL_AUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation';
const GHL_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';

// Scopes needed for Magic Wanda's 4 skill areas
const SCOPES = [
  'contacts.readonly',
  'contacts.write',
  'calendars.readonly',
  'calendars/events.readonly',
  'calendars/events.write',
  'conversations.readonly',
  'conversations/message.readonly',
  'conversations/message.write',
  'invoices.readonly',
  'invoices.write',
  'locations.readonly',
].join(' ');

interface GHLTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  locationId: string;
  userId: string;
}

export function buildAuthUrl(state: string): string {
  const clientId = process.env.GHL_CLIENT_ID;
  const redirectUri = process.env.GHL_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('GHL_CLIENT_ID and GHL_REDIRECT_URI must be set');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });

  return `${GHL_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GHLTokenResponse> {
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GHL_CLIENT_ID and GHL_CLIENT_SECRET must be set');
  }

  const res = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GHLTokenResponse> {
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GHL_CLIENT_ID and GHL_CLIENT_SECRET must be set');
  }

  const res = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return res.json();
}
