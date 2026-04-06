import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/lib/models/Room";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/auth";
import { getNetworkPool } from "@/lib/services/RadminNetworkPool";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from token
    const authHeader = request.headers.get("authorization");
    const tokenPayload = await getUserFromToken(authHeader);

    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find room
    const room = await Room.findById(params.id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Remove player from room
    const wasInRoom = room.players.some(
      (p) => p.userId === tokenPayload.userId
    );
    room.removePlayer(tokenPayload.userId);
    await room.save();

    // Update user's currentRoomId
    await User.findByIdAndUpdate(tokenPayload.userId, {
      currentRoomId: null,
    });

    // If custom room is now empty, mark for cleanup (will be deleted by cron after 5 min)
    if (room.type === "custom" && room.players.length === 0) {
      // The cleanup cron job will handle deletion
      console.log(`Custom room ${room._id} is now empty, marked for cleanup`);
    }

    return NextResponse.json(
      {
        message: "Left room successfully",
        wasInRoom,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Leave room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
