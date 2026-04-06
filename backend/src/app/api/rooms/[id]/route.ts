import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/lib/models/Room";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/auth";
import { getNetworkPool } from "@/lib/services/RadminNetworkPool";

/**
 * DELETE /api/rooms/[id]
 * Delete a custom room (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from token
    const authHeader = request.headers.get("authorization");
    const tokenPayload = await getUserFromToken(authHeader);

    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find room
    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room is custom (default rooms cannot be deleted)
    if (room.type !== "custom") {
      return NextResponse.json(
        { error: "Cannot delete default rooms" },
        { status: 403 }
      );
    }

    // Check if user is owner
    if (room.ownerId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: "Only room owner can delete the room" },
        { status: 403 }
      );
    }

    // Update all players' currentRoomId to null
    const playerIds = room.players.map((p) => p.userId);
    if (playerIds.length > 0) {
      await User.updateMany(
        { _id: { $in: playerIds } },
        { currentRoomId: null }
      );
    }

    // Release network back to pool
    const networkPool = getNetworkPool();
    networkPool.release(room.radminNetworkId);

    // Delete room
    await Room.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Room deleted successfully",
        playersKicked: playerIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
