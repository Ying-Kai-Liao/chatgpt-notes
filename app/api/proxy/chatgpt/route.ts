import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const PROXY_URL = 'https://api.allorigins.win/get?url=';

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
      responseHeaders: {},
      runtime: 'edge'
    };

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required', debug: debugInfo },
        { status: 400 }
      );
    }

    const targetUrl = `https://chat.openai.com/backend-api/share/${shareId}`;
    const proxyUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
    debugInfo.targetUrl = proxyUrl;

    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      });

      debugInfo.responseStatus = response.status;
      debugInfo.responseStatusText = response.statusText;
      debugInfo.responseHeaders = Object.fromEntries(response.headers.entries());

      if (!response.ok) {
        // const contentType = response.headers.get('content-type');
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch (error: unknown) {
          if (error instanceof Error) {
            errorDetails = error.message;
          } else {
            errorDetails = await response.text();
          }
          
          if (errorDetails.toLowerCase().includes('<!doctype html>')) {
            return NextResponse.json(
              {
                error: 'This conversation is no longer accessible',
                details: 'The shared link might have expired or been deleted',
                debug: debugInfo
              },
              { status: 404 }
            );
          }
        }

        return NextResponse.json(
          {
            error: `ChatGPT API error: ${response.statusText}`,
            details: errorDetails,
            debug: debugInfo
          },
          { status: response.status }
        );
      }

      const proxyResponse = await response.json();
      
      if (!proxyResponse.contents) {
        return NextResponse.json(
          {
            error: 'Invalid proxy response format',
            details: 'Response does not contain expected data structure',
            debug: { ...debugInfo, responseData: proxyResponse }
          },
          { status: 500 }
        );
      }

      try {
        const data = JSON.parse(proxyResponse.contents);
        if (!data || !data.mapping) {
          return NextResponse.json(
            {
              error: 'Invalid ChatGPT API response format',
              details: 'Response does not contain expected data structure',
              debug: { ...debugInfo, responseData: data }
            },
            { status: 500 }
          );
        }

        return new NextResponse(
          JSON.stringify({ data, debug: debugInfo }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, must-revalidate',
            }
          }
        );
      } catch (parseError) {
        return NextResponse.json(
          {
            error: 'Failed to parse ChatGPT API response',
            details: parseError instanceof Error ? parseError.message : String(parseError),
            debug: {
              ...debugInfo,
              responseContents: proxyResponse.contents
            }
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
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
