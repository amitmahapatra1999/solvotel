import mongoose from "mongoose";
import connectSTR from "../../../lib/dbConnect";
import Profile from "../../../lib/models/Profile";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { NextResponse } from "next/server";
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const connectToDatabase = async () => {
  if (mongoose.connections[0]?.readyState === 1) return;
  try {
    await mongoose.connect(connectSTR, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error("Database connection error:", err.message);
    throw new Error("Database connection failed.");
  }
};

// GET method to fetch a specific profile by ID
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    // Extract the token from cookies
    const authToken = req.cookies.get("authToken")?.value;
    const userAuthToken = req.cookies.get("userAuthToken")?.value;
    if (!authToken && !userAuthToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token missing",
        },
        { status: 401 }
      );
    }

    let decoded, userId;
    if (authToken) {
      // Verify the authToken (legacy check)
      decoded = await jwtVerify(
        authToken,
        new TextEncoder().encode(SECRET_KEY)
      );
      userId = decoded.payload.id;
    } else if (userAuthToken) {
      // Verify the userAuthToken
      decoded = await jwtVerify(
        userAuthToken,
        new TextEncoder().encode(SECRET_KEY)
      );
      userId = decoded.payload.profileId; // Use userId from the new token structure
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token structure",
        },
        { status: 400 }
      );
    }
    const profile = await Profile.findById(userId);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile" },
      { status: 400 }
    );
  }
}

// PUT method to update a specific profile by ID
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params; // Await params before destructuring
    const data = await req.json();
    
    // Extract the token from cookies
    const authToken = req.cookies.get("authToken")?.value;
    const userAuthToken = req.cookies.get("userAuthToken")?.value;
    const adminToken = req.cookies.get("adminauthToken")?.value;
    
    console.log("Auth tokens:", { 
      authToken: !!authToken, 
      userAuthToken: !!userAuthToken,
      adminToken: !!adminToken 
    });
    console.log("Update data received:", data);
    
    if (!authToken && !userAuthToken && !adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token missing",
        },
        { status: 401 }
      );
    }

    // If admin token is present, skip other token checks
    if (adminToken) {
      console.log("Admin token found, proceeding with admin privileges");
      // Admin can update any profile without additional checks
    } else {
      // Regular user token validation
      let decoded, userId;
      if (authToken) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(
          authToken,
          new TextEncoder().encode(SECRET_KEY)
        );
        userId = decoded.payload.id;
      } else if (userAuthToken) {
        // Verify the userAuthToken
        decoded = await jwtVerify(
          userAuthToken,
          new TextEncoder().encode(SECRET_KEY)
        );
        userId = decoded.payload.profileId; // Use userId from the new token structure
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid token structure",
          },
          { status: 400 }
        );
      }
      
      // For regular users, ensure they can only update their own profile
      if (userId !== id) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized to update this profile",
          },
          { status: 403 }
        );
      }
    }
    
    // Find the profile by ID
    const profile = await Profile.findById(id);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        { status: 404 }
      );
    }
    
    // Check if username is being changed and if it already exists
    if (data.username && data.username !== profile.username) {
      const existingProfile = await Profile.findOne({ username: data.username });
      if (existingProfile && existingProfile._id.toString() !== id) {
        return NextResponse.json(
          {
            success: false,
            error: "Username already exists",
          },
          { status: 400 }
        );
      }
    }
    
    // Hash the password if it is provided
    let updatedData = { ...data };
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updatedData.password = hashedPassword;
    }
    
    // Update the profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );
    
    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: updatedProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}

// DELETE method to delete a specific profile by ID
export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params; // Await params before destructuring
    // Find and delete the profile by ID
    const deletedProfile = await Profile.findByIdAndDelete(id);
    if (!deletedProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Profile deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete profile" },
      { status: 400 }
    );
  }
}

// PATCH route to toggle the active status
export async function PATCH(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params; // Await params
    
    // Extract the token from cookies
    const authToken = req.cookies.get("authToken")?.value;
    const userAuthToken = req.cookies.get("userAuthToken")?.value;
    const adminToken = req.cookies.get("adminauthToken")?.value;
    
    if (!authToken && !userAuthToken && !adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token missing",
        },
        { status: 401 }
      );
    }
    
    // Only proceed if admin token is present (only admins should toggle active status)
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin privileges required",
        },
        { status: 403 }
      );
    }

    // Find the profile by ID
    const profile = await Profile.findById(id);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        { status: 404 }
      );
    }

    // Toggle the active status
    const updatedProfile = await Profile.findByIdAndUpdate(
      id,
      { Active: profile.Active === "yes" ? "no" : "yes" },
      { new: true }
    );

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling active status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle active status" },
      { status: 400 }
    );
  }
}
