// ChatGPT Conversation Tree Tracker
class ConversationTreeTracker {
  constructor() {
    this.conversationTree = {
      nodes: [],
      branches: new Map(),
      currentPath: []
    };
    this.overlay = null;
    this.conversationId = null;
    this.init();
  }

  init() {
    console.log('ChatGPT Conversation Tree Tracker V2 loaded');
    console.log('URL:', window.location.href);
    this.getConversationId();
    this.loadPersistedData();
    this.createOverlay();
    this.createSimpleToggle();

    // Set initial visibility based on saved state
    this.updateToggleState();

    // Set up persistent toggle button management
    this.setupPersistentToggle();

    // Set up persistent overlay management
    this.setupPersistentOverlay();

    this.interceptNetworkCalls();
    this.observeConversation();

    // Try to load existing conversation data
    this.loadExistingConversation();
  }

  getConversationId() {
    // Extract conversation ID from URL
    const urlParts = window.location.pathname.split('/');
    this.conversationId = urlParts[urlParts.length - 1] || 'default';
    console.log('Conversation ID:', this.conversationId);
  }

  loadPersistedData() {
    const storageKey = `chatgpt_tree_${this.conversationId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        this.conversationTree = JSON.parse(saved);
        console.log('Loaded persisted conversation tree:', this.conversationTree);
      } catch (e) {
        console.log('Failed to load persisted data:', e);
      }
    }
  }

  saveData() {
    const storageKey = `chatgpt_tree_${this.conversationId}`;
    localStorage.setItem(storageKey, JSON.stringify(this.conversationTree));
  }

  createSimpleToggle() {
    // Remove any existing simple toggle button
    const existingToggle = document.getElementById('simple-tree-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }

    // Try to find the Share button to position next to it
    const shareButton = this.findShareButton();

    // Create toggle button with native ChatGPT styling
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'simple-tree-toggle';
    this.toggleButton.setAttribute('aria-label', 'Toggle Conversation Tree');

    // Original branching icon (will be rotated 180° via CSS)
    this.toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label class="-ms-0.5 icon">
        <rect x="3" y="3" width="6" height="6" rx="1"/>
        <rect x="15" y="3" width="6" height="6" rx="1"/>
        <rect x="9" y="15" width="6" height="6" rx="1"/>
        <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
        <path d="M12 15V12"/>
      </svg>
    `;

    // Apply ChatGPT-inspired button styling
      Object.assign(this.toggleButton.style, {
      background: 'transparent',
      border: 'none',
      borderRadius: '6px',
      padding: '8px',
      cursor: 'pointer',
      color: 'var(--text-secondary, #6b7280)',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    // Hover effects are now handled by CSS

    // Load saved state
    const savedState = localStorage.getItem(`tree_toggle_${this.conversationId}`);
    this.isVisible = savedState !== 'false'; // Default to true

    // Position the button with error handling
    try {
      if (shareButton && shareButton.parentNode) {
        // Insert next to share button
        shareButton.parentNode.insertBefore(this.toggleButton, shareButton);
        console.log('Toggle button positioned next to Share button');
      } else {
        // Fallback: add to page in top-right corner with native styling
        this.addToggleToTopRight();
      }
    } catch (error) {
      console.log('Error positioning toggle button, using fallback:', error);
      this.addToggleToTopRight();
    }

    // Set initial button color and extension visibility
    this.updateToggleState();

    // Add click handler
    this.toggleButton.addEventListener('click', () => {
      console.log('Native toggle button clicked! Current state:', this.isVisible);
      this.isVisible = !this.isVisible;
      console.log('New state:', this.isVisible);
      localStorage.setItem(`tree_toggle_${this.conversationId}`, this.isVisible.toString());
      this.updateToggleState();
    });

    console.log('Native-styled toggle button created');
  }

  findShareButton() {
    // Look for Share button with multiple selectors
    const selectors = [
      // Look for elements containing "Share" text with SVG
      'button:has(svg)',
      '[aria-label*="Share"]',
      'button[title*="Share"]',
      // Look for ChatGPT's header buttons
      'nav button',
      'header button'
    ];

    // First try to find by text content
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
      if (button.textContent && button.textContent.trim().toLowerCase().includes('share') && button.querySelector('svg')) {
        console.log('Found Share button by text content');
        return button;
      }
    }

    // Then try other selectors
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent && element.textContent.toLowerCase().includes('share')) {
            console.log('Found Share button with selector:', selector);
            return element;
          }
        }
      } catch (e) {
        // Selector failed, continue
      }
    }

    console.log('Share button not found');
    return null;
  }

  applyNativeToggleStyle(shareButton) {
    // Get reference styling from Share button or other ChatGPT buttons
    let referenceButton = shareButton;
    if (!referenceButton) {
      // Try to find any ChatGPT button for reference
      referenceButton = document.querySelector('button[aria-label], nav button, header button, button');
    }

    if (referenceButton) {
      const computedStyle = window.getComputedStyle(referenceButton);

      // Apply similar styling to match ChatGPT's design
      Object.assign(this.toggleButton.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: computedStyle.padding || '8px',
        margin: '0 4px',
        border: 'none',
        borderRadius: computedStyle.borderRadius || '8px',
        cursor: 'pointer',
        fontSize: computedStyle.fontSize || '14px',
        fontWeight: computedStyle.fontWeight || '500',
        fontFamily: computedStyle.fontFamily || 'inherit',
        transition: 'all 0.2s ease',
        minWidth: '36px',
        minHeight: '36px',
        outline: 'none',
        boxShadow: computedStyle.boxShadow || 'none'
      });
    } else {
      // Fallback styling that matches ChatGPT's general design
      Object.assign(this.toggleButton.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        margin: '0 4px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'all 0.2s ease',
        minWidth: '36px',
        minHeight: '36px',
        outline: 'none'
      });
    }

    // Hover effects are now handled by CSS
  }

  updateToggleState() {
    console.log('Updating toggle state. isVisible:', this.isVisible);

    if (this.toggleButton) {
      // Use CSS classes for styling instead of inline styles
      if (this.isVisible) {
        this.toggleButton.classList.remove('inactive');
        this.toggleButton.classList.add('active');
      } else {
        this.toggleButton.classList.remove('active');
        this.toggleButton.classList.add('inactive');
      }
      this.toggleButton.setAttribute('title', this.isVisible ? 'Hide Conversation Tree' : 'Show Conversation Tree');
      console.log('Button state updated to:', this.isVisible ? 'active' : 'inactive');
    }

    // Ensure overlay exists and is in DOM before updating
    this.ensureOverlayExists();

    if (this.overlay && document.contains(this.overlay)) {
      // Show/hide extension - use setProperty with !important to override CSS
      if (this.isVisible) {
        this.overlay.style.setProperty('display', 'flex', 'important');
      } else {
        this.overlay.style.setProperty('display', 'none', 'important');
      }
      console.log('Overlay display set to:', this.isVisible ? 'flex' : 'none');
    } else {
      console.log('Overlay not found or not in DOM, cannot update visibility');
    }
  }

  setupPersistentToggle() {
    console.log('Setting up persistent toggle button management...');

    // Check and recreate toggle button every 2 seconds
    this.toggleCheckInterval = setInterval(() => {
      this.ensureToggleButtonExists();
    }, 2000);

    // Also watch for DOM changes that might remove our button
    this.setupToggleObserver();
  }

  ensureToggleButtonExists() {
    const existingToggle = document.getElementById('simple-tree-toggle');

    if (!existingToggle || !document.contains(existingToggle)) {
      console.log('Toggle button missing, recreating...');
      this.createSimpleToggle();
    }
  }

  setupToggleObserver() {
    // Watch for DOM changes that might remove our toggle button
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if our toggle button was removed
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.id === 'simple-tree-toggle' ||
                (node.querySelector && node.querySelector('#simple-tree-toggle'))) {
                shouldCheck = true;
              }
            }
          });

          // Check if new elements were added (ChatGPT UI refresh)
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // If ChatGPT's header area was refreshed, we might need to recreate our button
              if (node.querySelector && (
                node.querySelector('button') ||
                node.querySelector('nav') ||
                node.querySelector('header')
              )) {
                shouldCheck = true;
              }
            }
          });
        }
      });

      if (shouldCheck) {
        // Debounce to avoid too frequent checks
        clearTimeout(this.toggleObserverTimeout);
        this.toggleObserverTimeout = setTimeout(() => {
          this.ensureToggleButtonExists();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('Toggle button observer set up');
  }

  addToggleToTopRight() {
    document.body.appendChild(this.toggleButton);
    Object.assign(this.toggleButton.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '999998'
    });
    console.log('Toggle button positioned in top-right corner (fallback)');
  }

  setupPersistentOverlay() {
    console.log('Setting up persistent overlay management...');

    // Check and recreate overlay every 3 seconds (less frequent than toggle button)
    this.overlayCheckInterval = setInterval(() => {
      this.ensureOverlayExists();
    }, 3000);
  }

  ensureOverlayExists() {
    const existingOverlay = document.getElementById('conversation-tree-overlay');

    if (!existingOverlay || !document.contains(existingOverlay)) {
      console.log('Extension overlay missing, recreating...');
      this.createOverlay();

      // Apply current toggle state to the recreated overlay
      setTimeout(() => {
        this.updateToggleState();
      }, 100);
    } else {
      // Overlay exists, but make sure our reference is correct
      if (this.overlay !== existingOverlay) {
        console.log('Updating overlay reference...');
        this.overlay = existingOverlay;
      }
    }
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    if (this.toggleCheckInterval) {
      clearInterval(this.toggleCheckInterval);
    }
    if (this.overlayCheckInterval) {
      clearInterval(this.overlayCheckInterval);
    }
    if (this.toggleObserverTimeout) {
      clearTimeout(this.toggleObserverTimeout);
    }
    console.log('Extension cleanup completed');
  }









  createSimpleToggleButton(shareButton) {
    console.log('Creating simple toggle button...');

    // Remove existing if any
    this.removeToggleButton();

    // Create toggle button
    this.toggleButton = document.createElement('div');
    this.toggleButton.className = 'flex w-full items-center justify-center gap-1.5 tree-toggle-btn';
    this.toggleButton.style.cursor = 'pointer';
    this.toggleButton.setAttribute('title', this.isExtensionVisible ? 'Hide Conversation Tree' : 'Show Conversation Tree');

    // Create branching icon matching the share button style
    this.toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label class="-ms-0.5 icon">
        <rect x="3" y="3" width="6" height="6" rx="1"/>
        <rect x="15" y="3" width="6" height="6" rx="1"/>
        <rect x="9" y="15" width="6" height="6" rx="1"/>
        <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
        <path d="M12 15V12"/>
      </svg>
    `;

    // Style to match share button
    this.applyShareButtonStyling();

    // Add click handler
    this.toggleButton.addEventListener('click', () => {
      this.toggleExtensionVisibility();
    });

    // Insert before share button
    shareButton.parentNode.insertBefore(this.toggleButton, shareButton);

    console.log('Toggle button created and inserted');
  }

  applyShareButtonStyling() {
    // Get the share button's computed styles to match exactly
    const shareButton = this.findShareButton();
    if (shareButton) {
      const computedStyle = window.getComputedStyle(shareButton);

      // Copy relevant styles
      this.toggleButton.style.padding = computedStyle.padding;
      this.toggleButton.style.margin = computedStyle.margin;
      this.toggleButton.style.borderRadius = computedStyle.borderRadius;
      this.toggleButton.style.fontSize = computedStyle.fontSize;
      this.toggleButton.style.fontWeight = computedStyle.fontWeight;
      this.toggleButton.style.color = computedStyle.color;
    }

    // Set the background color based on state
    this.updateToggleButtonColor();
  }

  updateToggleButtonColor() {
    if (this.toggleButton) {
      // Use CSS classes for styling instead of inline styles
      if (this.isExtensionVisible) {
        this.toggleButton.classList.remove('inactive');
        this.toggleButton.classList.add('active');
      } else {
        this.toggleButton.classList.remove('active');
        this.toggleButton.classList.add('inactive');
      }
      this.toggleButton.setAttribute('title', this.isExtensionVisible ? 'Hide Conversation Tree' : 'Show Conversation Tree');
    }
  }

  removeToggleButton() {
    if (this.toggleButton) {
      console.log('Removing toggle button');
      this.toggleButton.remove();
      this.toggleButton = null;
    }
  }

  setupShareButtonManagement() {
    console.log('Setting up share button management...');

    // Initial check
    this.checkShareButtonAndUpdateState();

    // Set up observer to watch for share button changes
    this.observeShareButton();

    // Periodic check as fallback
    this.setupPeriodicShareButtonCheck();
  }

  checkShareButtonAndUpdateState() {
    const shareButton = this.findShareButton();

    if (shareButton && !this.toggleButton) {
      // Share button exists but toggle button doesn't - create it
      console.log('Share button found, creating toggle button');
      this.createToggleButton(shareButton);
      this.updateExtensionVisibility();
    } else if (!shareButton && this.toggleButton) {
      // Share button gone but toggle button exists - remove it
      console.log('Share button gone, removing toggle button and hiding extension');
      this.removeToggleButton();
      this.hideExtension();
    } else if (shareButton && this.toggleButton) {
      // Both exist - ensure extension visibility matches user preference
      this.updateExtensionVisibility();
    } else {
      // Neither exists - ensure extension is hidden
      this.hideExtension();
    }
  }

  findShareButton() {
    const shareSelectors = [
      '[data-testid*="share"]',
      '[aria-label*="Share"]',
      'button[title*="Share"]',
      'button[aria-label*="share" i]',
      'button[title*="share" i]',
      'button:has(svg):has([d*="M18"])', // Share icon path
      'button:has(svg):has([d*="share"])',
      '.share-button',
      '[class*="share"]',
      'button:contains("Share")',
      // ChatGPT specific selectors
      'nav button[aria-label*="Share"]',
      'header button[aria-label*="Share"]',
      '.flex button[aria-label*="Share"]'
    ];

    for (const selector of shareSelectors) {
      try {
        const shareButton = document.querySelector(selector);
        if (shareButton) {
          console.log('Found share button with selector:', selector);
          return shareButton;
        }
      } catch (e) {
        console.log('Selector failed:', selector, e);
      }
    }

    return null;
  }

  createToggleButton(shareButton) {
    console.log('Creating toggle button...');

    // Remove existing toggle button if it exists
    if (this.toggleButton) {
      this.toggleButton.remove();
      this.toggleButton = null;
    }

    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'tree-toggle-btn';
    this.toggleButton.setAttribute('aria-label', 'Toggle Conversation Tree');
    this.toggleButton.setAttribute('title', this.isExtensionVisible ? 'Hide Conversation Tree' : 'Show Conversation Tree');

    // Create branching icon (organizational chart style)
    this.toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1"/>
        <rect x="15" y="3" width="6" height="6" rx="1"/>
        <rect x="9" y="15" width="6" height="6" rx="1"/>
        <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
        <path d="M12 15V12"/>
      </svg>
    `;

    // Apply ChatGPT-like styling
    this.applyNativeButtonStyling();

    // Add click handler
    this.toggleButton.addEventListener('click', () => {
      this.toggleExtensionVisibility();
    });

    // Insert before share button
    shareButton.parentNode.insertBefore(this.toggleButton, shareButton);

    console.log('Toggle button created and inserted');
  }

  removeToggleButton() {
    if (this.toggleButton) {
      console.log('Removing toggle button');
      this.toggleButton.remove();
      this.toggleButton = null;
    }
  }

  updateExtensionVisibility() {
    if (this.isExtensionVisible) {
      this.showExtension();
    } else {
      this.hideExtension();
    }
  }

  showExtension() {
    if (this.overlay) {
      console.log('Showing extension');
      this.overlay.style.display = 'flex';
      this.overlay.style.opacity = '0';
      this.overlay.style.transform = 'translateY(-10px)';

      // Refresh tree data when showing
      setTimeout(() => {
        this.extractConversationFromDOM();
      }, 100);

      // Animate in
      setTimeout(() => {
        this.overlay.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        this.overlay.style.opacity = '1';
        this.overlay.style.transform = 'translateY(0)';
      }, 10);
    }
  }

  hideExtension() {
    if (this.overlay) {
      console.log('Hiding extension');
      this.overlay.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      this.overlay.style.opacity = '0';
      this.overlay.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        this.overlay.style.display = 'none';
      }, 300);
    }
  }

  applyNativeButtonStyling() {
    // Get computed styles from a nearby ChatGPT button for reference
    const referenceButton = document.querySelector('button[aria-label*="Share"], button[title*="Share"], .btn, button');

    if (referenceButton) {
      const computedStyle = window.getComputedStyle(referenceButton);

      // Apply base styles matching ChatGPT's design
      Object.assign(this.toggleButton.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        margin: '0 4px',
        border: 'none',
        borderRadius: '8px',
        color: this.isExtensionVisible ? '#ffffff' : '#000000',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        minWidth: '36px',
        minHeight: '36px',
        position: 'relative',
        outline: 'none'
      });

      // Use CSS classes for state-based styling
      if (this.isExtensionVisible) {
        this.toggleButton.classList.add('active');
      } else {
        this.toggleButton.classList.add('inactive');
      }
    } else {
      // Fallback styling if no reference button found
      Object.assign(this.toggleButton.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        margin: '0 4px',
        border: 'none',
        borderRadius: '8px',
        color: this.isExtensionVisible ? '#ffffff' : '#000000',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        minWidth: '36px',
        minHeight: '36px',
        outline: 'none'
      });

      // Use CSS classes for state-based styling
      if (this.isExtensionVisible) {
        this.toggleButton.classList.add('active');
      } else {
        this.toggleButton.classList.add('inactive');
      }
    }

    // Hover effects are now handled by CSS
  }

  observeShareButton() {
    // Watch for changes to the header area where share button might appear/disappear
    const observer = new MutationObserver((mutations) => {
      let shouldCheckShareButton = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if toggle button was removed (indicates share button might be gone)
          if (this.toggleButton && !document.contains(this.toggleButton)) {
            shouldCheckShareButton = true;
          }

          // Check if new elements were added that might include share button
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && (
                node.querySelector('[data-testid*="share"]') ||
                node.querySelector('[aria-label*="Share"]') ||
                node.textContent?.toLowerCase().includes('share')
              )) {
                shouldCheckShareButton = true;
              }
            }
          });
        }
      });

      if (shouldCheckShareButton) {
        console.log('DOM changes detected, checking share button state...');
        // Debounce to avoid too frequent checks
        clearTimeout(this.shareButtonCheckTimeout);
        this.shareButtonCheckTimeout = setTimeout(() => {
          this.checkShareButtonAndUpdateState();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupPeriodicShareButtonCheck() {
    // Periodic check as fallback in case observer misses changes
    const checkInterval = setInterval(() => {
      this.checkShareButtonAndUpdateState();
    }, 5000); // Check every 5 seconds

    // Stop checking after 2 minutes to avoid infinite checking
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('Stopped periodic share button checking');
    }, 120000);
  }

  toggleExtensionVisibility() {
    console.log('Toggling extension from:', this.isExtensionVisible);

    // Toggle state
    this.isExtensionVisible = !this.isExtensionVisible;
    this.saveToggleState();

    // Update button using CSS classes
    if (this.toggleButton) {
      if (this.isExtensionVisible) {
        this.toggleButton.classList.remove('inactive');
        this.toggleButton.classList.add('active');
      } else {
        this.toggleButton.classList.remove('active');
        this.toggleButton.classList.add('inactive');
      }
    }

    // Show/hide extension
    if (this.overlay) {
      if (this.isExtensionVisible) {
        this.overlay.style.display = 'flex';
        setTimeout(() => {
          this.extractConversationFromDOM();
        }, 100);
      } else {
        this.overlay.style.display = 'none';
      }
    }

    console.log('Extension toggled to:', this.isExtensionVisible);
  }

  updateToggleButtonAppearance() {
    if (!this.toggleButton) return;

    const newColor = this.isExtensionVisible ? '#000000' : 'transparent';
    const newTextColor = this.isExtensionVisible ? '#ffffff' : '#000000';

    // Temporarily disable transition for instant color change
    const originalTransition = this.toggleButton.style.transition;
    this.toggleButton.style.transition = 'none';

    // Apply new background color
    this.toggleButton.style.setProperty('background-color', newColor, 'important');
    this.toggleButton.style.color = newTextColor;
    this.toggleButton.setAttribute('title', this.isExtensionVisible ? 'Hide Conversation Tree' : 'Show Conversation Tree');

    // Force a reflow to ensure the color change is applied
    this.toggleButton.offsetHeight;

    // Restore transition after a brief delay
    setTimeout(() => {
      this.toggleButton.style.transition = originalTransition || 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 10);

    console.log('Updated toggle button color to:', this.isExtensionVisible ? 'black (#000000)' : 'transparent');
  }

  createOverlay() {
    console.log('Creating overlay...');

    // Remove any existing overlay
    const existing = document.getElementById('conversation-tree-overlay');
    if (existing) {
      existing.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'conversation-tree-overlay';
    this.overlay.innerHTML = `
      <button class="minimize-btn" title="Drag handle" aria-label="Drag handle">☰</button>
      <div class="tree-container">
        <svg class="tree-svg">
          <!-- Tree will be drawn here -->
        </svg>
      </div>
      
      <!-- Resize handles (all four edges) -->
      <div class="resize-handle n"></div>
      <div class="resize-handle s"></div>
      <div class="resize-handle e"></div>
      <div class="resize-handle w"></div>
    `;

    document.body.appendChild(this.overlay);
    console.log('Overlay added to DOM:', this.overlay);

    // Show extension by default
    this.overlay.style.display = 'flex';
    this.isExtensionVisible = true;
    // Promote overlay to its own layer for smooth transforms
    this.overlay.style.willChange = 'transform';
    this.overlay.style.transform = 'translateZ(0)';

    // Make the overlay draggable
    this.makeDraggable();

    // Make the overlay resizable
    this.makeResizable();

    // Set a default position and size to prevent it from being off-screen
    Object.assign(this.overlay.style, {
      top: '0px',
      left: '0px',
      width: '25vw',
      height: '25vh',
      display: 'flex',
      transform: 'none'
    });

    // Load saved size and position
    this.loadSavedSize();

    this.renderTree();
  }



  makeDraggable() {
    const header = this.overlay.querySelector('.minimize-btn');
    if (!header) {
      console.error('Drag handle not found!');
      return;
    }

    let isDragging = false;
    // Global flag to block tree/DOM updates during drag
    this.isDragging = false;
    let initialX, initialY;
    
    // Cached values to avoid repeated DOM queries during drag
    let cachedViewportWidth, cachedViewportHeight, cachedOverlayWidth, cachedOverlayHeight;
    let cachedMinX, cachedMaxX, cachedMinY, cachedMaxY; // Pre-calculated boundaries

    const getTransform = () => {
      const style = window.getComputedStyle(this.overlay);
      const matrix = new DOMMatrix(style.transform);
      return { x: matrix.m41, y: matrix.m42 };
    };

    // Set initial position from saved data or default to top-right.
    const savedPosition = localStorage.getItem(`chatgpt_tree_position_${this.conversationId}`);
    let startX = 0;
    let startY = 50; // Default top padding

    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        startX = pos.x;
        startY = pos.y;
      } catch (e) {
        console.error("Failed to parse saved position", e);
        const rect = this.overlay.getBoundingClientRect();
        startX = window.innerWidth - rect.width - 50; // Default right padding
      }
    } else {
        const rect = this.overlay.getBoundingClientRect();
        startX = window.innerWidth - rect.width - 50; // Default right padding
    }
    this.overlay.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;


    const dragStart = (e) => {
      isDragging = true;
      this.isDragging = true;
      // Cancel any pending DOM update or streaming end timers
      clearTimeout(this.updateTimeout);
      clearTimeout(this.streamingEndTimeout);
      
      // Temporarily disable observers during drag to prevent interference
      this.pauseObservers();
      
      const currentPos = getTransform();
      initialX = e.clientX - currentPos.x;
      initialY = e.clientY - currentPos.y;

      // Cache dimensions and pre-calculate boundaries once
      const rect = this.overlay.getBoundingClientRect();
      cachedViewportWidth = document.documentElement.clientWidth;
      cachedViewportHeight = document.documentElement.clientHeight;
      cachedOverlayWidth = rect.width;
      cachedOverlayHeight = rect.height;
      
      // Pre-calculate all boundary values to avoid Math.max/min during drag
      const padding = 20;
      cachedMinX = padding;
      cachedMinY = padding;
      cachedMaxX = cachedViewportWidth - cachedOverlayWidth - padding;
      cachedMaxY = cachedViewportHeight - cachedOverlayHeight - padding;

      this.overlay.style.transition = 'none';
      header.style.cursor = 'grabbing';
      
      // Add high-performance styles during drag
      this.overlay.style.willChange = 'transform';
      this.overlay.style.pointerEvents = 'none'; // Prevent hover effects during drag
      
      e.preventDefault();
    };

    const drag = (e) => {
      if (!isDragging) return;

      // Direct calculation and immediate update for responsive dragging
      const newX = e.clientX - initialX;
      const newY = e.clientY - initialY;

      // Apply boundary constraints directly
      const constrainedX = newX < cachedMinX ? cachedMinX : 
                          newX > cachedMaxX ? cachedMaxX : newX;
      const constrainedY = newY < cachedMinY ? cachedMinY : 
                          newY > cachedMaxY ? cachedMaxY : newY;
      
      // Immediate DOM update without requestAnimationFrame
      this.overlay.style.transform = `translate3d(${constrainedX}px, ${constrainedY}px, 0)`;
    };

    const dragEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      this.isDragging = false;
      // After drag, trigger final DOM extraction (lighter than full render with logs)
      setTimeout(() => this.extractConversationFromDOM(), 0);
      
      // Re-enable observers
      this.resumeObservers();
      
      header.style.cursor = 'grab';
      this.overlay.style.transition = '';
      
      // Remove high-performance styles
      this.overlay.style.willChange = 'auto';
      this.overlay.style.pointerEvents = 'auto';

      const finalPos = getTransform();
      localStorage.setItem(`chatgpt_tree_position_${this.conversationId}`, JSON.stringify({ x: finalPos.x, y: finalPos.y }));
    };

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    header.style.cursor = 'grab';
  }

  // Helper methods to pause/resume observers during drag for better performance
  pauseObservers() {
    this.observerPaused = true;
  }

  resumeObservers() {
    this.observerPaused = false;
  }

  makeResizable() {
    const handles = this.overlay.querySelectorAll('.resize-handle');
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startTransform;

    // Flags that tell which edges are being resized
    let dragNorth = false, dragSouth = false, dragEast = false, dragWest = false;

    const startResize = (e) => {
      if (e.target.closest('button')) return;
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.overlay.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      startTransform = new DOMMatrix(window.getComputedStyle(this.overlay).transform);

      this.overlay.style.transition = 'none';
      document.body.style.userSelect = 'none';

      // Capture which directions this particular handle controls
      const cls = e.target.classList;
      dragNorth = cls.contains('n');
      dragSouth = cls.contains('s');
      dragEast = cls.contains('e');
      dragWest = cls.contains('w');

      document.addEventListener('mousemove', doResize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
    };

    const doResize = (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startTransform.m41;
      let newY = startTransform.m42;

      if (dragEast) newWidth = startWidth + deltaX;
      if (dragWest) {
        newWidth = startWidth - deltaX;
        newX = startTransform.m41 + deltaX;
      }
      if (dragSouth) newHeight = startHeight + deltaY;
      if (dragNorth) {
        newHeight = startHeight - deltaY;
        newY = startTransform.m42 + deltaY;
      }

      const padding = 50;
      const minWidth = 250;
      const minHeight = 200;
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;

      if (newWidth < minWidth) {
        if (dragWest) newX += newWidth - minWidth;
        newWidth = minWidth;
      }
      if (newHeight < minHeight) {
        if (dragNorth) newY += newHeight - minHeight;
        newHeight = minHeight;
      }

      // Clamp position
      newX = Math.max(padding, newX);
      newY = Math.max(padding, newY);
      
      if (newX + newWidth > viewportWidth - padding) {
        newWidth = viewportWidth - padding - newX;
      }
      if (newY + newHeight > viewportHeight - padding) {
        newHeight = viewportHeight - padding - newY;
      }

      this.overlay.style.width = `${newWidth}px`;
      this.overlay.style.height = `${newHeight}px`;
      this.overlay.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      this.updateTreeContainerHeight(newHeight);
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      dragNorth = dragSouth = dragEast = dragWest = false;

      document.body.style.userSelect = '';
      this.overlay.style.transition = '';

      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);

      const finalRect = this.overlay.getBoundingClientRect();
      const finalTransform = new DOMMatrix(window.getComputedStyle(this.overlay).transform);
      localStorage.setItem(`chatgpt_tree_size_${this.conversationId}`, JSON.stringify({ width: finalRect.width, height: finalRect.height }));
      localStorage.setItem(`chatgpt_tree_position_${this.conversationId}`, JSON.stringify({ x: finalTransform.m41, y: finalTransform.m42 }));
      this.renderTree();
    };

    handles.forEach(handle => {
      handle.addEventListener('mousedown', startResize);
    });
  }

  scrollToMessage(node, depth) {
    console.log(`Scrolling to message at depth ${depth}:`, node);

    // Allow node to be null when we just want to scroll by depth after navigation
    if (node == null) {
      node = { content: `Depth ${depth}` };
    }

    try {
      // Find all user messages in the conversation
      const userMessages = document.querySelectorAll('[data-message-author-role="user"]');

      if (userMessages.length > depth && userMessages[depth]) {
        const targetMessage = userMessages[depth];

        // Smooth scroll to the message
        targetMessage.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });

        console.log(`Scrolled to message ${depth + 1}`);
      } else {
        console.log(`Message at depth ${depth} not found. Available messages: ${userMessages.length}`);

        // Fallback: scroll to the closest available message
        if (userMessages.length > 0) {
          const fallbackIndex = Math.min(depth, userMessages.length - 1);
          userMessages[fallbackIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
          console.log(`Scrolled to fallback message ${fallbackIndex + 1}`);
        }
      }
    } catch (error) {
      console.error('Error scrolling to message:', error);
    }
  }

  addTooltip(element, node) {
    let hoverTimeout;

    // Use a 100ms debounce for tooltip creation (increased from 50ms)
    element.addEventListener('mouseenter', () => {
      // Clear any existing timeout
      clearTimeout(hoverTimeout);
      
      // Show tooltip after 100ms debounce to reduce creation frequency
      hoverTimeout = setTimeout(() => {
        this.showTooltip(node, element);
      }, 100);
    });

    element.addEventListener('mouseleave', () => {
      // Clear timeout and hide tooltip immediately
      clearTimeout(hoverTimeout);
      this.hideTooltip();
    });
  }

  showTooltip(node, circleElement) {
    // Remove any existing tooltip
    this.hideTooltip();

    // Reuse existing tooltip element or create new one (tooltip pooling)
    if (!this.tooltipElement) {
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.className = 'node-tooltip';
    }
    
    const tooltip = this.tooltipElement;
    
    // Update content only if it changed
    if (tooltip.textContent !== node.content) {
    tooltip.textContent = node.content;
    }

    // Get the circle's actual position and the container's position
    const circleRect = circleElement.getBoundingClientRect();
    const treeContainer = this.overlay.querySelector('.tree-container');
    const containerRect = treeContainer.getBoundingClientRect();

    // Account for container scroll position
    const scrollLeft = treeContainer.scrollLeft;
    const scrollTop = treeContainer.scrollTop;

    // Calculate position relative to container content (including scroll offset)
    const tooltipX = circleRect.right - containerRect.left + scrollLeft + 10; // Right of circle + 10px gap
    const tooltipY = circleRect.top - containerRect.top + scrollTop + (circleRect.height / 2) - 10; // Center of circle

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;

    // Add to tree container
    treeContainer.appendChild(tooltip);

    // Store reference for cleanup
    this.currentTooltip = tooltip;

    console.log(`Tooltip positioned at: ${tooltipX}, ${tooltipY} (scroll: ${scrollLeft}, ${scrollTop}, circle: ${circleRect.right}, ${circleRect.top})`);
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  updateTreeContainerHeight(overlayHeight) {
    const treeContainer = this.overlay.querySelector('.tree-container');
    if (treeContainer) {
      // Don't force the tree to fit container - let it scroll instead
      treeContainer.style.maxHeight = `${overlayHeight}px`;
      // Removed: treeContainer.style.height = `${containerHeight}px`; - this was forcing shrinking
      console.log(`Updated tree container max-height to: ${overlayHeight}px (tree will scroll if needed)`);
    }
  }

  loadSavedSize() {
    const savedSize = localStorage.getItem(`chatgpt_tree_size_${this.conversationId}`);
    if (savedSize) {
      try {
        const size = JSON.parse(savedSize);
        if (size.width && size.height && size.width > 0 && size.height > 0) {
          this.overlay.style.width = `${size.width}px`;
          this.overlay.style.height = `${size.height}px`;

          // Update tree container height
          this.updateTreeContainerHeight(size.height);

          console.log('Restored size:', size);
        }
      } catch (e) {
        console.log('Error restoring size:', e);
      }
    } else {
      // Set default size
      this.overlay.style.width = '25vw';
      this.overlay.style.height = '25vh';
      // Set initial height for tree container
      setTimeout(() => {
        const currentHeight = this.overlay.offsetHeight;
        this.updateTreeContainerHeight(currentHeight);
      }, 100);
    }
  }





  interceptNetworkCalls() {
    // Intercept fetch calls to monitor ChatGPT API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Check if this is a ChatGPT conversation API call
      const url = args[0];
      if (url && typeof url === 'string') {
        const isConversationCall = url.includes('/conversation') ||
          url.includes('/backend-api') ||
          url.includes('/moderations') ||
          url.includes('/chat');

        if (isConversationCall) {
          console.log('ChatGPT API call detected:', url);

          // Clone response to read it without consuming the original
          const clonedResponse = response.clone();
          try {
            const text = await clonedResponse.text();

            // Handle streaming responses (ChatGPT uses Server-Sent Events)
            if (text.includes('data: ')) {
              this.processStreamingResponse(text);
            } else {
              try {
                const data = JSON.parse(text);
                this.processApiResponse(data);
              } catch (e) {
                console.log('Non-JSON response:', text.substring(0, 200));
              }
            }
          } catch (e) {
            console.log('Could not parse API response:', e);
          }
        }
      }

      return response;
    };

    // Also intercept XMLHttpRequest for older API calls
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;

      xhr.open = function (method, url, ...args) {
        this._url = url;
        return originalOpen.apply(this, [method, url, ...args]);
      };

      xhr.send = function (...args) {
        this.addEventListener('load', () => {
          if (this._url && (this._url.includes('/conversation') || this._url.includes('/backend-api'))) {
            console.log('XHR ChatGPT API call:', this._url);
            try {
              const data = JSON.parse(this.responseText);
              window.chatGPTTreeTracker?.processApiResponse(data);
            } catch (e) {
              console.log('Could not parse XHR response:', e);
            }
          }
        });
        return originalSend.apply(this, args);
      };

      return xhr;
    };
  }

  processApiResponse(data) {
    console.log('Processing API response:', data);

    // Look for conversation structure in various response formats
    if (data.conversation && data.conversation.mapping) {
      console.log('Found conversation mapping in response');
      this.updateTreeFromMapping(data.conversation.mapping);
    } else if (data.mapping) {
      console.log('Found direct mapping in response');
      this.updateTreeFromMapping(data.mapping);
    } else if (data.message && data.message.id) {
      console.log('Found single message in response');
      this.handleSingleMessage(data.message);
    } else {
      console.log('No recognizable conversation structure found');
      // Fallback to DOM extraction
      this.extractConversationFromDOM();
    }
  }

  processStreamingResponse(text) {
    console.log('Processing streaming response');

    // Parse Server-Sent Events format
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const jsonStr = line.substring(6); // Remove 'data: '
          const data = JSON.parse(jsonStr);

          if (data.message || data.conversation_id) {
            console.log('Found message in streaming data:', data);
            this.processApiResponse(data);
          }
        } catch (e) {
          // Ignore parsing errors for streaming data
        }
      }
    }
  }

  handleSingleMessage(message) {
    console.log('Handling single message:', message);

    // Add or update message in our tree
    if (message.author && message.author.role === 'user') {
      const existingIndex = this.conversationTree.nodes.findIndex(n => n.id === message.id);

      if (existingIndex === -1) {
        // New message
        const depth = this.conversationTree.nodes.length;
        const newNode = {
          id: message.id,
          depth: depth,
          branchIndex: 0,
          content: message.content?.parts?.[0] || 'New message'
        };

        this.conversationTree.nodes.push(newNode);
        this.saveData();
        this.renderTree();
        console.log('Added new message node:', newNode);
      }
    }
  }

  updateTreeFromMapping(mapping) {
    console.log('Updating tree from mapping:', mapping);
    console.log('Mapping keys:', Object.keys(mapping));

    const userNodes = [];
    const allNodes = new Map();

    // First pass: collect all nodes and identify user messages
    Object.entries(mapping).forEach(([id, node]) => {
      allNodes.set(id, node);

      if (node.message && node.message.author && node.message.author.role === 'user') {
        const content = node.message.content?.parts?.[0] || 'User message';
        console.log(`Found user message: ${id} -> "${content.substring(0, 50)}"`);

        userNodes.push({
          id: id,
          parentId: node.parent,
          content: content,
          depth: 0,
          branchIndex: 0,
          children: []
        });
      }
    });

    console.log(`Found ${userNodes.length} user messages`);

    if (userNodes.length === 0) {
      console.log('No user messages found in mapping, falling back to DOM');
      this.extractConversationFromDOM();
      return;
    }

    // Calculate the tree structure
    this.buildTreeStructure(userNodes, allNodes);

    // Update the tree and render
    this.conversationTree.nodes = userNodes;
    this.saveData();
    this.renderTree();

    console.log('Final tree structure:', userNodes);
  }

  buildTreeStructure(userNodes, allNodes) {
    console.log('Building tree structure...');

    // Create a map for quick lookup
    const nodeMap = new Map();
    userNodes.forEach(node => nodeMap.set(node.id, node));

    // Calculate depth for each user message by traversing up the parent chain
    userNodes.forEach(node => {
      let depth = 0;
      let currentId = node.parentId;
      const visited = new Set();

      // Traverse up the parent chain, counting user messages
      while (currentId && allNodes.has(currentId) && !visited.has(currentId)) {
        visited.add(currentId);
        const parentNode = allNodes.get(currentId);

        // If parent is a user message, increment depth
        if (parentNode.message && parentNode.message.author &&
          parentNode.message.author.role === 'user') {
          depth++;
        }

        currentId = parentNode.parent;
      }

      node.depth = depth;
      console.log(`Node ${node.id} has depth ${depth}`);
    });

    // Group nodes by depth to identify branches
    const depthGroups = new Map();
    userNodes.forEach(node => {
      if (!depthGroups.has(node.depth)) {
        depthGroups.set(node.depth, []);
      }
      depthGroups.get(node.depth).push(node);
    });

    // Assign branch indices for nodes at the same depth
    depthGroups.forEach((nodesAtDepth, depth) => {
      console.log(`Depth ${depth} has ${nodesAtDepth.length} nodes`);
      nodesAtDepth.forEach((node, index) => {
        node.branchIndex = index;
      });
    });

    console.log('Depth groups:', Array.from(depthGroups.entries()));
  }

  calculateTreeStructure(nodes, mapping) {
    // Build parent-child relationships and calculate depths
    const nodeMap = new Map();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Calculate depth for each node
    nodes.forEach(node => {
      let depth = 0;
      let currentId = node.parentId;

      while (currentId && mapping[currentId]) {
        depth++;
        currentId = mapping[currentId].parent;
      }

      node.depth = Math.floor(depth / 2); // Divide by 2 since user/assistant alternate
    });

    // Group nodes by depth to identify branches
    const depthGroups = new Map();
    nodes.forEach(node => {
      if (!depthGroups.has(node.depth)) {
        depthGroups.set(node.depth, []);
      }
      depthGroups.get(node.depth).push(node);
    });

    // Assign branch indices
    depthGroups.forEach((nodesAtDepth, depth) => {
      nodesAtDepth.forEach((node, index) => {
        node.branchIndex = index;
      });
    });
  }

  observeConversation() {
    // Watch for DOM changes to detect new messages and branch changes
    const observer = new MutationObserver((mutations) => {
      // Skip processing entirely if observers are paused or dragging
      if (this.observerPaused || this.isDragging) {
        return;
      }

      // Skip processing entirely if streaming
      const isStreaming = document.querySelector('[data-streaming="true"]');
      if (isStreaming) {
        // Set up a single check for when streaming ends if not already set
        if (!this.streamingEndTimeout) {
          this.streamingEndTimeout = setTimeout(() => {
            this.checkStreamingEnd();
          }, 1000);
        }
        return;
      }

      let shouldUpdate = false;

      try {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Be more selective - only check for specific important changes
                try {
                  if (node.querySelector && (
                    node.querySelector('[data-message-author-role="user"]') ||
                    node.querySelector('[class*="tabular-nums"]') // Branch indicators
                  )) {
                    shouldUpdate = true;
                  }
                } catch (e) {
                  console.log('Error in querySelector:', e);
                  // If querySelector fails, still check for user messages by class/attribute
                  if (node.getAttribute && node.getAttribute('data-message-author-role') === 'user') {
                    shouldUpdate = true;
                  }
                }
              }
            });
          } else if (mutation.type === 'attributes') {
            // Only watch for specific button state changes
            if (mutation.target.tagName === 'BUTTON' &&
              (mutation.attributeName === 'disabled' || mutation.attributeName === 'aria-disabled') &&
              (mutation.target.getAttribute('aria-label')?.includes('Previous response') ||
               mutation.target.getAttribute('aria-label')?.includes('Next response'))) {
              shouldUpdate = true;
            }
          }
        });
      } catch (e) {
        console.log('Error in MutationObserver:', e);
        shouldUpdate = true; // Force update if there's an error
      }

      if (shouldUpdate) {
        console.log('DOM changes detected, updating tree...');
        // Debounce updates to avoid too frequent re-renders
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          this.extractConversationFromDOM();
        }, 500);
      }

    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled']
    });
  }

  checkStreamingEnd() {
    const stillStreaming = document.querySelector('[data-streaming="true"]');
    if (!stillStreaming) {
      console.log('Streaming ended, updating tree now');
      this.streamingEndTimeout = null;
      this.extractConversationFromDOM();
    } else {
      // Still streaming, check again in a moment
      this.streamingEndTimeout = setTimeout(() => {
        this.checkStreamingEnd();
      }, 500);
    }
  }

  checkForNewMessages() {
    // Simple fallback: count user messages in DOM
    const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
    const currentCount = userMessages.length;

    if (currentCount > this.conversationTree.nodes.length) {
      console.log('New message detected, updating tree');
      // Add simple linear nodes if API interception didn't work
      this.addSimpleNode(currentCount - 1);
    }
  }

  addSimpleNode(depth) {
    const node = {
      id: `simple_${Date.now()}`,
      parentId: null,
      content: `Message ${depth + 1}`,
      depth: depth,
      branchIndex: 0
    };

    this.conversationTree.nodes.push(node);
    this.saveData();
    this.renderTree();
  }

  loadExistingConversation() {
    // Try to extract conversation data from the current page
    console.log('Attempting to load existing conversation...');

    // Look for conversation data in the page
    setTimeout(() => {
      console.log('Loading existing conversation after delay...');
      this.extractConversationFromDOM();
    }, 2000);

    // Also set up periodic checks to ensure we catch updates
    this.setupPeriodicCheck();
  }

  setupPeriodicCheck() {
    // Initialize with current message count
    const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
    this.lastMessageCount = userMessages.length;
    console.log(`Initial message count: ${this.lastMessageCount}`);

    // Check for conversation updates every 3 seconds
    setInterval(() => {
      const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
      const currentCount = userMessages.length;

      if (currentCount !== this.lastMessageCount) {
        console.log(`Message count changed: ${this.lastMessageCount} -> ${currentCount}`);
        this.lastMessageCount = currentCount;
        this.extractConversationFromDOM();
      }
    }, 3000);
  }

  extractConversationFromDOM() {
    console.log('=== Extracting conversation from DOM ===');

    // Find all user messages in the current conversation
    const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
    console.log(`Found ${userMessages.length} user messages in DOM`);

    if (userMessages.length === 0) {
      console.log('No user messages found, checking alternative selectors...');
      // Try alternative selectors
      const altMessages = document.querySelectorAll('[role="presentation"]');
      console.log(`Found ${altMessages.length} potential message containers`);
    }

    if (userMessages.length > 0) {
      const nodes = [];

      userMessages.forEach((msg, index) => {
        const content = msg.textContent?.trim() || `Message ${index + 1}`;

        // Look for branch navigation arrows in this message
        const branchInfo = this.detectBranchesInMessage(msg, index);

        // If this message has branches, create multiple nodes
        if (branchInfo.totalBranches > 1) {
          console.log(`✓ Message ${index} has ${branchInfo.totalBranches} branches, current: ${branchInfo.currentBranch + 1}`);
          console.log(`  Branch text: "${branchInfo.branchText}", Arrows: L:${branchInfo.hasLeftArrow} R:${branchInfo.hasRightArrow}`);

          // Use the branches array from the enhanced branch detection
          branchInfo.branches.forEach((branch) => {
            let nodeContent;
            if (branch.isCurrentBranch) {
              // Current branch: show actual message content
              nodeContent = content.substring(0, 50) + (content.length > 50 ? '...' : '');
            } else {
              // Other branches: show placeholder with branch number
              nodeContent = branch.label; // This will be "Branch 1", "Branch 3", etc.
            }

            nodes.push({
              id: `dom_${index}_branch_${branch.branchIndex}`,
              depth: index,
              branchIndex: branch.branchIndex,
              branchNumber: branch.branchNumber,
              content: nodeContent,
              isCurrentBranch: branch.isCurrentBranch,
              isPlaceholder: !branch.isCurrentBranch,
              totalBranches: branchInfo.totalBranches,
              messageElement: branch.messageElement, // Store reference for navigation
              branchInfo: branchInfo // Store full branch info for debugging
            });
          });
        } else {
          // Single node (no branching)
          console.log(`- Message ${index}: No branches detected`);
          nodes.push({
            id: `dom_${index}`,
            depth: index,
            branchIndex: 0,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            isCurrentBranch: true,
            isPlaceholder: false,
            totalBranches: 1
          });
        }
      });

      // Sort nodes to ensure proper left-to-right branch ordering
      // First by depth, then by branchIndex for consistent branch positioning
      nodes.sort((a, b) => {
        if (a.depth !== b.depth) {
          return a.depth - b.depth; // Sort by depth first
        }
        return a.branchIndex - b.branchIndex; // Then by branch index for left-to-right ordering
      });

      // Build parent-child relationships
      const nodeMap = new Map();
      nodes.forEach(node => nodeMap.set(node.id, node));
      
      console.log('=== DEBUG: Node structure before parent assignment ===');
      nodes.forEach(node => {
        console.log(`Node ${node.id}: depth=${node.depth}, branchIndex=${node.branchIndex}, isCurrentBranch=${node.isCurrentBranch}`);
      });
      
      // Set parentId for each node based on depth and branching
      nodes.forEach(node => {
        if (node.depth === 0) {
          node.parentId = null; // Root has no parent
        } else {
          // Find the correct parent based on branching structure
          const nodesAtPrevDepth = nodes.filter(n => n.depth === node.depth - 1);
          if (nodesAtPrevDepth.length > 0) {
            // Assign parent based on current branch context
            // If this node is part of the current branch, find the current branch parent
            // If not, assign to the first available parent (fallback)
            let parentNode;
            if (node.isCurrentBranch) {
              // Find the current branch parent at previous depth
              parentNode = nodesAtPrevDepth.find(n => n.isCurrentBranch);
            }
            if (!parentNode) {
              // Fallback: assign to first parent at previous depth
              parentNode = nodesAtPrevDepth[0];
            }
            node.parentId = parentNode.id;
            console.log(`Assigned ${node.id} to parent ${parentNode.id} (isCurrentBranch=${node.isCurrentBranch})`);
          } else {
            node.parentId = null; // Fallback
          }
        }
      });

      this.conversationTree.nodes = nodes;
      this.saveData();
      this.renderTree();
      console.log('Created tree from DOM with branching:', nodes);
    } else {
      // Show empty state
      this.renderTree();
    }
  }

  detectBranchesInMessage(messageElement, messageIndex) {
    console.log(`=== Analyzing message ${messageIndex} for branches ===`);

    // 1. Locate the enclosing article
    const turnArticle = messageElement.closest('[data-testid^="conversation-turn"]') ||
      messageElement;

    // 2. Find navigation buttons inside that article
    const prevButton = turnArticle.querySelector('button[aria-label="Previous response"]');
    const nextButton = turnArticle.querySelector('button[aria-label="Next response"]');

    console.log(`Previous button found: ${!!prevButton}, Next button found: ${!!nextButton}`);

    // If we don't find the specific labels, try broader patterns
    let leftArrow = prevButton || turnArticle.querySelector('button[aria-label*="Previous"]');
    let rightArrow = nextButton || turnArticle.querySelector('button[aria-label*="Next"]');

    // Check button states
    const leftDisabled = leftArrow && (leftArrow.disabled || leftArrow.getAttribute('aria-disabled') === 'true');
    const rightDisabled = rightArrow && (rightArrow.disabled || rightArrow.getAttribute('aria-disabled') === 'true');

    console.log(`Left disabled: ${leftDisabled}, Right disabled: ${rightDisabled}`);

    // Look for branch indicator text (like "2/3") in the message container
    let branchText = '';
    let currentBranch = 0;
    let totalBranches = 1;

      // If we have navigation buttons, look for the numerical indicator
    // Prefer explicit branch-indicator element (e.g. <div class="tabular-nums">2/3</div>) if present
    let indicatorEl = turnArticle.querySelector('[class*="tabular-nums"]');
    console.log('Indicator element:', indicatorEl);
    const textContent = indicatorEl ? indicatorEl.textContent.trim() : (turnArticle.textContent || '');
      const branchMatch = textContent.match(/(\d+)\s*\/\s*(\d+)/);

      if (branchMatch) {
        branchText = branchMatch[0];
        currentBranch = parseInt(branchMatch[1]) - 1; // Convert to 0-based index
        totalBranches = parseInt(branchMatch[2]);
        console.log(`Found branch indicator: ${branchText} -> Current: ${currentBranch}, Total: ${totalBranches}`);
    } else if (leftArrow || rightArrow) {
      // Arrows present but no numeric indicator: infer from button states
        totalBranches = 2; // Minimum assumption

        if (leftDisabled && !rightDisabled) {
          currentBranch = 0; // First branch
        } else if (!leftDisabled && rightDisabled) {
          currentBranch = 1; // Assume second branch (could be last)
        } else if (!leftDisabled && !rightDisabled) {
          currentBranch = 1; // Middle branch
          totalBranches = 3; // Minimum for middle position
        } else {
          currentBranch = 0; // Default
        }

        console.log(`No text indicator, inferred from button states: Current: ${currentBranch}, Total: ${totalBranches}`);
    } else {
      // No arrows and no numeric indicator => single branch
      currentBranch = 0;
      totalBranches = 1;
    }


    // Additional validation: look for copy/edit buttons to confirm this is a user message
    const hasCopyButton = !!messageElement.querySelector('[data-testid="copy-turn-action-button"]');
    const hasEditButton = !!messageElement.querySelector('[aria-label*="Edit"]');

    console.log(`Copy button: ${hasCopyButton}, Edit button: ${hasEditButton}`);
    console.log(`Final result - Message ${messageIndex}: ${totalBranches} branches, current: ${currentBranch}`);

    // Create branch information for ALL branches at this depth
    const branches = [];
    for (let branchIndex = 0; branchIndex < totalBranches; branchIndex++) {
      const isCurrentBranch = branchIndex === currentBranch;
      branches.push({
        branchNumber: branchIndex + 1,        // 1-based branch number for display
        branchIndex: branchIndex,             // 0-based index for logic
        isCurrentBranch: isCurrentBranch,
        label: isCurrentBranch ? null : `Branch ${branchIndex + 1}`, // Placeholder label for non-current branches
        messageElement: messageElement        // Reference to DOM element for navigation
      });
    }

    console.log(
      `Message ${messageIndex} indicator: "${branchText}" -> total=${totalBranches}`
    );

    return {
      currentBranch,
      totalBranches,
      hasLeftArrow: !!leftArrow,
      hasRightArrow: !!rightArrow,
      branchText,
      leftDisabled,
      rightDisabled,
      hasCopyButton,
      hasEditButton,
      branches // Add the branches array
    };
  }

  // Navigation function to switch between branches
  navigateToBranch(messageElement, targetBranchIndex, currentBranchIndex, depthToScroll) {
    // --- Robustness patch ---
    // When the tree is restored from localStorage the stored messageElement is
    // no longer a live HTMLElement (JSON lost the prototype).  If so, try to
    // re-query the current DOM to find the user message at the given depth.
    if (!(messageElement instanceof Element) || typeof messageElement.closest !== 'function') {
      const userMsgs = document.querySelectorAll('[data-message-author-role="user"]');
      if (typeof depthToScroll === 'number' && depthToScroll < userMsgs.length) {
        console.warn('[nav] recovered messageElement from fresh DOM query');
        messageElement = userMsgs[depthToScroll];
      }
    }
    console.log(`=== Navigating from branch ${currentBranchIndex} to branch ${targetBranchIndex} ===`);

    if (!messageElement) {
      console.error('No message element provided for navigation');
      return false;
    }

    // Identify the unique conversation turn via its data-testid so we can re-locate it
    const originalArticle = messageElement.closest('[data-testid^="conversation-turn"]') || messageElement;
    if (!originalArticle) {
      console.error('Unable to locate conversation-turn article for navigation');
      return false;
    }

    const dataTestId = originalArticle.getAttribute('data-testid');
    if (!dataTestId) {
      console.error('No data-testid found for the conversation turn');
      return false;
    }

    const targetBranch = targetBranchIndex;

    // Helper: fetch the *current* article corresponding to this turn number
    const getCurrentArticle = () => document.querySelector(`[data-testid="${dataTestId}"]`);

    // Helper: read the numerical branch indicator inside an article
    const readBranchIndicator = (articleEl) => {
      if (!articleEl) return null;
      const indicatorEl = articleEl.querySelector('[class*="tabular-nums"]');
      if (!indicatorEl) return null;
      const match = indicatorEl.textContent.trim().match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return null;
      return {
        current: parseInt(match[1], 10) - 1, // convert to 0-based index
        total: parseInt(match[2], 10)
      };
    };

    const pollInterval = 200; // ms
    let attempts = 0;
    const maxAttempts = 60; // 12 seconds safeguard

    const step = () => {
      // ---- debug logging ----
      console.log(
        `[nav] attempt #${attempts}`,
        {
          targetBranch,
          articleExists: !!getCurrentArticle(),
          indicator: readBranchIndicator(getCurrentArticle()),
        }
      );
      attempts++;
      if (attempts > maxAttempts) {
        console.warn('Navigation aborted – too many attempts');
        return;
      }

      const article = getCurrentArticle();
      const indicator = readBranchIndicator(article);

      if (indicator && indicator.current === targetBranch) {
        console.log(`[nav] reached target ${targetBranch}, stopping`);
        console.log(`Reached target branch ${targetBranch}`);
        // Give UI a moment to settle, then rebuild the tree
        setTimeout(() => {
          this.extractConversationFromDOM();
          // After DOM extraction, scroll to the user message at the intended depth
          if (typeof depthToScroll === 'number') {
            this.scrollToMessage(null, depthToScroll);
          }
        }, 300);
        return;
      }

      // Decide direction based on latest indicator if available; fallback to original
      let goForward;
      if (indicator) {
        goForward = targetBranch > indicator.current;
      } else {
        goForward = targetBranch > currentBranchIndex;
      }

      const buttonSelector = goForward ? 'button[aria-label="Next response"]' : 'button[aria-label="Previous response"]';
      const button = article ? article.querySelector(buttonSelector) : null;

      console.log(
        `[nav] goForward=${goForward}`,
        {
          buttonExists: !!button,
          disabled: button && (button.disabled || button.getAttribute('aria-disabled') === 'true'),
        }
      );

      if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') {
        console.log('[nav] clicking arrow');
        console.log('Clicking navigation arrow');
        button.click();
      } else {
        console.log('[nav] arrow not ready, will retry');
        console.log('Arrow button not ready or disabled, will retry');
      }

      // Schedule next poll/click
      setTimeout(step, pollInterval);
    };

    // Kick-off the polling loop
    step();
    return true;
  }

  renderTree() {
    if (!this.overlay) return;

    const svg = this.overlay.querySelector('.tree-svg');
    const container = this.overlay.querySelector('.tree-container');
    
    // --- Cleanup: always start with a fresh SVG (keep <defs> only) ---
    {
      const defsEl = svg.querySelector('defs');
      svg.innerHTML = '';
      if (defsEl) svg.appendChild(defsEl);
    }

    // Check if ChatGPT is currently streaming to avoid updates during streaming
    const isStreaming = document.querySelector('[data-streaming="true"]');
    if (isStreaming) {
      console.log('Skipping tree render during streaming');
      return;
    }

    // Clear existing elements only if we have no nodes
    if (this.conversationTree.nodes.length === 0) {
      // Keep only the defs element if it exists
      const defs = svg.querySelector('defs');
      svg.innerHTML = '';
      if (defs) svg.appendChild(defs);
      
      // Add empty state message
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '50%');
      text.setAttribute('y', '50%');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#888');
      text.setAttribute('font-size', '18');
      text.setAttribute('font-family', 'system-ui');
      text.textContent = 'Start a conversation to see the tree';
      svg.appendChild(text);
      return;
    }

    // Enhanced styling constants
    const nodeRadius = 22;
    const verticalSpacing = 90; // Increased from 70
    const horizontalSpacing = 80; // Increased from 50
    const containerWidth = container.offsetWidth || 300;
    const containerHeight = container.offsetHeight || 200;

    // Group nodes by depth
    const depthGroups = new Map();
    this.conversationTree.nodes.forEach(node => {
      if (!depthGroups.has(node.depth)) {
        depthGroups.set(node.depth, []);
      }
      depthGroups.get(node.depth).push(node);
    });

    // Calculate tree height for SVG sizing
    const maxDepth = Math.max(...Array.from(depthGroups.keys()));
    const treeHeight = (maxDepth + 1) * verticalSpacing + 80; // Add padding

    // Start position - we'll anchor everything relative to container center
    const startY = 40; // Fixed top padding

    // Calculate dynamic width based on maximum branches at any depth
    const maxBranchesAtAnyDepth = Math.max(...Array.from(depthGroups.values()).map(nodes => nodes.length));
    const requiredWidth = maxBranchesAtAnyDepth * horizontalSpacing + 200; // 200px padding on sides
    const MINIMUM_TREE_WIDTH = 300;
    // No maximum width - tree can grow as wide as needed
    const FIXED_TREE_WIDTH = Math.max(requiredWidth, MINIMUM_TREE_WIDTH);

    console.log(`Dynamic width: ${maxBranchesAtAnyDepth} branches → ${FIXED_TREE_WIDTH}px width`);

    // Phase 1: Use dynamic width, dynamic height based on tree structure
    const calculatedHeight = startY + (maxDepth + 1) * verticalSpacing + 80; // Dynamic calculation
    const MINIMUM_HEIGHT = 300;     // Minimum height for small trees
    const FIXED_TREE_HEIGHT = Math.max(calculatedHeight, MINIMUM_HEIGHT);  // Dynamic but keeps variable name

    // Set SVG height to accommodate all content
    svg.setAttribute('width', FIXED_TREE_WIDTH);
    svg.setAttribute('height', FIXED_TREE_HEIGHT);
    svg.setAttribute('viewBox', `0 0 ${FIXED_TREE_WIDTH} ${FIXED_TREE_HEIGHT}`);

    // Ensure defs exist (create once, reuse)
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = this.createSVGDefs();
    svg.appendChild(defs);
    }

    // Store node positions for connection drawing
    const nodePositions = new Map();
    
    // Create a map of node IDs to their visual elements
    const nodeElements = new Map();

    // Draw nodes and store positions with parent-centric layout
    // Build map of parentId -> children nodes
    const parentMap = new Map();
    console.log('=== DEBUG: Node data ===');
    this.conversationTree.nodes.forEach(n => {
      console.log(`Node ${n.id}: parentId=${n.parentId}, depth=${n.depth}`);
      const pid = n.parentId;
      if (!parentMap.has(pid)) parentMap.set(pid, []);
      parentMap.get(pid).push(n);
    });
    console.log('=== ParentMap ===');
    parentMap.forEach((children, parentId) => {
      console.log(`Parent ${parentId}: ${children.length} children`);
    });

    // Position root nodes (depth 0) evenly across the width
    const roots = depthGroups.get(0) || [];
    const rootCenterX = FIXED_TREE_WIDTH / 2;
    const y0 = startY;
    const count0 = roots.length;
    roots.forEach((node, idx) => {
      const x0 = rootCenterX + (idx - (count0 - 1) / 2) * horizontalSpacing;
      nodePositions.set(node.id, { x: x0, y: y0, depth: 0, branchIndex: idx });
      console.log(`Root node ${node.id}: x=${x0}, y=${y0}, centerX=${rootCenterX}`);
    });

    // Position other nodes based on their parent position
    depthGroups.forEach((nodes, depth) => {
      if (depth === 0) return; // already positioned roots
      const y = startY + depth * verticalSpacing;
      nodes.forEach(node => {
        const siblings = parentMap.get(node.parentId) || [];
        const idx = siblings.findIndex(sib => sib.id === node.id);
        const count = siblings.length;
        const parentPos = nodePositions.get(node.parentId) || { x: FIXED_TREE_WIDTH / 2, y: startY + (depth - 1) * verticalSpacing };
        const offset = (idx - (count - 1) / 2) * horizontalSpacing;
        const x = parentPos.x + offset;
        nodePositions.set(node.id, { x, y, depth, branchIndex: idx });
        
        // Debug logging
        console.log(`Node ${node.id} (depth ${depth}): parent=${node.parentId}, siblings=${count}, idx=${idx}, x=${x}, y=${y}`);
      });
    });

    // ---- Draw fresh circles/text for each node ----
    this.conversationTree.nodes.forEach(node => {
      const { x, y } = nodePositions.get(node.id);
      const depth = node.depth;

      // Determine if this is the current branch
      const isCurrentBranch = node.isCurrentBranch !== false;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', nodeRadius);
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('filter', 'url(#dropShadow)');
      
      // Set initial fill and stroke attributes for CSS hover to work
      // CSS will override these based on theme and state
      if (isCurrentBranch) {
        circle.setAttribute('fill', '#212121');
        circle.setAttribute('stroke', '#212121');
      } else {
        circle.setAttribute('fill', '#808080');
        circle.setAttribute('stroke', '#808080');
      }
      
      circle.classList.add('tree-node');
      
      // Add 'current' class for active branches to use CSS styling
      if (isCurrentBranch) {
        circle.classList.add('current');
      }
      
      // Add entrance animation class
      circle.classList.add('node-entering');
      
      circle.style.cursor = 'pointer';
      svg.appendChild(circle);

      circle.addEventListener('click', () => {
        if (node.isCurrentBranch === false && node.messageElement && node.branchInfo) {
          this.navigateToBranch(node.messageElement, node.branchIndex, node.branchInfo.currentBranch, depth);
        } else {
          this.scrollToMessage(node, depth);
        }
      });
      
      // Add proper SVG hover scaling without position shift
      circle.addEventListener('mouseenter', () => {
        const currentRadius = parseFloat(circle.getAttribute('r'));
        circle.style.transition = 'r 0.15s ease-out, stroke-width 0.15s ease-out';
        circle.setAttribute('r', currentRadius * 1.2);
      });
      
      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', nodeRadius);
      });
      
      this.addTooltip(circle, node);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '22');
      text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text.classList.add('tree-text');
      
      // Add 'current' class for active branch text styling
      if (isCurrentBranch) {
        text.classList.add('current');
      }
      
      // Add entrance animation class for text
      text.classList.add('text-entering');
      
      text.textContent = depth + 1;
      text.style.pointerEvents = 'none';
      svg.appendChild(text);

      nodeElements.set(node.id, { circle, text });
    });

    // Trigger entrance animations after all nodes are in the DOM
    setTimeout(() => {
      this.conversationTree.nodes.forEach(node => {
        const elements = nodeElements.get(node.id);
        if (elements && elements.circle) {
          elements.circle.classList.remove('node-entering');
        }
        if (elements && elements.text) {
          elements.text.classList.remove('text-entering');
        }
      });
    }, 10); // Small delay to ensure DOM is updated

    // Build connections based on actual parent relationships
    this.conversationTree.nodes.forEach(node => {
      if (!node.parentId) return; // root has no parent
      const parentPos = nodePositions.get(node.parentId);
      const nodePos   = nodePositions.get(node.id);
      if (!parentPos || !nodePos) return;

      const siblings = parentMap.get(node.parentId) || [];

      // Path geometry: branched vs single child
      let pathData;
      if (siblings.length > 1) {
        const controlOffset = Math.abs(nodePos.x - parentPos.x) * 0.3;
        pathData = `M ${parentPos.x} ${parentPos.y + nodeRadius}
                    C ${parentPos.x} ${parentPos.y + nodeRadius + controlOffset},
                      ${nodePos.x} ${nodePos.y - nodeRadius - controlOffset},
                      ${nodePos.x} ${nodePos.y - nodeRadius}`;
      } else {
        const midY = (parentPos.y + nodePos.y) / 2;
        pathData = `M ${parentPos.x} ${parentPos.y + nodeRadius}
                    Q ${parentPos.x} ${midY} ${(parentPos.x + nodePos.x) / 2} ${midY}
                    Q ${nodePos.x} ${midY} ${nodePos.x} ${nodePos.y - nodeRadius}`;
      }

      // Determine if this branch connection is part of the current active path
      const isCurrentBranch = node.isCurrentBranch !== false;
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData.trim());
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.classList.add('tree-line');
      
      // Add class for active branch styling
      if (isCurrentBranch) {
        path.classList.add('current');
      }
      
      svg.appendChild(path);
    });
  }

  createSVGDefs() {
    // Create defs element with all gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Gradient for nodes
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'nodeGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#667eea');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#764ba2');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    // Hover gradient for nodes
    const hoverGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    hoverGradient.setAttribute('id', 'nodeGradientHover');
    hoverGradient.setAttribute('x1', '0%');
    hoverGradient.setAttribute('y1', '0%');
    hoverGradient.setAttribute('x2', '100%');
    hoverGradient.setAttribute('y2', '100%');

    const hstop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    hstop1.setAttribute('offset', '0%');
    hstop1.setAttribute('stop-color', '#7c3aed');

    const hstop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    hstop2.setAttribute('offset', '100%');
    hstop2.setAttribute('stop-color', '#8b5cf6');

    hoverGradient.appendChild(hstop1);
    hoverGradient.appendChild(hstop2);
    defs.appendChild(hoverGradient);

    // Branch gradient
    const branchGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    branchGradient.setAttribute('id', 'branchGradient');
    branchGradient.setAttribute('x1', '0%');
    branchGradient.setAttribute('y1', '0%');
    branchGradient.setAttribute('x2', '100%');
    branchGradient.setAttribute('y2', '100%');

    const bstop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    bstop1.setAttribute('offset', '0%');
    bstop1.setAttribute('stop-color', '#f093fb');

    const bstop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    bstop2.setAttribute('offset', '100%');
    bstop2.setAttribute('stop-color', '#f5576c');

    branchGradient.appendChild(bstop1);
    branchGradient.appendChild(bstop2);
    defs.appendChild(branchGradient);

    // Drop shadow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'dropShadow');
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');

    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '2');
    feDropShadow.setAttribute('dy', '2');
    feDropShadow.setAttribute('stdDeviation', '3');
    feDropShadow.setAttribute('flood-opacity', '0.3');

    filter.appendChild(feDropShadow);
    defs.appendChild(filter);

    return defs;
  }
}

// Debug functions
window.debugChatGPTTree = function () {
  console.log('=== ChatGPT Tree Debug ===');
  if (window.chatGPTTreeTracker) {
    console.log('Current tree:', window.chatGPTTreeTracker.conversationTree);
    console.log('Overlay element:', window.chatGPTTreeTracker.overlay);
    console.log('Conversation ID:', window.chatGPTTreeTracker.conversationId);
    window.chatGPTTreeTracker.extractConversationFromDOM();
  } else {
    console.log('Tree tracker not initialized');
  }
};

window.analyzeBranches = function () {
  console.log('=== Branch Analysis ===');
  const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
  console.log(`Found ${userMessages.length} user messages`);
  userMessages.forEach((msg, index) => {
    if (window.chatGPTTreeTracker) {
      const branchInfo = window.chatGPTTreeTracker.detectBranchesInMessage(msg, index);
      console.log(`Message ${index}:`, branchInfo);
    }
  });
};

window.refreshTree = function () {
  console.log('=== Manual Tree Refresh ===');
  if (window.chatGPTTreeTracker) {
    window.chatGPTTreeTracker.extractConversationFromDOM();
    console.log('Tree refreshed manually');
  } else {
    console.log('Tree tracker not initialized');
  }
};

window.testBranchDetection = function () {
  console.log('=== Testing Branch Detection ===');
  if (window.chatGPTTreeTracker) {
    const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
    console.log(`Found ${userMessages.length} user messages`);

    userMessages.forEach((msg, index) => {
      console.log(`\n--- Testing Message ${index} ---`);
      const branchInfo = window.chatGPTTreeTracker.detectBranchesInMessage(msg, index);
      console.log('Result:', branchInfo);

      // Show some DOM details
      const prevBtn = msg.querySelector('button[aria-label="Previous response"]');
      const nextBtn = msg.querySelector('button[aria-label="Next response"]');
      console.log('DOM elements:', {
        prevButton: !!prevBtn,
        nextButton: !!nextBtn,
        prevDisabled: prevBtn?.disabled,
        nextDisabled: nextBtn?.disabled
      });
    });
  } else {
    console.log('Tree tracker not initialized');
  }
};

// Recovery function - must be defined at global scope
function resetOverlayPosition() {
  console.log('=== Resetting Overlay Position ===');
  if (window.chatGPTTreeTracker && window.chatGPTTreeTracker.overlay) {
    const overlay = window.chatGPTTreeTracker.overlay;
    overlay.style.setProperty('width', '25vw', 'important');
    overlay.style.setProperty('height', '25vh', 'important');
    overlay.style.setProperty('transform', 'translate3d(20px, 20px, 0)', 'important');
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    overlay.style.zIndex = '999999';
    console.log('Overlay position reset to default');
  } else {
    console.log('Overlay not found - trying to recreate...');
    if (window.chatGPTTreeTracker) {
      window.chatGPTTreeTracker.createOverlay();
    }
  }
}

// Make it globally accessible
window.resetOverlayPosition = resetOverlayPosition;

// Initialize the tracker
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatGPTTreeTracker = new ConversationTreeTracker();
  });
} else {
  window.chatGPTTreeTracker = new ConversationTreeTracker();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.chatGPTTreeTracker) {
    window.chatGPTTreeTracker.cleanup();
  }
});

window.debugToggleButton = function () {
  console.log('=== Toggle Button Debug ===');
  if (window.chatGPTTreeTracker) {
    console.log('Toggle button element:', window.chatGPTTreeTracker.toggleButton);
    console.log('Extension visible:', window.chatGPTTreeTracker.isExtensionVisible);
    console.log('Overlay element:', window.chatGPTTreeTracker.overlay);
    console.log('Overlay display:', window.chatGPTTreeTracker.overlay?.style.display);

    // Try to find share button
    const shareSelectors = [
      '[data-testid*="share"]',
      '[aria-label*="Share"]',
      'button[title*="Share"]'
    ];

    shareSelectors.forEach(selector => {
      const found = document.querySelector(selector);
      console.log(`Share button with selector "${selector}":`, found);
    });

    // Force recreate toggle button
    console.log('Attempting to recreate toggle button...');
    window.chatGPTTreeTracker.createToggleButton();
  } else {
    console.log('Tree tracker not initialized');
  }
};

window.testToggle = function () {
  console.log('=== Testing Toggle Functionality ===');
  if (window.chatGPTTreeTracker) {
    console.log('Current state before toggle:', window.chatGPTTreeTracker.isExtensionVisible);
    if (window.chatGPTTreeTracker.toggleButton) {
      console.log('Button background before:', window.chatGPTTreeTracker.toggleButton.style.backgroundColor);
    }
    window.chatGPTTreeTracker.toggleExtensionVisibility();
    console.log('Current state after toggle:', window.chatGPTTreeTracker.isExtensionVisible);
    if (window.chatGPTTreeTracker.toggleButton) {
      console.log('Button background after:', window.chatGPTTreeTracker.toggleButton.style.backgroundColor);
    }
  }
};

window.forceShareButtonCheck = function () {
  console.log('=== Force Share Button Check ===');
  if (window.chatGPTTreeTracker) {
    console.log('Share button found:', !!window.chatGPTTreeTracker.findShareButton());
    console.log('Toggle button exists:', !!window.chatGPTTreeTracker.toggleButton);
    console.log('Extension visible:', window.chatGPTTreeTracker.isExtensionVisible);
    window.chatGPTTreeTracker.checkShareButtonAndUpdateState();
  }
};

// Simple extension visibility methods
ConversationTreeTracker.prototype.updateExtensionVisibility = function () {
  if (!this.overlay) return;

  if (this.isExtensionVisible) {
    console.log('Showing extension');
    this.overlay.style.display = 'flex';
    this.overlay.style.opacity = '0';

    // Refresh tree data
    setTimeout(() => {
      this.extractConversationFromDOM();
    }, 100);

    // Fade in
    setTimeout(() => {
      this.overlay.style.opacity = '1';
    }, 10);
  } else {
    console.log('Hiding extension');
    this.overlay.style.opacity = '0';
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 200);
  }
};

ConversationTreeTracker.prototype.hideExtension = function () {
  if (this.overlay) {
    this.overlay.style.display = 'none';
  }
};

// Simple test function
window.testSimpleToggle = function () {
  console.log('=== Simple Toggle Test ===');
  if (window.chatGPTTreeTracker) {
    const tracker = window.chatGPTTreeTracker;
    console.log('Share button found:', !!tracker.findShareButton());
    console.log('Toggle button exists:', !!tracker.toggleButton);
    console.log('Extension visible:', tracker.isExtensionVisible);
    console.log('Overlay display:', tracker.overlay?.style.display);

    // Force check
    tracker.checkAndCreateToggleButton();
  }
};// Debug function to test toggle
window.debugToggleState = function () {
  console.log('=== Debug Toggle State ===');
  if (window.chatGPTTreeTracker) {
    const tracker = window.chatGPTTreeTracker;
    console.log('isExtensionVisible:', tracker.isExtensionVisible);
    console.log('overlay exists:', !!tracker.overlay);
    console.log('overlay display:', tracker.overlay?.style.display);
    console.log('overlay in DOM:', document.contains(tracker.overlay));
    console.log('toggle button exists:', !!tracker.toggleButton);

    // Try to manually show the extension
    if (tracker.overlay) {
      console.log('Manually showing extension...');
      tracker.overlay.style.display = 'flex';
      tracker.overlay.style.opacity = '1';
    }
  }
};
