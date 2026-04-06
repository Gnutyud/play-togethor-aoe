import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/lib/models/Room';

const CLEANUP_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/cron/cleanup
 * Cron job to auto-delete empty custom rooms after 5 minutes of inactivity
 */
export async function GET(request: Request) {
  // Verify Cron secret if configured in Vercel
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    // Find empty custom rooms that haven't been active for > 5 minutes
    const thresholdTime = new Date(Date.now() - CLEANUP_THRESHOLD_MS);

    const emptyCustomRooms = await Room.find({
      type: 'custom',
      players: { $size: 0 },
      lastActivity: { $lt: thresholdTime },
    });

    if (emptyCustomRooms.length === 0) {
      return NextResponse.json({ message: 'No rooms to clean up' });
    }

    const roomNames = emptyCustomRooms.map(r => r.name);
    
    // Delete the rooms
    // NOTE: In the new stateless RadminNetworkPool, deleting from DB 
    // is enough to "release" the network ID.
    await Room.deleteMany({
      _id: { $in: emptyCustomRooms.map(r => r._id) }
    });

    console.log(`🧹 Cleaned up ${emptyCustomRooms.length} rooms: ${roomNames.join(', ')}`);

    return NextResponse.json({
      message: `Successfully cleaned up ${emptyCustomRooms.length} rooms`,
      cleanedRooms: roomNames
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
