let clipboardData = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveClip") {
    clipboardData[request.key] = request.text;
    chrome.storage.local.set({ clipboardData: clipboardData });
    sendResponse({ success: true, message: `Text saved to key: ${request.key}` });
  } else if (request.action === "getClip") {
    const clip = clipboardData[request.key] || "";
    sendResponse({ text: clip });
  } else if (request.action === "getAll") {
    sendResponse({ data: clipboardData });
  }
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("clipboardData", (result) => {
    if (result.clipboardData) {
      clipboardData = result.clipboardData;
    }
  });
});