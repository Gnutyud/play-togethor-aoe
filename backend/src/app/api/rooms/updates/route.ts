import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/lib/models/Room";

/**
 * GET /api/rooms/updates?since={timestamp}
 * Poll for room updates since given timestamp
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sinceParam = searchParams.get("since");

    // Parse since timestamp (default to 5 seconds ago if not provided)
    const since = sinceParam
      ? new Date(parseInt(sinceParam))
      : new Date(Date.now() - 5000);

    await connectDB();

    // Get all rooms updated since the timestamp
    const updatedRooms = await Room.find({
      updatedAt: { $gte: since },
    })
      .sort({ type: -1, name: 1 })
      .select("-password");

    // Also check for deleted rooms (we can't query deleted docs, so just return all current rooms)
    // The client will compare with their local state to detect deletions
    const allRooms = await Room.find()
      .sort({ type: -1, name: 1 })
      .select("-password");

    const roomsData = allRooms.map((room) => ({
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
      updatedAt: room.updatedAt,
    }));

    return NextResponse.json(
      {
        rooms: roomsData,
        timestamp: Date.now(),
        updatedCount: updatedRooms.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get updates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
