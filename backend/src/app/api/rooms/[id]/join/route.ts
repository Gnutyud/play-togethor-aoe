import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Room from "@/lib/models/Room";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/auth";
import { validateBody, JoinRoomSchema } from "@/lib/validation";

export async function POST(
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

    // Parse and validate request body
    const body = await request.json();
    const validation = validateBody(JoinRoomSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors.format(),
        },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    await connectDB();

    // Find room
    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    // Verify password if room has one
    if (room.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, room.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    // Add player to room
    room.addPlayer(tokenPayload.userId, tokenPayload.username);
    await room.save();

    // Update user's currentRoomId
    await User.findByIdAndUpdate(tokenPayload.userId, {
      currentRoomId: room._id.toString(),
    });

    return NextResponse.json(
      {
        message: "Joined room successfully",
        room: {
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
          radminNetworkId: room.radminNetworkId,
          radminNetworkPassword: room.radminNetworkPassword,
          ownerId: room.ownerId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
