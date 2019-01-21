# Gekko Warez Bruteforce Backtester, with added bulk TOML to Gekko Config writer

A Swiss Army Node.js brute force backtester for Gekko trading bot. Saves time so you can spend more time looking good.

## Here's what you can do:

1. Set multiple history periods
2. Set multiple candle sizes
3. Set multiple strategies
4. Set multiple exchange and trading pairs
5. Set random ranges for each strategy config
6. Writes all outputs and strategy configs out into a csv so you can review what strat and related settings are going to make you the most cold hard crypto

## Installation:
(You can install Bruteforce wherever you like, but it saves you time if you just set it up in a folder called "bruteforce" next to "gekko".)

```
git clone https://github.com/gekkowarez/bruteforce.git`
cd bruteforce
npm install
```

## Setup:

Open bruteforce.js in your favorite text editor and setup paths and configs from line 20. Instructions are in the doc.

## To run:

You must have the Gekko api server running so type the following into a console first:

```
cd ../gekko
node gekko --ui
```

Then type the following to run the bruteforce app:

```
cd ../bruteforce
npm start
```

(`npm start` will launch bruteforce with `--max_old_space_size=4096`, which should prevent the `JavaScript heap out of memory` error ([#3](https://github.com/gekkowarez/bruteforce/issues/3)).)

# What's this TOML thing do?
The TOML thing is pretty cool - it takes all the TOML files contents, re-writes them into JSON, then appends them to a Gekko config file. This is pretty awesome for us CLI guys who really don't use the front end but do use Strategy libraries such as the one here:
https://github.com/xFFFFF/Gekko-Strategies/

## Setup:
toml-config-converter.js will read strategy configurations from all TOML files in `strategiesFolder`, append them to `configFile` and save the result as `outputConfigFile`. Set your paths on lines 19, 21 and 23 accordingly.

## To run:
```
node toml-config-converter.js
```

## Use:
Make sure to point `configFile` in bruteforce.js to the output config file and you're good to go.
