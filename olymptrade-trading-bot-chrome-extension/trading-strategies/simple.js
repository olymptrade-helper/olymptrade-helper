const websocketUrl = 'wss://ws.olymptrade.com/otp?cid_ver=1&cid_app=web%40OlympTrade%402024.3.23534%4023534&cid_device=%40%40desktop&cid_os=windows%4010';

const socket = new WebSocket(websocketUrl);

socket.onopen = function(event) {
  console.log("Connected to WebSocket");
  
  // Daftar pesan inisialisasi yang harus dikirim secara berurutan
  const initMessages = [
    JSON.stringify([{ "t": 2, "e": 95, "uuid": "LY2TI1Y5FKPKP35Q7JM", "d": [{"cat": "digital", "pair": "ASIA_X"}] }]),
    JSON.stringify([{ "t": 2, "e": 12, "uuid": "LY2TI1YO9O4UG359ZEG", "d": [{"pair": "ASIA_X"}] }]),
    JSON.stringify([{ "t": 2, "e": 280, "uuid": "LY2T9V29MFRXF7A6L5Q", "d": [{"pair": "ASIA_X"}] }]),
    JSON.stringify([{ "t": 2, "e": 10, "uuid": "Frqj0B", "d": [{"pair": "ASIA_X", "size": 5, "to": 1719828529, "solid": true}] }]),
    JSON.stringify([{ "t": 2, "e": 282, "uuid": "KcICN3", "d": [{"pair": "ASIA_X", "size": 5, "to": 1719828529, "solid": true}] }])
  ];
  
  // Fungsi untuk mengirim pesan inisialisasi dengan jeda waktu
  function sendInitMessages(index) {
    if (index < initMessages.length) {
      socket.send(initMessages[index]);
      console.log(`Sent initialization message ${index + 1}:`, initMessages[index]);
      setTimeout(() => sendInitMessages(index + 1), 1000); // Kirim pesan berikutnya setelah 1 detik
    }
  }
  
  // Mulai mengirim pesan inisialisasi
  sendInitMessages(0);
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log("Data received from WebSocket:", data);

  // Asumsi bahwa data candle memiliki struktur tertentu
  if (data && data.length > 0 && data[0].d && data[0].d.length > 0) {
    const candleData = data[0].d[0];
    const price = candleData.q;

    if (typeof previousPrice !== 'undefined') {
      const direction = price > previousPrice ? 'up' : 'down';
      clickTradeButton(direction);
    }

    previousPrice = price;
  }
};

socket.onerror = function(error) {
  console.error("WebSocket Error:", error);
};

socket.onclose = function(event) {
  console.log("WebSocket connection closed:", event);
};

function clickTradeButton(direction) {
  // strategy 1 
  const buttonSelector = direction === 'up' ? 'button[data-test="deal-button-up"]' : 'button[data-test="deal-button-down"]';  // Click trade UP if candle price increased
  
  // strategy 2
  // const buttonSelector = direction === 'up' ? 'button[data-test="deal-button-down"]' : 'button[data-test="deal-button-up"]';   // Click trade DOWN if candle price increased

  const tradeButton = document.querySelector(buttonSelector);
  if (tradeButton) {
    tradeButton.click();
    console.log(`Clicked ${direction} button`);
  } else {
    console.error(`Trade button not found: ${buttonSelector}`);
  }
}



let previousPrice;
