'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Container, Skeleton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuth, setHasAuth] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const idCounterRef = useRef(0)
  const nextId = () => `${++idCounterRef.current}`

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)

      // Initialize with welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '👋 Hi! I\'m your financial assistant. I can help you understand your spending, answer questions about your finances, and provide personalized recommendations. What would you like to know?',
          timestamp: new Date(),
        },
      ])

      setIsLoading(false)
    }

    checkAuth()
  }, [supabase.auth, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: nextId(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsWaitingForResponse(true)

    try {
      // Simulate AI response (in production, this would call an AI API)
      const response = await generateAIResponse(input)

      const assistantMessage: Message = {
        id: nextId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast({
        type: 'error',
        message: 'Failed to get response',
      })
    } finally {
      setIsWaitingForResponse(false)
    }
  }

  const generateAIResponse = async (userInput: string): Promise<string> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('spending') || lowerInput.includes('spent')) {
      return '💰 Based on your transaction history, your spending has been relatively consistent this month. Would you like me to analyze a specific category?'
    } else if (lowerInput.includes('budget') || lowerInput.includes('afford')) {
      return "💡 Your current budget allocation looks good! You're maintaining a healthy safety buffer. Keep up the good spending habits!"
    } else if (lowerInput.includes('save') || lowerInput.includes('savings')) {
      return "📈 Great question! To improve your savings, consider:\n1. Reviewing subscription services you don't use\n2. Setting a daily spending limit\n3. Planning large purchases in advance\n\nWould you like me to help with any of these?"
    } else if (lowerInput.includes('help') || lowerInput.includes('how')) {
      return "🤖 I can help you with:\n• Understanding your spending patterns\n• Setting budgets for categories\n• Checking if you can afford purchases\n• Finding ways to save money\n• Tracking recurring expenses\n\nJust ask me anything about your finances!"
    } else {
      return "📊 That's a great question! While I'm still learning, I can help you track spending, set budgets, and make smart financial decisions. What specific financial question can I help with?"
    }
  }

  if (!hasAuth) return null

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8 flex flex-col h-screen">
        {/* Hero */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
                <p className="text-violet-100">Ask me anything about your finances</p>
              </div>
              <div className="text-6xl">🤖</div>
            </div>
          </Container>
        </div>

        {/* Chat Area */}
        <Container className="py-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {isLoading ? (
              <Skeleton count={3} className="h-20" />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    isGlass
                    className={`max-w-md md:max-w-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <p className={message.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}>
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </Card>
                </div>
              ))
            )}

            {isWaitingForResponse && (
              <div className="flex justify-start">
                <Card isGlass>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </Container>

        {/* Input Area */}
        <Container className="py-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your spending, budgets, or financial advice..."
              disabled={isWaitingForResponse}
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                placeholder-slate-500 dark:placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-violet-500
                disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isWaitingForResponse || !input.trim()}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Try asking:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  'How am I spending?',
                  'Can I save more?',
                  'Budget tips?',
                  'Spending insights?',
                ].map((question) => (
                  <button
                    key={question}
                    onClick={() => setInput(question)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                      text-slate-900 dark:text-white text-sm rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>
    </DashboardLayout>
  )
}
