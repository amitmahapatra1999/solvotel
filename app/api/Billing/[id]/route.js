// Dynamic Route (api/billing/[id]/route.js)
import mongoose from "mongoose";
import connectSTR from "../../../lib/dbConnect";
import Billing from "../../../lib/models/Billing";
import Profile from "../../../lib/models/Profile"; // Import Profile model
import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export async function GET(req, { params }) {
  const { id } = await params;
  try {
    await mongoose.connect(connectSTR);
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
    const bill = await Billing.findById(id);

    if (!bill || bill.username !== profile.username) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: bill }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bill" },
      { status: 400 }
    );
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  try {
    await mongoose.connect(connectSTR);
    const data = await req.json();
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
    const billingData = await Billing.findById(id);

    if (!billingData || billingData.username !== profile.username) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    // Update roomNo if provided
    if (data.roomNo) {
      billingData.roomNo = data.roomNo; // Handle array of room numbers
    }

    // Update existing fields with new logic to handle lists
    const updatedItemList = Array.isArray(data.itemList)
      ? data.itemList
      : Array.isArray(billingData.itemList)
      ? billingData.itemList
      : [];
    const updatedPriceList = Array.isArray(data.priceList)
      ? data.priceList
      : Array.isArray(billingData.priceList)
      ? billingData.priceList
      : [];
    const updatedQuantityList = Array.isArray(data.quantityList)
      ? data.quantityList
      : Array.isArray(billingData.quantityList)
      ? billingData.quantityList
      : [];
    const updatedTaxList = Array.isArray(data.taxList)
      ? data.taxList
      : Array.isArray(billingData.taxList)
      ? billingData.taxList
      : [];
    const updatedCGSTArray = Array.isArray(data.cgstArray)
      ? data.cgstArray
      : Array.isArray(billingData.cgstArray)
      ? billingData.cgstArray
      : [];
    const updatedSGSTArray = Array.isArray(data.sgstArray)
      ? data.sgstArray
      : Array.isArray(billingData.sgstArray)
      ? billingData.sgstArray
      : [];

    // Handle remarks updates - ensure arrays exist
    if (data.FoodRemarks) {
      billingData.FoodRemarks = Array.isArray(billingData.FoodRemarks)
        ? billingData.FoodRemarks
        : [];
      billingData.FoodRemarks = data.FoodRemarks;
    }
    if (data.ServiceRemarks) {
      billingData.ServiceRemarks = Array.isArray(billingData.ServiceRemarks)
        ? billingData.ServiceRemarks
        : [];
      billingData.ServiceRemarks = data.ServiceRemarks;
    }
    if (data.RoomRemarks) {
      billingData.RoomRemarks = Array.isArray(billingData.RoomRemarks)
        ? billingData.RoomRemarks
        : [];
      billingData.RoomRemarks = data.RoomRemarks;
    }

    // Calculate total amount including taxes
    let totalAmount = 0;

    // Process each room's items
    updatedItemList.forEach((roomItems, roomIndex) => {
      const roomPrices = updatedPriceList[roomIndex] || [];
      const roomQuantities = updatedQuantityList[roomIndex] || [];
      const roomTaxes = updatedTaxList[roomIndex] || [];
      const roomCGST = updatedCGSTArray[roomIndex] || []; // Added for CGST
      const roomSGST = updatedSGSTArray[roomIndex] || []; // Added for SGST

      // Calculate total for this room
      roomItems.forEach((item, itemIndex) => {
        const price = roomPrices[itemIndex] || 0;
        const quantity = roomQuantities[itemIndex] || 1;

        // Use CGST and SGST if available, otherwise use taxRate
        const cgstRate =
          roomCGST[itemIndex] !== undefined
            ? roomCGST[itemIndex]
            : (roomTaxes[itemIndex] || 0) / 2;
        const sgstRate =
          roomSGST[itemIndex] !== undefined
            ? roomSGST[itemIndex]
            : (roomTaxes[itemIndex] || 0) / 2;

        // Calculate item total with tax
        const itemTotal = price * quantity;
        const cgstAmount = (itemTotal * cgstRate) / 100;
        const sgstAmount = (itemTotal * sgstRate) / 100;

        totalAmount += itemTotal + cgstAmount + sgstAmount;
      });
    });

    // Update the billing data
    billingData.itemList = updatedItemList;
    billingData.priceList = updatedPriceList;
    billingData.quantityList = updatedQuantityList;
    billingData.taxList = updatedTaxList;
    billingData.cgstArray = updatedCGSTArray; // Added for CGST
    billingData.sgstArray = updatedSGSTArray; // Added for SGST
    billingData.totalAmount = data.totalAmount || totalAmount;
    billingData.dueAmount =
      data.dueAmount || totalAmount - billingData.amountAdvanced;

    await billingData.save();
    return NextResponse.json(
      { success: true, data: billingData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update bill" },
      { status: 400 }
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = await params; // Add await for Next.js 15
  try {
    await mongoose.connect(connectSTR);
    const data = await req.json();

    // Authentication and authorization
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

    // Get existing bill
    const bill = await Billing.findById(id);
    if (!bill || bill.username !== profile.username) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    if (data.dueAmount) {
      bill.dueAmount = data.dueAmount;
    }

    // Handle itemList, priceList, quantityList, taxList, cgstArray, and sgstArray updates
    if (data.itemList && data.priceList && data.quantityList) {
      const roomIndex = data.roomIndex || 0;

      // Initialize bill arrays if they don't exist
      if (!Array.isArray(bill.itemList)) bill.itemList = [];
      if (!Array.isArray(bill.hsnList)) bill.hsnList = [];
      if (!Array.isArray(bill.priceList)) bill.priceList = [];
      if (!Array.isArray(bill.quantityList)) bill.quantityList = [];
      if (!Array.isArray(bill.taxList)) bill.taxList = [];
      if (!Array.isArray(bill.cgstArray)) bill.cgstArray = [];
      if (!Array.isArray(bill.sgstArray)) bill.sgstArray = [];

      // Initialize arrays at room index if they don't exist
      while (bill.itemList.length <= roomIndex) bill.itemList.push([]);
      while (bill.hsnList.length <= roomIndex) bill.hsnList.push([]);
      while (bill.priceList.length <= roomIndex) bill.priceList.push([]);
      while (bill.quantityList.length <= roomIndex) bill.quantityList.push([]);
      while (bill.taxList.length <= roomIndex) bill.taxList.push([]);
      while (bill.cgstArray.length <= roomIndex) bill.cgstArray.push([]);
      while (bill.sgstArray.length <= roomIndex) bill.sgstArray.push([]);

      // Update arrays with new data
      bill.itemList[roomIndex] = data.itemList[roomIndex];
      bill.hsnList[roomIndex] = data.hsnList[roomIndex];
      bill.priceList[roomIndex] = data.priceList[roomIndex];
      bill.quantityList[roomIndex] = data.quantityList[roomIndex];
      bill.taxList[roomIndex] = data.taxList[roomIndex];

      // Update CGST and SGST arrays if provided
      if (data.cgstArray && data.cgstArray[roomIndex]) {
        bill.cgstArray[roomIndex] = data.cgstArray[roomIndex];
      }
      if (data.sgstArray && data.sgstArray[roomIndex]) {
        bill.sgstArray[roomIndex] = data.sgstArray[roomIndex];
      }

      // Recalculate total amount with taxes
      let totalAmount = 0;

      bill.itemList.forEach((roomItems, roomIdx) => {
        const roomPrices = bill.priceList[roomIdx] || [];
        const roomQuantities = bill.quantityList[roomIdx] || [];
        const roomTaxes = bill.taxList[roomIdx] || [];
        const roomCGST = bill.cgstArray[roomIdx] || [];
        const roomSGST = bill.sgstArray[roomIdx] || [];

        roomItems.forEach((item, itemIdx) => {
          const price = roomPrices[itemIdx] || 0;
          const quantity = roomQuantities[itemIdx] || 1;

          // Use CGST and SGST if available, otherwise use taxRate
          const cgstRate =
            roomCGST[itemIdx] !== undefined
              ? roomCGST[itemIdx]
              : (roomTaxes[itemIdx] || 0) / 2;
          const sgstRate =
            roomSGST[itemIdx] !== undefined
              ? roomSGST[itemIdx]
              : (roomTaxes[itemIdx] || 0) / 2;

          // Calculate item total with tax
          const itemTotal = price * quantity;
          const cgstAmount = (itemTotal * cgstRate) / 100;
          const sgstAmount = (itemTotal * sgstRate) / 100;

          totalAmount += itemTotal + cgstAmount + sgstAmount;
        });
      });

      bill.totalAmount = totalAmount;
      bill.dueAmount = totalAmount - bill.amountAdvanced;
    }

    // Handle remarks updates
    const updateRemarks = (field, newRemarks) => {
      if (newRemarks) {
        if (!Array.isArray(bill[field])) bill[field] = [];
        bill[field] = Array.isArray(newRemarks)
          ? [...bill[field], ...newRemarks]
          : [...bill[field], newRemarks];
      }
    };

    updateRemarks("FoodRemarks", data.FoodRemarks);
    updateRemarks("ServiceRemarks", data.ServiceRemarks);
    updateRemarks("RoomRemarks", data.RoomRemarks);

    // Handle payment updates
    if (data.amountAdvanced !== undefined) {
      const newPayment = Number(data.amountAdvanced);
      if (newPayment > bill.totalAmount) {
        return NextResponse.json(
          { success: false, error: "Payment exceeds total amount" },
          { status: 400 }
        );
      }
      bill.amountAdvanced += newPayment;
      bill.dueAmount = bill.totalAmount - bill.amountAdvanced;

      // Add payment details
      const now = new Date();
      bill.DateOfPayment.push(now);
      bill.ModeOfPayment.push(data.ModeOfPayment.toString() || "Cash");
      bill.AmountOfPayment.push(newPayment);
    }

    // Handle status updates
    if (typeof data.Bill_Paid !== "undefined") {
      bill.Bill_Paid = data.Bill_Paid;
      if (data.Bill_Paid === "yes") bill.dueAmount = 0;
    }

    // Handle status updates
    if (typeof data.Cancelled !== "undefined") {
      bill.Cancelled = data.Cancelled;
      if (data.Cancelled === "yes") bill.dueAmount = 0;
    }

    const updatedBill = await bill.save();
    return NextResponse.json(
      { success: true, data: updatedBill },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update bill" },
      { status: 400 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;
  try {
    await mongoose.connect(connectSTR);
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
    const bill = await Billing.findById(id);
    if (!bill || bill.username !== profile.username) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }
    const deletedBill = await Billing.findByIdAndDelete(id);
    if (!deletedBill) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Bill deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bill" },
      { status: 400 }
    );
  }
}
