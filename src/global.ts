const buildNumber = __BUILD_NUMBER__;
const buildDate = __BUILD_DATE__;
const buildCommit = __BUILD_COMMIT__;
  
document!.getElementById('build-info')!.innerText = `Build: ${buildNumber} - REV ${buildCommit} - ${buildDate}`;