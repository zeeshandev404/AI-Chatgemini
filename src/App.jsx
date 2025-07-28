import { useState, useEffect } from 'react'
import './App.css'

export const API_KEY = "AIzaSyC70M2i9VHfwwJJWTWvzI36wV5ONZ2qYGo";
export const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_URL = `${BASE_URL}?key=${API_KEY}`;

function App() {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  
  // Load chat history from localStorage on initial render
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory')
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
  }, [chatHistory])

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

  const startNewChat = () => {
    if (messages.length > 0) {
      // Save current chat to history before starting new one
      const newChat = {
        id: Date.now(),
        title: messages[0].text.substring(0, 30) + (messages[0].text.length > 30 ? '...' : ''),
        messages: [...messages],
        timestamp: new Date().toISOString()
      }
      
      setChatHistory(prev => [newChat, ...prev])
    }
    setMessages([])
    setActiveChat(null)
  }

  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId)
    if (chat) {
      setMessages(chat.messages)
      setActiveChat(chatId)
    }
  }

  const deleteChat = (chatId, e) => {
    e.stopPropagation()
    setChatHistory(prev => prev.filter(c => c.id !== chatId))
    if (activeChat === chatId) {
      setMessages([])
      setActiveChat(null)
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true)
    try {
      // Add user message to chat
      const userMessage = { sender: 'user', text: query }
      setMessages(prev => [...prev, userMessage])
      
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
      const aiMessage = { 
        sender: 'ai', 
        text: aiResponse,
        formatted: formatMessage(aiResponse)
      }
      setMessages(prev => [...prev, aiMessage])
      
      // If this is a new chat (not loaded from history), create a history entry
      if (!activeChat && messages.length === 0) {
        const newChat = {
          id: Date.now(),
          title: query.substring(0, 30) + (query.length > 30 ? '...' : ''),
          messages: [userMessage, aiMessage],
          timestamp: new Date().toISOString()
        }
        setChatHistory(prev => [newChat, ...prev])
        setActiveChat(newChat.id)
      } else if (activeChat) {
        // Update existing chat in history
        setChatHistory(prev => prev.map(chat => 
          chat.id === activeChat 
            ? {...chat, messages: [...chat.messages, userMessage, aiMessage]}
            : chat
        ))
      }
      
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
      <div className='w-full md:w-64 bg-gray-800 text-white p-4 flex flex-col'>
        <div className='flex-1 overflow-y-auto'>
          <h1 className='text-xl font-bold mb-6'>SHAN AI</h1>
          <button 
            className='w-full text-left p-2 rounded hover:bg-gray-700 mb-4 flex items-center gap-2'
            onClick={startNewChat}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
          
          <div className='mb-2 text-sm text-gray-300 uppercase tracking-wider'>Chat History</div>
          <div className='space-y-1'>
            {chatHistory.length === 0 && (
              <div className='text-gray-400 text-sm p-2'>No chat history yet</div>
            )}
            {chatHistory.map(chat => (
              <div 
                key={chat.id}
                className={`p-2 rounded hover:bg-gray-700 cursor-pointer flex justify-between items-center group ${
                  activeChat === chat.id ? 'bg-gray-700' : ''
                }`}
                onClick={() => loadChat(chat.id)}
              >
                <div className='truncate flex-1'>{chat.title}</div>
                <button 
                  className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white'
                  onClick={(e) => deleteChat(chat.id, e)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className='pt-4 border-t border-gray-700'>
          <button className='w-full text-left p-2 rounded hover:bg-gray-700 flex items-center gap-2'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Settings
          </button>
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
                <p className='mt-4 text-sm'>Start a new chat or select one from your history</p>
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