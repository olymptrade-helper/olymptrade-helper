console.log('Content script loaded: 5 seconds TRADING using bounce method only is better for now');


// The highest final_balance is: 17575
// The highest highest_winrate is: 19
// The best parameter is:
// Array
// (
//     [final_balance] => 17575
//     [trade_count] => 20
//     [correct_trades] => 19
//     [incorrect_trades] => 1
//     [parameters] => Array
//         (
//             [rsiPeriod] => 7
//             [atrPeriod] => 33
//             [bollingerPeriod] => 20
//             [upperLimitPercent] => 1
//             [lowerLimitPercent] => 1
//             [initialBalance] => 10000
//             [tradeAmount] => 500
//             [rsi_low] => 14
//             [rsi_high] => 100
//             [atr_min] => 0.033
//         )

// )

let rsi_high = 100;
let rsi_low = 14;
const RSI_PERIOD = 7; // Standard period for RSI
const ATR_PERIOD = 33; // Standard period for ATR
// let atr_minimum = 0.035;
let atr_minimum = 0.33; // BEST atr_minimum according my test for 30 minutes period of DATA from dump json olymptrade price websocket
let WSS_UIID = "LYAHMWGRBCPZQLGPCOQ" // you may change it with your own uiid or just random with Length and UPPERCASE random alphanumeric



let last_trade_win = 1; // Global variable to track the last trade result
let starting_balance = 0;
let lowest_balance = -1;
let highest_balance = 0;

let allow_trading = 0;
let asset_id = "";



let socket;
let isBotRunning = false;
let lastTradeTime = 0;
let lastTradeDirection = "none";
let lastTradePrice = 0.0;
let prices = [];
let recentData = [];
var lets_try = "bounce";
var last_used_lets_try = "bounce";


const BOLLINGER_PERIOD = 20; // Standard period for Bollinger Bands
// const BOLLINGER_STD_DEV = 1.0; // Standard deviation for Bollinger Bands
// const BOLLINGER_STD_DEV = 1.8; // BEST Standard deviation for Bollinger Bands according my test for 30 minutes period of DATA from dump json olymptrade price websocket
const BOLLINGER_STD_DEV = 2.3; // BEST Standard deviation for Bollinger Bands according my test for 30 minutes period of DATA from dump json olymptrade price websocket
const CUSTOM_MINUTE = 2 * 60 * 1000; // 60 seconds


if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  const handleStart = (sendResponse) => {
    allow_trading = 1;
    last_trade_win = 1;
    starting_balance = 0;
    lowest_balance = -1;
    highest_balance = 0;
    isBotRunning = true;
    lastTradeTime = 0;
    lastTradeDirection = "none";
    lastTradePrice = 0.0;
    prices = [];
    recentData = [];

    clearPreviousData();
    connectWebSocket();
    sendResponse({ status: 'started' });
  };

  const handleStop = (sendResponse) => {
    allow_trading = 0;
    // starting_balance = 0;
    last_trade_win = 0;
    isBotRunning = false;
    if (socket) {
      socket.close();
    }
    sendResponse({ status: 'stopped' });
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'start') {
      handleStart(sendResponse);
    } else if (message.action === 'stop') {
      handleStop(sendResponse);
    }
    return true; // Keep the message channel open for async response
  });
} else {
  console.error('chrome.runtime.onMessage is not available in content script.');
}



function clearPreviousData() {
  localStorage.removeItem('prices');
  prices = [];
  recentData = [];
}

// Function to extract the word after /vector/ and before the dot
function extractAssetIdFromImgUrl(url) {
  const regex = /\/vector\/([^.]+)\./;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function get_asset_id() {
  var asset_id = "";
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      const word = extractAssetIdFromImgUrl(src);
      if (word) {
        asset_id = word;
        console.log(`Extracted word from ${src}: ${word}`);
      }
    }
  });
  if (!asset_id.includes("_X")) {
    asset_id += "_X";
  }
  console.log("Final asset_id:", asset_id);
  return asset_id;
}

function connectWebSocket() {
  if (!isBotRunning) return;

  socket = new WebSocket('wss://ws.olymptrade.com/otp?cid_ver=1&cid_app=web%40OlympTrade%402024.3.23534%4023534&cid_device=%40%40desktop&cid_os=windows%4010');

  asset_id = get_asset_id();
  console.log("olymptrade asset_id:", asset_id);

  socket.onopen = function() {
    const initMessages = [
      JSON.stringify([{"t":2,"e":12,"uuid":WSS_UIID,"d":[{"pair":asset_id}]}])
    ];

    initMessages.forEach((msg, index) => {
      setTimeout(() => socket.send(msg), index * 1000);
    });
  };

  socket.onmessage = function(event) {
    setLastTry();

    if (!isBotRunning) return;

    const data = JSON.parse(event.data);

    if (data && data.length > 0 && data[0].d && data[0].d.length > 0) {
      const candleData = data[0].d[0];

      if (!candleData.q) return;

      const price = candleData.q;
      const timestamp = candleData.ts || Date.now();

      recentData.push({ timestamp, price });

      // Sort the recentData array by timestamp to ensure it's in order
      recentData.sort((a, b) => a.timestamp - b.timestamp);

      // Only keep data for the last 60 seconds
      recentData = recentData.filter(d => Date.now() - d.timestamp <= CUSTOM_MINUTE);
      prices = recentData.map(d => d.price);

      const pricesRsi = prices.slice(-RSI_PERIOD)
      const pricesAtr = prices.slice(-ATR_PERIOD)

      const atr = calculateATR(pricesAtr, ATR_PERIOD);
      const rsi = calculateRSI(pricesRsi, RSI_PERIOD);

      // const atr = calculateATR(prices, ATR_PERIOD);
      // const rsi = calculateRSI(prices, RSI_PERIOD);

      const { upperBand, lowerBand } = calculateBollingerBands(prices, BOLLINGER_PERIOD, BOLLINGER_STD_DEV);

      if (atr !== null && rsi !== null && upperBand !== null && lowerBand !== null) {
        console.log("WSS time: " + nowWIB() + " WIB - rsi:", rsi);
        console.log("WSS time: " + nowWIB() + " WIB - atr:", atr);
        console.log("WSS time: " + nowWIB() + " WIB - price:", price);
        // lets show config to console log to debugging, sometimes we need disabled and then re-enabled this chrome extension to makes change is applied, and refresh the Olymptrade page after code changes.
        console.log("WSS time: " + nowWIB() + " WIB - RSI_PERIOD:", RSI_PERIOD);
        console.log("WSS time: " + nowWIB() + " WIB - ATR_PERIOD:", ATR_PERIOD);
        console.log("WSS time: " + nowWIB() + " WIB - rsi_high:", rsi_high);
        console.log("WSS time: " + nowWIB() + " WIB - rsi_low:", rsi_low);
        console.log("WSS time: " + nowWIB() + " WIB - atr_minimum:", atr_minimum);
        if (shouldTrade(rsi, price, upperBand, lowerBand, atr)) {
          const direction = price > lastTradePrice ? 'up' : 'down';
          clickTradeButton(direction, price, rsi, atr, upperBand, lowerBand);
        }
      }

      lastTradePrice = price;
    }

    checkBalance();
    checkLastTrade();
    console.log('Last trade win:', last_trade_win);
    setTimeValue();
  };

  socket.onerror = function(error) {
    console.error("WebSocket Error:", error);
  };

  socket.onclose = function(event) {
    console.log("WebSocket connection closed:", event);
    if (isBotRunning) {
      setTimeout(connectWebSocket, 5000);
    }
  };
}

function calculateATR(data, period) {
  if (data.length < period ) {
    console.log('Not enough data to calculate ATR. Data length: ', data.length);
    return null;
  }
  console.log('calculate ATR. Data length: ', data.length);

  let atr = 0;
  for (let i = 1; i < data.length; i++) {
    const highLow = Math.abs(data[i] - data[i - 1]);
    atr += highLow;
  }
  return atr / period; // Average of differences
}

function calculateRSI(data, period) {
  if (data.length < period ) {
    console.log('Not enough data to calculate RSI. Data length: ', data.length);
    return null;
  }
  console.log('calculate RSI. Data length: ', data.length);

  let gains = 0, losses = 0;
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) {
    console.log('Average loss is zero. RSI cannot be calculated.');
    return 100; // RSI is 100 if there are no losses
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  console.log(`Calculated RSI: ${rsi}, Avg Gain: ${avgGain}, Avg Loss: ${avgLoss}, RS: ${rs}`);
  return rsi;
}

function calculateBollingerBands(data, period, std_dev) {
  // if (data.length < period) {
  //   console.log('Not enough data to calculate Bollinger Bands. Data length: ', data.length);
  //   return { upperBand: null, lowerBand: null };
  // }
  // console.log('calculate Bollinger Bands. Data length: ', data.length);

  // const mean = data.slice(-period).reduce((acc, val) => acc + val, 0) / period;
  // const stdDev = Math.sqrt(data.slice(-period).reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period);
  
  // const upperBand = mean + (std_dev * stdDev);
  // const lowerBand = mean - (std_dev * stdDev);

  // console.log(`Calculated Bollinger Bands: Upper: ${upperBand}, Lower: ${lowerBand}, Mean: ${mean}, StdDev: ${stdDev}`);
  
  // // upperBand = upperBand * 0.85;
  // // lowerBand = lowerBand * 1.15;
  // // upperBand = upperBand * 1;
  // // lowerBand = lowerBand * 1; 
  const upperBand = 0;
  const lowerBand = 9999999;

  return { upperBand, lowerBand };
}

function shouldTrade(rsi, price, upperBand, lowerBand, atr) {

  return (rsi <= rsi_low  && atr > atr_minimum) || (rsi >= rsi_high  && atr > atr_minimum);

 // return (rsi <= rsi_low && price <= lowerBand && atr > atr_minimum) || (rsi >= rsi_high && price >= upperBand && atr > atr_minimum);
}

function clickTradeButton(direction, price, rsi, atr, upperBand, lowerBand) {
  const currentTime = Date.now();


  console.log("clickTradeButton rsi:", rsi);
  console.log("clickTradeButton atr:", atr);
  console.log("clickTradeButton price:", price);
  console.log("clickTradeButton upperBand:", upperBand);
  console.log("clickTradeButton lowerBand:", lowerBand);
  console.log("clickTradeButton rsi_low:", rsi_low);
  console.log("clickTradeButton rsi_high:", rsi_high);

  if (allow_trading == 0) {
    console.log("Bot is PAUSED clickTradeButton not processed");
    return;
  }

  direction = "none";

  // Define trading strategy based on RSI values and Bollinger Bands
  if (rsi <= rsi_low && price <= lowerBand && atr >= atr_minimum) {
    direction = "up";
    lets_try = "bounce";
  } else if (rsi >= rsi_high && price >= upperBand && atr >= atr_minimum) {
    direction = "down";
    lets_try = "bounce";
  }

  if (direction === "none") {
    console.log(`(Not Clicking ${direction}) - No valid trade signal. Price: ${price}, RSI: ${rsi}, ATR: ${atr}`);
    return;
  }

  if (currentTime - lastTradeTime < 4999) {
    console.log(`(Not Clicking ${direction}) Trade blocked to avoid simultaneous trading. Price: ${price}, Time since last trade: ${(currentTime - lastTradeTime) / 1000} seconds`);
    return;
  }

  const buttonSelector = direction === 'up' ? 'button[data-test="deal-button-up"]' : 'button[data-test="deal-button-down"]';
  const tradeButton = document.querySelector(buttonSelector);

  if (tradeButton) {
    tradeButton.click();
    lastTradeTime = currentTime;
    lastTradeDirection = direction;
    last_used_lets_try = lets_try;
    lastTradePrice = price;
    console.log(`Clicked ${direction} button, lets_try: ${lets_try} - Trade executed at: ${nowWIB()} WIB, Price: ${price}, RSI: ${rsi}, ATR: ${atr}`);
  } else {
    console.error(`Click: Trade button not found: ${buttonSelector}`);
  }
}

function nowWIB() {
  const currentTime = Date.now();
  const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return new Intl.DateTimeFormat('en-GB', options).format(currentTime);
}

function checkLastTrade() {
  const tradeElements = document.querySelectorAll('[data-test="deal-history-card-ftt"]');

  if (tradeElements.length > 0) {
    const lastTradeElement = tradeElements[0]; // Assuming the first element is the latest trade

    const resultElement = lastTradeElement.querySelector('[data-test="deal-header-end-bottom"] p');
    if (resultElement) {
      const resultText = resultElement.textContent.trim();

      if (resultText.startsWith('+')) {
        last_trade_win = 1;
      } else {
        last_trade_win = 0;
      }
    }
  } else {
    // If trade elements are not found, click the button to show the trading results section
    const showTradesButton = document.querySelector('button[data-test="sidebar-btn-trading-bar"]');
    if (showTradesButton) {
      showTradesButton.click();

      // Wait a moment for the trades section to load and try checking again
      setTimeout(checkLastTrade, 2000);
    }
  }
}

function setTimeValue() {
  const buttons = document.querySelectorAll('button[data-test="deal-form-input-controls-minus"]');

  // Check if there are at least two buttons
  if (buttons.length > 1) {
    const secondButton = buttons[1]; // Select the second button

    if (!secondButton.disabled) {
      secondButton.click();
      secondButton.click();
      secondButton.click();
      secondButton.click();
      secondButton.click();

      console.log('Second button clicked.');
    } else {
      console.log('Second button is disabled.');
    }
  } else {
    console.log('Less than two buttons found.');
  }
}

function setLastTry() {
  if (last_used_lets_try === "bounce" && last_trade_win == 1) {
    lets_try = "bounce";
  } else if (last_used_lets_try === "continue" && last_trade_win == 1) {
    lets_try = "continue";
  } else if (last_used_lets_try === "bounce" && last_trade_win == 0) {
    lets_try = "continue";
  } else if (last_used_lets_try === "continue" && last_trade_win == 0) {
    lets_try = "bounce";
  }

  console.log(`lets_try: ${lets_try}`);
}

function checkBalance() {
  const balanceElement = document.querySelector('p[data-test="account-balance-value"]');
  if (balanceElement) {
    const balanceTextOriginal = balanceElement.textContent;
    const balanceText = balanceElement.textContent.replace(/[^\d.-]/g, '');
    const balance = parseFloat(balanceText);
    if (starting_balance === 0) {
      starting_balance = balance;
    }
    if (lowest_balance === -1) {
      lowest_balance = balance;
    }
    if (highest_balance < balance) {
      highest_balance = balance;
    }

    if (lowest_balance > balance) {
      lowest_balance = balance;
    }

    let maximum_achieved_balance = 0;
    let minimum_achieved_balance = 0;
    let trading_amount = 0;

    if (balanceTextOriginal.includes('IDR')) {
      trading_amount = 25000;
      maximum_achieved_balance = starting_balance + (trading_amount * 0.85 * 2);
      minimum_achieved_balance = starting_balance - (trading_amount * 10);
    } else if (balanceTextOriginal.includes('USD')) {
      trading_amount = 10;
      maximum_achieved_balance = starting_balance + (trading_amount * 0.85 * 2);
      minimum_achieved_balance = starting_balance - (trading_amount * 10);
    } else {
      trading_amount = 500;
      maximum_achieved_balance = starting_balance + (trading_amount * 1 * 10);
      minimum_achieved_balance = starting_balance - (trading_amount * 20);
    }
    console.log("Starting Balance: " + starting_balance);
    console.log("Highest Balance: " + highest_balance);
    console.log("Lowest Balance: " + lowest_balance);



    if (balance >= maximum_achieved_balance || balance <= minimum_achieved_balance) {
      console.log("Balance threshold reached. Stopping the bot.");
      console.log("Balance: " + balance);

      if (socket) {
        socket.close();
      }
      isBotRunning = false;
      chrome.runtime.sendMessage({ action: 'statusUpdate', status: 'stopped' }, () => {
        console.log('Bot stopped due to balance threshold.');
      });
    }
  }
}

