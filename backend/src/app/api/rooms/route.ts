import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Room from '@/lib/models/Room';
import { getUserFromToken } from '@/lib/auth';
import { validateBody, CreateRoomSchema } from '@/lib/validation';
import { getNetworkPool } from '@/lib/services/RadminNetworkPool';
 
/**
 * GET /api/rooms
 * List all rooms (default + custom)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
   
    // Get all rooms, sorted by type (default first) then by name
    const rooms = await Room.find()
      .sort({ type: -1, name: 1 })
      .select('-password'); // Don't send password hashes
   
    // Transform rooms for response
    const roomsData = rooms.map((room) => ({
      id: room._id.toString(),
      type: room.type,
      name: room.name,
      hasPassword: !!room.password,
      maxPlayers: room.maxPlayers,
      playerCount: room.players.length,
      isFull: room.players.length >= room.maxPlayers,
      players: room.players.map((p) => ({
        userId: p.userId,
        username: p.username,
      })),
      ownerId: room.ownerId,
      createdAt: room.createdAt,
    }));
   
    return NextResponse.json(
      { rooms: roomsData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get rooms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 
/**
 * POST /api/rooms
 * Create a new custom room
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    const tokenPayload = await getUserFromToken(authHeader);
   
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
   
    // Parse and validate request body
    const body = await request.json();
    const validation = validateBody(CreateRoomSchema, body);
   
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors.format()
        },
        { status: 400 }
      );
    }
   
    const { name, password, maxPlayers } = validation.data;
   
    await connectDB();
   
    // Allocate a network from the pool
    const networkPool = getNetworkPool();
    const network = networkPool.allocate();
   
    if (!network) {
      return NextResponse.json(
        { error: 'No available networks. Maximum custom rooms reached.' },
        { status: 503 }
      );
    }
   
    try {
      // Hash password if provided
      const hashedPassword = password && password.trim() !== ''
        ? await bcrypt.hash(password, 10)
        : undefined;
     
      // Create custom room
      const room = await Room.create({
        type: 'custom',
        name,
        password: hashedPassword,
        maxPlayers: maxPlayers || 8,
        radminNetworkId: network.id,
        radminNetworkPassword: network.password,
        ownerId: tokenPayload.userId,
        players: [],
        lastActivity: new Date(),
      });
     
      return NextResponse.json(
        {
          message: 'Room created successfully',
          room: {
            id: room._id.toString(),
            type: room.type,
            name: room.name,
            hasPassword: !!room.password,
            maxPlayers: room.maxPlayers,
            playerCount: 0,
            isFull: false,
            players: [],
            ownerId: room.ownerId,
            createdAt: room.createdAt,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      // Release network if room creation fails
      networkPool.release(network.id);
      throw error;
    }
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}