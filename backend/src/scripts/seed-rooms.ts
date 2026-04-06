/**
 * Seed script to create 10 default public rooms
 *
 * Usage: npm run seed
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
      console.log(
        "Do you want to recreate them? (This will delete existing default rooms)"
      );
      console.log(
        "Run with --force flag to recreate: npm run seed -- --force\n"
      );

      const hasForceFlag = process.argv.includes("--force");

      if (!hasForceFlag) {
        console.log("✅ Seed aborted. Use --force to recreate default rooms.");
        process.exit(0);
      }

      console.log("🗑️  Deleting existing default rooms...");
      await Room.deleteMany({ type: "default" });
      console.log(`✅ Deleted ${existingDefaultRooms.length} default rooms\n`);
    }

    // Create 10 default rooms
    const defaultRooms = [];

    for (let i = 1; i <= 10; i++) {
      const networkId = process.env[`RADMIN_NETWORK_${i}_ID`];
      const networkPassword = process.env[`RADMIN_NETWORK_${i}_PASSWORD`];

      if (!networkId || !networkPassword) {
        console.error(`❌ Missing environment variables for Network ${i}`);
        console.error(
          `   Required: RADMIN_NETWORK_${i}_ID and RADMIN_NETWORK_${i}_PASSWORD`
        );
        console.error("   Please check your .env file\n");
        process.exit(1);
      }

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
      });
    }

    // Insert all default rooms
    const createdRooms = await Room.insertMany(defaultRooms);

    console.log(
      `✅ Successfully created ${createdRooms.length} default rooms:\n`
    );

    createdRooms.forEach((room, index) => {
      console.log(`   ${index + 1}. ${room.name}`);
      console.log(`      - ID: ${room._id}`);
      console.log(`      - Type: ${room.type}`);
      console.log(`      - Max Players: ${room.maxPlayers}`);
      console.log(`      - Radmin Network: ${room.radminNetworkId}\n`);
    });

    console.log("🎉 Seed completed successfully!\n");
    console.log("You can now:");
    console.log("  1. Start the dev server: npm run dev");
    console.log("  2. Test the API: GET http://localhost:3000/api/rooms\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

// Run seed
seedDefaultRooms();
