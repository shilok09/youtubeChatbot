from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import re
import os
from dotenv import load_dotenv

# LangChain imports
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain.embeddings import HuggingFaceInferenceAPIEmbeddings
from github_inference_llm import GitHubInferenceLLM
from github_inference_embeddings import GitHubInferenceEmbeddings
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# Load environment variables
load_dotenv()

app = FastAPI(title="YouTube Chatbot API", version="1.0.0")

# Add CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store processed video data
video_chains: Dict[str, Any] = {}
video_transcripts: Dict[str, str] = {}

# Request/Response models
class VideoRequest(BaseModel):
    video_url: str

class QuestionRequest(BaseModel):
    video_url: str
    question: str

class ChatResponse(BaseModel):
    response: str
    success: bool
    message: Optional[str] = None

# Initialize tokens
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACEHUB_API_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GITHUB_TOKEN:
    raise ValueError("GITHUB_TOKEN environment variable is required")

# Initialize LLM and embeddings
llm = GitHubInferenceLLM(token=GITHUB_TOKEN)
embeddings = GitHubInferenceEmbeddings(
    token=GITHUB_TOKEN,
    model="text-embedding-3-large"
)

def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from URL"""
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    return None

def get_video_transcript(video_id: str) -> str:
    """Get transcript for a YouTube video"""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(
            video_id, 
            languages=["en"]
        )
        transcript = " ".join(chunk["text"] for chunk in transcript_list)
        return transcript
    except TranscriptsDisabled:
        raise HTTPException(
            status_code=404, 
            detail="No captions available for this video"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching transcript: {str(e)}"
        )

def create_chain_for_video(transcript: str):
    """Create a RAG chain for the video transcript"""
    # Split transcript into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )
    chunks = splitter.create_documents([transcript])
    
    # Create vector store
    vector_store = FAISS.from_documents(chunks, embeddings)
    retriever = vector_store.as_retriever(
        search_type="similarity", 
        search_kwargs={"k": 4}
    )
    
    # Create prompt template
    prompt = PromptTemplate(
        template="""
        You are a helpful assistant for a YouTube video chatbot.
        Answer ONLY from the provided transcript context.
        If the context is insufficient, just say you don't know.
        Be concise and helpful in your responses.
        
        Context: {context}
        
        Question: {question}
        """,
        input_variables=['context', 'question']
    )
    
    def format_docs(retrieved_docs):
        context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)
        return context_text
    
    # Create the chain
    parallel_chain = RunnableParallel({
        'context': retriever | RunnableLambda(format_docs),
        'question': RunnablePassthrough()
    })
    
    parser = StrOutputParser()
    main_chain = parallel_chain | prompt | llm | parser
    
    return main_chain

@app.get("/")
async def root():
    return {"message": "YouTube Chatbot API is running"}

@app.post("/process_video", response_model=ChatResponse)
async def process_video(request: VideoRequest):
    """Process a YouTube video and prepare it for questions"""
    try:
        video_id = extract_video_id(request.video_url)
        if not video_id:
            raise HTTPException(
                status_code=400, 
                detail="Invalid YouTube URL"
            )
        
        # Check if video is already processed
        if video_id in video_chains:
            return ChatResponse(
                response="Video already processed and ready for questions",
                success=True,
                message="Video ready"
            )
        
        # Get transcript
        transcript = get_video_transcript(video_id)
        
        # Store transcript
        video_transcripts[video_id] = transcript
        
        # Create chain
        chain = create_chain_for_video(transcript)
        video_chains[video_id] = chain
        
        return ChatResponse(
            response="Video processed successfully! You can now ask questions about it.",
            success=True,
            message="Video processed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing video: {str(e)}"
        )

@app.post("/ask_question", response_model=ChatResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about a processed video"""
    try:
        video_id = extract_video_id(request.video_url)
        if not video_id:
            raise HTTPException(
                status_code=400, 
                detail="Invalid YouTube URL"
            )
        
        # Check if video is processed
        if video_id not in video_chains:
            # Try to process it first
            transcript = get_video_transcript(video_id)
            video_transcripts[video_id] = transcript
            chain = create_chain_for_video(transcript)
            video_chains[video_id] = chain
        
        # Get the chain for this video
        chain = video_chains[video_id]
        
        # Handle quick actions
        if request.question.lower() == "please summarize this video for me":
            question = "Can you provide a comprehensive summary of this video covering the main topics and key points discussed?"
        elif request.question.lower() == "what are the key moments in this video?":
            question = "What are the most important moments, timestamps, or key points covered in this video?"
        elif request.question.lower() == "can you provide the transcript of this video?":
            # Return a portion of the transcript
            transcript = video_transcripts.get(video_id, "")
            if len(transcript) > 1000:
                response = f"Here's the beginning of the transcript:\n\n{transcript[:1000]}...\n\n(Transcript truncated for readability)"
            else:
                response = f"Full transcript:\n\n{transcript}"
            return ChatResponse(
                response=response,
                success=True
            )
        else:
            question = request.question
        
        # Get response from chain
        response = chain.invoke(question)
        
        return ChatResponse(
            response=response,
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error answering question: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)