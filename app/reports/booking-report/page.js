"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../_components/Navbar";
import Link from "next/link";
import { Add } from "@mui/icons-material";
import { Footer } from "../../_components/Footer";
import Preloader from "../../_components/Preloader";
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
  Typography,
  styled,
} from "@mui/material";
import axios from "axios";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";
import { GetCustomDate } from "../../../utils/DateFetcher";

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

const BookingReport = () => {
  const tableRef = useRef(null);
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [originalBillingData, setOriginalBillingData] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEnrichedBills, setAllEnrichedBills] = useState([]);
  const [profile, setProfile] = useState({});
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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

        setAllEnrichedBills(enrichedBilling);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterByDate = () => {
    if (startDate && endDate) {
      const filtered = allEnrichedBills.filter((invoice) => {
        const invoiceDate = new Date(invoice.booking.createdAt);
        return (
          invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate)
        );
      });
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  };

  const printTable = () => {
    if (!tableRef.current) return;
    const tableHTML = tableRef.current.outerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <title>Room Booking Report</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            table, th, td { border: 1px solid black; }
            th, td { padding: 8px; text-align: center; }
          </style>
        </head>
        <body>
          ${tableHTML}
        </body>
      </html>
    `;

    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {loading && <Preloader />}
        <div className="container mx-auto py-10" style={{ maxWidth: "95%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Room Invoice Report
          </h1>
          <div className="space-x-3 flex  mb-4 ">
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/4 "
              size="small"
            />
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/4 "
              size="small"
            />
            <Button variant="contained" color="primary" onClick={filterByDate}>
              Filter
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setFilteredInvoices(invoices);
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={printTable}
              size="small"
              sx={{
                backgroundColor: "orange",
                "&:hover": {
                  backgroundColor: "darkorange",
                },
              }}
            >
              Download/Export
            </Button>
          </div>

          <Box>
            {startDate && endDate ? (
              <TableContainer component={Paper}>
                <Table ref={tableRef}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <CustomHeadingCell>Invoice Date</CustomHeadingCell>
                      <CustomHeadingCell>Invoice No</CustomHeadingCell>
                      <CustomHeadingCell>Check-In Date</CustomHeadingCell>
                      <CustomHeadingCell>Check-Out Date</CustomHeadingCell>

                      <CustomHeadingCell>Room Number</CustomHeadingCell>
                      <CustomHeadingCell>Guest</CustomHeadingCell>
                      <CustomHeadingCell>Company Name</CustomHeadingCell>
                      <CustomHeadingCell>GSTIN</CustomHeadingCell>
                      <CustomHeadingCell>Taxable Value</CustomHeadingCell>
                      <CustomHeadingCell>CGST</CustomHeadingCell>
                      <CustomHeadingCell>SGST</CustomHeadingCell>
                      <CustomHeadingCell>IGST</CustomHeadingCell>
                      <CustomHeadingCell>Total Sales</CustomHeadingCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      <>
                        {filteredInvoices.map((item, index) => {
                          const invoiceDate = GetCustomDate(
                            item.booking.createdAt
                          );
                          const checkInDate = GetCustomDate(
                            item.booking.checkIn
                          );
                          const checkOutDate = GetCustomDate(
                            item.booking.checkOut
                          );
                          const noOfNights =
                            (new Date(item?.booking?.checkOut) -
                              new Date(item?.booking?.checkIn)) /
                            (1000 * 60 * 60 * 24);

                          const isSameState =
                            item?.booking?.state &&
                            profile.state &&
                            item?.booking?.state === profile.state;

                          const totalBaseAmt = item?.rooms?.reduce(
                            (sum, room) => {
                              const baseAmtPerNight =
                                room?.category?.tariff ?? 0;
                              return sum + baseAmtPerNight * noOfNights;
                            },
                            0
                          );

                          const totalCgst = item?.rooms?.reduce((sum, room) => {
                            const gstPerNight =
                              (room?.category?.total ?? 0) -
                              (room?.category?.tariff ?? 0);
                            return (sum + gstPerNight * noOfNights) / 2;
                          }, 0);

                          const totalSgst = item?.rooms?.reduce((sum, room) => {
                            const gstPerNight =
                              (room?.category?.total ?? 0) -
                              (room?.category?.tariff ?? 0);
                            return (sum + gstPerNight * noOfNights) / 2;
                          }, 0);
                          const totalGst = item?.rooms?.reduce((sum, room) => {
                            const gstPerNight =
                              (room?.category?.total ?? 0) -
                              (room?.category?.tariff ?? 0);
                            return sum + gstPerNight * noOfNights;
                          }, 0);
                          return (
                            <TableRow
                              key={index}
                              sx={{ backgroundColor: "white" }}
                            >
                              <CustomBodyCell>{checkOutDate}</CustomBodyCell>
                              <CustomBodyCell>
                                {item.booking.bookingId || "N/A"}
                              </CustomBodyCell>
                              <CustomBodyCell>{checkInDate}</CustomBodyCell>
                              <CustomBodyCell>{checkOutDate}</CustomBodyCell>

                              <CustomBodyCell>
                                {Array.isArray(item.billing.roomNo)
                                  ? item.billing.roomNo.join(", ")
                                  : item.billing.roomNo || "N/A"}
                              </CustomBodyCell>
                              <CustomBodyCell>
                                {item.booking.guestName || "N/A"}
                              </CustomBodyCell>
                              <CustomBodyCell>
                                {item.booking.companyName || "N/A"}
                              </CustomBodyCell>
                              <CustomBodyCell>
                                {item.booking.gstin || "N/A"}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {totalBaseAmt.toFixed(2)}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {isSameState ? totalCgst.toFixed(2) : "0.00"}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {isSameState ? totalSgst.toFixed(2) : "0.00"}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {!isSameState ? totalGst.toFixed(2) : "0.00"}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {(
                                  totalBaseAmt +
                                  (isSameState
                                    ? totalCgst + totalSgst
                                    : totalGst)
                                ).toFixed(2)}
                              </CustomBodyCell>
                            </TableRow>
                          );
                        })}
                      </>
                    ) : (
                      <TableRow>
                        <CustomBodyCell colSpan={5} align="center">
                          No Booking found for the selected date range.
                        </CustomBodyCell>
                      </TableRow>
                    )}
                    {filteredInvoices.length > 0 && (
                      <TableRow
                        sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}
                      >
                        <CustomBodyCell
                          sx={{ textAlign: "center" }}
                          colSpan={8}
                        >
                          Grand Total
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          {filteredInvoices
                            .reduce((sum, item) => {
                              const nights =
                                (new Date(item.booking.checkOut) -
                                  new Date(item.booking.checkIn)) /
                                (1000 * 60 * 60 * 24);
                              return (
                                sum +
                                item.rooms?.reduce((roomSum, room) => {
                                  const base = room?.category?.tariff ?? 0;
                                  return roomSum + base * nights;
                                }, 0)
                              );
                            }, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          {filteredInvoices
                            .reduce((sum, item) => {
                              const nights =
                                (new Date(item.booking.checkOut) -
                                  new Date(item.booking.checkIn)) /
                                (1000 * 60 * 60 * 24);
                              if (
                                item.booking.state &&
                                profile.state &&
                                item.booking.state === profile.state
                              ) {
                                return (
                                  sum +
                                  item.rooms?.reduce((roomSum, room) => {
                                    const gst =
                                      (room?.category?.total ?? 0) -
                                      (room?.category?.tariff ?? 0);
                                    return roomSum + (gst * nights) / 2;
                                  }, 0)
                                );
                              }
                              return sum;
                            }, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          {filteredInvoices
                            .reduce((sum, item) => {
                              const nights =
                                (new Date(item.booking.checkOut) -
                                  new Date(item.booking.checkIn)) /
                                (1000 * 60 * 60 * 24);
                              if (
                                item.booking.state &&
                                profile.state &&
                                item.booking.state === profile.state
                              ) {
                                return (
                                  sum +
                                  item.rooms?.reduce((roomSum, room) => {
                                    const gst =
                                      (room?.category?.total ?? 0) -
                                      (room?.category?.tariff ?? 0);
                                    return roomSum + (gst * nights) / 2;
                                  }, 0)
                                );
                              }
                              return sum;
                            }, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          {filteredInvoices
                            .reduce((sum, item) => {
                              const nights =
                                (new Date(item.booking.checkOut) -
                                  new Date(item.booking.checkIn)) /
                                (1000 * 60 * 60 * 24);
                              if (
                                item.booking.state &&
                                profile.state &&
                                item.booking.state !== profile.state
                              ) {
                                return (
                                  sum +
                                  item.rooms?.reduce((roomSum, room) => {
                                    const gst =
                                      (room?.category?.total ?? 0) -
                                      (room?.category?.tariff ?? 0);
                                    return roomSum + gst * nights;
                                  }, 0)
                                );
                              }
                              return sum;
                            }, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          {filteredInvoices
                            .reduce((sum, item) => {
                              const nights =
                                (new Date(item.booking.checkOut) -
                                  new Date(item.booking.checkIn)) /
                                (1000 * 60 * 60 * 24);
                              const isSameState =
                                item.booking.state &&
                                profile.state &&
                                item.booking.state === profile.state;

                              const baseAmt = item.rooms?.reduce(
                                (roomSum, room) => {
                                  const base = room?.category?.tariff ?? 0;
                                  return roomSum + base * nights;
                                },
                                0
                              );

                              const gstAmt = item.rooms?.reduce(
                                (roomSum, room) => {
                                  const gst =
                                    (room?.category?.total ?? 0) -
                                    (room?.category?.tariff ?? 0);
                                  return (
                                    roomSum +
                                    (isSameState ? gst * nights : gst * nights)
                                  );
                                },
                                0
                              );

                              return (
                                sum + baseAmt + (isSameState ? gstAmt : gstAmt)
                              );
                            }, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", color: "gray", mt: 4 }}
              >
                Please select both start and end dates to view the invoice data.
              </Typography>
            )}
          </Box>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BookingReport;
