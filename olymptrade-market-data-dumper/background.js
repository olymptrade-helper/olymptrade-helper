chrome.runtime.onInstalled.addListener(function() {
  console.log("WebSocket Message Dumper Extension Installed");
});

let messages = [];
let startTime = Date.now();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureMessage") {
    messages.push(request.message);
  }
  sendResponse({status: "ok"});
});

function downloadData() {
  const blob = new Blob([JSON.stringify(messages, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'messages.json'
  });
}

setInterval(function() {
  const currentTime = Date.now();
  if (currentTime - startTime >= 15 * 60 * 1000) { // 15 minutes
    downloadData();
    messages = [];
    startTime = currentTime;
  }
}, 60 * 1000); // Check every minute