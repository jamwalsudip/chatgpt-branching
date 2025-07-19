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
      <div class="tree-header" id="tree-drag-handle">
        <div class="header-left">
          <button class="minimize-btn" title="Minimize">−</button>
          <h3>Conversation Tree V2</h3>
        </div>
        <div class="header-right">
          <button class="refresh-tree-btn" title="Refresh tree">↻</button>
          <button class="clear-tree-btn" title="Clear tree">×</button>
        </div>
      </div>
      <div class="tree-container">
        <svg class="tree-svg" width="100%" height="100%">
          <!-- Tree will be drawn here -->
        </svg>
      </div>
      
      <!-- Resize handles (bottom and right only) -->
      <div class="resize-handle s"></div>
      <div class="resize-handle e"></div>
    `;
    
    document.body.appendChild(this.overlay);
    console.log('Overlay added to DOM:', this.overlay);
    
    // Add button functionality
    this.overlay.querySelector('.clear-tree-btn').addEventListener('click', () => {
      this.clearTree();
    });
    
    this.overlay.querySelector('.minimize-btn').addEventListener('click', () => {
      this.toggleMinimize();
    });
    
    this.overlay.querySelector('.refresh-tree-btn').addEventListener('click', () => {
      console.log('Manual refresh triggered');
      this.extractConversationFromDOM();
    });
    
    // Make the overlay draggable
    this.makeDraggable();
    
    // Make the overlay resizable
    this.makeResizable();
    
    // Load minimize state
    setTimeout(() => {
      this.loadMinimizeState();
    }, 100);
    
    this.renderTree();
  }

  clearTree() {
    this.conversationTree = {
      nodes: [],
      branches: new Map(),
      currentPath: []
    };
    this.saveData();
    this.renderTree();
  }

  makeDraggable() {
    const header = this.overlay.querySelector('#tree-drag-handle');
    console.log('Setting up drag functionality for header:', header);
    
    if (!header) {
      console.error('Drag handle not found!');
      return;
    }
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Get initial position from saved data or use default
    const savedPosition = localStorage.getItem(`chatgpt_tree_position_${this.conversationId}`);
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        this.overlay.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        xOffset = pos.x;
        yOffset = pos.y;
        console.log('Restored position:', pos);
      } catch (e) {
        console.log('Error restoring position:', e);
      }
    }

    const dragStart = (e) => {
      console.log('Drag start triggered on:', e.target);
      
      if (e.target.tagName === 'BUTTON') {
        console.log('Ignoring drag on button');
        return; // Don't drag when clicking buttons
      }
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        console.log('Starting drag...');
        isDragging = true;
        header.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation(); // Prevent interference with other handlers
      }
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation(); // Prevent interference with other handlers
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Keep within viewport bounds
        const rect = this.overlay.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        xOffset = currentX;
        yOffset = currentY;

        // Apply transform with higher specificity
        this.overlay.style.setProperty('transform', `translate3d(${currentX}px, ${currentY}px, 0)`, 'important');
        
        // Debug log occasionally
        if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
          console.log(`Dragging to: ${currentX}, ${currentY}`);
        }
      }
    };

    const dragEnd = (e) => {
      if (isDragging) {
        console.log(`Drag ended at: ${xOffset}, ${yOffset}`);
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        header.style.cursor = 'grab';
        
        // Save position
        localStorage.setItem(`chatgpt_tree_position_${this.conversationId}`, 
                           JSON.stringify({ x: xOffset, y: yOffset }));
        
        e.stopPropagation(); // Prevent interference with other handlers
      }
    };

    // Add event listeners
    header.addEventListener('mousedown', dragStart, { passive: false });
    document.addEventListener('mousemove', drag, { passive: false });
    document.addEventListener('mouseup', dragEnd, { passive: false });

    // Also make the entire overlay draggable from the header area
    this.overlay.addEventListener('mousedown', (e) => {
      // Only if clicking on header area
      if (header.contains(e.target)) {
        dragStart(e);
      }
    }, { passive: false });

    // Set initial cursor
    header.style.cursor = 'grab';
    console.log('Drag functionality setup complete');
  }

  makeResizable() {
    console.log('Setting up resize functionality...');
    
    const handles = this.overlay.querySelectorAll('.resize-handle');
    
    handles.forEach(handle => {
      let isResizing = false;
      let startX, startY, startWidth, startHeight;
      
      const startResize = (e) => {
        console.log('Starting resize on handle:', handle.className);
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = this.overlay.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        
        console.log('Initial dimensions:', { startWidth, startHeight });
        
        // Add visual feedback during resize
        this.overlay.style.opacity = '0.8';
        this.overlay.style.transition = 'none'; // Disable transitions during resize
        
        e.preventDefault();
        e.stopPropagation();
        
        document.addEventListener('mousemove', doResize, { passive: false });
        document.addEventListener('mouseup', stopResize, { passive: false });
      };
      
      const doResize = (e) => {
        if (!isResizing) return;
        
        try {
          e.preventDefault();
          e.stopPropagation();
          
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          
          let newWidth = startWidth;
          let newHeight = startHeight;
          
          const handleClass = handle.className.split(' ').find(cls => cls !== 'resize-handle');
          
          // Handle bottom and right resize only
          switch (handleClass) {
            case 'e': // Right edge - width only
              newWidth = startWidth + deltaX;
              break;
            case 's': // Bottom edge - height only
              newHeight = startHeight + deltaY;
              break;
            default:
              // Skip other resize operations
              return;
          }
          
          // Apply constraints
          const minWidth = Math.max(250, window.innerWidth * 0.1);
          const minHeight = Math.max(200, window.innerHeight * 0.1);
          const maxWidth = window.innerWidth * 0.5;
          const maxHeight = window.innerHeight * 0.8;
          
          newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
          newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
          
          // Validate dimensions
          if (newWidth > 0 && newHeight > 0 && !isNaN(newWidth) && !isNaN(newHeight)) {
            // Apply new dimensions using setProperty with !important to override CSS
            this.overlay.style.setProperty('width', `${newWidth}px`, 'important');
            this.overlay.style.setProperty('height', `${newHeight}px`, 'important');
            
            // Update tree container height immediately for visual feedback
            this.updateTreeContainerHeight(newHeight);
            
            // Verify the changes were applied
            const computedStyle = window.getComputedStyle(this.overlay);
            console.log(`Resized to: ${newWidth}x${newHeight}`);
            console.log(`Computed dimensions: ${computedStyle.width} x ${computedStyle.height}`);
          }
        } catch (error) {
          console.error('Error during resize:', error);
          // Stop resizing on error
          isResizing = false;
        }
      };
      
      const stopResize = (e) => {
        if (isResizing) {
          isResizing = false;
          console.log('Resize stopped');
          
          // Restore visual feedback
          this.overlay.style.opacity = '1';
          this.overlay.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          
          try {
            // Save the new size
            const rect = this.overlay.getBoundingClientRect();
            const sizeData = {
              width: rect.width,
              height: rect.height
            };
            
            localStorage.setItem(`chatgpt_tree_size_${this.conversationId}`, JSON.stringify(sizeData));
            
            // Re-render tree to adjust to new size
            setTimeout(() => {
              this.renderTree();
            }, 100);
          } catch (error) {
            console.error('Error saving resize:', error);
          }
          
          document.removeEventListener('mousemove', doResize);
          document.removeEventListener('mouseup', stopResize);
        }
      };
      
      handle.addEventListener('mousedown', startResize, { passive: false });
    });
    
    // Load saved size
    this.loadSavedSize();
    
    console.log('Resize functionality setup complete');
  }

  updateTreeContainerHeight(overlayHeight) {
    const headerHeight = this.overlay.querySelector('.tree-header')?.offsetHeight || 60;
    const treeContainer = this.overlay.querySelector('.tree-container');
    if (treeContainer) {
      // Let flexbox handle the height naturally, just set max-height for scrolling
      const newMaxHeight = overlayHeight - headerHeight;
      treeContainer.style.maxHeight = `${newMaxHeight}px`;
      treeContainer.style.removeProperty('height'); // Remove explicit height, let flex handle it
      console.log(`Updated tree container max-height to: ${newMaxHeight}px (overlay: ${overlayHeight}, header: ${headerHeight})`);
    }
  }

  loadSavedSize() {
    const savedSize = localStorage.getItem(`chatgpt_tree_size_${this.conversationId}`);
    if (savedSize) {
      try {
        const size = JSON.parse(savedSize);
        if (size.width && size.height && size.width > 0 && size.height > 0) {
          this.overlay.style.setProperty('width', `${size.width}px`, 'important');
          this.overlay.style.setProperty('height', `${size.height}px`, 'important');
          
          // Update tree container height
          this.updateTreeContainerHeight(size.height);
          
          console.log('Restored size:', size);
        }
      } catch (e) {
        console.log('Error restoring size:', e);
      }
    } else {
      // Set initial height for tree container
      setTimeout(() => {
        const currentHeight = this.overlay.offsetHeight;
        this.updateTreeContainerHeight(currentHeight);
      }, 100);
    }
  }

  toggleMinimize() {
    const isMinimized = this.overlay.classList.contains('minimized');
    
    if (isMinimized) {
      // Restore
      this.overlay.classList.remove('minimized');
      this.overlay.querySelector('.minimize-btn').textContent = '−';
      this.overlay.querySelector('.minimize-btn').title = 'Minimize';
    } else {
      // Minimize
      this.overlay.classList.add('minimized');
      this.overlay.querySelector('.minimize-btn').textContent = '+';
      this.overlay.querySelector('.minimize-btn').title = 'Restore';
    }
    
    // Save minimize state
    localStorage.setItem(`chatgpt_tree_minimized_${this.conversationId}`, isMinimized ? 'false' : 'true');
  }

  loadMinimizeState() {
    const savedState = localStorage.getItem(`chatgpt_tree_minimized_${this.conversationId}`);
    if (savedState === 'true') {
      this.overlay.classList.add('minimized');
      this.overlay.querySelector('.minimize-btn').textContent = '+';
      this.overlay.querySelector('.minimize-btn').title = 'Restore';
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
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(method, url, ...args) {
        this._url = url;
        return originalOpen.apply(this, [method, url, ...args]);
      };
      
      xhr.send = function(...args) {
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
      let shouldUpdate = false;
      
      try {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if new messages or branch indicators were added
                try {
                  if (node.querySelector && (
                      node.querySelector('[data-message-author-role="user"]') ||
                      node.querySelector('button') ||  // Simplified - just look for any buttons
                      (node.textContent && node.textContent.match(/\d+\s*\/\s*\d+/))
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
            // Watch for changes in button states (disabled/enabled arrows)
            if (mutation.target.tagName === 'BUTTON' && 
                (mutation.attributeName === 'disabled' || mutation.attributeName === 'aria-disabled')) {
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
          
          // Create nodes for all branches at this depth
          for (let branchIndex = 0; branchIndex < branchInfo.totalBranches; branchIndex++) {
            const isCurrentBranch = branchIndex === branchInfo.currentBranch;
            let branchContent;
            
            if (isCurrentBranch) {
              branchContent = content; // Show actual content for current branch
            } else {
              branchContent = `Branch ${branchIndex + 1}`; // Placeholder for other branches
            }
            
            nodes.push({
              id: `dom_${index}_branch_${branchIndex}`,
              depth: index,
              branchIndex: branchIndex,
              content: branchContent.substring(0, 50) + (branchContent.length > 50 ? '...' : ''),
              isCurrentBranch: isCurrentBranch,
              totalBranches: branchInfo.totalBranches,
              branchInfo: branchInfo // Store full branch info for debugging
            });
          }
        } else {
          // Single node (no branching)
          console.log(`- Message ${index}: No branches detected`);
          nodes.push({
            id: `dom_${index}`,
            depth: index,
            branchIndex: 0,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            isCurrentBranch: true,
            totalBranches: 1
          });
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
    
    // Look for specific ARIA labels for Previous/Next response buttons
    const prevButton = messageElement.querySelector('button[aria-label="Previous response"]');
    const nextButton = messageElement.querySelector('button[aria-label="Next response"]');
    
    console.log(`Previous button found: ${!!prevButton}, Next button found: ${!!nextButton}`);
    
    // If we don't find the specific labels, try broader patterns
    let leftArrow = prevButton || messageElement.querySelector('button[aria-label*="Previous"]');
    let rightArrow = nextButton || messageElement.querySelector('button[aria-label*="Next"]');
    
    // Check button states
    const leftDisabled = leftArrow && (leftArrow.disabled || leftArrow.getAttribute('aria-disabled') === 'true');
    const rightDisabled = rightArrow && (rightArrow.disabled || rightArrow.getAttribute('aria-disabled') === 'true');
    
    console.log(`Left disabled: ${leftDisabled}, Right disabled: ${rightDisabled}`);
    
    // Look for branch indicator text (like "2/3") in the message container
    let branchText = '';
    let currentBranch = 0;
    let totalBranches = 1;
    
    if (leftArrow || rightArrow) {
      // If we have navigation buttons, look for the numerical indicator
      const textContent = messageElement.textContent || '';
      const branchMatch = textContent.match(/(\d+)\s*\/\s*(\d+)/);
      
      if (branchMatch) {
        branchText = branchMatch[0];
        currentBranch = parseInt(branchMatch[1]) - 1; // Convert to 0-based index
        totalBranches = parseInt(branchMatch[2]);
        console.log(`Found branch indicator: ${branchText} -> Current: ${currentBranch}, Total: ${totalBranches}`);
      } else {
        // If we have arrows but no text, infer from button states
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
      }
    }
    
    // Additional validation: look for copy/edit buttons to confirm this is a user message
    const hasCopyButton = !!messageElement.querySelector('[data-testid="copy-turn-action-button"]');
    const hasEditButton = !!messageElement.querySelector('[aria-label*="Edit"]');
    
    console.log(`Copy button: ${hasCopyButton}, Edit button: ${hasEditButton}`);
    console.log(`Final result - Message ${messageIndex}: ${totalBranches} branches, current: ${currentBranch}`);
    
    return {
      currentBranch,
      totalBranches,
      hasLeftArrow: !!leftArrow,
      hasRightArrow: !!rightArrow,
      branchText,
      leftDisabled,
      rightDisabled,
      hasCopyButton,
      hasEditButton
    };
  }

  renderTree() {
    if (!this.overlay) return;
    
    const svg = this.overlay.querySelector('.tree-svg');
    const container = this.overlay.querySelector('.tree-container');
    svg.innerHTML = '';
    
    if (this.conversationTree.nodes.length === 0) {
      svg.innerHTML = `
        <text x="50%" y="50%" text-anchor="middle" fill="#888" font-size="14" font-family="system-ui">
          Start a conversation to see the tree
        </text>
      `;
      return;
    }
    
    // Enhanced styling constants
    const nodeRadius = 18;
    const verticalSpacing = 70;
    const horizontalSpacing = 50;
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
    
    // Calculate total tree dimensions for centering
    const maxDepth = Math.max(...Array.from(depthGroups.keys()));
    const maxBranchWidth = Math.max(...Array.from(depthGroups.values()).map(nodes => nodes.length));
    
    const treeHeight = (maxDepth + 1) * verticalSpacing + 80; // Add padding
    const treeWidth = maxBranchWidth * horizontalSpacing;
    
    // Set SVG height to accommodate all content
    svg.setAttribute('height', Math.max(treeHeight, 200));
    svg.setAttribute('viewBox', `0 0 ${containerWidth} ${Math.max(treeHeight, 200)}`);
    
    // Center the tree horizontally, start from top with padding
    const startX = (containerWidth - treeWidth) / 2 + horizontalSpacing / 2;
    const startY = 40; // Fixed top padding instead of centering vertically
    
    // Create gradients and filters for better visuals
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
    
    svg.appendChild(defs);
    
    // Store node positions for connection drawing
    const nodePositions = new Map();
    
    // Draw nodes and store positions
    depthGroups.forEach((nodes, depth) => {
      const y = startY + (depth * verticalSpacing);
      const nodesAtDepth = nodes.length;
      
      // Center nodes at this depth
      const totalWidth = (nodesAtDepth - 1) * horizontalSpacing;
      const depthStartX = startX + (treeWidth - totalWidth) / 2 - horizontalSpacing / 2;
      
      nodes.forEach((node, branchIndex) => {
        const x = depthStartX + (branchIndex * horizontalSpacing);
        nodePositions.set(node.id, { x, y, depth, branchIndex });
        
        // Determine if this is a branch point or part of branches
        const nextDepth = depth + 1;
        const isBranchPoint = depthGroups.has(nextDepth) && depthGroups.get(nextDepth).length > 1;
        const isLastBeforeBranch = isBranchPoint && nodesAtDepth === 1;
        const isPartOfBranches = nodesAtDepth > 1;
        const isCurrentBranch = node.isCurrentBranch !== false; // Default to true if not specified
        
        console.log(`Node at depth ${depth}, branch ${branchIndex}: isBranchPoint=${isBranchPoint}, isPartOfBranches=${isPartOfBranches}, isCurrentBranch=${isCurrentBranch}`);
        
        // Draw node circle with enhanced styling
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', nodeRadius);
        // Color coding:
        // - Branch point (node before branches): Pink/red gradient
        // - Current branch: Blue gradient
        // - Non-current branches: Muted blue/gray
        let fillColor, strokeColor, opacity = 1;
        
        if (isBranchPoint && isLastBeforeBranch) {
          // This is the branch point
          fillColor = 'url(#branchGradient)';
          strokeColor = '#f5576c';
        } else if (isPartOfBranches) {
          if (isCurrentBranch) {
            // Current active branch
            fillColor = 'url(#nodeGradient)';
            strokeColor = '#4c63d2';
          } else {
            // Non-current branch (muted)
            fillColor = '#94a3b8';
            strokeColor = '#64748b';
            opacity = 0.6;
          }
        } else {
          // Regular linear node
          fillColor = 'url(#nodeGradient)';
          strokeColor = '#4c63d2';
        }
        
        circle.setAttribute('fill', fillColor);
        circle.setAttribute('stroke', strokeColor);
        circle.setAttribute('opacity', opacity);
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('filter', 'url(#dropShadow)');
        circle.classList.add('tree-node');
        svg.appendChild(circle);
        
        // Add node number with better styling
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 6);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        text.textContent = depth + 1;
        svg.appendChild(text);
        
        // Add animations
        if (isBranchPoint && isLastBeforeBranch) {
          // Pulse animation for branch points
          const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animate.setAttribute('attributeName', 'r');
          animate.setAttribute('values', `${nodeRadius};${nodeRadius + 3};${nodeRadius}`);
          animate.setAttribute('dur', '2s');
          animate.setAttribute('repeatCount', 'indefinite');
          circle.appendChild(animate);
        } else if (isPartOfBranches && isCurrentBranch) {
          // Subtle glow for current branch
          circle.setAttribute('filter', 'url(#dropShadow) brightness(1.1)');
        }
      });
    });
    
    // Draw connections with improved styling
    depthGroups.forEach((nodes, depth) => {
      if (depth === 0) return; // Skip root level
      
      const parentDepth = depth - 1;
      const parentNodes = depthGroups.get(parentDepth) || [];
      
      nodes.forEach((node) => {
        const nodePos = nodePositions.get(node.id);
        
        // Connect to the appropriate parent
        // For branches, connect to the last single node (branch point)
        let parentNode = parentNodes[0]; // Default to first parent
        
        // If there are multiple nodes at current depth (branches) and single parent
        if (nodes.length > 1 && parentNodes.length === 1) {
          parentNode = parentNodes[0]; // All branches connect to the single parent
        }
        
        if (parentNode) {
          const parentPos = nodePositions.get(parentNode.id);
          
          // Create curved connection
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const midY = (parentPos.y + nodePos.y) / 2;
          
          // Different curve styles for branches vs linear connections
          let pathData;
          if (nodes.length > 1) {
            // Branch connections - more pronounced curves
            const controlOffset = Math.abs(nodePos.x - parentPos.x) * 0.3;
            pathData = `M ${parentPos.x} ${parentPos.y + nodeRadius} 
                       C ${parentPos.x} ${parentPos.y + nodeRadius + controlOffset},
                         ${nodePos.x} ${nodePos.y - nodeRadius - controlOffset},
                         ${nodePos.x} ${nodePos.y - nodeRadius}`;
          } else {
            // Linear connections - gentle curves
            pathData = `M ${parentPos.x} ${parentPos.y + nodeRadius} 
                       Q ${parentPos.x} ${midY} ${(parentPos.x + nodePos.x) / 2} ${midY}
                       Q ${nodePos.x} ${midY} ${nodePos.x} ${nodePos.y - nodeRadius}`;
          }
          
          path.setAttribute('d', pathData);
          path.setAttribute('stroke', nodes.length > 1 ? '#f5576c' : '#8b5cf6');
          path.setAttribute('stroke-width', nodes.length > 1 ? '2' : '3');
          path.setAttribute('fill', 'none');
          path.setAttribute('opacity', '0.8');
          path.setAttribute('stroke-linecap', 'round');
          svg.appendChild(path);
        }
      });
    });
  }
}

// Debug functions
window.debugChatGPTTree = function() {
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

window.analyzeBranches = function() {
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

window.refreshTree = function() {
  console.log('=== Manual Tree Refresh ===');
  if (window.chatGPTTreeTracker) {
    window.chatGPTTreeTracker.extractConversationFromDOM();
    console.log('Tree refreshed manually');
  } else {
    console.log('Tree tracker not initialized');
  }
};

window.testBranchDetection = function() {
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