import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Divider,
  Grid,
  styled,
  Tab,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import HotelIcon from "@mui/icons-material/Hotel";
import axios from "axios";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { GetCustomDate, GetTodaysDate } from "../../../../../utils/DateFetcher";
import { ToWords } from "to-words";

const toWords = new ToWords({
  localeCode: "en-IN",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: {
      // can be used to override defaults for the selected locale
      name: "Rupee",
      plural: "Rupees",
      symbol: "₹",
      fractionalUnit: {
        name: "Paisa",
        plural: "Paise",
        symbol: "",
      },
    },
  },
});

// Add print-specific styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
      #print-button * {
      display:none;
      }

    #printable-invoice,
    #printable-invoice * {
      visibility: visible;
    }

    #printable-invoice {
      position: absolute;
      left: 0;
      top: 0;
      background: white !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body {
      background: white !important;
    }
  }
`;

const CustomTableCell = styled(TableCell)`
  border: 1px solid black;
  padding: 5px;
  & > p {
    font-size: 15px;
  }
`;

const PrintableRoomInvoice = ({ billId }) => {
  const toWords = new ToWords();
  const todaysDate = GetTodaysDate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceItems, setServiceItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find(
            (row) =>
              row.startsWith("authToken=") || row.startsWith("userAuthToken=")
          )
          .split("=")[1];
        const headers = { Authorization: `Bearer ${token}` };
        console.log("billId", billId);
        // 1. First fetch billing details
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

        const [billingResponse, profileResponse] = await Promise.all([
          fetch(`/api/Billing/${billId}`),
          fetch(`/api/Profile/${userId}`),
        ]);
        console.log("billingResponse", billingResponse);
        if (!billingResponse.ok || !profileResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        const [billing, profileData] = await Promise.all([
          billingResponse.json(),
          profileResponse.json(),
        ]);
        const billingData = billing.data;
        console.log("billingData", billingData);
        // Set payment status
        setIsPaid(billingData.Bill_Paid?.toLowerCase() === "yes");
        // Set cancellation status
        setIsCancelled(billingData.Cancelled?.toLowerCase() === "yes");
        // 2. Fetch and find matched room
        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();
        console.log("roomsData", roomsData.data);
        const matchedRooms = roomsData.data.filter((room) =>
          billingData.roomNo.includes(String(room.number))
        );

        console.log("matchedRooms", matchedRooms);

        if (!matchedRooms) {
          throw new Error("No matching room found");
        }

        // Fetch bookings
        const newBookingsResponse = await axios.get("/api/NewBooking", {
          headers,
        });
        // Find bookings for all rooms
        const matchedBookings = await Promise.all(
          matchedRooms.map(async (room) => {
            if (
              billingData.Bill_Paid === "yes" ||
              billingData.Cancelled === "yes"
            ) {
              const currentBillIndex = room.billWaitlist.findIndex(
                (billId) => billId._id.toString() === billingData._id.toString()
              );

              if (currentBillIndex === -1) {
                return null;
              }

              const correspondingGuestId = room.guestWaitlist[currentBillIndex];
              return newBookingsResponse.data.data.find(
                (booking) => booking._id === correspondingGuestId._id.toString()
              );
            } else {
              return newBookingsResponse.data.data.find(
                (booking) => booking._id === room.currentGuestId
              );
            }
          })
        );

        console.log("matchedBookings", matchedBookings);

        if (!matchedBookings) {
          throw new Error("No matching booking found");
        }

        // Filter out duplicates and null values
        const uniqueBookings = Array.from(
          new Set(
            matchedBookings.filter((booking) => booking).map(JSON.stringify)
          )
        ).map(JSON.parse);
        console.log("uniqueBookings", uniqueBookings);

        // Fetch room categories
        const roomCategoriesResponse = await axios.get("/api/roomCategories", {
          headers,
        });

        // Get categories for all matched rooms
        const matchedCategories = matchedRooms.map((room) =>
          roomCategoriesResponse.data.data.find(
            (category) => category._id === room.category._id
          )
        );

        // Fetch menu items for comparison
        const menuResponse = await axios.get("/api/menuItem", { headers });
        const menuItemsList = menuResponse.data.data;

        // Fetch billing details
        console.log("billingData", billingData.itemList);

        // Process existing items
        const existingServices = billingData.itemList || [];
        const existingPrices = billingData.priceList || [];
        const existingTaxes = billingData.taxList || [];
        const existingQuantities = billingData.quantityList || [];

        const serviceItemsArray = [];

        existingServices.forEach((roomServices, roomIndex) => {
          const roomPrices = existingPrices[roomIndex] || [];
          const roomTaxes = existingTaxes[roomIndex] || [];
          const roomQuantities = existingQuantities[roomIndex] || [];

          roomServices.forEach((item, itemIndex) => {
            const itemDetails = {
              name: item,
              price: roomPrices[itemIndex] || 0,
              quantity: roomQuantities[itemIndex] || 1,
              tax: roomTaxes[itemIndex] || 0,
              roomIndex: roomIndex,
            };
            if (item === "Room Charge") {
              serviceItemsArray.push(itemDetails);
            }
          });
        });
        setServiceItems(serviceItemsArray);
        console.log("serviceItemsArray", serviceItemsArray);

        setBookingData({
          billing: billingData,
          booking: uniqueBookings[0],
          room: matchedRooms,
          category: matchedCategories,
        });
        setProfile(profileData.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching invoice data:", err);
      }
    };

    if (billId) {
      fetchInvoiceData();
    }
  }, [billId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <div className="loader"></div>
        <span className="mt-4 text-gray-700">Loading Room Invoice...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (!bookingData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography variant="h6">No invoice found</Typography>
      </Box>
    );
  }

  let totalInWords = toWords.convert(bookingData?.billing?.totalAmount);
  const numberOfDays =
    (new Date(bookingData?.booking?.checkOut) -
      new Date(bookingData?.booking?.checkIn)) /
    (1000 * 60 * 60 * 24);

  return (
    <>
      <style>{printStyles}</style>
      <Box id="printable-invoice">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <CustomTableCell colSpan={6} align="center">
                  <Typography fontWeight={600} align="center">
                    TAX INVOICE
                  </Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell colSpan={6} align="center">
                  <Typography align="center" variant="h5">
                    {profile?.hotelName}
                  </Typography>
                  <Typography align="center">
                    Contact: {profile?.mobileNo}&nbsp; Email: {profile?.email}
                  </Typography>
                  <Typography align="center">
                    {profile?.addressLine1},{profile?.addressLine2},
                    {profile?.district},{profile?.state},{profile?.country},
                    {profile?.pinCode}
                  </Typography>
                  <Typography align="center">GSTIN:{profile?.gstNo}</Typography>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography>Bill to</Typography>
                    <Typography>
                      Booking Id: {bookingData?.booking?.bookingId}
                    </Typography>
                  </Box>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell rowSpan={3} colSpan={2}>
                  <Typography>
                    Guest Name: {bookingData?.booking?.guestName}
                  </Typography>
                  <Typography>
                    Company Name: {bookingData?.booking?.companyName}
                  </Typography>
                  <Typography>
                    Address: {bookingData?.booking?.address},
                    {bookingData?.booking?.state}, PIN:
                    {bookingData?.booking?.pinCode}
                  </Typography>
                  <Typography>GSTIN: {bookingData?.booking?.gstin}</Typography>
                </CustomTableCell>
                <CustomTableCell colSpan={2}>
                  <Typography fontWeight={600}>
                    Check-in: {GetCustomDate(bookingData?.booking?.checkIn)}
                  </Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography fontWeight={600}>Invoice:</Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography fontWeight={600}>Date:</Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell colSpan={2}>
                  <Typography fontWeight={600}>
                    Check-out: {GetCustomDate(bookingData?.booking?.checkOut)}
                  </Typography>
                </CustomTableCell>
                <CustomTableCell rowSpan={2} align="center">
                  <Typography fontWeight={600}>1001</Typography>
                </CustomTableCell>
                <CustomTableCell rowSpan={2} align="center">
                  <Typography fontWeight={600}>
                    {GetCustomDate(bookingData?.booking?.checkOut)}
                  </Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell colSpan={2}>
                  <Typography>
                    Room No. (s):{" "}
                    {bookingData?.booking?.roomNumbers?.map((item, index) => (
                      <span key={index}>
                        {item}
                        {index < bookingData?.booking?.roomNumbers.length - 1
                          ? ", "
                          : ""}
                      </span>
                    ))}
                  </Typography>
                </CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <CustomTableCell align="center">
                  <Typography fontWeight={600}>
                    Description of Services
                  </Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="15%">
                  <Typography fontWeight={600}>HSN CODE</Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="11%">
                  <Typography fontWeight={600}>SGST%</Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="11%">
                  <Typography fontWeight={600}>CGST%</Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="12%">
                  <Typography fontWeight={600}>Total GST</Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="12%">
                  <Typography fontWeight={600}>Amount</Typography>
                </CustomTableCell>
              </TableRow>
            </TableBody>
            <TableBody sx={{ height: "200px" }}>
              {bookingData?.room?.map((room, index) => (
                <TableRow key={index}>
                  <CustomTableCell
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>
                      Room No:{room?.number}- {room?.category?.category}
                      <br />
                      <span style={{ fontSize: "12px" }}>
                        ({`Per night: Rs.${room?.category?.tariff}/-`})
                      </span>
                    </Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography></Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    align="center"
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>{room?.category?.sgst}</Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    align="center"
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>{room?.category?.cgst}</Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    align="center"
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>
                      {(room?.category?.total - room?.category?.tariff) *
                        numberOfDays}
                    </Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    align="center"
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>
                      {room?.category?.total * numberOfDays}
                    </Typography>
                  </CustomTableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableBody>
              <TableRow>
                <CustomTableCell>
                  <Typography fontWeight={600}>Total</Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography></Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography></Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography></Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography>
                    {bookingData?.room?.reduce((sum, room) => {
                      const gstPerNight =
                        (room?.category?.total ?? 0) -
                        (room?.category?.tariff ?? 0);
                      return sum + gstPerNight * numberOfDays;
                    }, 0)}
                  </Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography>{bookingData?.billing?.totalAmount}</Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell>
                  <Typography>Amuount Chargeable (in words):</Typography>
                  <Typography fontWeight={600}>
                    {totalInWords} rupees
                  </Typography>
                </CustomTableCell>
                <CustomTableCell rowSpan={2} colSpan={2} align="center">
                  <Typography variant="body2">
                    I agree that I&apos;m responsible for the full payment of
                    this invoice,in the event it is not paid by the
                    company,organisation or person indicated above.
                  </Typography>
                </CustomTableCell>
                <CustomTableCell colSpan={3} rowSpan={2} align="center">
                  <Typography fontWeight={600}>Authorised Signatory</Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell>
                  <Typography fontWeight={600} sx={{ mb: 10 }}>
                    GUEST SIGNATURE:
                  </Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell colSpan={6} align="center">
                  <Typography variant="caption">
                    We are Happy to Serve You.Visit us again...
                  </Typography>
                </CustomTableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ textAlign: "center", mt: 1 }} id="print-button">
          <Button variant="contained" onClick={handlePrint}>
            Print Invoice
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default PrintableRoomInvoice;
