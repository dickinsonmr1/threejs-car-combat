const buildNumber = __BUILD_NUMBER__;
const buildDate = __BUILD_DATE__;
//const buildNumber = import.meta.env.VITE_BUILD_NUMBER || "12345";
  
    
document!.getElementById('build-info')!.innerText = `Build: ${buildNumber} - ${buildDate}`;