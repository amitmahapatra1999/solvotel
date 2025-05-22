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
  styled,
} from "@mui/material";
import axios from "axios";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";
import { GetCustomDate } from "../../../utils/DateFetcher";
import { SquarePen } from "lucide-react";

const CustomHeadingCell = styled(TableCell)`
  font-weight: bold;
  color: #28bfdb;
  text-align: center;
  padding: 5px;
`;
const CustomBodyCell = styled(TableCell)`
  font-size: 13px;
  padding: 5px;
`;

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

        const billingsMap = new Map(
          billingResult.map((bill) => [bill._id, bill])
        );
        const bookingsMap = new Map(
          bookingResult.map((booking) => [booking._id, booking])
        );

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
                bookingDetails: guest,
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
    const checkIn = new Date(bill.bookingDetails.checkIn);
    const checkOut = new Date(bill.bookingDetails.checkOut);

    const isSameDay =
      today.getFullYear() === checkIn.getFullYear() &&
      today.getMonth() === checkIn.getMonth() &&
      today.getDate() === checkIn.getDate();
    console.log(isSameDay);
    if (today < checkIn) {
      return "Booked";
    } else if (today > checkIn && today < checkOut) {
      return "Checked In";
    } else if (today > checkOut || bill.bill.Bill_Paid === "yes") {
      return "Checked Out";
    }
  };

  const getBillStatus = (bill) => {
    if (bill.bill.Cancelled === "yes") {
      return "Cancelled";
    }
    return bill.bill.Bill_Paid === "yes" ? "Paid" : "Unpaid";
  };

  console.log(filteredBillingData, "filteredBillingData");

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
                  <CustomHeadingCell>#</CustomHeadingCell>
                  <CustomHeadingCell>Booking ID</CustomHeadingCell>
                  <CustomHeadingCell>Guest</CustomHeadingCell>
                  <CustomHeadingCell>Room No</CustomHeadingCell>
                  <CustomHeadingCell>Check In/Out</CustomHeadingCell>
                  <CustomHeadingCell>Booked On</CustomHeadingCell>
                  <CustomHeadingCell>Pax</CustomHeadingCell>
                  <CustomHeadingCell>Meal Plan</CustomHeadingCell>
                  <CustomHeadingCell>Notes</CustomHeadingCell>
                  <CustomHeadingCell>Status</CustomHeadingCell>
                  <CustomHeadingCell>Action</CustomHeadingCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBillingData.length > 0 ? (
                  filteredBillingData.map((bill, index) => {
                    const bookingDate = GetCustomDate(bill.timestamp);
                    const checkInDate = GetCustomDate(
                      bill.bookingDetails.checkIn
                    );
                    const checkOutDate = GetCustomDate(
                      bill.bookingDetails.checkOut
                    );
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
                        <CustomBodyCell>{index + 1}</CustomBodyCell>
                        <CustomBodyCell>
                          <Link
                            href={`/property/billing/guest-bill/${bill.currentBillingId}`}
                            style={{
                              color: " #00158a",

                              fontWeight: "400",
                            }}
                          >
                            {bill.bookingId || "N/A"}
                          </Link>
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {bill.bookingDetails.guestName || "N/A"} <br />
                          {bill.bookingDetails.mobileNo || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell sx={{ fontWeight: 600 }}>
                          {Array.isArray(bill.bill.roomNo)
                            ? bill.bill.roomNo.join(", ")
                            : bill.bill.roomNo || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {checkInDate || "N/A"}
                          <br />
                          {checkOutDate || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell>{bookingDate || "N/A"}</CustomBodyCell>
                        <CustomBodyCell>
                          Adults: {bill?.bookingDetails?.adults || "N/A"} <br />{" "}
                          Child:
                          {bill?.bookingDetails?.children}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {bill?.bookingDetails?.mealPlan || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {bill?.bookingDetails?.remarks || "N/A"}
                        </CustomBodyCell>
                        {/* <CustomBodyCell>
                          ₹{parseFloat(bill.bill.totalAmount).toFixed(2) || 0}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          ₹
                          {parseFloat(bill.bill.amountAdvanced).toFixed(2) || 0}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          ₹{parseFloat(bill.bill.dueAmount).toFixed(2) || 0}
                        </CustomBodyCell> */}
                        <CustomBodyCell>{getGuestStatus(bill)}</CustomBodyCell>
                        {/* <CustomBodyCell>{getBillStatus(bill)}</CustomBodyCell> */}
                        <CustomBodyCell>
                          <Button
                            variant="contained"
                            color="warning"
                            onClick={() => handleViewBill(bill)}
                            sx={{
                              p: "4px",
                              minWidth: 0,
                            }}
                          >
                            <SquarePen size={18} />
                          </Button>
                        </CustomBodyCell>
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
