document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM fully loaded and parsed');

  const statusText = document.getElementById('statusText');
  const runButton = document.getElementById('runButton');
  const stopButton = document.getElementById('stopButton');

  function updateStatus(status) {
    statusText.textContent = status;
    if (status === 'Running') {
      statusText.style.color = 'green';
    } else {
      statusText.style.color = 'red';
    }
  }

  runButton.addEventListener('click', () => {
    console.log('RUN button clicked');
    chrome.runtime.sendMessage({ action: 'start' }, response => {
      console.log('Sent start message:', response);
      if (response && response.status === 'started') {
        updateStatus('Running');
      }
    });
  });

  stopButton.addEventListener('click', () => {
    console.log('STOP button clicked');
    chrome.runtime.sendMessage({ action: 'stop' }, response => {
      console.log('Sent stop message:', response);
      if (response && response.status === 'stopped') {
        updateStatus('Stopped');
      }
    });
  });

  // Initialize status
  chrome.runtime.sendMessage({ action: 'getStatus' }, response => {
    console.log('Received status:', response);
    if (response && response.status) {
      updateStatus(response.status);
    }
  });
  
  // Listen for status updates from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'statusUpdate' && message.status) {
      console.log('Received status update:', message.status);
      updateStatus(message.status);
    }
  });



  // stopButton.click();  // stop at first load (ini ter trigger setiap menu di load)


});

