# ChatGPT Conversation Tree Tracker

A Chrome extension that provides visual conversation depth tracking and branching visualization for ChatGPT conversations.

## 🌟 Features

- **Visual Conversation Tree**: See your conversation structure as an interactive tree diagram
- **Branch Detection**: Automatically detects when you edit messages and create conversation branches
- **Draggable Interface**: Move the tree window anywhere on your screen
- **Resizable Window**: Adjust width and height to fit your needs
- **Minimizable**: Collapse to a small circle when not needed
- **Persistent Settings**: Remembers position, size, and state across sessions
- **Real-time Updates**: Tree updates automatically as you chat

## 🎯 How It Works

The extension monitors your ChatGPT conversations and:
1. **Tracks conversation depth** - Each user prompt increases the depth
2. **Detects branching** - When you edit previous messages, it shows multiple branches
3. **Visualizes the structure** - Displays circles connected by lines showing the conversation flow
4. **Highlights current branch** - Shows which conversation path you're currently on

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. Navigate to ChatGPT and start using the tree tracker!

## 🎨 Interface

- **Purple header** with minimize (-) and refresh (↻) buttons
- **Tree visualization** with numbered circles representing conversation depth
- **Branch indicators** showing where conversations split
- **Scrollable content** for long conversation trees
- **Resize handles** on bottom and right edges

## 🔧 Usage

### Basic Usage
1. Start a conversation on ChatGPT
2. The tree tracker appears in the top-right corner
3. Each message you send adds a new node to the tree

### Branching
1. Edit any previous message in your ChatGPT conversation
2. The tree will show multiple branches at that point
3. Current active branch is highlighted
4. Navigate between branches using ChatGPT's arrow buttons

### Customization
- **Drag** the header to move the window
- **Resize** using the bottom or right edges
- **Minimize** using the (-) button
- **Refresh** the tree using the (↻) button

## 🛠️ Technical Details

### Files Structure
```
├── manifest.json          # Extension configuration
├── content.js            # Main functionality and tree logic
├── styles.css            # Styling and visual design
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
└── README.md             # This file
```

### Key Components
- **Branch Detection**: Uses DOM analysis and ARIA labels to detect ChatGPT's branching
- **Tree Rendering**: SVG-based visualization with dynamic positioning
- **Drag & Resize**: Custom implementation with viewport constraints
- **Persistence**: localStorage for settings and tree state

## 🐛 Troubleshooting

### Extension Not Visible
- Run `resetOverlayPosition()` in browser console
- Check if extension is loaded in `chrome://extensions/`
- Refresh the ChatGPT page

### Tree Not Updating
- Run `refreshTree()` in browser console
- Check browser console for error messages
- Try the manual refresh button (↻)

### Debug Functions
Open browser console and try:
- `debugChatGPTTree()` - Shows current tree state
- `testBranchDetection()` - Analyzes branch detection
- `resetOverlayPosition()` - Resets window position

## 🔄 Version History

### v2.0.0
- Complete rewrite with improved branch detection
- Added drag and resize functionality
- Enhanced visual design with gradients and animations
- Persistent settings across sessions
- Better error handling and recovery

### v1.0.0
- Initial version with basic tree visualization
- Simple branch detection
- Fixed positioning

## 🤝 Contributing

This is a private project. If you have access and want to contribute:
1. Create a feature branch
2. Make your changes
3. Test thoroughly with ChatGPT
4. Submit a pull request

## 📝 License

Private project - All rights reserved.

## 🙏 Acknowledgments

Built for enhancing the ChatGPT conversation experience by making the hidden branching feature visible and intuitive.