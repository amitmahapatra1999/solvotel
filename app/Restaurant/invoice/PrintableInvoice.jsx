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
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";

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

const PrintableInvoice = ({ invoiceId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        const [invoiceResponse, profileResponse] = await Promise.all([
          fetch(`/api/restaurantinvoice/${invoiceId}`),
          fetch(`/api/Profile/${userId}`),
        ]);
        if (!invoiceResponse.ok || !profileResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [invoiceData, profileData] = await Promise.all([
          invoiceResponse.json(),
          profileResponse.json(),
        ]);

        setInvoice(invoiceData);
        setProfile(profileData.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchData();
    }
  }, [invoiceId]);

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

  if (!invoice || !profile) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography variant="h6">No invoice or profile data found</Typography>
      </Box>
    );
  }

  // Determine if invoice state matches profile state
  const isSameState =
    invoice.state && profile.resState && invoice.state === profile.resState;

  // Prepare items with correct attributes for display
  const preparedItems = invoice.menuitem.map((item, index) => ({
    name: item,
    qty: invoice.quantity[index],
    rate: invoice.price[index],
    sgst: invoice.sgstArray[index],
    cgst: invoice.cgstArray[index],
    amount: invoice.quantity[index] * invoice.price[index],
    igst:
      invoice.amountWithGstArray[index] -
      invoice.quantity[index] * invoice.price[index], // IGST as total GST
  }));

  // Calculate subtotal from items
  const subtotal = preparedItems.reduce(
    (total, item) => total + item.amount,
    0
  );

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
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <RestaurantIcon
                  sx={{ fontSize: 40, mr: 2, color: "#00bcd4" }}
                />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#00bcd4" }}
                >
                  {profile.resName}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                {profile.resAddressLine1 || "N/A"},{" "}
                {profile.resAddressLine2 || "N/A"}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                {profile.resDistrict || "N/A"} - {profile.resPinCode || "N/A"},
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                {profile.resState || "N/A"}, {profile.resCountry || "India"}
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
                Restaurant GST No: {profile.resGstNo || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#00bcd4" }}
              >
                Invoice
              </Typography>
              <Typography variant="body1" color="textSecondary">
                #INV-{invoice.invoiceno}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Bill To:
              </Typography>
              <Typography variant="body1">{invoice.custname}</Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: {invoice.custphone}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                Customer GST No: {invoice.custgst || "N/A"}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 0.5 }}
              >
                State: {invoice.state || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Invoice Date:
              </Typography>
              <Typography variant="body1">
                {new Date(invoice.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Time: {invoice.time}
              </Typography>
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#00bcd4" }}>
                  <TableCell sx={{ color: "white" }}>ITEM</TableCell>
                  <TableCell align="center" sx={{ color: "white" }}>
                    HSN CODE
                  </TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>
                    QTY
                  </TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>
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
                {preparedItems.map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">996331</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="right">₹{item.rate.toFixed(2)}</TableCell>
                    {isSameState ? (
                      <>
                        <TableCell align="right">
                          ₹{item.sgst.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ₹{item.cgst.toFixed(2)}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell align="right">
                        ₹{item.igst.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      ₹{item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
                    ₹{subtotal.toFixed(2)}
                  </Typography>
                  {isSameState ? (
                    <>
                      <Typography variant="body1">
                        ₹
                        {invoice.sgstArray
                          ?.reduce((sum, value) => sum + value, 0)
                          .toFixed(2)}
                      </Typography>
                      <Typography variant="body1">
                        ₹
                        {invoice.cgstArray
                          ?.reduce((sum, value) => sum + value, 0)
                          .toFixed(2)}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1">
                      ₹{invoice.gst.toFixed(2)}
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{invoice.payableamt.toFixed(2)}
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
            id="print-button"
            sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
          >
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ bgcolor: "#00bcd4", "&:hover": { bgcolor: "#00acc1" } }}
            >
              Print Invoice
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default PrintableInvoice;
