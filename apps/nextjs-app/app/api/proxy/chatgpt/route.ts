import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const PROXY_URL = process.env.PROXY_SERVER_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Get shareId from query parameter
    const url = new URL(request.url);
    const shareId = url.searchParams.get('id');
    
    console.log('Debug: Request URL:', url.toString());
    console.log('Debug: ShareId:', shareId);
    console.log('Debug: Proxy URL:', PROXY_URL);

    if (!shareId) {
      return NextResponse.json({ 
        error: 'Share ID is required',
        debug: { 
          url: url.toString(),
          params: Object.fromEntries(url.searchParams.entries())
        }
      }, { status: 400 });
    }

    // Remove trailing slash from PROXY_URL if present
    const baseUrl = PROXY_URL.endsWith('/') ? PROXY_URL.slice(0, -1) : PROXY_URL;
    const proxyUrl = `${baseUrl}/api/chatgpt/${shareId}`;
    
    console.log('Debug: Full Proxy URL:', proxyUrl);

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Proxy server error:', error);
      return NextResponse.json({
        ...error,
        debug: {
          shareId,
          proxyUrl,
          status: response.status,
          timestamp: new Date().toISOString()
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      debug: {
        shareId,
        proxyUrl,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        debug: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
