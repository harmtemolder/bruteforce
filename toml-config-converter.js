//require modules
const fs = require("fs-extra");
const replaceall = require("replaceall");
const toml = require("toml");

//setup variables
var stratKey = "";
var stratFileName = "";
var contents = "";
var stratFileContents = "";
var baseConfig = "";
var outtxt = "";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                      CONFIGURATION ELEMENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//set the path to your TOML files here:
var strategiesFolder = "../gekko/config/strategies/";
//set the path to your config file here (don't worry, it will only be read):
var configFile = "../gekko/config-without-strategies.js";
//set the path to the config file you want the result to be saved in:
var outputConfigFile = "../gekko/config-with-strategies.js";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                    START CONVERTING TOML FILES
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//get filenames of all strategy configurations (TOML files)
let dirCont = fs.readdirSync(strategiesFolder);
let strategies = dirCont.filter(function (elm) { return elm.match(/.*\.(toml)/ig); });

//read existing config file into baseConfig variable and remove the last line
const config = require(configFile);
baseConfig = fs.readFileSync(configFile, "utf8");
baseConfig = replaceall("module.exports = config;", "", baseConfig);

//delete the output file if it exists and create a new one
if (fs.existsSync(outputConfigFile)) {
	fs.unlinkSync(outputConfigFile);
}
fs.appendFileSync(outputConfigFile, baseConfig, encoding = "utf8");

//loop through all strategy configurations and append them to the output file
for (var i = 0, len = strategies.length; i < len; i++) {
	stratFileName = strategies[i];

	//parse the contents of the TOML file to stratFileContents
	stratKey = strategies[i].slice(0, -5);
	contents = fs.readFileSync(strategiesFolder + "/" + stratFileName, "utf8");
	stratFileContents = toml.parse(contents);

	//convert stratFileContents to JSON and append it to the output file
	outtxt = "config['" + stratKey + "'] = " + JSON.stringify(stratFileContents);
	config[stratKey] = stratFileContents;
	fs.appendFileSync(outputConfigFile, outtxt + "\r\n\r\n", encoding = "utf8");
}

//add the last line to the output file to make it "ready to go"
fs.appendFileSync(outputConfigFile, "module.exports = config;", encoding = "utf8");
console.log("Config - " + outputConfigFile + " is ready to go.");
