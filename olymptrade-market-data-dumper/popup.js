document.getElementById("download").addEventListener("click", function() {
  chrome.runtime.sendMessage({action: "download"});
});