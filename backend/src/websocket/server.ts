import { WebSocketServer as WSServer, WebSocket } from 'ws';
import pool from '../db/connection';

interface Client {
  ws: WebSocket;
  userId?: number;
  latitude?: number;
  longitude?: number;
  subscribedChannels: Set<string>;
}

/**
 * WebSocket Server for real-time traffic updates
 * Implements geographic scoping - users only receive alerts for nearby incidents
 */
export class WebSocketServer {
  private wss: WSServer;
  private port: number;
  private clients: Map<WebSocket, Client> = new Map();

  constructor(port: number) {
    this.port = port;
    this.wss = new WSServer({ port });
  }

  start() {
    this.wss.on('connection', (ws: WebSocket) => {
      const client: Client = {
        ws,
        subscribedChannels: new Set(),
      };
      this.clients.set(ws, client);

      console.log(`WebSocket client connected. Total clients: ${this.clients.size}`);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to ETraffic real-time server',
      }));
    });

    console.log(`🚀 WebSocket server running on ws://localhost:${this.port}`);

    // Start broadcasting incidents periodically
    this.startIncidentBroadcast();
  }

  private handleMessage(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'authenticate':
        client.userId = data.userId;
        ws.send(JSON.stringify({ type: 'authenticated' }));
        break;

      case 'update_location':
        client.latitude = data.latitude;
        client.longitude = data.longitude;
        // Subscribe to geographic channel
        const channel = this.getChannelForLocation(data.latitude, data.longitude);
        client.subscribedChannels.add(channel);
        ws.send(JSON.stringify({
          type: 'location_updated',
          channel,
        }));
        break;

      case 'subscribe':
        if (data.channel) {
          client.subscribedChannels.add(data.channel);
        }
        break;

      case 'unsubscribe':
        if (data.channel) {
          client.subscribedChannels.delete(data.channel);
        }
        break;
    }
  }

  /**
   * Get geographic channel for location
   * Divides map into grid cells (approximately 1km x 1km)
   */
  private getChannelForLocation(lat: number, lng: number): string {
    // Simple grid-based channel (can be refined)
    const gridSize = 0.01; // ~1km
    const gridLat = Math.floor(lat / gridSize);
    const gridLng = Math.floor(lng / gridSize);
    return `location:${gridLat}:${gridLng}`;
  }

  /**
   * Broadcast new incident to nearby clients
   */
  async broadcastIncident(incident: any) {
    const message = {
      type: 'incident',
      data: incident,
    };

    // Find clients in same geographic area
    const incidentChannel = this.getChannelForLocation(
      incident.latitude,
      incident.longitude
    );

    this.clients.forEach((client) => {
      if (
        client.ws.readyState === WebSocket.OPEN &&
        (client.subscribedChannels.has(incidentChannel) ||
          client.subscribedChannels.has('all'))
      ) {
        // Also check if client is within radius
        if (client.latitude && client.longitude) {
          const distance = this.calculateDistance(
            { lat: client.latitude, lng: client.longitude },
            { lat: incident.latitude, lng: incident.longitude }
          );
          if (distance <= 5000) {
            // 5km radius
            client.ws.send(JSON.stringify(message));
          }
        } else {
          client.ws.send(JSON.stringify(message));
        }
      }
    });
  }

  /**
   * Broadcast traffic update
   */
  broadcastTrafficUpdate(update: any) {
    const message = {
      type: 'traffic_update',
      data: update,
    };

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Send alert to specific user
   */
  sendAlert(userId: number, alert: any) {
    const message = {
      type: 'alert',
      data: alert,
    };

    this.clients.forEach((client) => {
      if (
        client.userId === userId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Start periodic broadcast of active incidents
   */
  private startIncidentBroadcast() {
    setInterval(async () => {
      try {
        const [incidents] = await pool.query(
          `SELECT * FROM incidents WHERE status = 'active' ORDER BY created_at DESC LIMIT 50`
        ) as any[];

        if (incidents.length > 0) {
          this.clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'incidents_update',
                data: incidents.map((inc: any) => ({
                  id: inc.id,
                  incidentType: inc.incident_type,
                  latitude: parseFloat(inc.latitude),
                  longitude: parseFloat(inc.longitude),
                  severity: inc.severity,
                  isVerified: inc.is_verified,
                  createdAt: inc.created_at,
                })),
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error broadcasting incidents:', error);
      }
    }, 30000); // Every 30 seconds
  }
}

