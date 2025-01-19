'use client';

import { useState } from 'react';

interface FetchResult {
  content?: string;
  error?: string;
}

export default function TestFetch() {
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('pre');
  const [result, setResult] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/headless-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          selector,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Headless Fetch</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter URL to fetch from"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CSS Selector:</label>
          <input
            type="text"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="CSS selector (default: pre)"
          />
        </div>

        <button
          onClick={handleFetch}
          disabled={loading || !url}
          className={`px-4 py-2 rounded ${
            loading || !url
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
