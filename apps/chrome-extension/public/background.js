// Store for web activity and conversation
let webActivity = [];
let conversationData = null;
let isMonitoring = false;

// Create a mapping of request IDs to their filter instances
const requestFilters = new Map();

// Handle requests
function handleRequest(details) {
  if (isMonitoring) {
    const activity = {
      url: details.url,
      method: details.method,
      timestamp: Date.now()
    };
    webActivity = [activity, ...webActivity].slice(0, 10);
    
    // Check if this is a conversation request
    if (details.url.includes('/conversation/') && details.method === 'GET') {
      console.log('Detected conversation request:', details);
      
      // Extract authorization header if present
      const authHeader = details.requestHeaders?.find(h => h.name.toLowerCase() === 'authorization');
      if (authHeader) {
        console.log('Found auth header:', authHeader.value);
      }
    }

    // Notify the popup if it's open
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_ACTIVITY', 
      webActivity,
      conversationData 
    });
  }
}

// Handle completed responses
function handleResponse(details) {
  if (isMonitoring && details.url.includes('/conversation/')) {
    console.log('Conversation response:', details);
    
    // Extract response headers
    const headers = {};
    if (details.responseHeaders) {
      details.responseHeaders.forEach(header => {
        headers[header.name.toLowerCase()] = header.value;
      });
    }

    conversationData = {
      url: details.url,
      timestamp: Date.now(),
      data: {
        statusCode: details.statusCode,
        statusLine: details.statusLine,
        headers: headers,
        type: headers['content-type'],
        size: headers['content-length']
      }
    };

    // Notify the popup
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_CONVERSATION', 
      conversationData 
    });
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_MONITORING') {
    isMonitoring = true;
    webActivity = [];
    conversationData = null;
    
    chrome.webRequest.onBeforeSendHeaders.addListener(
      handleRequest,
      { urls: ['<all_urls>'] },
      ['requestHeaders', 'extraHeaders']
    );
    
    chrome.webRequest.onHeadersReceived.addListener(
      handleResponse,
      { urls: ['*://chatgpt.com/backend-api/conversation/*'] },
      ['responseHeaders', 'extraHeaders']
    );
    
    sendResponse({ success: true });
  } else if (message.type === 'STOP_MONITORING') {
    isMonitoring = false;
    chrome.webRequest.onBeforeSendHeaders.removeListener(handleRequest);
    chrome.webRequest.onHeadersReceived.removeListener(handleResponse);
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATE') {
    sendResponse({ isMonitoring, webActivity, conversationData });
  }
  return true; // Keep the message channel open for async response
});
