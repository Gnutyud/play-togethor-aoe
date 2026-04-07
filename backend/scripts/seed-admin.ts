import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/lib/models/User";

// Env loaded via --env-file flag
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected successfully");

    const adminUsername = "admin";
    const adminPassword = "admin";

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log(
        "Admin account already exists. Updating password and role...",
      );
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Admin account updated successfully");
    } else {
      console.log("Creating new admin account...");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername,
        password: hashedPassword,
        role: "admin",
      });
      console.log("Admin account created successfully");
    }

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedAdmin();
