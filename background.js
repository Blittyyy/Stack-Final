let clipboardData = {};

// Function to save clipboard data with timestamp
function saveClipWithTimestamp(key, text) {
  clipboardData[key] = {
    text: text,
    timestamp: Date.now() // Add timestamp when saving
  };
  chrome.storage.local.set({ clipboardData: clipboardData });
}

// Clean up old clipboard entries (older than 24 hours)
function cleanupOldEntries() {
  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  let hasChanges = false;
  
  for (const key in clipboardData) {
    if (clipboardData[key].timestamp && (now - clipboardData[key].timestamp > twentyFourHoursMs)) {
      delete clipboardData[key];
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    chrome.storage.local.set({ clipboardData: clipboardData });
  }
}

// Set up periodic cleanup (check every hour)
setInterval(cleanupOldEntries, 60 * 60 * 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Run cleanup on each message to ensure stale data is removed
  cleanupOldEntries();
  
  if (request.action === "saveClip") {
    saveClipWithTimestamp(request.key, request.text);
    sendResponse({ success: true, message: `Text saved to key: ${request.key}` });
  } else if (request.action === "getClip") {
    const clipItem = clipboardData[request.key];
    const clipText = clipItem ? clipItem.text : "";
    sendResponse({ text: clipText });
  } else if (request.action === "getAll") {
    // Format data for the popup
    const formattedData = {};
    for (const key in clipboardData) {
      formattedData[key] = {
        text: clipboardData[key].text,
        timestamp: clipboardData[key].timestamp,
        age: formatTimeSince(clipboardData[key].timestamp)
      };
    }
    sendResponse({ data: formattedData });
  } else if (request.action === "deleteClip") {
    if (clipboardData[request.key]) {
      delete clipboardData[request.key];
      chrome.storage.local.set({ clipboardData: clipboardData });
      sendResponse({ success: true, message: `Deleted clip with key: ${request.key}` });
    } else {
      sendResponse({ success: false, message: `Key not found: ${request.key}` });
    }
  } else if (request.action === "deleteAll") {
    clipboardData = {};
    chrome.storage.local.set({ clipboardData: clipboardData });
    sendResponse({ success: true, message: "All clips deleted" });
  }
  return true;
});

// Format time since a timestamp in a human-readable format
function formatTimeSince(timestamp) {
  const now = Date.now();
  const diffMs = now - timestamp;
  
  // Calculate different time units
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("clipboardData", (result) => {
    if (result.clipboardData) {
      // Migrate old format to new format if needed
      let hasChanges = false;
      for (const key in result.clipboardData) {
        if (typeof result.clipboardData[key] === 'string') {
          // Migrate string format to object format with timestamp
          clipboardData[key] = {
            text: result.clipboardData[key],
            timestamp: Date.now() // Set current time for existing items
          };
          hasChanges = true;
        } else {
          clipboardData[key] = result.clipboardData[key];
        }
      }
      
      if (hasChanges) {
        chrome.storage.local.set({ clipboardData: clipboardData });
      } else {
        clipboardData = result.clipboardData;
      }
      
      // Clean up any old entries on startup
      cleanupOldEntries();
    }
  });
});