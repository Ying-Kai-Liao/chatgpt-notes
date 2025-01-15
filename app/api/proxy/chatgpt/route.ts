import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const USE_MOCK = false; // Toggle this to switch between mock and real API

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get('id');
    const debugInfo = {
      requestUrl: request.url,
      shareId: shareId,
      timestamp: new Date().toISOString(),
      targetUrl: '',
      responseStatus: 0,
      responseStatusText: '',
      usedMock: USE_MOCK
    };

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required', debug: debugInfo },
        { status: 400 }
      );
    }

    let data;
    if (USE_MOCK) {
      try {
        const filePath = path.join(process.cwd(), 'public', 'example.json');
        const fileContent = await fs.readFile(filePath, 'utf8');
        data = JSON.parse(fileContent);
        
        debugInfo.targetUrl = 'mock://example.json';
        debugInfo.responseStatus = 200;
        debugInfo.responseStatusText = 'OK (Mock)';
      } catch (mockError) {
        console.error('Mock data error:', mockError);
        return NextResponse.json(
          {
            error: 'Failed to load mock data',
            details: mockError instanceof Error ? mockError.message : String(mockError),
            debug: debugInfo
          },
          { status: 500 }
        );
      }
    } else {
      const targetUrl = `https://chat.openai.com/backend-api/share/${shareId}`;
      debugInfo.targetUrl = targetUrl;

      try {
        const response = await fetch(targetUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://chat.openai.com/',
          },
          next: { revalidate: 0 }, // Disable caching
        });

        debugInfo.responseStatus = response.status;
        debugInfo.responseStatusText = response.statusText;

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json(
            { 
              error: `ChatGPT API error: ${response.statusText}`,
              details: errorText,
              debug: debugInfo 
            },
            { status: response.status }
          );
        }

        data = await response.json();
      } catch (fetchError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch from ChatGPT API',
            details: fetchError instanceof Error ? fetchError.message : String(fetchError),
            debug: {
              ...debugInfo,
              fetchError: fetchError instanceof Error ? {
                message: fetchError.message,
                name: fetchError.name
              } : String(fetchError)
            }
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      data,
      debug: debugInfo
    });
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
