import { useState } from 'react'
import './App.css'

export const API_KEY = "AIzaSyC70M2i9VHfwwJJWTWvzI36wV5ONZ2qYGo";
export const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_URL = `${BASE_URL}?key=${API_KEY}`;

function App() {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  
  const payload = {
    "contents": [
      {
        "parts": [
          {
            "text": query
          }
        ]
      }
    ]
  }

  // Function to detect and format code blocks
  const formatMessage = (text) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    
    text.replace(codeBlockRegex, (match, code, index) => {
      // Add the text before the code block
      if (index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, index) });
      }
      
      // Add the code block with formatting
      parts.push({ type: 'code', content: code });
      lastIndex = index + match.length;
      return match;
    });
    
    // Add any remaining text after the last code block
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  }

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true)
    try {
      // Add user message to chat
      setMessages(prev => [...prev, { sender: 'user', text: query }])
      
      let res = await fetch(API_URL, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      let response = await res.json()
      const aiResponse = response.candidates[0].content.parts[0].text
      
      // Add formatted AI response to chat
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: aiResponse,
        formatted: formatMessage(aiResponse)
      }])
      
      // Clear input field
      setQuery("")
    } catch (error) {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Error: Failed to fetch response",
        formatted: [{ type: 'text', content: "Error: Failed to fetch response" }]
      }])
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuery()
    }
  }

  return (
    <div className='flex flex-col md:flex-row h-screen bg-gray-100'>
      {/* Sidebar */}
      <div className='w-full md:w-64 bg-gray-800 text-white p-4 hidden md:block'>
        <h1 className='text-xl font-bold mb-6'>SHAN AI</h1>
        <div className='space-y-2'>
          <button 
            className='w-full text-left p-2 rounded hover:bg-gray-700'
            onClick={() => setMessages([])}
          >
            New Chat
          </button>
          <button className='w-full text-left p-2 rounded hover:bg-gray-700'>History</button>
          <button className='w-full text-left p-2 rounded hover:bg-gray-700'>Settings</button>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Chat Area */}
        <div className='flex-1 p-4 overflow-y-auto'>
          {messages.length > 0 ? (
            <div className='space-y-4'>
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg shadow p-4 whitespace-pre-wrap ${
                    message.sender === 'user' 
                      ? 'bg-blue-100 ml-auto max-w-3xl' 
                      : 'bg-white mr-auto max-w-3xl'
                  }`}
                >
                  {message.sender === 'user' ? (
                    message.text
                  ) : (
                    message.formatted ? (
                      message.formatted.map((part, i) => (
                        part.type === 'code' ? (
                          <pre key={i} className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto my-2">
                            <code>{part.content}</code>
                          </pre>
                        ) : (
                          <div key={i}>{part.content}</div>
                        )
                      ))
                    ) : (
                      message.text
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center text-gray-500'>
                <h2 className='text-xl font-semibold mb-2'>SHAN AI</h2>
                <p>Ask me anything and I'll do my best to help!</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className='p-4 bg-white border-t'>
          <div className='flex items-center max-w-3xl mx-auto bg-gray-100 rounded-full px-4 py-2'>
            <input
              placeholder='Message Gemini...'
              className='flex-1 bg-transparent outline-none px-2'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className={`p-2 rounded-full ${loading ? 'text-gray-400' : 'text-blue-500 hover:bg-gray-200'}`}
              onClick={handleQuery}
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          <p className='text-xs text-center text-gray-500 mt-2'>
            SHANAI may display inaccurate info, so double-check its responses.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App;