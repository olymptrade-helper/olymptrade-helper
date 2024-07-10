(function() {
  const asset_id = "ASIA_X"; // Replace with your actual asset ID
  const socket = new WebSocket("wss://ws.olymptrade.com/otp?cid_ver=1&cid_app=web@OlympTrade@2024.3.23613@23613&cid_device=@@desktop&cid_os=windows@10");

  socket.onopen = function() {
    const initMessages = [
      JSON.stringify([{"t":2,"e":12,"uuid":"LYAHMWGRBCPZQLGPCOQ","d":[{"pair":asset_id}]}])
    ];

    initMessages.forEach((msg, index) => {
      setTimeout(() => socket.send(msg), index * 1000);
    });
  };

  socket.onmessage = function(event) {
    chrome.runtime.sendMessage({action: "captureMessage", message: JSON.parse(event.data)});
  };

  socket.onerror = function(error) {
    console.error("WebSocket error:", error);
  };

  socket.onclose = function(event) {
    console.log("WebSocket connection closed:", event);
  };
})();