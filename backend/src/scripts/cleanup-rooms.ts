/**
 * Cleanup script to auto-delete empty custom rooms after 5 minutes
 *
 * This should be run as a cron job (every 1 minute) in production:
 * - Vercel: Use Vercel Cron Jobs
 * - Other platforms: Use system cron or scheduler
 *
 * For development: npm run cleanup
 */

import mongoose from "mongoose";
import Room from "../lib/models/Room";
import connectDB from "../lib/mongodb";
import { getNetworkPool } from "../lib/services/RadminNetworkPool";

const CLEANUP_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

async function cleanupEmptyCustomRooms() {
  try {
    console.log("🧹 Starting cleanup of empty custom rooms...\n");

    // Connect to database
    await connectDB();

    // Initialize network pool
    const networkPool = getNetworkPool();

    // Find empty custom rooms that haven't been active for > 5 minutes
    const thresholdTime = new Date(Date.now() - CLEANUP_THRESHOLD_MS);

    const emptyCustomRooms = await Room.find({
      type: "custom",
      players: { $size: 0 },
      lastActivity: { $lt: thresholdTime },
    });

    if (emptyCustomRooms.length === 0) {
      console.log("✅ No empty custom rooms to clean up.\n");

      // In production (cron job), just exit silently
      if (process.env.NODE_ENV === "production") {
        process.exit(0);
      }

      return;
    }

    console.log(
      `Found ${emptyCustomRooms.length} empty custom rooms to delete:\n`
    );

    for (const room of emptyCustomRooms) {
      const minutesInactive = Math.round(
        (Date.now() - room.lastActivity.getTime()) / 1000 / 60
      );

      console.log(`   - ${room.name}`);
      console.log(`     ID: ${room._id}`);
      console.log(`     Last activity: ${minutesInactive} minutes ago`);
      console.log(`     Network: ${room.radminNetworkId}\n`);

      // Release network back to pool
      networkPool.release(room.radminNetworkId);

      // Delete room
      await Room.findByIdAndDelete(room._id);
    }

    console.log(
      `✅ Successfully cleaned up ${emptyCustomRooms.length} empty custom rooms\n`
    );

    // Show available networks count
    const availableCount = networkPool.getAvailableCount();
    console.log(`📊 Available networks in pool: ${availableCount}/40\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    process.exit(1);
  }
}

// Run cleanup
cleanupEmptyCustomRooms();
