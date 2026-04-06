import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/lib/models/Room';

const CLEANUP_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * GET /api/cron/cleanup
 * Cron job to auto-delete empty custom rooms after 15 minutes of inactivity
 */
export async function GET(request: Request) {
  // Verify Cron secret if configured in Vercel
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cleanup request attempt');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    // Find custom rooms that haven't sent a heartbeat for > 15 minutes
    const thresholdTime = new Date(Date.now() - CLEANUP_THRESHOLD_MS);

    const staleCustomRooms = await Room.find({
      type: 'custom',
      lastHeartbeat: { $lt: thresholdTime },
    });

    if (staleCustomRooms.length === 0) {
      return NextResponse.json({ message: 'No stale rooms to clean up' });
    }

    const roomNames = staleCustomRooms.map(r => r.name);
    
    // Delete the rooms
    // NOTE: In the new stateless RadminNetworkPool, deleting from DB 
    // is enough to "release" the network ID.
    await Room.deleteMany({
      _id: { $in: staleCustomRooms.map(r => r._id) }
    });

    console.log(`🧹 Cleaned up ${staleCustomRooms.length} rooms: ${roomNames.join(', ')}`);

    return NextResponse.json({
      message: `Successfully cleaned up ${staleCustomRooms.length} rooms`,
      cleanedRooms: roomNames
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
