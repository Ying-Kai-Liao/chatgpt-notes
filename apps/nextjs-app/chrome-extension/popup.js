document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('saveButton');
  const newNoteButton = document.getElementById('newNoteButton');
  const statusDiv = document.getElementById('status');

  saveButton.addEventListener('click', async () => {
    try {
      saveButton.disabled = true;
      statusDiv.textContent = 'Saving conversation...';
      statusDiv.classList.remove('error');

      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute content script to get conversation data
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getConversationContent,
      });

      const conversationData = result[0].result;
      if (!conversationData) {
        throw new Error('No conversation found');
      }

      // Send to your notes app API
      const response = await fetch('http://localhost:3000/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textDocId: conversationData.id,
          content: conversationData.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to notes app');
      }

      statusDiv.textContent = 'Conversation saved successfully!';
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error) {
      console.error('Error saving conversation:', error);
      statusDiv.textContent = error.message || 'Failed to save conversation';
      statusDiv.classList.add('error');
    } finally {
      saveButton.disabled = false;
    }
  });

  newNoteButton.addEventListener('click', async () => {
    try {
      // Open the new note page in a new tab
      const notesAppUrl = 'http://localhost:3000/new';
      chrome.tabs.create({ url: notesAppUrl });
    } catch (error) {
      console.error('Error opening new note:', error);
      statusDiv.textContent = error.message || 'Failed to open new note';
      statusDiv.classList.add('error');
    }
  });
});

// This function will be injected into the page context
function getConversationContent() {
  try {
    // Get conversation ID from URL
    const match = location.pathname.match(/\/c\/([\w-]+)/);
    const conversationId = match ? match[1] : null;

    if (!conversationId) {
      throw new Error('No conversation ID found');
    }

    // Get the main conversation container
    const conversationContainer = document.querySelector('main');
    if (!conversationContainer) {
      throw new Error('Conversation container not found');
    }

    // Extract conversation content
    const messages = Array.from(conversationContainer.querySelectorAll('[data-message-author-role]'))
      .map(message => {
        const role = message.getAttribute('data-message-author-role');
        const content = message.textContent;
        return `### ${role}:\n${content}\n`;
      });

    const content = messages.join('\n');

    return {
      id: conversationId,
      content: content,
    };
  } catch (error) {
    console.error('Error extracting conversation:', error);
    return null;
  }
}
