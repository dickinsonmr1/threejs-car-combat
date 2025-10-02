"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
// Get the build number from the git command
var buildNumber = (0, child_process_1.execSync)("git rev-list --count HEAD").toString().trim();
// Write the build number to a .env file
var envFilePath = (0, path_1.join)(process.cwd(), ".env");
(0, fs_1.writeFileSync)(envFilePath, "VITE_BUILD_NUMBER=".concat(buildNumber, "\n"));
console.log("Build number set to ".concat(buildNumber));
