/**
 * Server-Side Dynamic QR Redirection Engine
 * Handles GET /r/:shortCode with bot filtering, duplicate debouncing,
 * and synchronous scan persistence before issuing HTTP 302/307.
 */

import crypto from 'node:crypto';
import type { Request, Response } from 'express';

// Known bot and preview crawler signatures
const BOT_SIGNATURES = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /yahoo/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /whatsapp/i,
  /telegrambot/i,
  /twitterbot/i,
  /slackbot/i,
  /discordbot/i,
  /applebot/i,
];

// In-memory 5-minute sliding debounce cache: key -> timestamp
const debounceCache = new Map<string, number>();
const DEBOUNCE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired debounce entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of debounceCache.entries()) {
    if (now - timestamp > DEBOUNCE_WINDOW_MS) {
      debounceCache.delete(key);
    }
  }
}, 60 * 1000);

export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  return BOT_SIGNATURES.some((regex) => regex.test(userAgent));
}

export function generateDailySessionHash(
  ip: string,
  userAgent: string,
  secret: string
): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const salt = `${secret}_${today}`;
  return crypto
    .createHmac('sha256', salt)
    .update(`${ip}|${userAgent}`)
    .digest('hex');
}

export function parseDeviceAndBrowser(userAgent: string) {
  let deviceType = 'desktop';
  let os = 'Other';
  let browser = 'Other';

  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  if (/chrome|crios/i.test(userAgent) && !/edge|edg|opr/i.test(userAgent))
    browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent))
    browser = 'Safari';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
  else if (/edge|edg/i.test(userAgent)) browser = 'Edge';

  return { deviceType, os, browser };
}

export function renderInactiveQrPage(
  res: Response,
  title: string,
  message: string
) {
  res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Organization QR Portal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #F8FAFC;
      color: #0F172A;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1rem;
    }
    .card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 1rem;
      padding: 2.5rem;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }
    .badge {
      display: inline-block;
      background: #FEF3C7;
      color: #92400E;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
      color: #166534;
    }
    p {
      color: #64748B;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0 0 1.5rem;
    }
    .footer {
      font-size: 0.75rem;
      color: #94A3B8;
      border-top: 1px solid #F1F5F9;
      padding-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Notice</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">Organization Enterprise QR Portal</div>
  </div>
</body>
</html>
  `);
}

export async function handleRedirectRequest(
  req: Request,
  res: Response,
  options: {
    findQrCode: (shortCode: string) => Promise<any | null>;
    persistScan: (scanData: any) => Promise<void>;
    incrementScanCount: (qrCodeId: string) => Promise<void>;
    dailySaltSecret: string;
  }
) {
  const shortCode = req.params.shortCode;

  if (!shortCode) {
    return renderInactiveQrPage(
      res,
      'Invalid QR Code',
      'The requested QR redirect identifier is invalid or missing.'
    );
  }

  try {
    const qrCode = await options.findQrCode(shortCode);

    if (!qrCode) {
      return renderInactiveQrPage(
        res,
        'QR Code Not Found',
        'This QR code does not exist or has been removed.'
      );
    }

    if (qrCode.status !== 'active' || qrCode.isDeleted) {
      return renderInactiveQrPage(
        res,
        'QR Code Currently Inactive',
        'This QR code has been paused by the administrator or has expired.'
      );
    }

    const destinationUrl = qrCode.destination_url;
    if (!destinationUrl) {
      return renderInactiveQrPage(
        res,
        'Destination Unavailable',
        'No active destination URL is assigned to this QR code.'
      );
    }

    const userAgent = req.get('user-agent') || '';
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    // 1. Bot check - redirect bots immediately without recording scan metrics
    if (isBot(userAgent)) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      });
      return res.redirect(302, destinationUrl);
    }

    // 2. Duplicate debounce check (5-minute sliding window)
    const qrIdentifier = qrCode._id || qrCode.id;
    const debounceKey = `${rawIp}_${userAgent}_${qrIdentifier}`;
    const now = Date.now();
    const lastScan = debounceCache.get(debounceKey);
    const isRepeatScan = !!lastScan && now - lastScan < DEBOUNCE_WINDOW_MS;
    debounceCache.set(debounceKey, now);

    // 3. Privacy-conscious session hash (Zero raw IP stored)
    const sessionHash = generateDailySessionHash(
      rawIp,
      userAgent,
      options.dailySaltSecret
    );
    const { deviceType, os, browser } = parseDeviceAndBrowser(userAgent);

    // 4. Synchronous Scan Persistence BEFORE sending HTTP 302 response
    const scanRecord = {
      qr_code_id: qrIdentifier,
      qr_name: qrCode.name || null,
      department_id: qrCode.department_id || null,
      scanned_at: new Date().toISOString(),
      device_type: deviceType,
      browser,
      operating_system: os,
      country: (req.headers['cf-ipcountry'] as string) || null,
      city: null,
      referrer: req.get('referrer') || null,
      anonymous_session_hash: sessionHash,
      is_repeat_scan: isRepeatScan,
    };

    // Await persistence in MongoDB before redirecting
    await Promise.all([
      options.persistScan(scanRecord),
      options.incrementScanCount(qrIdentifier),
    ]);

    // 5. Issue HTTP 302 Found response
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    });
    return res.redirect(302, destinationUrl);
  } catch (err) {
    console.error('Redirect engine error:', err);
    return renderInactiveQrPage(
      res,
      'System Notice',
      'Unable to process the QR redirect at this time. Please try again later.'
    );
  }
}
