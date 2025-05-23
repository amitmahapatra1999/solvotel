"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
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
                rooms: room,
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

        setOriginalBillingData(mergedBillings);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filterByDate = () => {
    if (startDate && endDate) {
      const filtered = originalBillingData.filter((invoice) => {
        const invoiceDate = new Date(invoice.timestamp);
        return (
          invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate)
        );
      });
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  };

  console.log(filteredInvoices);

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
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="loader"></div>
              <span className="mt-4 text-gray-700">Loading Bills...</span>
            </div>
          </div>
        )}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Room Booking Report
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
                      <CustomHeadingCell>Booking Date</CustomHeadingCell>
                      {/* <CustomHeadingCell>Check-In Date</CustomHeadingCell>
                      <CustomHeadingCell>Check-Out Date</CustomHeadingCell> */}

                      <CustomHeadingCell>Invoice ID</CustomHeadingCell>
                      {/* <CustomHeadingCell>Room Number</CustomHeadingCell> */}
                      <CustomHeadingCell>Guest</CustomHeadingCell>
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
                          const lastCheckInDate =
                            item.bill.billStartDate[
                              item.bill.billStartDate.length - 1
                            ];
                          const lastCheckOutDate =
                            item.bill.billEndDate[
                              item.bill.billEndDate.length - 1
                            ];
                          const invoiceDate = GetCustomDate(item.timestamp);
                          const checkInDate = GetCustomDate(lastCheckInDate);
                          const checkOutDate = GetCustomDate(lastCheckOutDate);
                          return (
                            <TableRow
                              key={index}
                              sx={{ backgroundColor: "white" }}
                            >
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {invoiceDate}
                              </CustomBodyCell>
                              {/* <CustomBodyCell sx={{ textAlign: "center" }}>
                                {checkInDate}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {checkOutDate}
                              </CustomBodyCell> */}
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {item.bookingId || "N/A"}
                              </CustomBodyCell>
                              {/* <CustomBodyCell sx={{ textAlign: "center" }}>
                                {Array.isArray(item.bill.roomNo)
                                  ? item.bill.roomNo.join(", ")
                                  : item.bill.roomNo || "N/A"}
                              </CustomBodyCell> */}
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                {item.guestName || "N/A"}
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                0.00
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                0.00
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                0.00
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                0.00
                              </CustomBodyCell>
                              <CustomBodyCell sx={{ textAlign: "center" }}>
                                0.00
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
