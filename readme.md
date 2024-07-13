

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
        [final_balance] => 27800
        [trade_count] => 179
        [correct_trades] => 116
        [incorrect_trades] => 63
        [parameters] => Array
            (
                [rsiPeriod] => 7
                [atrPeriod] => 37
                [bollingerPeriod] => 20
                [upperLimitPercent] => 1
                [lowerLimitPercent] => 1
                [initialBalance] => 10000
                [tradeAmount] => 500
                [rsi_low] => 14
                [rsi_high] => 80
                [atr_min] => 0.031
            )

    )

## OR this:


    The highest final_balance is: 17575
    The highest highest_winrate is: 19
    The best parameter is:
    Array
    (
        [final_balance] => 17575
        [trade_count] => 20
        [correct_trades] => 19
        [incorrect_trades] => 1
        [parameters] => Array
            (
                [rsiPeriod] => 7
                [atrPeriod] => 33
                [bollingerPeriod] => 20
                [upperLimitPercent] => 1
                [lowerLimitPercent] => 1
                [initialBalance] => 10000
                [tradeAmount] => 500
                [rsi_low] => 14
                [rsi_high] => 100
                [atr_min] => 0.033
            )

    )

## and highest final balance with ZERO incorrect_trades is:

    The highest final_balance is: 14250
    The best parameter is:
    Array
    (
        [final_balance] => 14250
        [trade_count] => 10
        [correct_trades] => 10
        [incorrect_trades] => 0
        [parameters] => Array
            (
                [rsiPeriod] => 7
                [atrPeriod] => 37
                [bollingerPeriod] => 20
                [upperLimitPercent] => 1
                [lowerLimitPercent] => 1
                [initialBalance] => 10000
                [tradeAmount] => 500
                [rsi_low] => 14
                [rsi_high] => 100
                [atr_min] => 0.034
            )

    )
	
	
# Conclusion

## after trial and error, even using Very Fast Dedicated Server rented in Europe (for very Fast click trade response to Olymptrade server), to try any best Config from my BackTesting, its still always losses, no matter what best setting I try.
## no luck until now!
## if you doubt with my negative trading result, PLEASE TRY YOURSELF! try using Demo Account for atleast 2 Weeks - 1 Month and See Your Result when using Best config from back testing.
## Be Safe with your money.