import { prisma } from '../db';
import { encrypt, decrypt } from '../encryption';
import { refreshAccessToken } from '../ghl-oauth';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

export class GHLClient {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async getAccessToken(): Promise<{ token: string; locationId: string }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: this.tenantId },
    });

    if (!tenant?.ghlAccessToken || !tenant?.ghlRefreshToken || !tenant?.ghlLocationId) {
      throw new Error('GHL not connected. Please connect your GoHighLevel account in Settings.');
    }

    // Check if token is expired (refresh 5 minutes early)
    const isExpired = tenant.ghlTokenExpiry
      ? new Date(tenant.ghlTokenExpiry).getTime() < Date.now() + 5 * 60 * 1000
      : true;

    if (isExpired) {
      // Refresh the token
      const decryptedRefresh = decrypt(tenant.ghlRefreshToken);
      const newTokens = await refreshAccessToken(decryptedRefresh);

      const encryptedAccess = encrypt(newTokens.access_token);
      const encryptedRefresh = encrypt(newTokens.refresh_token);

      await prisma.tenant.update({
        where: { id: this.tenantId },
        data: {
          ghlAccessToken: encryptedAccess,
          ghlRefreshToken: encryptedRefresh,
          ghlTokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      });

      return { token: newTokens.access_token, locationId: tenant.ghlLocationId };
    }

    return { token: decrypt(tenant.ghlAccessToken), locationId: tenant.ghlLocationId };
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const { token, locationId } = await this.getAccessToken();

    const url = new URL(`${GHL_BASE_URL}${path}`);
    // Always include locationId if not already in params
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    if (!url.searchParams.has('locationId')) {
      url.searchParams.set('locationId', locationId);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GHL API error (${res.status}): ${error}`);
    }

    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const { token } = await this.getAccessToken();

    const res = await fetch(`${GHL_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GHL API error (${res.status}): ${error}`);
    }

    return res.json();
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const { token } = await this.getAccessToken();

    const res = await fetch(`${GHL_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GHL API error (${res.status}): ${error}`);
    }

    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const { token } = await this.getAccessToken();

    const res = await fetch(`${GHL_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GHL API error (${res.status}): ${error}`);
    }

    return res.json();
  }

  async getLocationId(): Promise<string> {
    const { locationId } = await this.getAccessToken();
    return locationId;
  }
}
