import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const PROXY_URL = process.env.PROXY_SERVER_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const shareId = request.url.split('/').pop();
    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    const response = await fetch(`${PROXY_URL}/api/chatgpt/${shareId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
