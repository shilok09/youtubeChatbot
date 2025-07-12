# AskTube - YouTube Chatbot

A Chrome extension that allows you to ask questions about YouTube videos using AI-powered chatbot functionality. The application uses GitHub's Inference API for language processing and embeddings to provide intelligent responses based on video transcripts.

## 🚀 Features

- **Chrome Extension**: Seamlessly integrates with YouTube
- **AI-Powered Q&A**: Ask questions about any YouTube video content
- **Transcript Analysis**: Automatically extracts and processes video transcripts
- **RAG (Retrieval-Augmented Generation)**: Uses vector embeddings for accurate responses
- **Real-time Processing**: Instant video processing and question answering
- **User-friendly Interface**: Clean and intuitive chatbot interface

## 📁 Project Structure

```
youtubeChatbot/
├── backend/                          # FastAPI backend server
│   ├── main.py                      # Main FastAPI application
│   ├── run_server.py                # Server startup script
│   ├── github_inference_llm.py      # GitHub Inference LLM integration
│   └── github_inference_embeddings.py # GitHub Inference embeddings
├── extension/                        # Chrome extension
│   ├── manifest.json                # Extension manifest
│   ├── background.js                # Background service worker
│   ├── chatbot.js                   # Main chatbot functionality
│   ├── not-youtube.html             # Non-YouTube page handler
│   └── icons/                       # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── requirements.txt                 # Python dependencies
└── README.md                        # This file
```

## 🛠️ Installation

### Prerequisites

- Python 3.8 or higher
- Chrome browser
- GitHub account with access to GitHub Inference API For using Models Like Chat-gpt-4.0 free.

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtubeChatbot
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   GITHUB_TOKEN=your_github_token_here
   HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_here  # Optional
   ```

5. **Start the backend server**
   ```bash
   cd backend
   python run_server.py
   ```
   The server will be available at `http://localhost:8000`

### Chrome Extension Setup

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

2. **Load the extension**
   - Click "Load unpacked"
   - Select the `youtubeChatbot/extension/` folder

3. **Verify installation**
   - The "AskTube - YouTube Chatbot" extension should appear in your extensions list
   - Navigate to any YouTube video to see the chatbot interface

## 🔧 Configuration

### Environment Variables

- `GITHUB_TOKEN`: Required. Your GitHub token for accessing the Inference API
- `HUGGINGFACEHUB_API_TOKEN`: Optional. Hugging Face token for additional models

### API Endpoints

- `GET /`: Health check endpoint
- `POST /process_video`: Process a YouTube video for Q&A
- `POST /ask_question`: Ask a question about a processed video
- `GET /health`: Server health status

## 📖 Usage

1. **Navigate to a YouTube video**
   - Open any YouTube video in your browser
   - The chatbot interface will appear on the page

2. **Process the video**
   - Click the "Process Video" button to extract and analyze the transcript
   - Wait for the processing to complete

3. **Ask questions**
   - Type your question in the chat interface
   - Get AI-powered responses based on the video content

## 🏗️ Architecture

### Backend (FastAPI)
- **FastAPI**: Modern web framework for building APIs
- **LangChain**: Framework for building LLM applications
- **GitHub Inference API**: For LLM and embeddings processing
- **FAISS**: Vector database for similarity search
- **YouTube Transcript API**: For extracting video transcripts

### Frontend (Chrome Extension)
- **Manifest V3**: Modern Chrome extension manifest
- **Content Scripts**: Inject chatbot interface into YouTube pages
- **Background Service Worker**: Handle extension lifecycle
- **REST API Integration**: Communicate with backend server

## 🔒 Security

- CORS middleware configured for extension communication
- Environment variable management for sensitive tokens
- Input validation and error handling
- Secure API endpoint design

## 🚀 Deployment

### Backend Deployment
The backend can be deployed to any platform supporting Python:
- **Heroku**: Use the provided `requirements.txt`
- **Docker**: Create a Dockerfile for containerization
- **VPS**: Deploy directly to a virtual private server

### Extension Distribution
- **Chrome Web Store**: Package and publish the extension
- **Manual Installation**: Load unpacked extension for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Ensure the backend server is running
4. Check that the extension is properly loaded

## 🔮 Future Enhancements

- Support for multiple languages
- Video timestamp references in responses
- User authentication and conversation history
- Integration with additional AI models
- Mobile browser support
- Offline transcript caching 