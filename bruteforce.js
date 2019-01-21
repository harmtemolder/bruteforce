#!/usr/local/bin/node
//require modules
const async = require("async");
const randomExt = require("random-ext");
const rp = require("request-promise");
const { some } = require("bluebird");
const fs = require("fs-extra");
const humanize = require("humanize");
const replaceall = require("replaceall");

//setup variables
var viableStrategies = [];
var stratKey = "";
var configs = [];
var count = 0;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                      CONFIGURATION ELEMENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//set the path to your strategy files here:
var strategiesFolder = "../gekko/strategies/";
//set the path to your config file here:
var configFile = "../gekko/config-with-strategies.js";
const config = require(configFile);
//type "node gekko --ui" in your console and check that the address matches this one:
var apiUrl = "http://localhost:3000";

//then we setup the filewriter to store the backtests
//if you don't want to write the output to a file then set this to false, but then why the fuck else would you run this....derp
var writecsv = true;
//by default we throw the results into the folder and file you see below, the results will be appended...again....derp.
var resultCsv = __dirname + "/results/" + humanize.date("Ymd_His_") + "bruteforce.csv";

//then we load up the important shit!

//how many backtests do you want to run parralel, 1928374982734 I bet but unless you're armed with a serious bit of pro, multi cpu kit...how about you keep this lower than the number of cores you have for now?
var parallelqueries = 2;

//this is where it gets interesting right?
//RIGHT!!!!
//setup params for backtesting
//fuck json, this is pure arrays as god intended us pony coders to use
//throw in the candle sizes here
var candleSizes = [1440, 720, 480, 240, 120, 60, 30, 10];
//list different history sizes here
var historySizes = [21];
//ooo this looks fun - this is where you set up the trading pairs and back testing exchange data
//you can load up as many sets as you like
var tradingPairs = [
	["binance", "USDT", "BTC"],
	["binance", "BTC", "DLT"],
	["binance", "BTC", "ETH"],
	["binance", "BTC", "TRX"],
	["binance", "BTC", "QKC"],
	["binance", "BTC", "VIBE"],
	["binance", "BTC", "LINK"],
	["binance", "PAX", "BTC"],
	["binance", "BTC", "XRP"],
	["binance", "BTC", "BNB"],
	["binance", "BTC", "QLC"],
	["binance", "BTC", "WAVES"],
	["binance", "BTC", "TUSD"],
	["binance", "BTC", "BCHABC"],
	["binance", "BTC", "TNT"],
	["binance", "USDC", "BTC"],
	["binance", "BTC", "ADA"],
	["binance", "BTC", "REP"],
	["binance", "BTC", "LTC"],
	["binance", "BTC", "BCHSV"],
	["binance", "BTC", "EOS"],
	["binance", "BTC", "XLM"],
	["binance", "BTC", "ZIL"],
	["binance", "BTC", "NEO"],
	["binance", "BTC", "PHX"]
];
//so this is the number of configs that will be generated with different strategy settings
//if you multiply this by the number of candle sizes and history sizes and trading pairs you'll get the total number of backtests this sucker will run
//Note: if you wanna test candle sizes, against the same config setup then just set this to 1. Cute right???
var numberofruns = 32;

let dirCont = fs.readdirSync(strategiesFolder);

//oh wait, there's more....

//so there is another version of this script that will run every single strategy in your strategy file that has an entry in the config but while useful...it was a bit crap when it came to brute forcing shit. So now you have to enter in your strategy name.
//make sure the strategy has a config entry in the config below
let strategies = ["private-bbRsi"];

for (var a = 0, len4 = tradingPairs.length; a < len4; a++) {
	for (var j = 0, len1 = candleSizes.length; j < len1; j++) {
		for (var k = 0, len2 = historySizes.length; k < len2; k++) {
			//check which strategies have equivalent config entries for in the config
			for (var i = 0, len = numberofruns; i < len; i++) {
				stratKey = strategies[0];
				config.tradingAdvisor.method = stratKey;
				config.tradingAdvisor.candleSize = candleSizes[j];
				config.tradingAdvisor.historySize = historySizes[k];
				config.watch.exchange = tradingPairs[a][0];
				config.watch.currency = tradingPairs[a][1];
				config.watch.asset = tradingPairs[a][2];

				this.baseConfig = {
					"backtest": {
						"daterange": {
							"from": "2018-12-01T00:00:00Z",
							"to": "2019-01-14T00:00:00Z"
						} //TODO Somehow use all available data for each currency pair?
					},
					"backtestResultExporter": {
						"enabled": true,
						"writeToDisk": false,
						"data": {
							"stratUpdates": false,
							"roundtrips": true,
							"stratCandles": true,
							"stratCandleProps": ["close", "start", "open", "high", "volume", "vwp"],
							"trades": true
						}
					},
					"paperTrader": {
						"feeMaker": config.paperTrader.feeMaker,
						"feeTaker": config.paperTrader.feeTaker,
						"feeUsing": config.paperTrader.feeUsing,
						"slippage": config.paperTrader.slippage,
						"simulationBalance": config.paperTrader.simulationBalance,
						"reportRoundtrips": true,
						"enabled": true
					},
					"performanceAnalyzer": {
						"riskFreeReturn": 2,
						"enabled": true
					},
					"tradingAdvisor": {
						"enabled": true,
						"method": config.tradingAdvisor.method,
						"candleSize": config.tradingAdvisor.candleSize,
						"historySize": config.tradingAdvisor.historySize
					},
					"valid": true,
					"watch": {
						"exchange": config.watch.exchange,
						"currency": config.watch.currency,
						"asset": config.watch.asset
					},
					//strategy configurations starting from here:
					"private-bbRsi": {
						"bbPeriod": randomExt.integer(21, 7),
						"bbDeviation": randomExt.float(3.0, 1.0),
						"rsiPeriod": randomExt.integer(21, 7),
						"rsiOverbought": randomExt.integer(75, 65),
						"rsiOversold": randomExt.integer(35, 25),
						"trailPercentage": randomExt.float(10.0, 0.5)
					}
				};

				configs.push(this.baseConfig);
			}
		}
	}
}

//by this point you have an array of all the configs you're gonna run.

//run the backtests against all the stored configs.
hitApi(configs);

//this might look familiar...that's cos it's ripped from Gekkoga <3
async function hitApi(configs) {
	const results = await queue(configs, parallelqueries, async (data) => {

			console.log(
				"Running strategy - " + data.tradingAdvisor.method + " on "
				+ data.tradingAdvisor.candleSize + " minute(s) candle size on "
				+ data.watch.exchange + " for " + data.watch.currency + data.watch.asset);
			//TODO Add progress counter
			const body = await rp.post({
				url: `${apiUrl}/api/backtest`,
				json: true,
				body: data,
				headers: { "Content-Type": "application/json" },
				timeout: 1200000
			});

			if (!body.performanceReport) return null;

			let configCsvTmp1 = JSON.stringify(data[data.tradingAdvisor.method]);
			let configCsv = replaceall(",", "|", configCsvTmp1)
			let runDate = new Date().toISOString()

			var testResults = {
				"Exchange": data.watch.exchange,
				"Currency": data.watch.currency,
				"Asset": data.watch.asset,
				"Currency Pair": data.watch.currency + data.watch.asset,
				"Strategy": data.tradingAdvisor.method,
				"Config": configCsv,
				"Candle Size": data.tradingAdvisor.candleSize,
				"History Size": data.tradingAdvisor.historySize,
				"Start Date": data.backtest.daterange.from,
				"End Date": data.backtest.daterange.to,
				"Run Date": runDate,
				"Trades": body.performanceReport.trades,
				"Market Performance (%)": body.performanceReport.market,
				"Strategy Performance (%)": body.performanceReport.relativeProfit,
				"Strategy vs Market": body.performanceReport.relativeProfit - body.performanceReport.market,
				"Start Price": body.performanceReport.startPrice,
				"End Price": body.performanceReport.endPrice,
				"Start Balance": body.performanceReport.startBalance,
				"End Balance": body.performanceReport.balance,
				"Profit": body.performanceReport.profit,
				"Yearly Profit": body.performanceReport.yearlyProfit,
				"Yearly Profit (%)": body.performanceReport.relativeYearlyProfit,
				"Sharpe": body.performanceReport.sharpe || 0,
				"Alpha": body.performanceReport.alpha
			};

			//now we write the backtest results to file:

			if (writecsv === true) {
				let resultKeys = Object.keys(testResults);
				let resultValues = resultKeys.map(function(key){return testResults[key]});

				if (fs.existsSync(resultCsv)) {
					fs.appendFileSync(resultCsv, resultValues.toString() + "\n", encoding = "utf8");
				} else {
					fs.appendFileSync(resultCsv, resultKeys.toString() + "\n", encoding = "utf8");
					fs.appendFileSync(resultCsv, resultValues.toString() + "\n", encoding = "utf8");
				}

				//to do
				//write strategy file to a new file with a key
				//ensure the config it appended to the strategy file

			}
			return testResults;
		})
		.catch((err) => {
			console.log(err)
			throw err
		});
	return results;
}

function queue(items, parallel, ftc) {

	const queued = [];

	return Promise.all(items.map((item) => {

			const mustComplete = Math.max(0, queued.length - parallel + 1);
			const exec = some(queued, mustComplete)
				.then(() => ftc(item));
			queued.push(exec);

			return exec;

		}))
		.catch((err) => {
			console.log(err)
			throw err
		});
}

function getConfig(data, stratName) {
	const conf = Object.assign({}, this.baseConfig);

	conf.gekkoConfig[stratName] = Object.keys(data)
		.reduce((acc, key) => {
			acc[key] = data[key];
			return acc;
		}, {});

	return conf;
}
