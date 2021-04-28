#!/bin/node
const fs = require("fs");
const selectedEnvironment = process.argv[2]
const envFileContent = require(`../envs/${selectedEnvironment}.json`);
fs.writeFileSync("env.json", JSON.stringify(envFileContent, undefined, 2));
