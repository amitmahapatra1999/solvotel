"use client";
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

// Add print-specific styles
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

const PrintableServiceInvoice = ({ billId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [profile, setProfile] = useState(null);
<<<<<<< HEAD
=======
  const [services, setServices] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
  const [serviceItems, setServiceItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

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
<<<<<<< HEAD
=======
        setMenuItems(menuResponse.data.data);
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
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
<<<<<<< HEAD

=======
        console.log("billId", billId);
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
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
<<<<<<< HEAD

        const billingData = billing.data;
=======
        console.log("Profile Data", profileData);
        const billingData = billing.data;
        // Set payment status
        setIsPaid(billingData.Bill_Paid?.toLowerCase() === "yes");
        // Set cancellation status
        setIsCancelled(billingData.Cancelled?.toLowerCase() === "yes");
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a

        // 2. Fetch booking details using room number from billing
        const bookingsResponse = await fetch("/api/NewBooking");
        const bookingsData = await bookingsResponse.json();
        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();
<<<<<<< HEAD

        const matchedRooms = roomsData.data.filter((room) =>
          billingData.roomNo.includes(String(room.number))
        );
=======
        console.log("roomsData", roomsData.data);
        console.log("billingData", billingData);
        const matchedRooms = roomsData.data.filter((room) =>
          billingData.roomNo.includes(String(room.number))
        );
        console.log("matchedRooms", matchedRooms);
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a

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

<<<<<<< HEAD
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
        // Separate food and service items
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

            // Get tax values from the taxList if available in the new format
            let sgst = 0;
            let cgst = 0;
            
            if (roomTaxes[itemIndex] && Array.isArray(roomTaxes[itemIndex]) && roomTaxes[itemIndex].length === 2) {
              // New format: [sgst, cgst]
              sgst = roomTaxes[itemIndex][0] || 0;
              cgst = roomTaxes[itemIndex][1] || 0;
            } else {
              // Fallback to old format
              sgst = roomSGST[itemIndex] || roomTaxes[itemIndex] / 2 || 0;
              cgst = roomCGST[itemIndex] || roomTaxes[itemIndex] / 2 || 0;
            }

            const itemDetails = {
              name: item,
              price: roomPrices[itemIndex] || 0,
              quantity: roomQuantities[itemIndex] || 1,
              tax: (sgst + cgst) || 0, // Total tax is sum of SGST and CGST
              sgst: sgst,
              cgst: cgst,
              roomIndex: roomIndex,
            };

            if (menuItem) {
              foodItemsArray.push(itemDetails);
            } else if (item !== "Room Charge") {
              serviceItemsArray.push(itemDetails);
            }
          });
        });

        setServiceItems(serviceItemsArray);

=======
        console.log("matchedBookings", matchedBookings);

        if (!matchedBookings) {
          throw new Error("No matching booking found");
        }

        // Process existing items
        const existingServices = billingData.itemList || [];
        const existingPrices = billingData.priceList || [];
        const existingTaxes = billingData.taxList || [];
        const existingQuantities = billingData.quantityList || [];

        // Separate food and service items
        const foodItemsArray = [];
        const serviceItemsArray = [];

        existingServices.forEach((roomServices, roomIndex) => {
          const roomPrices = existingPrices[roomIndex] || [];
          const roomTaxes = existingTaxes[roomIndex] || [];
          const roomQuantities = existingQuantities[roomIndex] || [];

          roomServices.forEach((item, itemIndex) => {
            const menuItem = menuItemsList.find(
              (menuItem) => menuItem.itemName === item
            );

            const itemDetails = {
              name: item,
              price: roomPrices[itemIndex] || 0,
              quantity: roomQuantities[itemIndex] || 1,
              tax: roomTaxes[itemIndex] || 0,
              roomIndex: roomIndex,
            };

            if (menuItem) {
              foodItemsArray.push(itemDetails);
            } else if (item !== "Room Charge") {
              serviceItemsArray.push(itemDetails);
            }
          });
        });

        setFoodItems(foodItemsArray);
        setServiceItems(serviceItemsArray);
        setServices([...serviceItemsArray, ...foodItemsArray]);

        setServices(serviceItems);
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
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
          height: "100vh",
        }}
      >
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

<<<<<<< HEAD
  const { booking } = invoiceData;
=======
  const { booking, billing } = invoiceData;
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");
  const formattedTime = currentDate.toLocaleTimeString();

<<<<<<< HEAD
  // Determine if invoice state matches profile state
  const isSameState =
    booking.state && profile.state && booking.state === profile.state;

  let totalBeforeTax = 0;
  let totalSGST = 0;
  let totalCGST = 0;
  let totalIGST = 0;
  let totalAmount = 0;

  serviceItems.forEach((item) => {
    const price = item?.price || 0;
    const sgstRate = item?.sgst || 0;
    const cgstRate = item?.cgst || 0;
    const igstRate = item?.sgst + item?.cgst;

    const itemTotal = price;
    const taxAmount = itemTotal * (item?.igst / 100);

    totalBeforeTax += itemTotal;

    totalSGST += itemTotal * (sgstRate / 100);
    totalCGST += itemTotal * (cgstRate / 100);
    totalIGST += itemTotal * (igstRate / 100);

    totalAmount += itemTotal + taxAmount;
  });
=======
  // Calculate total services amount
  const totalServicesAmount = serviceItems.reduce(
    (total, service) => total + service.price,
    0
  );
  const serviceTax = serviceItems.reduce(
    (tax, service) => tax + service.tax,
    0
  );
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a

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
<<<<<<< HEAD
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {/* <RestaurantIcon
                  sx={{ fontSize: 40, mr: 2, color: "#00bcd4" }}
                /> */}
=======
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <RestaurantIcon
                  sx={{ fontSize: 40, mr: 2, color: "#00bcd4" }}
                />
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
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
<<<<<<< HEAD
                Invoice No
=======
                Service Invoice
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
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
                Guest Details:
              </Typography>
              <Typography variant="body1">{booking.guestName}</Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: +91 {booking.mobileNo}
              </Typography>
              <Typography variant="body1">
                Customer GST No.: {booking.gstin}
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

          {/* Services Table */}
          <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#00bcd4" }}>
<<<<<<< HEAD
                  {/* <TableCell sx={{ color: "white" }}>Room No.</TableCell> */}
                  <TableCell sx={{ color: "white" }}>ITEM</TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                    RATE
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                      SGST (%)
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                      CGST (%)
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                      IGST (%)
                  </TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>
                    AMOUNT
=======
                  <TableCell sx={{ color: "white" }}>Room No.</TableCell>
                  <TableCell sx={{ color: "white" }}>Service</TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                    Quantity
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                    Tax
                  </TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>
                    Total
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceItems.map((service, index) => (
                  <TableRow key={index}>
<<<<<<< HEAD
                    {/* <TableCell>
                      Room #{billing.roomNo[service.roomIndex]}
                    </TableCell> */}
                    <TableCell>{service.name}</TableCell>
                    <TableCell align="center">
                      ₹{(parseFloat(service.price) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{service?.sgst}%</TableCell>
                    <TableCell align="center">{service?.cgst}%</TableCell>
                      <TableCell align="center">
                        {(service?.sgst + service?.cgst)}%
                      </TableCell>
                    <TableCell align="right">
                      ₹
                      {(service.price +
                        service.price * ((service?.sgst + service?.cgst) / 100)).toFixed(2)}
=======
                    <TableCell>
                      Room #{billing.roomNo[service.roomIndex]}
                    </TableCell>
                    <TableCell>{service.name}</TableCell>
                    <TableCell align="center">{service.quantity}</TableCell>
                    <TableCell align="center">{service.tax}%</TableCell>
                    <TableCell align="right">
                      ₹{(parseFloat(service.price) || 0).toFixed(2)}
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
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
<<<<<<< HEAD
                  <Typography variant="body1">Subtotal:</Typography>
                  {isSameState ? (
                    <>
                      <Typography variant="body1">SGST:</Typography>
                      <Typography variant="body1">CGST:</Typography>
                    </>
                  ) : (
                    <Typography variant="body1">IGST:</Typography>
                  )}
=======
                  <Typography variant="body1">IGST:</Typography>
                  <Typography variant="body1">CGST:</Typography>
                  <Typography variant="body1">SGST:</Typography>
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    Total:
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: "right" }}>
<<<<<<< HEAD
                  {isSameState ? (
                    <>
                      <Typography variant="body1">
                        ₹{totalBeforeTax.toFixed(2)}
                      </Typography>
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
                    ₹{(totalIGST + totalBeforeTax).toFixed(2)}
=======
                  <Typography variant="body1">
                    {serviceTax.toFixed(2)}%
                  </Typography>
                  <Typography variant="body1">
                    {(serviceTax / 2).toFixed(2)}%
                  </Typography>
                  <Typography variant="body1">
                    {(serviceTax / 2).toFixed(2)}%
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{totalServicesAmount.toFixed(2)}
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
<<<<<<< HEAD
=======
          {/* Paid Image */}
          {isPaid && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <img
                src="/paid.png"
                alt="Paid"
                style={{
                  width: "250px",
                  height: "auto",
                  opacity: 0.8,
                }}
              />
            </Box>
          )}

          {/* Cancelled Image */}
          {isCancelled && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <img
                src="/cancelled.png"
                alt="Cancelled"
                style={{
                  width: "250px",
                  height: "auto",
                  opacity: 0.8,
                }}
              />
            </Box>
          )}
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2, textAlign: "center" }}
          >
            Thank you for using our services.
          </Typography>

          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
<<<<<<< HEAD
            id="print-button"
=======
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
          >
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ bgcolor: "#00bcd4", "&:hover": { bgcolor: "#00acc1" } }}
            >
<<<<<<< HEAD
              Print Invoice
            </Button>
          </Box>
=======
              Print Service Invoice
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="caption" color="textSecondary">
              Invoice generated on {formattedDate} at {formattedTime}
            </Typography>
          </Box>
>>>>>>> 6648c145aa85a0e3486c160232a3f52db08ee99a
        </Paper>
      </Box>
    </>
  );
};

export default PrintableServiceInvoice;
