
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetPath = url.pathname.replace('/functions/v1/proxy-voiceagent', '');
    const targetUrl = `https://delicate-bavarois-995263.netlify.app${targetPath}${url.search}`;

    console.log(`Proxying request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('User-Agent') || 'Mozilla/5.0 (compatible; Proxy)',
        'Accept': req.headers.get('Accept') || '*/*',
        'Accept-Language': req.headers.get('Accept-Language') || 'en-US,en;q=0.9',
        'Referer': 'https://delicate-bavarois-995263.netlify.app/',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
    });

    const responseHeaders = new Headers();
    
    // Copy important headers from the response
    for (const [key, value] of response.headers.entries()) {
      if (!key.toLowerCase().startsWith('x-') && 
          !['content-security-policy', 'x-frame-options'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // Remove frame restrictions to allow embedding
    responseHeaders.delete('x-frame-options');
    responseHeaders.delete('content-security-policy');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
