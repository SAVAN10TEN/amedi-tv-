/**
 * Cloudflare Worker: HLS (.m3u8 & .ts) CORS Proxy with Manifest Rewriting
 * 
 * Host or deploy this script on your Cloudflare Worker:
 * https://ameditv.kurdiish.workers.dev/
 * 
 * Usage:
 *   1. Basic CORS Proxy:
 *      https://ameditv.kurdiish.workers.dev/proxy?url=https://example.com/live/stream.m3u8
 *   2. Directly plays CORS-locked HLS playlists and media segments.
 *      It dynamically rewrites internal URLs within the .m3u8 files so that
 *      all subsequent sub-playlists (.m3u8) and video chunks (.ts) are
 *      automatically proxied through this worker.
 */

export default {
  async fetch(request, env, ctx) {
    const urlObj = new URL(request.url);
    
    // Handle CORS Preflight Options requests
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    // Direct health check or root welcome page
    if ((urlObj.pathname === "/" || urlObj.pathname === "/health") && !urlObj.searchParams.has("url")) {
      return new Response(
        JSON.stringify({
          status: "active",
          service: "AMEDI TV Stream Proxy",
          usage: `${urlObj.origin}/proxy?url=ENCODED_STREAM_URL`
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        }
      );
    }

    // Route CORS proxy requests
    if (urlObj.pathname === "/proxy" || urlObj.searchParams.has("url")) {
      let targetUrlStr = urlObj.searchParams.get("url");
      if (!targetUrlStr) {
        return new Response("Missing 'url' query parameter.", { status: 400 });
      }

      try {
        // Handle double encoded URLs
        targetUrlStr = decodeURIComponent(targetUrlStr);
        const targetUrl = new URL(targetUrlStr);

        // Standardize common browser request headers to avoid strict server blockers
        const headers = new Headers();
        const allowedHeaders = [
          "accept",
          "accept-language",
          "range",
          "user-agent",
          "x-playback-session-id"
        ];
        
        for (const [key, value] of request.headers.entries()) {
          if (allowedHeaders.includes(key.toLowerCase())) {
            headers.set(key, value);
          }
        }

        // Set a standard User-Agent if none provided to ensure the provider doesn't block the request
        if (!headers.has("user-agent")) {
          headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        }

        // Fetch the target stream asset
        const response = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: headers,
          redirect: "follow"
        });

        // Gather destination content-type and headers
        const contentType = response.headers.get("content-type") || "";
        const responseHeaders = new Headers();

        // Inject generous CORS access rules for browsers
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "*");
        responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");

        // Set Content-Type correctly
        if (contentType) {
          responseHeaders.set("Content-Type", contentType);
        }

        // If it is an HLS playlist/manifest, rewrite internal URLs so subsequent fragments are also proxied
        if (
          contentType.includes("application/vnd.apple.mpegurl") ||
          contentType.includes("application/x-mpegurl") ||
          targetUrlStr.endsWith(".m3u8") ||
          urlObj.searchParams.get("type") === "m3u8"
        ) {
          const playlistText = await response.text();
          const rewrittenPlaylist = rewritePlaylist(playlistText, targetUrl, urlObj.origin);
          
          return new Response(rewrittenPlaylist, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
          });
        }

        // Otherwise stream the binary chunk directly (.ts file, etc.)
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });

      } catch (err) {
        return new Response(`Fetch Error: ${err.message}`, {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

/**
 * Handle CORS OPTIONS requirements
 */
function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": headers.get("Access-Control-Request-Headers") || "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  } else {
    return new Response(null, {
      status: 204,
      headers: {
        "Allow": "GET, HEAD, POST, OPTIONS",
      },
    });
  }
}

/**
 * Rewrites lines in .m3u8 playlists that point to relative or absolute streams/keys
 * so they are recursively requested back through your proxy.
 */
function rewritePlaylist(playlistText, targetUrl, proxyOrigin) {
  const lines = playlistText.split("\n");
  const baseUrl = targetUrl.origin + targetUrl.pathname;
  const dirUrl = targetUrl.toString().substring(0, targetUrl.toString().lastIndexOf("/") + 1);

  const rewrittenLines = lines.map(line => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine.length === 0) {
      return line;
    }

    // Handle URI attributes in tags (e.g., #EXT-X-KEY, #EXT-X-MAP, etc.)
    if (trimmedLine.startsWith("#")) {
      let updatedLine = line;
      
      // Look for URI="xxx" inside tags
      const uriRegex = /URI=["']([^"']+)["']/g;
      let match;
      while ((match = uriRegex.exec(line)) !== null) {
        const matchedUri = match[1];
        const absoluteUri = resolveUrl(matchedUri, dirUrl, baseUrl);
        const proxiedUri = `${proxyOrigin}/proxy?url=${encodeURIComponent(absoluteUri)}`;
        updatedLine = updatedLine.replace(matchedUri, proxiedUri);
      }
      return updatedLine;
    }

    // Rewrite HLS link segments / nested playlist paths
    const absoluteSegmentUrl = resolveUrl(trimmedLine, dirUrl, baseUrl);
    return `${proxyOrigin}/proxy?url=${encodeURIComponent(absoluteSegmentUrl)}`;
  });

  return rewrittenLines.join("\n");
}

/**
 * Helper to resolve relative paths or segment paths to fully absolute URLs
 */
function resolveUrl(urlPath, dirUrl, baseUrl) {
  if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
    return urlPath;
  }
  
  if (urlPath.startsWith("/")) {
    // Resolve relative to server root
    const origin = new URL(baseUrl).origin;
    return origin + urlPath;
  }
  
  // Resolve relative to folder path
  return dirUrl + urlPath;
}
