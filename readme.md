

# Folder and tools descriptions:

## /olymptrade-market-data-dumper/ is for obtains market data in 15 menutes each and chrome will save the json (to be downloaded)

## /olymptrade-trading-bot-chrome-extension/ is for Trading, after we have the best parameters (already sets).

## /backtesting-using-php/ is for backtesting, after we have the market dump data (in json).

## Please note, although best parameters from backtesting is used, the chrome extension seem still highly possible to Loss balance to under 2000 from 10000 with using 500 for each trading (Demo Balance).

## `Please becareful to trading with your REAL Money`.


### [initialBalance] => 10000
### [tradeAmount] => 500
### Asset: ASIA_X (Asia Composite Index)

### The highest final_balance is: 24625

### The best config/parameters is:

    Array
    (
        [final_balance] => 24625
        [trade_count] => 424
        [correct_trades] => 245
        [incorrect_trades] => 179
        [parameters] => Array
            (
                [rsiPeriod] => 7
                [atrPeriod] => 31
                [bollingerPeriod] => 20
                [upperLimitPercent] => 1
                [lowerLimitPercent] => 1
                [initialBalance] => 10000
                [tradeAmount] => 500
                [rsi_low] => 14
                [rsi_high] => 80
                [atr_min] => 0.03
            )

    )