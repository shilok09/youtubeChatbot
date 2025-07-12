// Background script for YouTube Chatbot Extension
chrome.action.onClicked.addListener((tab) => {
    // Only activate on YouTube pages
    if (tab.url && tab.url.includes('youtube.com')) {
        // Send message to content script to toggle the chatbot
        chrome.tabs.sendMessage(tab.id, { action: 'toggleChatbot' });
    } else {
        // If not on YouTube, show a message
        chrome.action.setPopup({ popup: 'not-youtube.html' });
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoInfo') {
        // This could be used to get video information from YouTube API
        sendResponse({ success: true });
    }
}); 