#!/usr/bin/env python3
"""
Simple startup script for the YouTube Chatbot API server
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Start the FastAPI server"""
    print("🚀 Starting YouTube Chatbot API server...")
    print("📝 Make sure you have set up your .env file with:")
    print("   - GITHUB_TOKEN=your_github_token")
    print("   - HUGGINGFACEHUB_API_TOKEN=your_huggingface_token (optional)")
    print()
    
    # Check if required tokens are set
    if not os.getenv("GITHUB_TOKEN"):
        print("❌ ERROR: GITHUB_TOKEN not found in environment variables")
        print("   Please create a .env file with your GitHub token")
        return
    
    print("✅ Environment variables loaded")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print()
    
    # Start the server
    uvicorn.run(
        "main:app",  # Assuming your FastAPI app is in main.py
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )

if __name__ == "__main__":
    main()