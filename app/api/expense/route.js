import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import connectSTR from "../../lib/dbConnect";
import Expense from "../../lib/models/Expense";
import Profile from "../../lib/models/Profile";

// Load secret key from env
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Reusable DB connection function
const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(connectSTR, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Helper to get user ID from token
const getUserIdFromToken = async () => {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userAuthToken = cookieStore.get("userAuthToken")?.value;

  if (!authToken && !userAuthToken) {
    throw new Error("Authentication token missing");
  }

  const token = authToken || userAuthToken;
  const decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
  return authToken ? decoded.payload.id : decoded.payload.profileId;
};

// GET: Fetch all expenses for the authenticated user
export async function GET() {
  try {
    await connectToDatabase();

    const userId = await getUserIdFromToken();

    const profile = await Profile.findById(userId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const expenses = await Expense.find({ username: profile.username }).sort({
      date: -1,
    });
    return NextResponse.json(
      { success: true, data: expenses },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Add a new expense
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { title, description, date, amount, modeOfPayment } = body;

    // Validation
    if (!title || !date || !amount) {
      return NextResponse.json(
        { error: "Title, date, and amount are required" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || !Date.parse(date)) {
      return NextResponse.json(
        { error: "Invalid amount or date format" },
        { status: 400 }
      );
    }

    const userId = await getUserIdFromToken();

    const profile = await Profile.findById(userId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const newExpense = new Expense({
      title,
      description: description || "",
      date: date,
      amount: Number(amount),
      modeOfPayment: modeOfPayment || "",
      username: profile.username,
    });

    await newExpense.save();

    return NextResponse.json(
      {
        success: true,
        message: "Expense added successfully",
        data: newExpense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
