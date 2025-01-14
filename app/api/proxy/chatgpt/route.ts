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
        // Use mock data from public/example.json
        const filePath = path.join(process.cwd(), 'public', 'example.json');
        console.log('Reading mock file from:', filePath);
        
        const fileContent = await fs.readFile(filePath, 'utf8');
        console.log('File content first 100 chars:', fileContent.substring(0, 100));
        
        data = JSON.parse(fileContent);
        console.log('Parsed JSON successfully');
        
        debugInfo.targetUrl = 'mock://example.json';
        debugInfo.responseStatus = 200;
        debugInfo.responseStatusText = 'OK (Mock)';
      } catch (mockError) {
        console.error('Mock data error:', mockError);
        const errorDetails = mockError instanceof Error ? {
          message: mockError.message,
          stack: mockError.stack,
          name: mockError.name
        } : String(mockError);
        
        return NextResponse.json(
          {
            error: 'Failed to load mock data',
            details: errorDetails,
            debug: {
              ...debugInfo,
              mockError: errorDetails,
              currentDir: process.cwd(),
              filePath: path.join(process.cwd(), 'public', 'example.json')
            }
          },
          { status: 500 }
        );
      }
    } else {
      // Real API call
      const targetUrl = `https://chat.openai.com/backend-api/share/${shareId}`;
      debugInfo.targetUrl = targetUrl;

      const response = await fetch(targetUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://chat.openai.com/',
        },
      });

      debugInfo.responseStatus = response.status;
      debugInfo.responseStatusText = response.statusText;

      if (!response.ok) {
        return NextResponse.json(
          { 
            error: `ChatGPT API error: ${response.statusText}`, 
            debug: debugInfo 
          },
          { status: response.status }
        );
      }

      data = await response.json();
    }

    return NextResponse.json({ 
      data,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch from ChatGPT API',
        details: error instanceof Error ? error.message : String(error),
        debug: {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : String(error),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
