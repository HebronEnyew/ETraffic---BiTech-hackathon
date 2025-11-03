'use client'

let ws: WebSocket | null = null
let reconnectAttempts = 0
const maxReconnectAttempts = 5

export function connectWebSocket(
  onMessage: (data: any) => void,
  userId?: number
) {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001'

  if (ws?.readyState === WebSocket.OPEN) {
    return ws
  }

  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log('WebSocket connected')
    reconnectAttempts = 0
    
    if (userId) {
      ws?.send(JSON.stringify({
        type: 'authenticate',
        userId,
      }))
    }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error('WebSocket message parse error:', error)
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.onclose = () => {
    console.log('WebSocket disconnected')
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++
      setTimeout(() => {
        connectWebSocket(onMessage, userId)
      }, 3000 * reconnectAttempts)
    }
  }

  return ws
}

export function disconnectWebSocket() {
  if (ws) {
    ws.close()
    ws = null
  }
}

export function updateLocation(latitude: number, longitude: number) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'update_location',
      latitude,
      longitude,
    }))
  }
}

