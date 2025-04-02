let isCopyMode = false;
let isPasteMode = false;
let copyModeTimer = null;
let pasteModeTimer = null;

document.addEventListener('keydown', (e) => {
  // Copy mode (Ctrl+C)
  if (e.ctrlKey && e.key === 'c') {
    // Clear any existing timer first
    if (copyModeTimer) {
      clearTimeout(copyModeTimer);
    }
    
    isCopyMode = true;
    isPasteMode = false; // Ensure paste mode is off
    
    // Start timer to reset copy mode
    copyModeTimer = setTimeout(() => { 
      isCopyMode = false;
      copyModeTimer = null;
    }, 2000);
    return;
  }
  
  // Paste mode (Ctrl+V)
  if (e.ctrlKey && e.key === 'v') {
    // Clear any existing timer first
    if (pasteModeTimer) {
      clearTimeout(pasteModeTimer);
    }
    
    isPasteMode = true;
    isCopyMode = false; // Ensure copy mode is off
    
    // Start timer to reset paste mode
    pasteModeTimer = setTimeout(() => { 
      isPasteMode = false; 
      pasteModeTimer = null;
    }, 2000);
    return;
  }
  
  // If in copy mode and a key is pressed (not a control key)
  if (isCopyMode && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "saveClip",
        key: e.key,
        text: selectedText
      }, (response) => {
        if (response.success) {
          showNotification(`Copied to key: ${e.key}`);
        }
      });
    }
    isCopyMode = false;
    if (copyModeTimer) {
      clearTimeout(copyModeTimer);
      copyModeTimer = null;
    }
  }
  
  // If in paste mode and a key is pressed (not a control key)
  if (isPasteMode && !e.ctrlKey && !e.altKey && !e.metaKey) {
    chrome.runtime.sendMessage({
      action: "getClip",
      key: e.key
    }, (response) => {
      if (response.text) {
        pasteText(response.text);
        showNotification(`Pasted from key: ${e.key}`);
      } else {
        showNotification(`No text found for key: ${e.key}`);
      }
    });
    isPasteMode = false;
    if (pasteModeTimer) {
      clearTimeout(pasteModeTimer);
      pasteModeTimer = null;
    }
  }
});

function pasteText(text) {
  // Create a contenteditable element
  const el = document.createElement('div');
  el.contentEditable = true;
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  
  // Set content and select
  el.innerHTML = text;
  el.unselectable = "off";
  el.focus();
  document.execCommand('selectAll');
  
  // Execute paste
  document.execCommand('insertText', false, text);
  
  // Cleanup
  document.body.removeChild(el);
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.right = '10px';
  notification.style.backgroundColor = '#333';
  notification.style.color = 'white';
  notification.style.padding = '10px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10000';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 2000);
}