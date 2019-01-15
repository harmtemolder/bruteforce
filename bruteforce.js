const async = require("async");
// const nodemailer = require("nodemailer");
const randomExt = require("random-ext");
const rp = require("request-promise");
const { some } = require("bluebird");
const fs = require("fs-extra");
// const flat = require("flat");
// const util = require("util");
const humanize = require("humanize");
var replaceall = require("replaceall");

//setup variables
var viableStrategies = [];
var stratKey = "";
var configs = [];
var count = 0;
//configuration elements
//starting with paths and the all important gekko config
//where are your gekko strategies?
var strategiesFolder = "../gekko/strategies/";
//where is your config?
var configFile = "../gekko/config.js";
//where is your api server? (default is port 3000)
//to run the server type node gekko --ui in to the console
var apiUrl = "http://localhost:3000";
const config = require(configFile);

//then we setup the filewriter to store the backtests
//if you don't want to write the output to a file then set this to false, but then why the fuck else would you run this....derp
var writecsv = true;
//by default we throw the results into the folder and file you see below, the results will be appended...again....derp.
var resultCsv = __dirname + '/results/' + humanize.date('Ymd_His_') + 'bruteforce.csv';

//then we load up the important shit!

//how many backtests do you want to run parralel, 1928374982734 I bet but unless you're armed with a serious bit of pro, multi cpu kit...how about you keep this lower than the number of cores you have for now?
var parallelqueries = 1;

//this is where it gets interesting right?
//RIGHT!!!!
//setup params for backtesting
//fuck json, this is pure arrays as god intended us pony coders to use
//throw in the candle sizes here
var candleSizes = [10, 30, 60, 120, 240, 480, 1440];
//list different history sizes here
var historySizes = [21];
//ooo this looks fun - this is where you set up the trading pairs and back testing exchange data
//you can load up as many sets as you like
var tradingPairs = [
	["binance", "BTC", "BNB"]
];
//so this is the number of configs that will be generated with different strategy settings
//if you multiply this by the number of candle sizes and history sizes and trading pairs you'll get the total number of backtests this sucker will run
//Note: if you wanna test candle sizes, against the same config setup then just set this to 1. Cute right???
var numberofruns = 10;

let dirCont = fs.readdirSync(strategiesFolder);

//oh wait, there's more....

//so there is another version of this script that will run every single strategy in your strategy file that has an entry in the config but while useful...it was a bit crap when it came to brute forcing shit. So now you have to enter in your strategy name.
//make sure the strategy has a config entry in the config below
let strategies = ["bbRsi"];

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
						}
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
					"bbRsi": {
						"bbPeriod": randomExt.integer(21,7),
						"bbDeviation": 2,
						"rsiPeriod": randomExt.integer(21,7),
						"rsiOverbought": 70,
						"rsiOversold": 30,
						"trailPercentage": randomExt.integer(10,1)
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

			console.log("Running strategy - " + data.tradingAdvisor.method + " on " + data.tradingAdvisor.candleSize + " minute(s) candle size on " + data.watch.exchange + " for " + data.watch.currency + data.watch.asset);
			const body = await rp.post({
				url: `${apiUrl}/api/backtest`,
				json: true,
				body: data,
				headers: { "Content-Type": "application/json" },
				timeout: 1200000
			});

			// These properties will be outputted every epoch, remove property if not needed
			const properties = ["balance", "profit", "sharpe", "market", "relativeProfit", "yearlyProfit", "relativeYearlyProfit", "startPrice", "endPrice", "trades"];

			if (!body.performanceReport) return null;
			const report = body.performanceReport;

			let result = { profit: 0, metrics: false };
			if (report) {

				let picked = properties.reduce((o, k) => {

					o[k] = report[k];

					return o;

				}, {});

        result = { strat: data.tradingAdvisor.method, startdate: data.backtest.daterange.from, todate: data.backtest.daterange.to, profit: body.performanceReport.profit, sharpe: body.performanceReport.sharpe, metrics: picked };
			}

			//now we write the backtest results to file:
			if (writecsv === true) {
				let runDate = humanize.date("d-m-Y");
				let runTime = humanize.date("H:i:s");
				var sharpe = 0;
				//if(report.performanceReport.sharpe){
				//	sharpe = report.performanceReport.sharpe;
				//}
				let currencyPair = "currency dunno";//report.currency+report.asset;
				let configCsvTmp1 = JSON.stringify(data[data.tradingAdvisor.method]);
				let configCsv = replaceall(",", "|", configCsvTmp1)
				headertxt = "Strategy, Market performance(%),Strat performance (%),Profit,Run date, Run time, Start date, End date,Currency pair, Candle size, History size,Currency, Asset, Timespan,Yearly profit, Yearly profit (%), Start price, End price, Trades, Start balance, Sharpe, Alpha, Config\n";
				outtxt = data.tradingAdvisor.method+","+ report.market+","+ report.relativeProfit+","+ report.profit+","+runDate+","+runTime+","+ data.backtest.daterange.from+","+ data.backtest.daterange.to+","+ currencyPair+","+ data.tradingAdvisor.candleSize+","+ data.tradingAdvisor.historySize+","+ report.currency+","+ report.asset+","+ report.timespan+","+ report.yearlyProfit+","+ report.relativeYearlyProfit+","+ report.startPrice+","+ report.endPrice+","+ report.trades+","+ report.startBalance+","+ sharpe+","+ report.alpha+","+ configCsv+"\n";	

				if (fs.existsSync(resultCsv)) {
					fs.appendFileSync(resultCsv, outtxt, encoding = "utf8");
				} else {
					fs.appendFileSync(resultCsv, headertxt, encoding = "utf8");
					fs.appendFileSync(resultCsv, outtxt, encoding = "utf8");
				}
				//to do
				//write strategy file to a new file with a key
				//ensure the config it appended to the strategy file			

			}

		  console.log(result);
			return result;

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