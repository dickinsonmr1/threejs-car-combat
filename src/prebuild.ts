import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

// Get the build number from the git command
const buildNumber = execSync("git rev-list --count HEAD").toString().trim();

// Write the build number to a .env file
const envFilePath = join(process.cwd(), ".env");
writeFileSync(envFilePath, `VITE_BUILD_NUMBER=${buildNumber}\n`);

console.log(`Build number set to ${buildNumber}`);