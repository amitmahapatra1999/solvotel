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
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import axios from "axios";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import Image from "next/image";

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
      #print-button * {
      display:none;
      }
    #printable-invoice, #printable-invoice * {
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

const PrintableFoodInvoice = ({ billId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  console.log(foodItems);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find(
            (row) =>
              row.startsWith("authToken=") || row.startsWith("userAuthToken=")
          )
          .split("=")[1];
        const headers = { Authorization: `Bearer ${token}` };
        const menuResponse = await axios.get("/api/menuItem", { headers });
        setMenuItems(menuResponse.data.data);
      } catch (err) {
        console.error("Error fetching menu items:", err);
      }
    };
    fetchMenuItems();
  }, []);

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
        // Fetch menu items for comparison
        const menuResponse = await axios.get("/api/menuItem", { headers });
        const menuItemsList = menuResponse.data.data;
        // 1. First fetch billing details
        const [billingResponse, profileResponse] = await Promise.all([
          fetch(`/api/Billing/${billId}`),
          fetch(`/api/Profile/${userId}`),
        ]);
        if (!billingResponse.ok || !profileResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        const [billing, profileData] = await Promise.all([
          billingResponse.json(),
          profileResponse.json(),
        ]);

        const billingData = billing.data;
        // Set payment status
        setIsPaid(billingData.Bill_Paid?.toLowerCase() === "yes");
        // Set cancellation status
        setIsCancelled(billingData.Cancelled?.toLowerCase() === "yes");

        // 2. Fetch booking details using room number from billing
        const bookingsResponse = await fetch("/api/NewBooking");
        const bookingsData = await bookingsResponse.json();
        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();

        const matchedRooms = roomsData.data.filter((room) =>
          billingData.roomNo.includes(String(room.number))
        );

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

        if (!matchedBookings) {
          throw new Error("No matching booking found");
        }

        // Process existing items with proper null checks
        const existingServices = billingData.itemList || [];
        const existingPrices = billingData.priceList || [];
        const existingTaxes = billingData.taxList || [];
        const existingQuantities = billingData.quantityList || [];
        const existingCGSTArray = billingData.cgstArray || [];
        const existingSGSTArray = billingData.sgstArray || [];

        const foodItemsArray = [];
        const serviceItemsArray = [];

        existingServices.forEach((roomServices, roomIndex) => {
          if (!roomServices) return; // Skip if roomServices is undefined

          const roomPrices = existingPrices[roomIndex] || [];
          const roomTaxes = existingTaxes[roomIndex] || [];
          const roomQuantities = existingQuantities[roomIndex] || [];
          const roomCGST = existingCGSTArray[roomIndex] || [];
          const roomSGST = existingSGSTArray[roomIndex] || [];

          roomServices.forEach((item, itemIndex) => {
            if (!item) return; // Skip if item is undefined

            const menuItem = menuItemsList.find(
              (menuItem) => menuItem.itemName === item
            );

            const itemDetails = {
              name: item,
              price: roomPrices[itemIndex] || 0,
              quantity: roomQuantities[itemIndex] || 1,
              tax: roomTaxes[itemIndex] || 0,
              cgst: roomCGST[itemIndex] || roomTaxes[itemIndex] / 2 || 0,
              sgst: roomSGST[itemIndex] || roomTaxes[itemIndex] / 2 || 0,
              roomIndex: roomIndex,
            };

            if (menuItem) {
              foodItemsArray.push(itemDetails);
            } else if (item !== "Room Charge") {
              serviceItemsArray.push(itemDetails);
            }
          });
        });

        setFoodItems([...foodItemsArray]);
        setServiceItems(serviceItemsArray);
        setServices([...serviceItemsArray]);

        setServices(serviceItems);
        setInvoiceData({ billing: billingData, booking: matchedBookings[0] });
        setProfile(profileData.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [billId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <div className="loader"></div>
        <span className="mt-4 text-gray-700">Loading Invoice...</span>
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

  const { booking, billing } = invoiceData;
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");
  const formattedTime = currentDate.toLocaleTimeString();

  // Determine if invoice state matches profile state
  const isSameState =
    booking.state && profile.state && booking.state === profile.state;

  let totalBeforeTax = 0;
  let totalSGST = 0;
  let totalCGST = 0;
  let totalIGST = 0;
  let totalAmount = 0;

  foodItems.forEach((item) => {
    const quantity = item?.quantity || 0;
    const price = item?.price || 0;
    const taxRate = item?.tax || 0;
    const sgstRate = item?.sgst || 0;
    const cgstRate = item?.cgst || 0;
    const igstRate = item?.sgst + item?.igst;

    const itemTotal = quantity * price;
    const taxAmount = itemTotal * (taxRate / 100);

    totalBeforeTax += itemTotal;
    totalSGST += itemTotal * (sgstRate / 100);
    totalCGST += itemTotal * (cgstRate / 100);
    totalIGST += itemTotal * (igstRate / 100);
    totalAmount += itemTotal + taxAmount;
  });

  return (
    <>
      <style>{printStyles}</style>
      <Box
        id="printable-invoice"
        sx={{
          p: 4,
          maxWidth: "800px",
          margin: "auto",
          bgcolor: "#f5f5f5",
          borderRadius: 2,
          maxHeight: "90vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {/* <RestaurantIcon
                  sx={{ fontSize: 40, mr: 2, color: "#00bcd4" }}
                /> */}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#00bcd4" }}
                >
                  {profile.hotelName}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                {profile.addressLine1}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                {profile.addressLine2}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                {profile.district}, {profile.country} - {profile.pincode}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                Phone: {profile.mobileNo}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                Email: {profile.email}
              </Typography>
              {profile.website && (
                <Typography variant="body2" color="textSecondary">
                  Website: {profile.website}
                </Typography>
              )}
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                GST No: {profile.gstNo}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#00bcd4" }}
              >
                Invoice No
              </Typography>
              <Typography variant="body1" color="textSecondary">
                #{booking.bookingId}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Guest Details */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Bill To:
              </Typography>
              <Typography variant="body1">{booking.guestName}</Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: {booking.mobileNo}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                Customer GST No: {booking.gstin || "N/A"}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                State: {booking.state || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Invoice Date:
              </Typography>
              <Typography variant="body1">{formattedDate}</Typography>
              <Typography variant="body1" color="textSecondary">
                Time: {formattedTime}
              </Typography>
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#00bcd4" }}>
                  <TableCell sx={{ color: "white" }}>ITEM</TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                    QTY
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                    RATE
                  </TableCell>
                  {isSameState ? (
                    <>
                      <TableCell align="right" sx={{ color: "white" }}>
                        SGST
                      </TableCell>
                      <TableCell align="right" sx={{ color: "white" }}>
                        CGST
                      </TableCell>
                    </>
                  ) : (
                    <TableCell align="right" sx={{ color: "white" }}>
                      IGST
                    </TableCell>
                  )}
                  <TableCell align="right" sx={{ color: "white" }}>
                    AMOUNT
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {foodItems.map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{item?.name}</TableCell>
                    <TableCell align="center">{item?.quantity}</TableCell>
                    <TableCell align="center">
                      ₹{item?.price?.toFixed(2)}
                    </TableCell>
                    {isSameState ? (
                      <>
                        <TableCell align="right">{item?.sgst}</TableCell>
                        <TableCell align="right">{item?.cgst}</TableCell>
                      </>
                    ) : (
                      <TableCell align="right">
                        ₹{item?.igst?.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      ₹
                      {(
                        item?.quantity *
                        item?.price *
                        (1 + item?.tax / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total Calculation */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Box sx={{ width: "250px" }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body1">Subtotal:</Typography>
                  {isSameState ? (
                    <>
                      <Typography variant="body1">SGST:</Typography>
                      <Typography variant="body1">CGST:</Typography>
                    </>
                  ) : (
                    <Typography variant="body1">IGST:</Typography>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    Total:
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: "right" }}>
                  <Typography variant="body1">
                    ₹{totalBeforeTax.toFixed(2)}
                  </Typography>
                  {isSameState ? (
                    <>
                      <Typography variant="body1">
                        ₹{totalCGST.toFixed(2)}
                      </Typography>
                      <Typography variant="body1">
                        ₹{totalSGST.toFixed(2)}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1">
                      ₹{totalIGST.toFixed(2)}
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{totalAmount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2, textAlign: "center" }}
          >
            Thank you for your business.
          </Typography>

          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
            id="print-button"
          >
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                bgcolor: "#00bcd4",
                "&:hover": { bgcolor: "#00acc1" },
              }}
            >
              Print Invoice
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default PrintableFoodInvoice;
