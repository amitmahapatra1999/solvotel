"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../_components/Navbar";
import Link from "next/link";
import { Add } from "@mui/icons-material";
import { Footer } from "../../_components/Footer";
import {
  Button,
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
import axios from "axios";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";
import { GetCustomDate } from "../../../utils/DateFetcher";

export default function Billing() {
  const router = useRouter();
  const [billingData, setBillingData] = useState([]);
  const [originalBillingData, setOriginalBillingData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchRoom, setSearchRoom] = useState("");
  const [searchGuest, setSearchGuest] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const authtoken = getCookie("authToken");
        const usertoken = getCookie("userAuthToken");
        if (!authtoken && !usertoken) {
          router.push("/"); // Redirect to login if no token is found
          return;
        }

        let decoded, userId;
        if (authtoken) {
          // Verify the authToken (legacy check)
          decoded = await jwtVerify(
            authtoken,
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
        const profileResponse = await fetch(`/api/Profile/${userId}`);
        const profileData = await profileResponse.json();
        if (!profileData.success || !profileData.data) {
          router.push("/");
          return;
        }
        const username = profileData.data.username;
        const token = document.cookie
          .split("; ")
          .find(
            (row) =>
              row.startsWith("authToken=") || row.startsWith("userAuthToken=")
          )
          .split("=")[1];
        const headers = { Authorization: `Bearer ${token}` };

        const [roomsResponse, billingResponse, bookingResponse] =
          await Promise.all([
            axios.get(`/api/rooms?username=${username}`, { headers }),
            axios.get(`/api/Billing?username=${username}`, { headers }),
            axios.get(`/api/NewBooking?username=${username}`, { headers }),
          ]);

        const roomsResult = roomsResponse.data.data;
        const billingResult = billingResponse.data.data;
        const bookingResult = bookingResponse.data.data;
        console.log(billingResult);
        console.log("Rooms Result : ", roomsResult);

        const billingsMap = new Map(
          billingResult.map((bill) => [bill._id, bill])
        );
        const bookingsMap = new Map(
          bookingResult.map((booking) => [booking._id, booking])
        );
        console.log("Billings Map : ", billingsMap);
        console.log("Bookings Map : ", bookingsMap);

        const enrichedBills = roomsResult
          .flatMap((room) => {
            if (!room.billWaitlist || room.billWaitlist.length === 0) return [];
            return room.billWaitlist.map((billId, index) => {
              const bill = billingsMap.get(billId._id);
              if (!bill) return null;
              const guestId = room.guestWaitlist[index];
              const guest = bookingsMap.get(guestId._id);
              return {
                bill,
                guestId: guestId._id,
                roomNo: room.number.toString(),
                guestName: guest ? guest.guestName : "N/A",
                bookingId: guest ? guest.bookingId : "N/A",
                checkInDate: guest ? guest.checkIn : null,
                currentBillingId: billId._id,
                timestamp: bill.createdAt || new Date().toISOString(),
              };
            });
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const groupedBills = enrichedBills.reduce((acc, cur) => {
          const key = cur.guestId;
          if (!acc[key]) {
            acc[key] = { ...cur, roomNo: [cur.roomNo] };
          } else {
            acc[key].roomNo.push(cur.roomNo);
          }
          return acc;
        }, {});

        const mergedBillings = Object.values(groupedBills);

        setBillingData(mergedBillings);
        setOriginalBillingData(mergedBillings);
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

    if (filterStatus !== "all") {
      if (
        ["Booked", "Checked In", "Checked Out", "Cancelled"].includes(
          filterStatus
        )
      ) {
        result = result.filter((bill) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkIn = new Date(bill.checkInDate);
          const checkOut = new Date(bill.checkOutDate);
          checkIn.setHours(0, 0, 0, 0);

          if (filterStatus === "Cancelled") {
            return bill.bill.Cancelled === "yes";
          } else if (filterStatus === "Booked") {
            return today < checkIn && bill.bill.Cancelled !== "yes";
          } else if (filterStatus === "Checked In") {
            return (
              today.toISOString() === checkIn.toISOString() &&
              bill.bill.Cancelled !== "yes"
            );
          } else if (filterStatus === "Checked Out") {
            return today > checkOut && bill.bill.Cancelled !== "yes";
          }
          return false;
        });
      } else {
        result = result.filter(
          (bill) =>
            bill.bill.Bill_Paid.toLowerCase() === filterStatus &&
            bill.bill.Cancelled !== "yes"
        );
      }
    }

    if (searchRoom) {
      result = result.filter((bill) =>
        bill.roomNo.toString().toLowerCase().includes(searchRoom.toLowerCase())
      );
    }
    if (searchGuest) {
      result = result.filter(
        (bill) =>
          bill.guestName.toLowerCase().includes(searchGuest.toLowerCase()) ||
          bill.guestId.includes(searchGuest)
      );
    }
    return result;
  }, [originalBillingData, filterStatus, searchRoom, searchGuest]);

  const handleViewBill = (bill) => {
    router.push(`/property/billing/guest-bill/${bill.currentBillingId}`);
  };

  const getGuestStatus = (bill) => {
    if (bill.bill.Cancelled === "yes") {
      return "Cancelled";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(bill.bill.checkInDate);
    checkIn.setHours(0, 0, 0, 0);

    if (today < checkIn) {
      return "Booked";
    } else if (
      today.toLocaleDateString("en-GB") === checkIn.toLocaleDateString("en-GB")
    ) {
      return "Checked In";
    } else if (bill.bill.Bill_Paid === "yes") {
      return "Checked Out";
    }
    return "Staying";
  };

  const getBillStatus = (bill) => {
    if (bill.bill.Cancelled === "yes") {
      return "Cancelled";
    }
    return bill.bill.Bill_Paid === "yes" ? "Paid" : "Unpaid";
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="loader"></div>
              <span className="mt-4 text-gray-700">Loading Bills...</span>
            </div>
          </div>
        )}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <div className="flex justify-between items-center mb-4">
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant={filterStatus === "all" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "yes" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setFilterStatus("yes")}
              >
                Paid
              </Button>
              <Button
                variant={filterStatus === "no" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setFilterStatus("no")}
              >
                UnPaid
              </Button>
              <Button
                variant={filterStatus === "Booked" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setFilterStatus("Booked")}
              >
                Booked
              </Button>
              <Button
                variant={
                  filterStatus === "Checked In" ? "contained" : "outlined"
                }
                color="primary"
                onClick={() => setFilterStatus("Checked In")}
              >
                Checked In
              </Button>
              <Button
                variant={
                  filterStatus === "Checked Out" ? "contained" : "outlined"
                }
                color="primary"
                onClick={() => setFilterStatus("Checked Out")}
              >
                Checked Out
              </Button>
              <Button
                variant={
                  filterStatus === "Cancelled" ? "contained" : "outlined"
                }
                color="primary"
                onClick={() => setFilterStatus("Cancelled")}
              >
                Cancelled
              </Button>
            </Box>
            <Link href="roomdashboard/newguest">
              <Button
                variant="contained"
                color="success"
                startIcon={<Add />}
                sx={{
                  textTransform: "none",
                }}
              >
                New Reservation
              </Button>
            </Link>
          </div>
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
                    Booking Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Booking ID
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
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Bill Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Guest Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBillingData.length > 0 ? (
                  filteredBillingData.map((bill, index) => {
                    const bookingDate = GetCustomDate(bill.timestamp);
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          "& > td": {
                            backgroundColor: "white",
                            textAlign: "center",
                          },
                          background: `linear-gradient(to right, ${
                            bill.bill.Cancelled === "yes"
                              ? "#808080"
                              : bill.bill.Bill_Paid === "yes"
                              ? "#1ebc1e"
                              : "#f24a23"
                          } 5%, white 5%)`,
                        }}
                      >
                        <TableCell>{bookingDate || "N/A"}</TableCell>
                        <TableCell>{bill.bookingId || "N/A"}</TableCell>
                        <TableCell>
                          {Array.isArray(bill.bill.roomNo)
                            ? bill.bill.roomNo.join(", ")
                            : bill.bill.roomNo || "N/A"}
                        </TableCell>
                        <TableCell>{bill.guestName || "N/A"}</TableCell>
                        <TableCell>₹{bill.bill.totalAmount || 0}</TableCell>
                        <TableCell>₹{bill.bill.amountAdvanced || 0}</TableCell>
                        <TableCell>₹{bill.bill.dueAmount || 0}</TableCell>
                        <TableCell>{getGuestStatus(bill)}</TableCell>
                        <TableCell>{getBillStatus(bill)}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            onClick={() => handleViewBill(bill)}
                            sx={{
                              backgroundColor: "#28bfdb",
                              "&:hover": { backgroundColor: "#1e9ab8" },
                              textTransform: "none",
                            }}
                          >
                            View Bill
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No billing records available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
      <Footer />
    </>
  );
}
