<?php

function calculateRSI($data, $period) {
    $gains = 0;
    $losses = 0;

    for ($i = 1; $i < count($data); $i++) {
        $change = $data[$i] - $data[$i - 1];
        if ($change > 0) {
            $gains += $change;
        } else {
            $losses -= $change;
        }
    }

    $avgGain = $gains / $period;
    $avgLoss = $losses / $period;

    if ($avgLoss == 0) {
        return 100;
    }

    $rs = $avgGain / $avgLoss;
    return 100 - (100 / (1 + $rs));
}

function calculateATR($data, $period) {
    $atr = 0;
    // echo ('\n calculate ATR. Data length: '. count($data));

    for ($i = 1; $i < count($data); $i++) {
        $highLow = abs($data[$i] - $data[$i - 1]);
        $atr += $highLow;
    }

    return $atr / $period;
}

function calculateBollingerBands($data, $period, $stdDev, $upperLimitPercent, $lowerLimitPercent) {




    $mean = array_sum(array_slice($data, -$period)) / $period;
    $variance = 0;

    foreach (array_slice($data, -$period) as $price) {
        $variance += pow($price - $mean, 2);
    }

    $stdDeviation = sqrt($variance / $period);
    return [
        'upperBand' => $mean + ($stdDev * $stdDeviation) * $upperLimitPercent,
        'lowerBand' => $mean - ($stdDev * $stdDeviation) * $lowerLimitPercent,
    ];
}

function simulateTrading($data, $params) {

    
    $folder_result ="./folder_result/";
    if(!file_exists($folder_result )){
        mkdir($folder_result, 0777);
    }

    
    $cache_result = "$folder_result/".md5( json_encode($data) ) ."-".md5( json_encode($params) ) . ".json";
    if(file_exists($cache_result)){
        return null;
    }





    $balance = $params['initialBalance'];
    $rsi_low = $params['rsi_low'];
    $rsi_high = $params['rsi_high'];
    $atr_min = $params['atr_min'];

    $prices = [];
    $tradeCount = 0;
    $correctTrades = 0;
    $incorrectTrades = 0;

    foreach ($data as $index => $point) {
        if (!isset($point[0]['d'][0]['q']) || !isset($point[0]['d'][0]['t'])) {
            continue;
        }

        $price = $point[0]['d'][0]['q'];
        $timestamp = $point[0]['d'][0]['t'];

        $prices[] = $price;
        if (count($prices) < max($params['rsiPeriod'], $params['atrPeriod'], $params['bollingerPeriod'])) {
            continue;
        }

        $rsi = calculateRSI(array_slice($prices, -$params['rsiPeriod']), $params['rsiPeriod']);
        $atr = calculateATR(array_slice($prices, -$params['atrPeriod']), $params['atrPeriod']);
        $bollinger = calculateBollingerBands($prices, $params['bollingerPeriod'], $params['bollingerStdDev'], $params['upperLimitPercent'], $params['lowerLimitPercent']);

        if ($balance < $params['tradeAmount']) {
            break;
        }

        $tradeDirection = 'none';
        # if ($rsi <= $rsi_low && $price <= $bollinger['lowerBand'] && $atr > $atr_min) {
        if ($rsi <= $rsi_low &&  $atr > $atr_min) {

            $tradeDirection = 'up';
        ## } elseif ($rsi >= $rsi_high && $price >= $bollinger['upperBand'] && $atr > $atr_min) {
        } elseif ($rsi >= $rsi_high  && $atr > $atr_min) {
            $tradeDirection = 'down';
        }

        if ($tradeDirection === 'none') {
            continue;
        }

        $tradeCount++;
        $nextIndex = min($index + 1, count($data) - 1);
        $nextPrice = isset($data[$nextIndex][0]['d'][0]['q']) ? $data[$nextIndex][0]['d'][0]['q'] : $price;

        if (($tradeDirection === 'up' && $nextPrice > $price) || ($tradeDirection === 'down' && $nextPrice < $price)) {
            $balance += $params['tradeAmount'] * 0.85;
            $correctTrades++;
        } else 
        if ( $nextPrice == $price) {
            // OK refunded
        } else 
        {
            $balance -= $params['tradeAmount'];
            $incorrectTrades++;
        }

        // Ensure to skip to next 5 second window
        for ($j = $index + 1; $j < count($data) && $data[$j][0]['d'][0]['t'] < $timestamp + 5; $j++);
        $index = $j - 1;
    }

    $json_result = json_encode([
        'final_balance' => $balance,
        'trade_count' => $tradeCount,
        'correct_trades' => $correctTrades,
        'incorrect_trades' => $incorrectTrades,
        'parameters' => $params,
    ]);

    file_put_contents( $cache_result, $json_result); 

    return [
        'final_balance' => $balance,
        'trade_count' => $tradeCount,
        'correct_trades' => $correctTrades,
        'incorrect_trades' => $incorrectTrades,
    ];
}

// Load the JSON data
## $jsonData1 = file_get_contents('./a512af99-39f1-4478-a015-1b5b59603970.json');


$files = glob("./datas/*.json");
$data = [];

foreach($files as $file){
    $jsonData = file_get_contents($file);
    $decodedData = json_decode($jsonData, true);
    if ($decodedData !== null) {
        $data = array_merge($data, $decodedData);
    }
}

// Now $data contains the combined datasets

// Sort combined data by timestamp
usort($data, function($a, $b) {
    return $a[0]['d'][0]['t'] <=> $b[0]['d'][0]['t'];
});

// // Set initial parameters
// $initialParams = [
//     'rsiPeriod' => 7, // Customize the RSI period
//     'atrPeriod' => 7, // Customize the ATR period
//     'bollingerPeriod' => 20, // Customize the Bollinger Bands period
//     'bollingerStdDev' => 2.5, // Customize the Bollinger Bands standard deviation
//     'upperLimitPercent' => 1, // Customize the upper Bollinger Band limit percentage
//     'lowerLimitPercent' => 1, // Customize the lower Bollinger Band limit percentage
//     'initialBalance' => 300000, // Set the initial balance
//     'tradeAmount' => 15000 // Set the trade amount per trade
// ];

// Arrays to hold the range of RSI and ATR thresholds
$rsiMinRange = range(0, 30, 1); // Customize as needed
$rsiMaxRange = range(60, 100, 1); // Customize as needed
## $atrMinRange = [0.024]; // Customize as needed
// $atrMinRange = [0.040]; // Customize as needed
$atrMinRange = range(0.030, 0.035, 0.001); // Customize as needed
// $bollingerStdDevRange = range(0, 5, 0.1); // Customize as needed
$bestResult = null;
$bestParams = [];
$rsiPeriodRange = range(7, 8, 1); // Customize as needed
$atrPeriodRange = range(30, 40, 1); // Customize as needed
foreach ($rsiPeriodRange as $rsiPeriod) {
    foreach ($atrPeriodRange as $atrPeriod) {
        foreach ($rsiMinRange as $rsiMin) {
            foreach ($rsiMaxRange as $rsiMax) {
                foreach ($atrMinRange as $atrMin) {
                    //foreach ($bollingerStdDevRange as $bollingerStdDev) {
                        // Set initial parameters
                        $initialParams = [
                            'rsiPeriod' => $rsiPeriod, // Customize the RSI period
                            'atrPeriod' => $atrPeriod, // Customize the ATR period
                            'bollingerPeriod' => 20, // Customize the Bollinger Bands period
                           // 'bollingerStdDev' => $bollingerStdDev, // Customize the Bollinger Bands standard deviation
                            'upperLimitPercent' => 1, // Customize the upper Bollinger Band limit percentage
                            'lowerLimitPercent' => 1, // Customize the lower Bollinger Band limit percentage
                            'initialBalance' => 10000, // Set the initial balance
                            'tradeAmount' => 500 // Set the trade amount per trade
                        ];

                        $params = $initialParams;
                        $params['rsi_low'] = $rsiMin;
                        $params['rsi_high'] = $rsiMax;
                        $params['atr_min'] = $atrMin;

                        $result = simulateTrading($data, $params);

                        if (is_null($bestResult) || $result['final_balance'] > $bestResult['final_balance']) {
                            $bestResult = $result;
                            $bestParams = $params;
                        }
                    //}
                }
            }
        }
    }
}


$files = glob("./folder_result/*.json");
$maxBalance = null;
$maxBalanceFile = null;

foreach ($files as $file) {
    $jsonData = file_get_contents($file);
    $decodedData = json_decode($jsonData, true);
    
    if ($decodedData !== null && isset($decodedData['final_balance'])) {
        $currentBalance = $decodedData['final_balance'];
        
        if ($maxBalance === null || $currentBalance > $maxBalance) {
            $maxBalance = $currentBalance;
            $maxBalanceFile = $file;
        }
    }
}

if ($maxBalanceFile !== null) {
    echo "The file with the highest final_balance is: " . $maxBalanceFile . "\n";
    echo "The highest final_balance is: " . $maxBalance . "\n";
    $jsonData = file_get_contents($maxBalanceFile);
    $decodedData = json_decode($jsonData, true);
    echo "The best parameter is: \n";

    print_r($decodedData);
} else {
    echo "No valid final_balance found in the JSON files.\n";
}


// echo "Best Parameters:\n";
// // echo "bollingerStdDev: {$bestParams['bollingerStdDev']}\n";
// echo "rsiPeriod: {$bestParams['rsiPeriod']}\n";
// echo "atrPeriod: {$bestParams['atrPeriod']}\n";

// echo "RSI Low: {$bestParams['rsi_low']}\n";
// echo "RSI High: {$bestParams['rsi_high']}\n";
// echo "ATR Min: {$bestParams['atr_min']}\n";
// echo "Final Balance: {$bestResult['final_balance']}\n";
// echo "Total Trades: {$bestResult['trade_count']}\n";
// echo "Correct Trades: {$bestResult['correct_trades']}\n";
// echo "Incorrect Trades: {$bestResult['incorrect_trades']}\n";



// Best Parameters:
// RSI Low: 35
// RSI High: 50
// ATR Min: 0.035
// Final Balance: 10545
// Total Trades: 63
// Correct Trades: 37
// Incorrect Trades: 26
// PS C:\php\olymptrade>

// Best Parameters:
// bollingerStdDev: 2.3
// RSI Low: 35
// RSI High: 50
// ATR Min: 0.031
// Final Balance: 22275
// Total Trades: 240
// Correct Trades: 143
// Incorrect Trades: 97
// PS C:\php\olymptrade>


// Best Parameters:
// rsiPeriod: 8
// atrPeriod: 40
// RSI Low: 35
// RSI High: 50
// ATR Min: 0.032
// Final Balance: 26900
// Total Trades: 462
// Correct Trades: 268
// Incorrect Trades: 194
// PS C:\php\olymptrade>