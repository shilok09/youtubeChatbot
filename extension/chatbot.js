// YouTube Chatbot Content Script
class YouTubeChatbot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.messages = [];
        this.isInitialized = false;
        this.API_BASE_URL = 'http://localhost:8000';
        this.init();
    }

    async init() {
        // Wait for YouTube page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupExtension());
        } else {
            this.setupExtension();
        }
    }

    async setupExtension() {
        if (this.isInitialized) return;
        
        // Inject the UI into the page
        await this.injectUI();
        
        // Initialize elements and bind events
        this.initializeElements();
        this.bindEvents();
        this.setupInputAutoResize();
        
        this.isInitialized = true;
    }

    async injectUI() {
        // Create the HTML structure
        const extensionHTML = `
            <!-- Toggle Button -->
            <button class="yt-chatbot-toggle-btn" id="ytChatbotToggleBtn">💬</button>

            <!-- Extension Container -->
            <div class="yt-chatbot-extension-container" id="ytChatbotExtensionContainer">
                <!-- Header -->
                <div class="yt-chatbot-header">
                    <div class="yt-chatbot-header-content">
                        <h1>YT Chatbot</h1>
                        <p>Ask anything about this video</p>
                    </div>
                    <button class="yt-chatbot-close-btn" id="ytChatbotCloseBtn" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M 2.75 2.042969 L 2.042969 2.75 L 2.398438 3.101563 L 7.292969 8 L 2.042969 13.25 L 2.75 13.957031 L 8 8.707031 L 12.894531 13.605469 L 13.25 13.957031 L 13.957031 13.25 L 13.605469 12.894531 L 8.707031 8 L 13.957031 2.75 L 13.25 2.042969 L 8 7.292969 L 3.101563 2.398438 Z" fill="#aaa"/></svg>
                    </button>
                </div>

                <!-- Chat Container -->
                <div class="yt-chatbot-chat-container" id="ytChatbotChatContainer">
                    <div class="yt-chatbot-empty-state">
                        <h3>👋 Hello!</h3>
                        <p>I'm here to help you understand this video better. Ask me anything about the content, or use the quick actions below!</p>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="yt-chatbot-quick-actions">
                    <button class="yt-chatbot-quick-action-btn" data-action="summarize">📝 Summarize video</button>
                    <button class="yt-chatbot-quick-action-btn" data-action="keymoments">⏰ Key moments</button>
                    <button class="yt-chatbot-quick-action-btn" data-action="transcript">📜 Get transcript</button>
                </div>

                <!-- Input Container -->
                <div class="yt-chatbot-input-container">
                    <div class="yt-chatbot-input-wrapper">
                        <textarea 
                            class="yt-chatbot-chat-input" 
                            id="ytChatbotChatInput" 
                            placeholder="Type your question..." 
                            rows="1"
                        ></textarea>
                        <button class="yt-chatbot-send-btn" id="ytChatbotSendBtn">➤</button>
                    </div>
                </div>
            </div>
        `;

        // Inject the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = extensionHTML;
        document.body.appendChild(tempDiv.firstElementChild);
        document.body.appendChild(tempDiv.lastElementChild);
        
        // Inject the CSS
        this.injectCSS();
    }
     injectCSS() {
        // Add Google Fonts import
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        const css = `
            .yt-chatbot-extension-container {
                position: fixed;
                top: 0;
                right: 0;
                width: 380px;
                height: 100vh;
                background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                border-left: 1px solid #333;
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10000;
                box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
                font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }

            .yt-chatbot-extension-container.active {
                transform: translateX(0);
            }

            .yt-chatbot-header {
                padding: 20px;
                background: linear-gradient(135deg, #212121 0%, #1a1a1a 100%);
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                backdrop-filter: blur(10px);
            }

            .yt-chatbot-header-content {
                flex: 1;
            }

            .yt-chatbot-header h1 {
                font-size: 20px;
                font-weight: 600;
                color: #ff4444;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .yt-chatbot-header h1::before {
                content: '🤖';
                font-size: 18px;
            }

            .yt-chatbot-header p {
                font-size: 13px;
                color: #aaa;
                font-weight: 400;
            }

            .yt-chatbot-close-btn {
                background: none;
                border: none;
                color: #aaa;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .yt-chatbot-close-btn:hover svg path {
                fill: #fff;
            }

            .yt-chatbot-chat-container {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .yt-chatbot-chat-container::-webkit-scrollbar {
                width: 6px;
            }

            .yt-chatbot-chat-container::-webkit-scrollbar-track {
                background: transparent;
            }

            .yt-chatbot-chat-container::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 3px;
            }

            .yt-chatbot-message {
                display: flex;
                gap: 12px;
                animation: yt-chatbot-slideIn 0.3s ease-out;
            }

            @keyframes yt-chatbot-slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .yt-chatbot-message.user {
                flex-direction: row-reverse;
            }

            .yt-chatbot-message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                position: relative;
                word-wrap: break-word;
                font-size: 15px !important;
                padding: 12px 16px !important;
                line-height: 1.5 !important;
            }

            .yt-chatbot-message.user .yt-chatbot-message-content {
                background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
                color: white;
                border-bottom-right-radius: 6px;
            }

            .yt-chatbot-message.ai .yt-chatbot-message-content {
                background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
                color: #ffffff;
                border-bottom-left-radius: 6px;
                border: 1px solid #444;
            }

            .yt-chatbot-message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .yt-chatbot-message.user .yt-chatbot-message-avatar {
                background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
            }

            .yt-chatbot-message.ai .yt-chatbot-message-avatar {
                background: linear-gradient(135deg, #666 0%, #555 100%);
            }

            .yt-chatbot-message-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
                font-size: 11px;
                color: #888;
            }

            .yt-chatbot-copy-btn {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                padding: 2px 4px;
                border-radius: 4px;
                font-size: 10px;
                transition: all 0.2s ease;
            }

            .yt-chatbot-copy-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .yt-chatbot-quick-actions {
                padding: 16px 20px;
                border-top: 1px solid #333;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .yt-chatbot-quick-action-btn {
                background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
                border: 1px solid #444;
                color: #fff;
                padding: 8px 12px;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .yt-chatbot-quick-action-btn:hover {
                background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
            }

            .yt-chatbot-input-container {
                padding: 20px;
                border-top: 1px solid #333;
                background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
            }

            .yt-chatbot-input-wrapper {
                display: flex;
                gap: 12px;
                align-items: flex-end;
                background: #2a2a2a;
                border-radius: 24px;
                padding: 4px;
                border: 1px solid #444;
                transition: all 0.2s ease;
            }

            .yt-chatbot-input-wrapper:focus-within {
                border-color: #ff4444;
                box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.2);
            }

            .yt-chatbot-chat-input {
                flex: 1;
                background: none;
                border: none;
                color: #fff;
                padding: 12px 16px !important;
                font-size: 14px !important;
                resize: none;
                max-height: 80px;
                min-height: 20px;
                outline: none;
                font-family: inherit;
            }

            .yt-chatbot-chat-input::placeholder {
                color: #888;
            }

            .yt-chatbot-send-btn {
                background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .yt-chatbot-send-btn:hover {
                background: linear-gradient(135deg, #ff5555 0%, #dd4444 100%);
                transform: scale(1.05);
            }

            .yt-chatbot-send-btn:active {
                transform: scale(0.95);
            }

            .yt-chatbot-toggle-btn {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
                border: none;
                color: white;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                box-shadow: 0 4px 16px rgba(255, 68, 68, 0.4);
                transition: all 0.3s ease;
                z-index: 9999;
            }

            .yt-chatbot-toggle-btn:hover {
                transform: translateY(-50%) scale(1.1);
                box-shadow: 0 6px 20px rgba(255, 68, 68, 0.6);
            }

            .yt-chatbot-typing-indicator {
                display: flex;
                gap: 4px;
                align-items: center;
                margin-left: 44px;
                padding: 12px 16px;
                background: #333;
                border-radius: 18px;
                border-bottom-left-radius: 6px;
                max-width: fit-content;
            }

            .yt-chatbot-typing-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #888;
                animation: yt-chatbot-typing 1.4s infinite;
            }

            .yt-chatbot-typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }

            .yt-chatbot-typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes yt-chatbot-typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.5;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }

            .yt-chatbot-empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #888;
            }

            .yt-chatbot-empty-state h3 {
                font-size: 18px;
                margin-bottom: 8px;
                color: #fff;
            }

            .yt-chatbot-empty-state p {
                font-size: 14px;
                line-height: 1.5;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .yt-chatbot-extension-container {
                    width: 100%;
                    transform: translateX(100%);
                }
                
                .yt-chatbot-toggle-btn {
                    right: 16px;
                    width: 48px;
                    height: 48px;
                    font-size: 20px;
                }
            }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    initializeElements() {
        this.toggleBtn = document.getElementById('ytChatbotToggleBtn');
        this.container = document.getElementById('ytChatbotExtensionContainer');
        this.chatContainer = document.getElementById('ytChatbotChatContainer');
        this.chatInput = document.getElementById('ytChatbotChatInput');
        this.sendBtn = document.getElementById('ytChatbotSendBtn');
        this.closeBtn = document.getElementById('ytChatbotCloseBtn');
        this.quickActionBtns = document.querySelectorAll('.yt-chatbot-quick-action-btn');
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.togglePanel());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.closeBtn.addEventListener('click', () => this.togglePanel());
        
        this.quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Listen for messages from background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'toggleChatbot') {
                    this.togglePanel();
                }
            });
        }
    }

    setupInputAutoResize() {
        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 80) + 'px';
        });
    }

    async togglePanel() {
        this.isOpen = !this.isOpen;
        this.container.classList.toggle('active', this.isOpen);
        this.toggleBtn.textContent = this.isOpen ? '✕' : '💬';
        
        if (this.isOpen) {
            await this.loadChatHistory();
            this.chatInput.focus();
        }
    }

    async loadChatHistory() {
        // Load messages from chrome.storage.local if available
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['ytChatbotMessages'], (result) => {
                this.messages = Array.isArray(result.ytChatbotMessages) ? result.ytChatbotMessages : [];
                this.renderMessages();
            });
        } else {
            // Fallback to localStorage for development
            const stored = localStorage.getItem('ytChatbotMessages');
            this.messages = stored ? JSON.parse(stored) : [];
            this.renderMessages();
        }
    }

    renderMessages() {
        // Remove all children from chatContainer
        while (this.chatContainer.firstChild) {
            this.chatContainer.removeChild(this.chatContainer.firstChild);
        }
        
        if (this.messages.length === 0) {
            // Add the empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'yt-chatbot-empty-state';
            emptyState.innerHTML = `
                <h3>👋 Hello!</h3>
                <p>I'm here to help you understand this video better. Ask me anything about the content, or use the quick actions below!</p>
            `;
            this.chatContainer.appendChild(emptyState);
        } else {
            // Render all messages
            this.messages.forEach(msg => {
                this._renderMessageDiv(msg.type, msg.content, msg.timestamp);
            });
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Check if we're on a YouTube video page
        const currentVideoUrl = this.getCurrentYouTubeVideoUrl();
        if (!currentVideoUrl) {
            await this.addMessage('ai', 'Please navigate to a YouTube video page to use this chatbot.');
            return;
        }

        await this.addMessage('user', message);
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        // Call backend API
        try {
            const response = await this.callBackend(message);
            this.hideTypingIndicator();
            await this.addMessage('ai', response);
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Backend error:', error);
            await this.addMessage('ai', `Sorry, I encountered an error: ${error.message}. Please try again.`);
        }
    }

    async addMessage(type, content) {
        const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const msgObj = { type, content, timestamp };
        this.messages.push(msgObj);
        
        // Save to chrome.storage.local or localStorage
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ ytChatbotMessages: this.messages });
        } else {
            localStorage.setItem('ytChatbotMessages', JSON.stringify(this.messages));
        }
        
        this._renderMessageDiv(type, content, timestamp);
    }

    _renderMessageDiv(type, content, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `yt-chatbot-message ${type}`;
        messageDiv.innerHTML = `
            <div class="yt-chatbot-message-avatar">${type === 'user' ? '👤' : '🤖'}</div>
            <div>
                <div class="yt-chatbot-message-content">${content}</div>
                <div class="yt-chatbot-message-meta">
                    <span>${timestamp}</span>
                    <button class="yt-chatbot-copy-btn" onclick="window.ytChatbotInstance.copyMessage('${content.replace(/'/g, "\\'")}')">📋</button>
                </div>
            </div>
        `;
        
        // Remove empty state if it exists
        const emptyState = this.chatContainer.querySelector('.yt-chatbot-empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'yt-chatbot-typing-indicator';
        typingDiv.innerHTML = `
            <div class="yt-chatbot-typing-dot"></div>
            <div class="yt-chatbot-typing-dot"></div>
            <div class="yt-chatbot-typing-dot"></div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = this.chatContainer.querySelector('.yt-chatbot-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    async callBackend(message) {
        const currentVideoUrl = this.getCurrentYouTubeVideoUrl();
        
        if (!currentVideoUrl) {
            throw new Error('Please navigate to a YouTube video page first');
        }

        try {
            // First, ensure the video is processed
            await this.processVideo(currentVideoUrl);
            
            // Then ask the question
            const response = await fetch(`${this.API_BASE_URL}/ask_question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_url: currentVideoUrl,
                    question: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                return data.response;
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Backend call failed:', error);
            
            // Check if it's a network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to the chatbot server. Please make sure the FastAPI server is running on http://localhost:8000');
            }
            
            throw error;
        }
    }

    async processVideo(videoUrl) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/process_video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_url: videoUrl
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Video processing failed:', error);
            throw error;
        }
    }

    handleQuickAction(action) {
        const actions = {
            summarize: 'Please summarize this video for me',
            keymoments: 'What are the key moments in this video?',
            transcript: 'Can you provide the transcript of this video?'
        };

        if (actions[action]) {
            this.chatInput.value = actions[action];
            this.sendMessage();
        }
    }

    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            // Show temporary feedback
            const feedback = document.createElement('div');
            feedback.textContent = 'Copied!';
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #333;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                z-index: 10001;
                font-size: 12px;
            `;
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 2000);
        });
    }

    // Returns the current YouTube video URL if on a video page, otherwise null
    getCurrentYouTubeVideoUrl() {
        const url = window.location.href;
        // YouTube video URLs are of the form: https://www.youtube.com/watch?v=VIDEO_ID
        const match = url.match(/^https:\/\/(www\.)?youtube\.com\/watch\?v=([\w-]{11})/);
        if (match) {
            // Return the clean URL without extra parameters
            return url.split('&')[0]; // Remove any extra params after the video ID
        }
        return null;
    }
}

// Initialize the chatbot when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ytChatbotInstance = new YouTubeChatbot();
    });
} else {
    window.ytChatbotInstance = new YouTubeChatbot();
}