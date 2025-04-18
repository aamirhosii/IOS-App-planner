"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSupabase } from "@/components/supabase-provider"

type MessageHandler = (data: any) => void

interface WebSocketHook {
  sendMessage: (type: string, conversationId: string, data: any) => void
  isConnected: boolean
  joinConversation: (conversationId: string) => void
  onlineUsers: Set<string>
  typingUsers: Map<string, string>
}

export function useWebSocket(): WebSocketHook {
  const { supabase } = useSupabase()
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const messageHandlersRef = useRef<Map<string, MessageHandler[]>>(new Map())
  const conversationsJoinedRef = useRef<Set<string>>(new Set())

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = async () => {
      // Get current user and session
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//${window.location.host}/api/ws`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
        // Authenticate with the WebSocket server
        ws.send(
          JSON.stringify({
            auth: {
              userId: session.user.id,
              token: session.access_token,
            },
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle connection confirmation
          if (data.type === "connected") {
            setIsConnected(true)

            // Join all previously joined conversations
            if (conversationsJoinedRef.current.size > 0) {
              ws.send(
                JSON.stringify({
                  join: Array.from(conversationsJoinedRef.current),
                }),
              )
            }
          }

          // Handle different message types
          if (data.type === "new_message") {
            // Trigger handlers for new messages
            triggerHandlers("message", data)
          }

          if (data.type === "typing") {
            // Update typing users
            if (data.data.isTyping) {
              setTypingUsers((prev) => {
                const newMap = new Map(prev)
                newMap.set(data.data.userId, data.conversationId)
                return newMap
              })
            } else {
              setTypingUsers((prev) => {
                const newMap = new Map(prev)
                newMap.delete(data.data.userId)
                return newMap
              })
            }

            // Trigger handlers for typing status
            triggerHandlers("typing", data)
          }

          if (data.type === "read_receipt") {
            // Trigger handlers for read receipts
            triggerHandlers("read_receipt", data)
          }

          if (data.type === "user_online") {
            // Update online users
            if (data.data.isOnline) {
              setOnlineUsers((prev) => {
                const newSet = new Set(prev)
                newSet.add(data.data.userId)
                return newSet
              })
            } else {
              setOnlineUsers((prev) => {
                const newSet = new Set(prev)
                newSet.delete(data.data.userId)
                return newSet
              })
            }

            // Trigger handlers for online status
            triggerHandlers("user_online", data)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)

        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000)
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        ws.close()
      }
    }

    connectWebSocket()

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [supabase])

  // Function to send a message through the WebSocket
  const sendMessage = useCallback(
    (type: string, conversationId: string, data: any) => {
      if (wsRef.current && isConnected) {
        wsRef.current.send(
          JSON.stringify({
            type,
            conversationId,
            data,
          }),
        )
        return true
      }
      return false
    },
    [isConnected],
  )

  // Function to join a conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      conversationsJoinedRef.current.add(conversationId)

      if (wsRef.current && isConnected) {
        wsRef.current.send(
          JSON.stringify({
            join: [conversationId],
          }),
        )
      }
    },
    [isConnected],
  )

  // Function to register message handlers
  const registerHandler = useCallback((type: string, handler: MessageHandler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, [])
    }
    messageHandlersRef.current.get(type)?.push(handler)

    // Return unregister function
    return () => {
      const handlers = messageHandlersRef.current.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index !== -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }, [])

  // Function to trigger handlers for a specific type
  const triggerHandlers = useCallback((type: string, data: any) => {
    const handlers = messageHandlersRef.current.get(type)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }, [])

  return {
    sendMessage,
    isConnected,
    joinConversation,
    onlineUsers,
    typingUsers,
  }
}
