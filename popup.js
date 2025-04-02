document.addEventListener('DOMContentLoaded', function() {
    const clipboardItemsContainer = document.getElementById('clipboard-items');
    
    // Get all clipboard data
    chrome.runtime.sendMessage({ action: "getAll" }, (response) => {
      const data = response.data;
      
      if (Object.keys(data).length === 0) {
        clipboardItemsContainer.innerHTML = '<div class="empty-message">No items stored yet. Select text, press Ctrl+C followed by any key to store.</div>';
        return;
      }
      
      // Create HTML for each clipboard item
      let html = '';
      for (const [key, value] of Object.entries(data)) {
        html += `
          <div class="clipboard-item">
            <div class="key">Key: ${key}</div>
            <div class="value">${escapeHtml(value)}</div>
          </div>
        `;
      }
      
      clipboardItemsContainer.innerHTML = html;
    });
    
    function escapeHtml(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  });