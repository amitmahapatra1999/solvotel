"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TextField,
  Box,
} from "@mui/material";

export default function Billing() {
  const router = useRouter();
  const [billingData, setBillingData] = useState([]);
  const [originalBillingData, setOriginalBillingData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = getCookie("authToken");
        const usertoken = getCookie("userAuthToken");
        if (!token && !usertoken) {
          router.push("/"); // Redirect to login if no token is found
          return;
        }

        let decoded, userId;
        if (token) {
          // Verify the authToken (legacy check)
          decoded = await jwtVerify(
            token,
            new TextEncoder().encode(SECRET_KEY)
          );
          userId = decoded.payload.id;
        }
        if (usertoken) {
          // Verify the userAuthToken
          decoded = await jwtVerify(
            usertoken,
            new TextEncoder().encode(SECRET_KEY)
          );
          userId = decoded.payload.profileId; // Use userId from the new token structure
        }

        // Fetch the profile by userId to get the username
        const profileResponse = await fetch(`/api/Profile/${userId}`);
        const profileData = await profileResponse.json();
        console.log(profileData);
        if (!profileData.success || !profileData.data) {
          router.push("/"); // Redirect to login if profile not found
          return;
        }
        const username = profileData.data.username;
        const [roomsResponse, billingResponse, bookingResponse] =
          await Promise.all([
            fetch(`/api/rooms?username=${username}`),
            fetch(`/api/Billing?username=${username}`),
            fetch(`/api/NewBooking?username=${username}`),
          ]);

        const [roomsResult, billingResult, bookingResult] = await Promise.all([
          roomsResponse.json(),
          billingResponse.json(),
          bookingResponse.json(),
        ]);

        console.log(roomsResult, billingResult, bookingResult);

        if (
          roomsResult.success &&
          billingResult.success &&
          bookingResult.success
        ) {
          const billingsMap = new Map(
            billingResult.data.map((bill) => [bill._id, bill])
          );

          const bookingsMap = new Map(
            bookingResult.data.map((booking) => [booking._id, booking])
          );

          const enrichedBills = roomsResult.data
            .flatMap((room) => {
              if (!room.billWaitlist || room.billWaitlist.length === 0)
                return [];

              return room.billWaitlist.map((billId, index) => {
                const bill = billingsMap.get(billId._id);
                console.log(bill);
                if (!bill) return null;

                const guestId = room.guestWaitlist[index];
                const guest = bookingsMap.get(guestId._id);

                return {
                  ...bill,
                  roomNo: room.number.toString(),
                  guestName: guest ? guest.guestName : "N/A",
                  date: bill.date || new Date().toISOString().split("T")[0],
                };
              });
            })
            .filter(Boolean);

          setBillingData(enrichedBills);
          setOriginalBillingData(enrichedBills);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBillingData = useMemo(() => {
    let result = originalBillingData;

    if (startDate && endDate) {
      result = result.filter((bill) => {
        const billDate = new Date(bill.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return billDate >= start && billDate <= end;
      });
    }

    return result;
  }, [originalBillingData, startDate, endDate]);

  const totals = useMemo(() => {
    return filteredBillingData.reduce(
      (acc, bill) => ({
        totalAmount: acc.totalAmount + (bill.totalAmount || 0),
        totalAdvanced: acc.totalAdvanced + (bill.amountAdvanced || 0),
        totalDue: acc.totalDue + (bill.dueAmount || 0),
      }),
      { totalAmount: 0, totalAdvanced: 0, totalDue: 0 }
    );
  }, [filteredBillingData]);

  const shouldShowTable = startDate && endDate;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="loader"></div>
            <span className="mt-4 text-gray-700">Loading Room Report...</span>
          </div>
        </div>
      )}
      <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
        <h1 className="text-3xl font-bold text-cyan-900 mb-4">Room Report</h1>
        <div className="space-x-3 flex mb-4 ">
          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            className="w-1/4 "
            size="small"
          />
          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            className="w-1/4 "
            size="small"
          />
        </div>
        {shouldShowTable && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Room Number
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Guest
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Total Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Amount Paid in Advance
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Due Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBillingData.length > 0 ? (
                  <>
                    {filteredBillingData.map((bill, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ textAlign: "center" }}>
                          {bill.date}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {bill.roomNo || "N/A"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {bill.guestName || "N/A"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          ₹{bill.totalAmount || 0}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          ₹{bill.amountAdvanced || 0}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          ₹{bill.dueAmount || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}
                    >
                      <TableCell
                        colSpan={3}
                        sx={{ textAlign: "right", fontWeight: "bold" }}
                      >
                        Totals:
                      </TableCell>
                      <TableCell
                        sx={{ textAlign: "center", fontWeight: "bold" }}
                      >
                        ₹{totals.totalAmount}
                      </TableCell>
                      <TableCell
                        sx={{ textAlign: "center", fontWeight: "bold" }}
                      >
                        ₹{totals.totalAdvanced}
                      </TableCell>
                      <TableCell
                        sx={{ textAlign: "center", fontWeight: "bold" }}
                      >
                        ₹{totals.totalDue}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No records available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <Footer />
    </div>
  );
}
