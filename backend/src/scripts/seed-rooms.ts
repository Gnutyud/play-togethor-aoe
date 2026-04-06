/**
 * Seed script to create default public rooms based on .env
 *
 * Usage: npm run seed
 * Force recreate: npm run seed -- --force
 */

import mongoose from "mongoose";
import Room from "../lib/models/Room";
import connectDB from "../lib/mongodb";

async function seedDefaultRooms() {
  try {
    console.log("🌱 Starting seed process for default rooms...\n");

    // Connect to database
    await connectDB();

    // Check if default rooms already exist
    const existingDefaultRooms = await Room.find({ type: "default" });

    if (existingDefaultRooms.length > 0) {
      console.log(
        `⚠️  Found ${existingDefaultRooms.length} existing default rooms.`
      );

      const hasForceFlag = process.argv.includes("--force");

      if (!hasForceFlag) {
        console.log(
          "\nRun with --force flag to recreate: npm run seed -- --force\n"
        );
        console.log("✅ Seed aborted. Use --force to recreate default rooms.");
        process.exit(0);
      }

      console.log("🗑️  Deleting existing default rooms...");
      await Room.deleteMany({ type: "default" });
      console.log(`✅ Deleted ${existingDefaultRooms.length} default rooms\n`);
    }

    // Create default rooms based on ENV
    const defaultRooms = [];

    // Max 10 rooms from .env
    for (let i = 1; i <= 10; i++) {
      const networkId = process.env[`RADMIN_NETWORK_${i}_ID`];
      const networkPassword = process.env[`RADMIN_NETWORK_${i}_PASSWORD`];

      if (networkId && networkPassword) {
        defaultRooms.push({
          type: "default",
          name: `Room #${i}`,
          password: undefined, // No password for default rooms
          maxPlayers: 8,
          players: [],
          radminNetworkId: networkId,
          radminNetworkPassword: networkPassword,
          ownerId: undefined, // No owner for default rooms
          lastActivity: new Date(),
          lastHeartbeat: new Date(),
        });
        console.log(`📡 Prepared Network ${i}: ${networkId}`);
      }
    }

    if (defaultRooms.length === 0) {
      console.error("❌ No Radmin networks found in .env (RADMIN_NETWORK_X_ID)");
      process.exit(1);
    }

    // Insert all default rooms
    const createdRooms = await Room.insertMany(defaultRooms);

    console.log(
      `\n✅ Successfully created ${createdRooms.length} default rooms:\n`
    );

    createdRooms.forEach((room, index) => {
      console.log(`   ${index + 1}. ${room.name}`);
      console.log(`      - ID: ${room._id}`);
      console.log(`      - Radmin Network: ${room.radminNetworkId}`);
    });

    console.log("\n🎉 Seed completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

// Run seed
seedDefaultRooms();
