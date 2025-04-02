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
  if (isCopyMode && !e.ctrlKey && !e.altKey && !e.metaKey && 
      !['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) {
    
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "saveClip",
        key: e.key,
        text: selectedText
      }, (response) => {
        if (response && response.success) {
          showNotification(`Copied to key: ${e.key}`);
        }
      });
    } else {
      showNotification("No text selected");
    }
    
    isCopyMode = false;
    if (copyModeTimer) {
      clearTimeout(copyModeTimer);
      copyModeTimer = null;
    }
    e.preventDefault();
  }
  
  // If in paste mode and a key is pressed (not a control key)
  if (isPasteMode && !e.ctrlKey && !e.altKey && !e.metaKey && 
      !['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) {
    
    chrome.runtime.sendMessage({
      action: "getClip",
      key: e.key
    }, (response) => {
      if (response && response.text) {
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
    e.preventDefault();
  }
});

// Improved paste function that works in different contexts
function pasteText(text) {
  const activeElement = document.activeElement;
  
  // Handle different types of editable elements
  if (activeElement.isContentEditable || 
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA') {
    
    // For input fields and contentEditable elements
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      // For standard input elements
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const beforeText = activeElement.value.substring(0, start);
      const afterText = activeElement.value.substring(end);
      
      // Insert text at cursor position
      activeElement.value = beforeText + text + afterText;
      
      // Move cursor after the inserted text
      const newPosition = start + text.length;
      activeElement.setSelectionRange(newPosition, newPosition);
    } 
    else if (activeElement.isContentEditable) {
      // For contentEditable elements
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      // Create text node and insert at cursor position
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Move cursor after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } 
  else {
    // Fallback for other contexts
    // Try using document.execCommand (which works in many contexts)
    try {
      document.execCommand('insertText', false, text);
    } catch (e) {
      // If execCommand fails, try the clipboard API approach
      const originalActiveElement = document.activeElement;
      
      // Create a temporary textarea, insert text, and copy to clipboard
      const tempElement = document.createElement('textarea');
      tempElement.value = text;
      tempElement.style.position = 'fixed';
      tempElement.style.left = '-9999px';
      document.body.appendChild(tempElement);
      tempElement.select();
      document.execCommand('copy');
      document.body.removeChild(tempElement);
      
      // Focus back on the original element and paste
      originalActiveElement.focus();
      document.execCommand('paste');
    }
  }
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
