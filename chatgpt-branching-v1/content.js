// ChatGPT Visual Branching Extension
class ChatGPTBranching {
  constructor() {
    this.activeBranches = new Map();
    this.expandedBranchPoint = null;
    this.selectedBranch = null;
    this.init();
  }

  init() {
    console.log('ChatGPT Visual Branching Extension loaded');
    console.log('Current URL:', window.location.href);
    
    // Wait a bit for ChatGPT to load, then start observing
    setTimeout(() => {
      this.observeDOM();
      this.addBranchButtons();
    }, 2000);
  }

  observeDOM() {
    // Watch for new messages being added to the conversation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.addBranchButtons();
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addBranchButtons() {
    console.log('Looking for messages to add branch buttons...');
    
    // Try multiple selectors for user messages in ChatGPT
    const selectors = [
      '[data-message-author-role="user"]',
      '[data-testid*="user"]',
      '.group.w-full.text-token-text-primary',
      'div[class*="group"][class*="user"]',
      'div:has(> div > div > div[data-message-author-role="user"])'
    ];
    
    let messages = [];
    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          console.log(`Found ${found.length} messages with selector: ${selector}`);
          messages = Array.from(found);
          break;
        }
      } catch (e) {
        console.log(`Selector failed: ${selector}`, e);
      }
    }
    
    if (messages.length === 0) {
      console.log('No user messages found. Trying to find any message containers...');
      // Fallback: look for any message-like containers
      const allMessages = document.querySelectorAll('div[class*="group"], div[data-testid], div[role="presentation"]');
      console.log(`Found ${allMessages.length} potential message containers`);
      
      // Filter for user messages by looking for edit buttons or specific patterns
      messages = Array.from(allMessages).filter(msg => {
        const hasEditButton = msg.querySelector('button[aria-label*="edit"], button[title*="edit"], button[data-testid*="edit"]');
        const hasUserIndicator = msg.textContent && msg.innerHTML.includes('user') || msg.className.includes('user');
        return hasEditButton || hasUserIndicator;
      });
      
      console.log(`Filtered to ${messages.length} likely user messages`);
    }
    
    messages.forEach((message, index) => {
      console.log(`Processing message ${index}:`, message);
      if (!message.querySelector('.branch-button')) {
        this.addBranchButtonToMessage(message);
      }
    });
  }

  addBranchButtonToMessage(messageElement) {
    console.log('Adding branch button to message:', messageElement);
    
    // Try to find edit button with multiple selectors
    const editSelectors = [
      'button[aria-label*="edit"]',
      'button[title*="edit"]',
      'button[data-testid*="edit"]',
      'button:has(svg)',
      'button[class*="edit"]'
    ];
    
    let editButton = null;
    for (const selector of editSelectors) {
      try {
        editButton = messageElement.querySelector(selector);
        if (editButton) {
          console.log(`Found edit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Edit button selector failed: ${selector}`);
      }
    }
    
    if (editButton) {
      const branchButton = this.createBranchButton();
      editButton.parentNode.insertBefore(branchButton, editButton.nextSibling);
      console.log('Branch button added successfully');
    } else {
      console.log('No edit button found, trying to add to message container directly');
      // Fallback: add to the message container itself
      const branchButton = this.createBranchButton();
      branchButton.style.position = 'absolute';
      branchButton.style.top = '10px';
      branchButton.style.right = '10px';
      branchButton.style.zIndex = '1000';
      messageElement.style.position = 'relative';
      messageElement.appendChild(branchButton);
      console.log('Branch button added as fallback');
    }
  }

  createBranchButton() {
    const button = document.createElement('button');
    button.className = 'branch-button flex h-9 w-9 items-center justify-center rounded-full text-token-text-secondary transition hover:bg-token-main-surface-tertiary';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="6" y1="3" x2="6" y2="15"></line>
        <circle cx="18" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <path d="m18 9-3 3 3 3"></path>
      </svg>
    `;
    button.title = 'Create branch';
    button.addEventListener('click', (e) => this.handleBranchClick(e));
    
    return button;
  }

  handleBranchClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const messageElement = event.target.closest('[data-message-author-role="user"]');
    if (messageElement) {
      this.createBranch(messageElement);
    }
  }

  createBranch(messageElement) {
    // Collapse any existing expanded branches
    if (this.expandedBranchPoint && this.expandedBranchPoint !== messageElement) {
      this.collapseBranch(this.expandedBranchPoint);
    }

    // Create or expand branch at this point
    if (this.expandedBranchPoint === messageElement) {
      this.collapseBranch(messageElement);
    } else {
      this.expandBranch(messageElement);
    }
  }

  expandBranch(messageElement) {
    this.expandedBranchPoint = messageElement;
    
    // Create branch container
    const branchContainer = document.createElement('div');
    branchContainer.className = 'branch-container';
    branchContainer.innerHTML = `
      <div class="branch-layout">
        <div class="branch-column original">
          <div class="branch-header">Original</div>
          <div class="branch-content"></div>
          <button class="select-branch-btn">Select</button>
        </div>
        <div class="branch-column new">
          <div class="branch-header">Branch</div>
          <div class="branch-content">
            <textarea class="branch-input" placeholder="Enter your branched prompt..."></textarea>
            <button class="send-branch-btn">Send</button>
          </div>
        </div>
      </div>
    `;

    // Insert after the message
    messageElement.parentNode.insertBefore(branchContainer, messageElement.nextSibling);
    
    // Copy original content
    const originalContent = branchContainer.querySelector('.original .branch-content');
    const messageClone = messageElement.cloneNode(true);
    originalContent.appendChild(messageClone);

    // Add event listeners
    this.addBranchEventListeners(branchContainer);
  }

  collapseBranch(messageElement) {
    const branchContainer = messageElement.nextElementSibling;
    if (branchContainer && branchContainer.classList.contains('branch-container')) {
      branchContainer.remove();
    }
    this.expandedBranchPoint = null;
  }

  addBranchEventListeners(branchContainer) {
    const selectButtons = branchContainer.querySelectorAll('.select-branch-btn');
    const sendButton = branchContainer.querySelector('.send-branch-btn');
    const branchInput = branchContainer.querySelector('.branch-input');

    selectButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => this.selectBranch(e));
    });

    sendButton.addEventListener('click', () => {
      const prompt = branchInput.value.trim();
      if (prompt) {
        this.sendBranchedPrompt(prompt);
      }
    });

    branchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const prompt = branchInput.value.trim();
        if (prompt) {
          this.sendBranchedPrompt(prompt);
        }
      }
    });
  }

  selectBranch(event) {
    // Remove previous selection
    document.querySelectorAll('.branch-column').forEach(col => {
      col.classList.remove('selected');
    });

    // Mark this branch as selected
    const branchColumn = event.target.closest('.branch-column');
    branchColumn.classList.add('selected');
    this.selectedBranch = branchColumn;
  }

  sendBranchedPrompt(prompt) {
    // Find ChatGPT's input field and simulate sending the prompt
    const inputField = document.querySelector('textarea[placeholder*="Message"], #prompt-textarea');
    if (inputField) {
      inputField.value = prompt;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Find and click send button
      const sendButton = document.querySelector('button[data-testid="send-button"], button[aria-label*="Send"]');
      if (sendButton && !sendButton.disabled) {
        sendButton.click();
      }
    }
  }
}

// Debug function to manually trigger button addition
window.addBranchButtonsDebug = function() {
  console.log('Manual debug trigger');
  if (window.chatGPTBranching) {
    window.chatGPTBranching.addBranchButtons();
  } else {
    console.log('Extension not initialized');
  }
};

// Initialize the extension when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatGPTBranching = new ChatGPTBranching();
  });
} else {
  window.chatGPTBranching = new ChatGPTBranching();
}