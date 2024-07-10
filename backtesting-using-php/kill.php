<?php

// Execute the `ps ax` command and store the output in an array
exec("ps ax", $output);

// Loop through each line of the output
foreach ($output as $line) {
    // Check if the line contains "olymptrade.php"
    if (strpos($line, "olymptrade.php") !== false) {
        // Extract the PID (process ID)
        preg_match('/^\s*([0-9]+)/', $line, $matches);
        
        if (isset($matches[1])) {
            $pid = $matches[1];
            // Kill the process using the PID
            exec("kill $pid");
            echo "Killed process with PID: $pid\n";
        }
    }
}
?>