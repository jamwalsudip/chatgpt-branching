// Popup script for ChatGPT Visual Branching Extension

document.addEventListener('DOMContentLoaded', function() {
  checkChatGPTTab();
});

function checkChatGPTTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    if (currentTab.url.includes('chatgpt.com') || currentTab.url.includes('chat.openai.com')) {
      statusElement.className = 'status active';
      statusText.textContent = 'Active on ChatGPT';
    } else {
      statusElement.className = 'status inactive';
      statusText.textContent = 'Navigate to ChatGPT to use';
    }
  });
}