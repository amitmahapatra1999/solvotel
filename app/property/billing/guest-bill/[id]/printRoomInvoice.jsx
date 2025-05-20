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

// Add print-specific styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
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
  padding: 2px;
  & > p {
    font-size: 14px;
  }
`;

const PrintableRoomInvoice = ({ billId }) => {
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
        <svg
          aria-hidden="true"
          className="inline w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
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

  const { booking, billing, room, category, services } = bookingData;
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");
  const formattedTime = currentDate.toLocaleTimeString();

  const totalServicesAmount = serviceItems.reduce(
    (total, service) => total + service.price,
    0
  );

  const serviceTax = serviceItems.reduce(
    (tax, service) => tax + service.tax,
    0
  );

  return (
    <>
      <style>{printStyles}</style>
      <Box
        id="printable-invoice"
        sx={{
          maxWidth: "800px",
          margin: "auto",

          maxHeight: "90vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
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
                <CustomTableCell align="center" width="12%">
                  <Typography fontWeight={600}>SGST%</Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="12%">
                  <Typography fontWeight={600}>CGST%</Typography>
                </CustomTableCell>
                <CustomTableCell align="center" width="12%">
                  <Typography fontWeight={600}>Total GST%</Typography>
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
                    </Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography></Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>{bookingData?.category?.sgst}</Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>{bookingData?.category?.cgst}</Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>
                      {bookingData?.category?.sgst +
                        bookingData?.category?.cgst}
                    </Typography>
                  </CustomTableCell>
                  <CustomTableCell
                    align="center"
                    sx={{ borderBottom: "none", borderTop: "none" }}
                  >
                    <Typography>100</Typography>
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
                  <Typography></Typography>
                </CustomTableCell>
                <CustomTableCell align="center">
                  <Typography>{bookingData?.billing?.totalAmount}</Typography>
                </CustomTableCell>
              </TableRow>
              <TableRow>
                <CustomTableCell>
                  <Typography>Amuount Chargeable (in words):</Typography>
                  <Typography fontWeight={600}>Four Thousand</Typography>
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
      </Box>
    </>
  );
};

export default PrintableRoomInvoice;
