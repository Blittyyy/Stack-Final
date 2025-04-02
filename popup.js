document.addEventListener('DOMContentLoaded', function() {
    const clipboardItemsContainer = document.getElementById('clipboard-items');
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    // Load and display clipboard data
    function loadClipboardData() {
      chrome.runtime.sendMessage({ action: "getAll" }, (response) => {
        const data = response.data;
        
        if (Object.keys(data).length === 0) {
          clipboardItemsContainer.innerHTML = '<div class="empty-message">No items stored yet. Select text, press Ctrl+C followed by any key to store.</div>';
          return;
        }
        
        // Create HTML for each clipboard item
        let html = '';
        for (const [key, item] of Object.entries(data)) {
          // Calculate time remaining before expiry
          const now = Date.now();
          const timestampDate = new Date(item.timestamp);
          const expiryDate = new Date(item.timestamp + 24 * 60 * 60 * 1000);
          const timeRemaining = expiryDate - now;
          const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
          
          let expiryWarning = '';
          if (hoursRemaining < 6) {
            expiryWarning = `<div class="expiry-warning">Expires in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}</div>`;
          }
          
          html += `
            <div class="clipboard-item" data-key="${key}">
              <button class="delete-btn" data-key="${key}">X</button>
              <div class="key">Key: ${key}</div>
              <div class="value">${escapeHtml(item.text)}</div>
              <div class="timestamp">Copied ${item.age} (${timestampDate.toLocaleString()})</div>
              ${expiryWarning}
            </div>
          `;
        }
        
        clipboardItemsContainer.innerHTML = html;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
          button.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            deleteClipboardItem(key);
          });
        });
      });
    }
    
    // Delete a specific clipboard item
    function deleteClipboardItem(key) {
      chrome.runtime.sendMessage({ 
        action: "deleteClip", 
        key: key 
      }, (response) => {
        if (response.success) {
          loadClipboardData(); // Refresh the display
        }
      });
    }
    
    // Delete all clipboard items
    clearAllBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete all clipboard items?')) {
        chrome.runtime.sendMessage({ action: "deleteAll" }, (response) => {
          if (response.success) {
            loadClipboardData(); // Refresh the display
          }
        });
      }
    });
    
    function escapeHtml(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    // Initial load
    loadClipboardData();
    
    // Refresh data every 60 seconds to update timestamps
    setInterval(loadClipboardData, 60000);
  });