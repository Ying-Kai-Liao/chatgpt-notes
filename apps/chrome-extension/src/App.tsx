/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import './App.css'
import type { Chrome } from './types'

declare const chrome: Chrome;

interface WebActivity {
  url: string;
  method: string;
  timestamp: number;
}

interface ConversationData {
  url: string;
  timestamp: number;
  data: any;
}

function App() {
  const [webActivity, setWebActivity] = useState<WebActivity[]>([])
  const [conversationData, setConversationData] = useState<ConversationData | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Get initial state from background script
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      setIsMonitoring(response.isMonitoring);
      setWebActivity(response.webActivity);
      setConversationData(response.conversationData);
    });

    // Listen for updates from background script
    const handleMessage = (
      message: { 
        type: string; 
        webActivity?: WebActivity[]; 
        conversationData?: ConversationData 
      }
    ) => {
      if (message.type === 'UPDATE_ACTIVITY' && message.webActivity) {
        setWebActivity(message.webActivity);
      }
      if (message.type === 'UPDATE_CONVERSATION' && message.conversationData) {
        setConversationData(message.conversationData);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const toggleMonitoring = () => {
    const newState = !isMonitoring;
    chrome.runtime.sendMessage(
      { type: newState ? 'START_MONITORING' : 'STOP_MONITORING' },
      (response) => {
        if (response.success) {
          setIsMonitoring(newState);
          if (newState) {
            setWebActivity([]);
            setConversationData(null);
          }
        }
      }
    );
  };

  return (
    <div className="container">
      <div className="section">
        <button 
          onClick={toggleMonitoring}
          className={isMonitoring ? 'button-active' : ''}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        
        <h3>Recent Web Activity {isMonitoring && '(Monitoring...)'}</h3>
        {webActivity.length === 0 ? (
          <div className="empty-state">
            {isMonitoring 
              ? 'Waiting for web activity...' 
              : 'Click Start Monitoring to begin tracking web requests'}
          </div>
        ) : (
          <div className="activity-list">
            {webActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <strong>{activity.method}</strong>
                <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                <div className="url-text">{activity.url}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {conversationData && (
        <div className="section">
          <h3>Latest Conversation Data</h3>
          <div className="conversation-data">
            <div className="timestamp">
              <strong>Time:</strong> {new Date(conversationData.timestamp).toLocaleTimeString()}
            </div>
            <div className="url-text">
              <strong>URL:</strong> {conversationData.url}
            </div>
            <div className="response-data">
              <strong>Response:</strong>
              <pre>
                {JSON.stringify(conversationData.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
