let isBotRunning = false;
console.log('Background js is loaded');

function ensureContentScript(tabId, callback) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ['content.js']
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log('Content script injected');
        callback();
      }
    }
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTabId = tabs[0].id;
      if (message.action === 'start') {
        isBotRunning = true;
        console.log('Sending start message to content script in active tab:', activeTabId);
        ensureContentScript(activeTabId, () => {
          chrome.tabs.sendMessage(activeTabId, { action: 'start' }, response => {
            console.log('Sent start message to content:', response);
            sendResponse({ status: 'started' });
          });
        });
      } else if (message.action === 'stop') {
        isBotRunning = false;
        console.log('Sending stop message to content script in active tab:', activeTabId);
        ensureContentScript(activeTabId, () => {
          chrome.tabs.sendMessage(activeTabId, { action: 'stop' }, response => {
            console.log('Sent stop message to content:', response);
            sendResponse({ status: 'stopped' });
          });
        });
      } else if (message.action === 'getStatus') {
        sendResponse({ status: isBotRunning ? 'Running' : 'Stopped' });
      } else if (message.action === 'statusUpdate') {
        isBotRunning = false;
        sendResponse({ status: 'stopped' });
      }
    } else {
      console.log('No active tab found.');
      sendResponse({ status: 'Stopped' });
    }
  });
  return true; // Keep the message channel open for async response
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostContains: 'olymptrade.com' },
      })],
      actions: [new chrome.declarativeContent.ShowAction()]
    }]);
  });
});
