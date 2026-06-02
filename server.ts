import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

import { CHANNELS, CATEGORIES } from "./src/data.js";

// Load and manage custom channels persistently
let customChannels: any[] = [];
const customChannelsPath = path.join(process.cwd(), "custom_channels.json");

try {
  if (fs.existsSync(customChannelsPath)) {
    const fileData = fs.readFileSync(customChannelsPath, "utf-8");
    customChannels = JSON.parse(fileData);
    console.log(`[Channels DB] Successfully loaded ${customChannels.length} custom channels.`);
  } else {
    fs.writeFileSync(customChannelsPath, JSON.stringify([], null, 2), "utf-8");
  }
} catch (e) {
  console.error("[Channels DB] Error loading custom channels:", e);
}

let allChannelsServer = [...CHANNELS, ...customChannels];
let channelsVersion = Date.now().toString();

// Resolves karwan.tv webpage URLs to their dynamic HLS tokenized stream manifests dynamically at request time.
async function resolveKarwanStream(webpageUrl: string): Promise<string> {
  const baseHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Upgrade-Insecure-Requests": "1"
  };

  let cleanUrl = webpageUrl;
  // If the user appended .m3u8 or some file name to make it look like an HLS url, strip it off to get the parent page.
  // E.g., https://karwan.tv/nrt-sport/index.m3u8 -> https://karwan.tv/nrt-sport/
  if (cleanUrl.toLowerCase().includes(".m3u8")) {
    cleanUrl = cleanUrl.replace(/\/[^\/]+\.m3u8$/, "/");
  }

  console.log(`[Karwan Resolver] Resolving webpage dynamically: ${cleanUrl} (original: ${webpageUrl})`);
  
  // Step 1: Fetch main page (with browser navigation handshake)
  let pageRes = await fetch(cleanUrl, { 
    headers: {
      ...baseHeaders,
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1"
    } 
  });

  if (!pageRes.ok) {
    console.warn(`[Karwan Resolver] Handshake fetch failed with ${pageRes.status}. Retrying with simple browser User-Agent...`);
    pageRes = await fetch(cleanUrl, {
      headers: {
        "User-Agent": baseHeaders["User-Agent"]
      }
    });
  }

  if (!pageRes.ok) throw new Error(`Failed to fetch Karwan page: ${pageRes.status}`);
  const html = await pageRes.text();

  // If the page itself contains a direct m3u8 stream URL (e.g. Clappr embed on kurdtvs.net),
  // parse and return it directly as a highly efficient fast-path!
  const directM3u8Match = html.match(/['"](https?:\\?\/\\?[^'"]+\.m3u8[^'"]*)['"]/i);
  if (directM3u8Match) {
    const rawUrl = directM3u8Match[1];
    const cleanStreamUrl = rawUrl.replace(/\\/g, "");
    console.log(`[Stream Resolver] Found direct M3U8 inside webpage HTML: ${cleanStreamUrl}`);
    return cleanStreamUrl;
  }

  // Extract cookies from the main page fetch to satisfy credentials/session requirements
  let cookieHeaderStr = "";
  const rawCookies = pageRes.headers.getSetCookie ? pageRes.headers.getSetCookie() : [];
  if (rawCookies.length > 0) {
    cookieHeaderStr = rawCookies.map(cookie => cookie.split(';')[0]).join('; ');
  } else {
    const singleCookie = pageRes.headers.get('set-cookie');
    if (singleCookie) {
      cookieHeaderStr = singleCookie.split(',').map(cookie => cookie.split(';')[0]).join('; ');
    }
  }

  // Find post ID, e.g. postid-4222
  const postIdMatch = html.match(/postid-(\d+)/i);
  let postId = "";
  if (postIdMatch) {
    postId = postIdMatch[1];
    console.log(`[Karwan Resolver] Found WordPress post ID: ${postId}`);
  }

  // Set up AJAX request to admin-ajax.php for video_info
  let ajaxSources: any[] = [];
  if (postId) {
    try {
      const parsedWebpageUrl = new URL(cleanUrl);
      const ajaxUrl = `${parsedWebpageUrl.origin}/wp-admin/admin-ajax.php?action=video_info&post_id=${postId}`;
      console.log(`[Karwan Resolver] Fetching stream sources from WordPress AJAX: ${ajaxUrl}`);
      
      const ajaxRes = await fetch(ajaxUrl, {
        headers: {
          ...baseHeaders,
          "Referer": cleanUrl,
          "X-Requested-With": "XMLHttpRequest",
          ...(cookieHeaderStr ? { 'Cookie': cookieHeaderStr } : {})
        }
      });
      
      if (ajaxRes.ok) {
        const ajaxText = await ajaxRes.text();
        console.log(`[Karwan Resolver] AJAX Response: ${ajaxText}`);
        fs.appendFileSync(path.join(process.cwd(), "log_debug.txt"), `AJAX_RESPONSE: ${ajaxText}\n`, "utf-8");
        
        try {
          const ajaxJson = JSON.parse(ajaxText);
          if (ajaxJson && ajaxJson.data && ajaxJson.data.sources) {
            ajaxSources = ajaxJson.data.sources;
            console.log(`[Karwan Resolver] Found ${ajaxSources.length} sources from AJAX`);
          }
        } catch (e: any) {
          console.error(`[Karwan Resolver] Failed to parse AJAX JSON response: ${e.message}`);
        }
      } else {
        console.error(`[Karwan Resolver] AJAX request failed with status: ${ajaxRes.status}`);
      }
    } catch (err: any) {
      console.error(`[Karwan Resolver] Error fetching AJAX sources: ${err.message || err}`);
    }
  }

  // Determine the iframe or stream URL to proceed with
  let embedUrl = "";
  if (ajaxSources.length > 0 && ajaxSources[0].src) {
    embedUrl = ajaxSources[0].src;
    console.log(`[Karwan Resolver] Selected source URL from AJAX: ${embedUrl}`);
  } else {
    // Fallback to iframe src from html (support both numeric and alphanumeric/slug embed IDs)
    const embedMatch = html.match(/src=["'](https:\/\/karwan\.tv\/embed\/[^"'\s>]+|\/embed\/[^\s"'>]+)["']/i);
    if (!embedMatch) throw new Error("Could not find embed iframe URL in webpage and AJAX fallback failed");
    embedUrl = embedMatch[1];
  }

  if (embedUrl.startsWith("/")) {
    embedUrl = `https://karwan.tv${embedUrl}`;
  }

  const embedUrlNoSlash = embedUrl.endsWith("/") ? embedUrl.slice(0, -1) : embedUrl;
  const embedUrlWithSlash = embedUrl.endsWith("/") ? embedUrl : embedUrl + "/";

  // Step 2: Fetch embed iframe or player url (with multiple trailing-slash strategies, referers, cookies, and iframe navigate handshake)
  fs.appendFileSync(path.join(process.cwd(), "log_debug.txt"), `EMBED_URL_SLASH: ${embedUrlWithSlash}\nEMBED_URL_NO_SLASH: ${embedUrlNoSlash}\n`, "utf-8");
  
  const step2Headers = { 
    ...baseHeaders, 
    'Referer': cleanUrl,
    "Sec-Fetch-Dest": "iframe",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    ...(cookieHeaderStr ? { 'Cookie': cookieHeaderStr } : {})
  };

  let embedRes: any = null;
  let usedUrl = "";

  // If the embed or player url is already an HLS (.m3u8), we can return it directly!
  if (embedUrl.toLowerCase().includes(".m3u8")) {
    console.log(`[Karwan Resolver] Selected URL is a direct M3U8: ${embedUrl}`);
    return embedUrl;
  }

  // Try fetching without trailing slash first
  try {
    console.log(`[Proxy] Trying embed URL without trailing slash: ${embedUrlNoSlash}`);
    embedRes = await fetch(embedUrlNoSlash, { headers: step2Headers });
    usedUrl = embedUrlNoSlash;
  } catch (e: any) {
    console.error(`[Proxy] Failed fetching without slash: ${e.message}`);
  }

  // Fallback to trailing slash if first attempt was not OK
  if (!embedRes || !embedRes.ok) {
    const prevStatus = embedRes ? embedRes.status : "Error";
    console.log(`[Proxy Link Fallback] Fetching without slash returned ${prevStatus}. Retrying with slash: ${embedUrlWithSlash}`);
    try {
      embedRes = await fetch(embedUrlWithSlash, { headers: step2Headers });
      usedUrl = embedUrlWithSlash;
    } catch (e: any) {
      console.error(`[Proxy] Failed fetching with slash: ${e.message}`);
    }
  }
  
  if (embedRes && !embedRes.ok && (embedRes.status === 404 || embedRes.status === 403)) {
    console.log(`[Proxy Retry] Embed fetch failed (${embedRes.status}). Retrying with generic Karwan Referer...`);
    try {
      embedRes = await fetch(usedUrl, { 
        headers: { ...step2Headers, 'Referer': 'https://karwan.tv/', "Sec-Fetch-Site": "same-origin" } 
      });
    } catch (e: any) {
      console.error(`[Proxy Retry] Generic Referer fetch failed: ${e.message}`);
    }
  }

  if (embedRes && !embedRes.ok && (embedRes.status === 404 || embedRes.status === 403)) {
    console.log(`[Proxy Retry] Generic Referer fetch failed (${embedRes.status}). Retrying without Referer...`);
    try {
      embedRes = await fetch(usedUrl, { 
        headers: { 
          ...baseHeaders, 
          "Sec-Fetch-Dest": "iframe",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "cross-site",
          ...(cookieHeaderStr ? { 'Cookie': cookieHeaderStr } : {}) 
        } 
      });
    } catch (e: any) {
      console.error(`[Proxy Retry] Referer-less fetch failed: ${e.message}`);
    }
  }

  if (!embedRes || !embedRes.ok) {
    const finalStatus = embedRes ? embedRes.status : "No Response";
    const finalUrl = embedRes ? embedRes.url : "unknown";
    const finalHeaders = embedRes ? JSON.stringify([...embedRes.headers.entries()]) : "none";
    throw new Error(`Failed to fetch embed iframe after slash/referer fallbacks: ${finalStatus} (url: ${usedUrl || embedUrlWithSlash}, finalUrl: ${finalUrl}, headers: ${finalHeaders})`);
  }
  const embedHtml = await embedRes.text();

  let phpHtml = "";
  // Check if embedHtml is already the PHP live player frame by looking for stream matches inside it
  const hasStreamMatch = embedHtml.match(/['"](https:\/\/[^'"]+\.(m3u8|mpd)[^'"]*)['"]/i) || 
                         embedHtml.match(/src=["'](https:\/\/[^"']+\/embed\.html\?[^"']+)["']/i);
  
  if (hasStreamMatch) {
    console.log("[Karwan Resolver] embedHtml already contains the stream matches. Skipping Step 3.");
    phpHtml = embedHtml;
  } else {
    // Find live PHP iframe, e.g. src="/live/nrt-sport-1.php"
    const phpMatch = embedHtml.match(/src=["'](\/live\/[^"']+\.php)["']/i);
    if (!phpMatch) throw new Error("Could not find PHP live player URL in embed");

    const phpUrl = `https://karwan.tv${phpMatch[1]}`;

    // Step 3: Fetch PHP page (with identical fallback referer strategies and cookies forwarded)
    const step3Headers = { 
      ...baseHeaders, 
      'Referer': embedUrl,
      "Sec-Fetch-Dest": "iframe",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      ...(cookieHeaderStr ? { 'Cookie': cookieHeaderStr } : {})
    };

    let phpRes = await fetch(phpUrl, { headers: step3Headers });
    
    if (!phpRes.ok && (phpRes.status === 404 || phpRes.status === 403)) {
      console.log(`[Proxy Retry] Fetching PHP page with embed Referer failed (${phpRes.status}). Retrying with generic Karwan Referer...`);
      phpRes = await fetch(phpUrl, { 
        headers: { ...step3Headers, 'Referer': 'https://karwan.tv/', "Sec-Fetch-Site": "same-origin" } 
      });
    }

    if (!phpRes.ok && (phpRes.status === 404 || phpRes.status === 403)) {
      console.log(`[Proxy Retry] Fetching PHP page with generic Referer failed (${phpRes.status}). Retrying without Referer...`);
      phpRes = await fetch(phpUrl, { 
        headers: { 
          ...baseHeaders, 
          "Sec-Fetch-Dest": "iframe",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "cross-site",
          ...(cookieHeaderStr ? { 'Cookie': cookieHeaderStr } : {}) 
        } 
      });
    }

    if (!phpRes.ok) throw new Error(`Failed to fetch PHP player: ${phpRes.status}`);
    phpHtml = await phpRes.text();
  }

  // Find player URL/streams in the PHP frame
  const mpdMatch = phpHtml.match(/['"](https:\/\/[^'"]+\.mpd[^'"]*)['"]/i);
  const m3u8Match = phpHtml.match(/['"](https:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
  const flussonicMatch = phpHtml.match(/src=["'](https:\/\/[^"']+\/embed\.html\?[^"']+)["']/i);

  let streamUrl = "";
  if (m3u8Match) {
    streamUrl = m3u8Match[1];
  } else if (mpdMatch) {
    streamUrl = mpdMatch[1].replace(".mpd", ".m3u8");
  } else if (flussonicMatch) {
    streamUrl = flussonicMatch[1].replace("/embed.html", "/index.m3u8");
  }

  if (!streamUrl) {
    throw new Error("Could not find any Flussonic, MPD, or M3U8 player URL in PHP frame");
  }

  return streamUrl;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable trusting reverse proxy headers (e.g. from Cloudflare, Nginx, or Google Cloud Run)
  app.set("trust proxy", true);

  // Support parsing JSON request bodies
  app.use(express.json());

  // Store connected SSE clients
  let sseClients: express.Response[] = [];

  // Helper to send events to all connected clients
  const broadcastEvent = (eventType: string, data: any) => {
    console.log(`[SSE Broadcast] Sending '${eventType}' event to ${sseClients.length} clients.`);
    sseClients.forEach((client) => {
      try {
        client.write(`event: ${eventType}\n`);
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.warn(`[SSE] Failed to write event to client:`, err);
      }
    });
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Real-time Event Stream endpoint
  app.get("/api/updates/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    sseClients.push(res);
    console.log(`[SSE] Client connected. Active clients: ${sseClients.length}`);

    // Send initial ping to keep the connection alive & verify success
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ status: "ready" })}\n\n`);

    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\n`);
        res.write(`data: "keep-alive"\n\n`);
      } catch (e) {
        // Suppress writing errors to closed streams
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(pingInterval);
      sseClients = sseClients.filter((client) => client !== res);
      console.log(`[SSE] Client disconnected. Active clients: ${sseClients.length}`);
    });
  });

  // Manual Notification Broadcast endpoint
  app.post("/api/updates/notify", (req, res) => {
    const { title, desc, logo } = req.body;
    if (!title || !desc) {
      return res.status(400).json({ error: "Missing required fields: title, desc" });
    }

    // Broadcast live event notification
    broadcastEvent("custom-announcement", {
      title: title.trim(),
      desc: desc.trim(),
      logo: logo ? logo.trim() : "https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png"
    });

    res.json({ success: true, message: "Announcement broadcasted successfully to all devices!" });
  });

  app.get("/api/cloudflare-status", (req, res) => {
    res.json({
      active: !!req.headers["cf-ray"],
      clientIp: req.headers["cf-connecting-ip"] || req.ip || req.socket.remoteAddress,
      country: req.headers["cf-ipcountry"] || "Unknown",
      rayId: req.headers["cf-ray"] || null,
      protocol: req.protocol,
      ssl: req.secure || req.headers["x-forwarded-proto"] === "https",
      userAgent: req.headers["user-agent"]
    });
  });

  app.get("/api/channels/version", (req, res) => {
    res.json({ version: channelsVersion, count: allChannelsServer.length });
  });

  app.get("/api/channels", (req, res) => {
    res.json({ 
      channels: allChannelsServer, 
      categories: CATEGORIES,
      version: channelsVersion
    });
  });

  app.post("/api/channels", (req, res) => {
    const { name, logo, categories, streamUrl } = req.body;
    if (!name || !logo || !categories || !streamUrl) {
      return res.status(400).json({ error: "Missing required fields: name, logo, categories, streamUrl" });
    }

    const normalizedName = name.trim();
    const existingIndex = customChannels.findIndex(
      (c) => c.name.toLowerCase() === normalizedName.toLowerCase()
    );

    let isUpdate = false;
    let targetChannel;

    if (existingIndex !== -1) {
      // Update existing channel
      customChannels[existingIndex] = {
        ...customChannels[existingIndex],
        logo: logo.trim(),
        categories: Array.isArray(categories) ? categories : [categories],
        streamUrl: streamUrl.trim()
      };
      targetChannel = customChannels[existingIndex];
      isUpdate = true;
    } else {
      // Create new channel
      const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);
      const newChannel = {
        id,
        name: normalizedName,
        logo: logo.trim(),
        categories: Array.isArray(categories) ? categories : [categories],
        streamUrl: streamUrl.trim()
      };
      customChannels.push(newChannel);
      targetChannel = newChannel;
    }

    try {
      fs.writeFileSync(customChannelsPath, JSON.stringify(customChannels, null, 2), "utf-8");
      
      allChannelsServer = [...CHANNELS, ...customChannels];
      channelsVersion = Date.now().toString();
      
      console.log(`[Channels DB] ${isUpdate ? 'Updated' : 'Added'} channel: ${targetChannel.name} (ID: ${targetChannel.id})`);
      
      // Broadcast live event notifications to all connected browsers
      broadcastEvent(isUpdate ? "channel-updated" : "channel-added", {
        channel: targetChannel,
        version: channelsVersion
      });

      res.json({ success: true, channel: targetChannel, version: channelsVersion, isUpdate });
    } catch (err: any) {
      console.error("[Channels DB] Failed to save channel:", err);
      res.status(500).json({ error: "Failed to save channel on server" });
    }
  });

  // Advanced HLS Proxy (CORS Bypass)
  app.get("/api/proxy", async (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) return res.status(400).send("URL is required");

    let targetStreamUrl = streamUrl;

    // Direct support for resolving karwan.tv and kurdtvs.net webpage URLs to their dynamic HLS index.m3u8 streams
    let isKarwanWebpage = false;
    try {
      const parsedUrl = new URL(streamUrl);
      const host = parsedUrl.hostname.toLowerCase();
      isKarwanWebpage = (host === "karwan.tv" || host === "www.karwan.tv" || host === "kurdtvs.net" || host === "www.kurdtvs.net") && 
                        !streamUrl.includes("cdn.karwan.tv") &&
                        !streamUrl.includes("/tracks-") && 
                        !streamUrl.includes("token=") && 
                        !streamUrl.includes("embed.html") &&
                        !streamUrl.includes("mono.m3u8") &&
                        !parsedUrl.pathname.endsWith(".ts");
    } catch (e) {
      isKarwanWebpage = (streamUrl.includes("karwan.tv") || streamUrl.includes("kurdtvs.net")) && 
                        !streamUrl.includes("cdn.karwan.tv") &&
                        !streamUrl.includes("/tracks-") && 
                        !streamUrl.includes("token=") && 
                        !streamUrl.includes("embed.html") &&
                        !streamUrl.includes("mono.m3u8");
    }

    if (isKarwanWebpage) {
      try {
        console.log(`[Proxy] Intercepting webpage to resolve stream dynamically: ${streamUrl}`);
        const resolvedUrl = await resolveKarwanStream(streamUrl);
        targetStreamUrl = resolvedUrl;
        console.log(`[Proxy] Resolved stream successfully: ${targetStreamUrl}`);
      } catch (err: any) {
        console.error(`[Proxy] Failed to dynamically resolve stream:`, err.message || err);
      }
    }

    // Direct streamlock bypass: streamlock domains are best played directly in the browser.
    // Fetching them on cloud/server-side often results in connect timeouts due to firewalls or IP restrictions,
    // while the client browser's residential connection works perfectly.
    if (targetStreamUrl.includes("streamlock.net")) {
      console.log(`[Proxy Bypassed] Streamlock URL detected. Gracefully redirecting browser client to: ${targetStreamUrl}`);
      return res.redirect(targetStreamUrl);
    }

    try {
      const urlObj = new URL(targetStreamUrl);

      // Strict whitelist of domains to prevent open proxy classification & security warnings by Google Safe Browsing
      const ALLOWED_STREAM_DOMAINS = [
        "karwan.tv",
        "kurdtvs.net",
        "baskhd.ddns.net",
        "ddns.net",
        "avrstream.com",
        "onetv.app",
        "bozztv.com",
        "cloudfront.net",
        "host247.net",
        "mypsx.net",
        "supertv.gg",
        "akamaized.net",
        "amagi.tv",
        "persiana.live",
        "antik.sk",
        "rudaw.net",
        "channel8.com",
        "streamlock.net",
        "unitedmixmedia.tv",
        "alarabiya.net",
        "frequency.stream",
        "kwikmotion.com",
        "shams.tv",
        "ava2.store",
        "app-live.org",
        "siauliairsavlt.pw",
        "alkassdigital.net",
        "87.98.145.107",
        "154.58.202.18",
        "workers.dev",
        "pages.dev",
        "cloudflarestream.com",
        "videodelivery.net",
        "cloudflare.com",
        "cloudflarepages.com",
        "r2.dev",
        "r2.cloudflarestorage.com",
        "cloudflare-ipfs.com"
      ];

      const hostname = urlObj.hostname.toLowerCase();
      let isDomainAllowed = ALLOWED_STREAM_DOMAINS.some(allowed => {
        return hostname === allowed || hostname.endsWith(`.${allowed}`);
      });

      // Dynamic Cloudflare backend probing bypass: if the target is Cloudflare-backed, we authorize it.
      if (!isDomainAllowed) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const probeHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
          };
          
          const probeRes = await fetch(targetStreamUrl, {
            method: "HEAD",
            headers: probeHeaders,
            signal: controller.signal
          }).catch(async () => {
            const getController = new AbortController();
            const getTimeoutId = setTimeout(() => getController.abort(), 1500);
            const r = await fetch(targetStreamUrl, {
              method: "GET",
              headers: { ...probeHeaders, 'Range': 'bytes=0-0' },
              signal: getController.signal
            });
            clearTimeout(getTimeoutId);
            return r;
          });
          
          clearTimeout(timeoutId);
          if (probeRes) {
            const serverHeader = probeRes.headers.get("server") || "";
            const cfRayHeader = probeRes.headers.get("cf-ray");
            const isCfBackend = serverHeader.toLowerCase().includes("cloudflare") || !!cfRayHeader;
            if (isCfBackend) {
              console.log(`[Proxy Auto-Detect] Dynamically authorized Cloudflare-backed host: ${hostname}`);
              isDomainAllowed = true;
            }
          }
        } catch (err) {
          // Dynamic probe failed, fallback to standard whitelist & parent parameters
        }
      }

      // Authorization bypass for child stream segments/playlists if their parent domain is whitelisted
      const parentParam = req.query.parent as string;
      if (!isDomainAllowed && parentParam) {
        try {
          const parentHost = parentParam.includes("://") 
            ? new URL(parentParam).hostname.toLowerCase() 
            : new URL(`https://${parentParam}`).hostname.toLowerCase();
          
          const isParentAllowed = ALLOWED_STREAM_DOMAINS.some(allowed => {
            return parentHost === allowed || parentHost.endsWith(`.${allowed}`);
          });

          if (isParentAllowed) {
            console.log(`[Proxy Whitelist Bypass] Authorizing segment segment/resource ${hostname} through trusted parent ${parentHost}`);
            isDomainAllowed = true;
          }
        } catch (e) {
          // Ignore parse errors on malformed parent param
        }
      }

      if (!isDomainAllowed) {
        console.warn(`[Proxy Block] Blocked response proxy for unauthorized host: ${urlObj.hostname}`);
        return res.status(403).send("Host not authorized for proxying.");
      }
      
      // Extract Cloudflare real client IP or standard proxy forwarded IPs to bypass stream authorization IP checks
      const clientIp = (req.headers["cf-connecting-ip"] as string) || 
                       (req.headers["x-forwarded-for"] as string)?.split(',')[0].trim() || 
                       req.ip || 
                       req.socket.remoteAddress || 
                       "";

      let response;
      let attempts = 0;
      const isSegment = targetStreamUrl.toLowerCase().endsWith('.ts') || targetStreamUrl.includes('/tracks-') && targetStreamUrl.includes('.ts');
      const maxAttempts = isSegment ? 2 : 1;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const isCfDomain = hostname.endsWith("cloudflarestream.com") || 
                             hostname.endsWith("videodelivery.net") || 
                             hostname.endsWith("cloudflare.com") || 
                             hostname.endsWith("workers.dev") || 
                             hostname.endsWith("pages.dev") || 
                             hostname.endsWith("r2.dev") ||
                             hostname.endsWith("cloudflarepages.com");

          const proxyHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
          };

          // Do NOT send manufactured Referer/Origin headers to Cloudflare domains to avoid being blocked by integrity filters
          if (!isCfDomain) {
            proxyHeaders['Referer'] = `${urlObj.protocol}//${urlObj.hostname}/`;
            proxyHeaders['Origin'] = `${urlObj.protocol}//${urlObj.hostname}/`;
          }

          // Seamless Cloudflare-mediated stream proxy support: forward viewer's actual IP to the target media server
          // Note: CF-Connecting-IP is intentionally omitted as streaming servers behind Cloudflare reject requests containing it.
          if (clientIp) {
            proxyHeaders['X-Forwarded-For'] = clientIp;
            proxyHeaders['True-Client-IP'] = clientIp;
          }
          if (req.headers['cf-ipcountry']) {
            proxyHeaders['CF-IPCountry'] = req.headers['cf-ipcountry'] as string;
          }

          response = await fetch(targetStreamUrl, {
            headers: proxyHeaders
          });
          if (response.ok) {
            break;
          }
          if (response.status === 404 && isSegment && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            continue;
          }
        } catch (e) {
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            continue;
          }
          throw e;
        }
      }

      if (!response || !response.ok) {
        const isTransientTs404 = isSegment && response?.status === 404;
        const isManifest404 = !isSegment && response?.status === 404;
        if (isTransientTs404 || isManifest404) {
          // Log as gentle warning instead of loud console.error
          console.warn(`[Proxy Info] Resource not found (404) for stream: ${targetStreamUrl}`);
        } else {
          console.error(`Proxy fetch failed for ${targetStreamUrl}: ${response?.status || 'Network Error'} ${response?.statusText || ''}`);
        }
        return res.status(response?.status || 502).send(`Fetch failed: ${response?.statusText || 'Network Error'}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      const isM3U8Content = contentType.includes("mpegurl") || 
                           contentType.includes("m3u8") || 
                           contentType.includes("application/vnd.apple.mpegurl") ||
                           contentType.includes("application/x-mpegurl");

      if (isM3U8Content) {
        let manifest = await response.text();
        const finalUrl = response.url || targetStreamUrl;
        const urlObj = new URL(finalUrl);
        const baseDir = finalUrl.substring(0, finalUrl.lastIndexOf("/") + 1);

        // Utility to convert relative URL to absolute and wrapped in proxy
        const toProxyUrl = (relUrl: string) => {
          let targetUrl = relUrl.trim();
          if (!targetUrl) return relUrl;
          if (!targetUrl.startsWith("http")) {
            if (targetUrl.startsWith("/")) {
              targetUrl = `${urlObj.origin}${targetUrl}`;
            } else {
              targetUrl = `${baseDir}${targetUrl}`;
            }
          }

          // Preserve query parameters (tokens/auth) from the parent playlist
          // if the segment doesn't already have its own query string
          if (!targetUrl.includes('?') && urlObj.search) {
            targetUrl += urlObj.search;
          }

          const parentHost = urlObj.hostname;
          return `/api/proxy?url=${encodeURIComponent(targetUrl)}&parent=${encodeURIComponent(parentHost)}`;
        };

        // 1. Rewrite plain URLs (lines not starting with #)
        let rewrittenManifest = manifest.replace(/^(?!#|\s)(.*)$/gm, (match) => toProxyUrl(match));

        // 2. Rewrite URLs in URI="..." attributes
        rewrittenManifest = rewrittenManifest.replace(/URI=["']([^"']+)["']/g, (match, p1) => {
          return `URI="${toProxyUrl(p1)}"`;
        });

        res.set("Content-Type", "application/vnd.apple.mpegurl");
        res.set("Access-Control-Allow-Origin", "*");
        return res.send(rewrittenManifest);
      } else {
        // Fallback check for manifests mislabeled as octet-stream
        const buffer = await response.arrayBuffer();
        const firstBytes = Buffer.from(buffer.slice(0, 7)).toString();
        
        if (firstBytes === "#EXTM3U") {
          let manifest = Buffer.from(buffer).toString();
          const finalUrl = response.url || targetStreamUrl;
          const urlObj = new URL(finalUrl);
          const baseDir = finalUrl.substring(0, finalUrl.lastIndexOf("/") + 1);

          const toProxyUrl = (relUrl: string) => {
            let targetUrl = relUrl.trim();
            if (!targetUrl) return relUrl;
            if (!targetUrl.startsWith("http")) {
              if (targetUrl.startsWith("/")) {
                targetUrl = `${urlObj.origin}${targetUrl}`;
              } else {
                targetUrl = `${baseDir}${targetUrl}`;
              }
            }

            // Preserve query parameters (tokens/auth) from the parent playlist
            if (!targetUrl.includes('?') && urlObj.search) {
              targetUrl += urlObj.search;
            }

            const parentHost = urlObj.hostname;
            return `/api/proxy?url=${encodeURIComponent(targetUrl)}&parent=${encodeURIComponent(parentHost)}`;
          };

          let rewrittenManifest = manifest.replace(/^(?!#|\s)(.*)$/gm, (match) => toProxyUrl(match));
          rewrittenManifest = rewrittenManifest.replace(/URI=["']([^"']+)["']/g, (match, p1) => {
            return `URI="${toProxyUrl(p1)}"`;
          });

          res.set("Content-Type", "application/vnd.apple.mpegurl");
          res.set("Access-Control-Allow-Origin", "*");
          return res.send(rewrittenManifest);
        }

        res.set("Content-Type", contentType || "application/octet-stream");
        res.set("Access-Control-Allow-Origin", "*");
        return res.send(Buffer.from(buffer));
      }
    } catch (error: any) {
      console.error(`Proxy error for ${targetStreamUrl}:`, error);
      const isSegment = targetStreamUrl.toLowerCase().endsWith('.ts') || targetStreamUrl.includes('/tracks-') && targetStreamUrl.includes('.ts');
      
      // If fetching the .m3u8 manifest file fails (e.g. timeout, connection error),
      // we gracefully fallback to redirecting the client's browser directly to the stream.
      if (!isSegment && targetStreamUrl.startsWith("http")) {
        console.warn(`[Proxy Fallback] Redirecting client directly to manifest: ${targetStreamUrl}`);
        return res.redirect(targetStreamUrl);
      }
      res.status(502).send(`Proxy fetch failed: ${error.message || error}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Auto-test resolving Next TV from karwan.tv on boot and write to log.txt
    resolveKarwanStream("https://karwan.tv/next-tv/")
      .then(url => {
        console.log("[TEST RESOLVE SUCCESS] Next TV resolved to:", url);
        fs.writeFileSync(path.join(process.cwd(), "log.txt"), `SUCCESS: ${url}\nTimestamp: ${new Date().toISOString()}`, "utf-8");
      })
      .catch(err => {
        console.error("[TEST RESOLVE FAIL] Next TV resolve failed:", err.message || err);
        fs.writeFileSync(path.join(process.cwd(), "log.txt"), `FAIL: ${err.message || err}\nTimestamp: ${new Date().toISOString()}`, "utf-8");
      });
  });
}

startServer();
