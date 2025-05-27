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
  const [profile, setProfile] = useState(null);
  const [billingData, setBillingData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchRoom, setSearchRoom] = useState("");
  const [searchGuest, setSearchGuest] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [checkInOutLoadingId, setCheckInOutLoadingId] = useState(null);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const authtoken = getCookie("authToken");
        const usertoken = getCookie("userAuthToken");
        if (!authtoken && !usertoken) {
          router.push("/");
          return;
        }

        let decoded, userId;
        if (authtoken) {
          decoded = await jwtVerify(
            authtoken,
            new TextEncoder().encode(SECRET_KEY)
          );
          userId = decoded.payload.id;
        }
        if (usertoken) {
          decoded = await jwtVerify(
            usertoken,
            new TextEncoder().encode(SECRET_KEY)
          );
          userId = decoded.payload.profileId;
        }

        const profileResponse = await fetch(`/api/Profile/${userId}`);
        const profileData = await profileResponse.json();
        if (!profileData.success || !profileData.data) {
          router.push("/");
          return;
        }
        setProfile(profileData.data);
        const username = profileData.data.username;
        const token = document.cookie
          .split("; ")
          .find(
            (row) =>
              row.startsWith("authToken=") || row.startsWith("userAuthToken=")
          )
          .split("=")[1];
        const headers = { Authorization: `Bearer ${token}` };

        const [
          roomsResponse,
          billingResponse,
          bookingResponse,
          menuResponse,
          roomCategoriesResponse,
        ] = await Promise.all([
          axios.get(`/api/rooms?username=${username}`, { headers }),
          axios.get(`/api/Billing?username=${username}`, { headers }),
          axios.get(`/api/NewBooking?username=${username}`, { headers }),
          axios.get("/api/menuItem", { headers }),
          axios.get("/api/roomCategories", { headers }),
        ]);

        const rooms = roomsResponse.data.data;
        const billings = billingResponse.data.data;
        const bookings = bookingResponse.data.data;
        const menuItems = menuResponse.data.data;
        const categories = roomCategoriesResponse.data.data;

        const enrichedBilling = billings
          .map((billing) => {
            if (!billing || !billing.bookingId) return null;

            const relatedBooking = bookings.find(
              (b) => b.bookingId === billing.bookingId
            );
            if (!relatedBooking) return null;

            const matchedRooms = rooms.filter((room) =>
              billing.roomNo.includes(String(room.number))
            );
            if (matchedRooms.length === 0) return null;

            const matchedCategories = matchedRooms.map((room) =>
              categories.find((cat) => cat._id === room.category._id)
            );

            // Process items
            const foodItemsArray = [];
            const serviceItemsArray = [];

            const itemList = billing.itemList || [];
            const priceList = billing.priceList || [];
            const quantityList = billing.quantityList || [];
            const taxList = billing.taxList || [];
            const cgstArray = billing.cgstArray || [];
            const sgstArray = billing.sgstArray || [];

            itemList.forEach((roomItems, roomIndex) => {
              if (!roomItems) return;

              const prices = priceList[roomIndex] || [];
              const quantities = quantityList[roomIndex] || [];
              const taxes = taxList[roomIndex] || [];
              const cgsts = cgstArray[roomIndex] || [];
              const sgsts = sgstArray[roomIndex] || [];

              roomItems.forEach((item, itemIndex) => {
                if (!item) return;
                const menuItem = menuItems.find(
                  (menu) => menu.itemName === item
                );
                const itemDetails = {
                  name: item,
                  price: prices[itemIndex] || 0,
                  quantity: quantities[itemIndex] || 1,
                  tax: taxes[itemIndex] || 0,
                  cgst: cgsts[itemIndex] || taxes[itemIndex] / 2 || 0,
                  sgst: sgsts[itemIndex] || taxes[itemIndex] / 2 || 0,
                  roomIndex,
                };

                if (menuItem) {
                  foodItemsArray.push(itemDetails);
                } else if (item !== "Room Charge") {
                  serviceItemsArray.push(itemDetails);
                }
              });
            });

            return {
              billing,
              foodItems: foodItemsArray,
              serviceItems: serviceItemsArray,
              rooms: matchedRooms,
              categories: matchedCategories,
              booking: relatedBooking,
            };
          })
          .filter(Boolean);

        setBillingData(enrichedBilling);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewBill = (bill) => {
    router.push(`/property/billing/guest-bill/${bill.billing._id}`);
  };

  const getGuestStatus = (bill) => {
    const chechInStatus = bill?.booking?.CheckedIn;
    const chechOutStatus = bill?.booking?.CheckedOut;
    if (bill.billing.Cancelled === "yes") {
      return "Cancelled";
    }

    if (chechInStatus == true && chechOutStatus == false) {
      return "Checked In";
    } else if (chechOutStatus == true) {
      return "Checked Out";
    }
    return "Booked";
  };

  const handleCheckIn = async (bill) => {
    try {
      setCheckInOutLoadingId(bill.currentBillingId);

      const payload = {
        ...bill.booking,
        CheckedIn: true,
      };

      const token = getCookie("authToken");
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
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
      if (!profileData.success || !profileData.data) {
        router.push("/"); // Redirect to login if profile not found
        return;
      }

      const response = await fetch(`/api/NewBooking/${bill.booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await response.json();
      const result = res.data;

      alert("Check IN Success");
      window.location.reload();
    } catch (err) {
      console.log(`Error while checkin: ${err}`);

      setCheckInOutLoadingId(null);
      return;
    }
  };

  const handleCheckOut = async (bill) => {
    try {
      setCheckInOutLoadingId(bill.currentBillingId);

      const payload = {
        ...bill.booking,
        CheckedOut: true,
      };

      const token = getCookie("authToken");
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
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
      if (!profileData.success || !profileData.data) {
        router.push("/"); // Redirect to login if profile not found
        return;
      }

      const response = await fetch(`/api/NewBooking/${bill.booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await response.json();
      const result = res.data;
      console.log(result);

      alert("Check Out Success");
      window.location.reload();
    } catch (err) {
      console.log(`Error while checkin: ${err}`);

      setCheckInOutLoadingId(null);
      return;
    }
  };

  const handleAllowCheckIn = (bill) => {
    const checkInDate = new Date(bill.booking.checkIn);

    const today = new Date();
    checkInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (checkInDate.getTime() <= today.getTime()) {
      return true; // Allow check-in if today is the check-in date
    }
    return false; // Do not allow check-in if it's not the check-in date
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
            {/* <Box sx={{ display: "flex", gap: 1 }}>
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
            </Box> */}
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
                  <CustomHeadingCell>No. Of Guest</CustomHeadingCell>
                  <CustomHeadingCell>Meal Plan</CustomHeadingCell>
                  <CustomHeadingCell>Notes</CustomHeadingCell>
                  <CustomHeadingCell>Status</CustomHeadingCell>
                  <CustomHeadingCell>Action</CustomHeadingCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billingData.length > 0 ? (
                  billingData.map((bill, index) => {
                    const bookingDate = GetCustomDate(bill.booking.createdAt);
                    const checkInDate = GetCustomDate(bill.booking.checkIn);
                    const checkOutDate = GetCustomDate(bill.booking.checkOut);

                    const isCheckInAllowed = handleAllowCheckIn(bill);
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          "& > td": {
                            backgroundColor: "white",
                            textAlign: "center",
                          },
                          background: `linear-gradient(to right, ${
                            bill.billing.Cancelled === "yes"
                              ? "#808080"
                              : bill.billing.Bill_Paid === "yes"
                              ? "#1ebc1e"
                              : "#f24a23"
                          } 5%, white 5%)`,
                        }}
                      >
                        <CustomBodyCell>{index + 1}</CustomBodyCell>
                        <CustomBodyCell>
                          <Link
                            href={`/property/billing/guest-bill/${bill.billing._id}`}
                            style={{
                              color: " #00158a",

                              fontWeight: "400",
                            }}
                          >
                            {bill.billing.bookingId || "N/A"}
                          </Link>
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {bill.booking.guestName || "N/A"} <br />
                          {bill.booking.mobileNo || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell sx={{ fontWeight: 600 }}>
                          {Array.isArray(bill.billing.roomNo)
                            ? bill.billing.roomNo.join(", ")
                            : bill.billing.roomNo || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {checkInDate || "N/A"}
                          <br />
                          {checkOutDate || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell>{bookingDate || "N/A"}</CustomBodyCell>
                        <CustomBodyCell>
                          Adults: {bill?.booking?.adults || "N/A"} <br /> Child:
                          {bill?.booking?.children}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {bill?.booking?.mealPlan || "N/A"}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          {bill?.booking?.remarks || "N/A"}
                        </CustomBodyCell>
                        {/* <CustomBodyCell>
                          ₹{parseFloat(bill.billing.totalAmount).toFixed(2) || 0}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          ₹
                          {parseFloat(bill.billing.amountAdvanced).toFixed(2) || 0}
                        </CustomBodyCell>
                        <CustomBodyCell>
                          ₹{parseFloat(bill.billing.dueAmount).toFixed(2) || 0}
                        </CustomBodyCell> */}
                        <CustomBodyCell>
                          {getGuestStatus(bill)}
                          <br />
                          {isCheckInAllowed && (
                            <>
                              {bill?.booking?.CheckedIn == false && (
                                <Button
                                  variant="contained"
                                  color="success"
                                  sx={{
                                    textTransform: "none",
                                    fontSize: "10px",
                                    p: "0px 4px",
                                    minWidth: 0,
                                  }}
                                  disabled={
                                    checkInOutLoadingId ===
                                    bill.currentBillingId
                                  }
                                  onClick={() => handleCheckIn(bill)}
                                >
                                  {checkInOutLoadingId !== bill.currentBillingId
                                    ? "Check In"
                                    : "Checking In..."}
                                </Button>
                              )}
                            </>
                          )}

                          {bill?.booking?.CheckedIn &&
                            !bill?.booking?.CheckedOut && (
                              <Button
                                variant="contained"
                                color="error"
                                sx={{
                                  textTransform: "none",
                                  fontSize: "10px",
                                  p: "0px 4px",
                                  minWidth: 0,
                                }}
                                disabled={
                                  checkInOutLoadingId === bill.currentBillingId
                                }
                                onClick={() => handleCheckOut(bill)}
                              >
                                {checkInOutLoadingId !== bill.currentBillingId
                                  ? "Check Out"
                                  : "Checking Out..."}
                              </Button>
                            )}
                        </CustomBodyCell>
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
