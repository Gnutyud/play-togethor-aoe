import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/lib/models/Room';

/**
 * GET /api/rooms/events
 * SSE (Server-Sent Events) for real-time room updates
 */
export async function GET(request: NextRequest) {
  const { signal } = request;
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      await connectDB();
      
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial heart-beat to keep connection alive
      sendEvent({ type: 'connected', timestamp: Date.now() });

      // Poll as a fallback if change streams are not available/supported in this env
      // In a real production with high load, use MongoDB Change Streams
      const interval = setInterval(async () => {
        try {
          const rooms = await Room.find()
            .sort({ type: -1, name: 1 })
            .select('-password');
            
          sendEvent({ type: 'rooms_update', rooms });
        } catch (err) {
          console.error("SSE Poll error:", err);
        }
      }, 5000); // Poll every 5 seconds for now

      signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
