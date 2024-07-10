<?php
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
