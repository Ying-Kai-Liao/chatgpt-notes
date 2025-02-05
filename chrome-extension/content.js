// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getConversation') {
    const conversationData = getConversationContent();
    sendResponse(conversationData);
  }
});
