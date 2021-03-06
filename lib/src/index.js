#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var e_1, _a;
var utils_1 = require("@0xproject/utils");
var chalk_1 = require("chalk");
var glob_1 = require("glob");
var Handlebars = require("handlebars");
var _ = require("lodash");
var mkdirp = require("mkdirp");
var yargs = require("yargs");
var types_1 = require("./types");
var utils_2 = require("./utils");
var ABI_TYPE_CONSTRUCTOR = 'constructor';
var ABI_TYPE_METHOD = 'function';
var ABI_TYPE_EVENT = 'event';
var DEFAULT_NETWORK_ID = 50;
var DEFAULT_BACKEND = 'web3';
var args = yargs
    .option('abis', {
    describe: 'Glob pattern to search for ABI JSON files',
    type: 'string',
    demandOption: true,
})
    .option('output', {
    alias: ['o', 'out'],
    describe: 'Folder where to put the output files',
    type: 'string',
    normalize: true,
    demandOption: true,
})
    .option('partials', {
    describe: 'Glob pattern for the partial template files',
    type: 'string',
    implies: 'template',
})
    .option('template', {
    describe: 'Path for the main template file that will be used to generate each contract',
    type: 'string',
    demandOption: true,
    normalize: true,
})
    .option('backend', {
    describe: "The backing Ethereum library your app uses. Either 'web3' or 'ethers'. Ethers auto-converts small ints to numbers whereas Web3 doesn't.",
    type: 'string',
    choices: [types_1.ContractsBackend.Web3, types_1.ContractsBackend.Ethers],
    default: DEFAULT_BACKEND,
})
    .option('network-id', {
    describe: 'ID of the network where contract ABIs are nested in artifacts',
    type: 'number',
    default: DEFAULT_NETWORK_ID,
})
    .example("$0 --abis 'src/artifacts/**/*.json' --out 'src/contracts/generated/' --partials 'src/templates/partials/**/*.handlebars' --template 'src/templates/contract.handlebars'", 'Full usage example').argv;
function registerPartials(partialsGlob) {
    var e_2, _a;
    var partialTemplateFileNames = glob_1.sync(partialsGlob);
    utils_1.logUtils.log("Found " + chalk_1.default.green("" + partialTemplateFileNames.length) + " " + chalk_1.default.bold('partial') + " templates");
    try {
        for (var partialTemplateFileNames_1 = __values(partialTemplateFileNames), partialTemplateFileNames_1_1 = partialTemplateFileNames_1.next(); !partialTemplateFileNames_1_1.done; partialTemplateFileNames_1_1 = partialTemplateFileNames_1.next()) {
            var partialTemplateFileName = partialTemplateFileNames_1_1.value;
            var namedContent = utils_2.utils.getNamedContent(partialTemplateFileName);
            Handlebars.registerPartial(namedContent.name, namedContent.content);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (partialTemplateFileNames_1_1 && !partialTemplateFileNames_1_1.done && (_a = partialTemplateFileNames_1.return)) _a.call(partialTemplateFileNames_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
Handlebars.registerHelper('parameterType', utils_2.utils.solTypeToTsType.bind(utils_2.utils, types_1.ParamKind.Input, args.backend));
Handlebars.registerHelper('returnType', utils_2.utils.solTypeToTsType.bind(utils_2.utils, types_1.ParamKind.Output, args.backend));
Handlebars.registerHelper('jsonStringify', function (value) {
    return JSON.stringify(value);
});
if (args.partials) {
    registerPartials(args.partials);
}
var mainTemplate = utils_2.utils.getNamedContent(args.template);
var template = Handlebars.compile(mainTemplate.content);
var abiFileNames = glob_1.sync(args.abis);
if (_.isEmpty(abiFileNames)) {
    utils_1.logUtils.log("" + chalk_1.default.red("No ABI files found."));
    utils_1.logUtils.log("Please make sure you've passed the correct folder name and that the files have\n               " + chalk_1.default.bold('*.json') + " extensions");
    process.exit(1);
}
else {
    utils_1.logUtils.log("Found " + chalk_1.default.green("" + abiFileNames.length) + " " + chalk_1.default.bold('ABI') + " files");
    mkdirp.sync(args.output);
}
var _loop_1 = function (abiFileName) {
    var namedContent = utils_2.utils.getNamedContent(abiFileName);
    utils_1.logUtils.log("Processing: " + chalk_1.default.bold(namedContent.name) + "...");
    var parsedContent = JSON.parse(namedContent.content);
    var ABI = void 0;
    if (_.isArray(parsedContent)) {
        ABI = parsedContent; // ABI file
    }
    else if (!_.isUndefined(parsedContent.abi)) {
        ABI = parsedContent.abi; // Truffle artifact
    }
    else if (!_.isUndefined(parsedContent.compilerOutput.abi)) {
        ABI = parsedContent.compilerOutput.abi; // 0x artifact
    }
    if (_.isUndefined(ABI)) {
        utils_1.logUtils.log("" + chalk_1.default.red("ABI not found in " + abiFileName + "."));
        utils_1.logUtils.log("Please make sure your ABI file is either an array with ABI entries or a truffle artifact or 0x sol-compiler artifact");
        process.exit(1);
    }
    var outFileName = utils_2.utils.makeOutputFileName(namedContent.name);
    var outFilePath = args.output + "/" + outFileName + ".ts";
    if (utils_2.utils.isOutputFileUpToDate(abiFileName, outFilePath)) {
        utils_1.logUtils.log("Already up to date: " + chalk_1.default.bold(outFilePath));
        return "continue";
    }
    var ctor = ABI.find(function (abi) { return abi.type === ABI_TYPE_CONSTRUCTOR; });
    if (_.isUndefined(ctor)) {
        ctor = utils_2.utils.getEmptyConstructor(); // The constructor exists, but it's implicit in JSON's ABI definition
    }
    var methodAbis = ABI.filter(function (abi) { return abi.type === ABI_TYPE_METHOD; });
    var sanitizedMethodAbis = utils_1.abiUtils.renameOverloadedMethods(methodAbis);
    var methodsData = _.map(methodAbis, function (methodAbi, methodAbiIndex) {
        _.forEach(methodAbi.inputs, function (input, inputIndex) {
            if (_.isEmpty(input.name)) {
                // Auto-generated getters don't have parameter names
                input.name = "index_" + inputIndex;
            }
        });
        // This will make templates simpler
        var methodData = __assign({}, methodAbi, { singleReturnValue: methodAbi.outputs.length === 1, hasReturnValue: methodAbi.outputs.length !== 0, tsName: sanitizedMethodAbis[methodAbiIndex].name, functionSignature: utils_1.abiUtils.getFunctionSignature(methodAbi) });
        return methodData;
    });
    var eventAbis = ABI.filter(function (abi) { return abi.type === ABI_TYPE_EVENT; });
    var contextData = {
        ABI: ABI,
        contractName: namedContent.name,
        ctor: ctor,
        methods: methodsData,
        events: eventAbis,
    };
    var renderedTsCode = template(contextData);
    utils_2.utils.writeOutputFile(outFilePath, renderedTsCode);
    utils_1.logUtils.log("Created: " + chalk_1.default.bold(outFilePath));
};
try {
    for (var abiFileNames_1 = __values(abiFileNames), abiFileNames_1_1 = abiFileNames_1.next(); !abiFileNames_1_1.done; abiFileNames_1_1 = abiFileNames_1.next()) {
        var abiFileName = abiFileNames_1_1.value;
        _loop_1(abiFileName);
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (abiFileNames_1_1 && !abiFileNames_1_1.done && (_a = abiFileNames_1.return)) _a.call(abiFileNames_1);
    }
    finally { if (e_1) throw e_1.error; }
}
//# sourceMappingURL=index.js.map