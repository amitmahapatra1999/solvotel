"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";
import { GetCustomDate } from "../../../utils/DateFetcher";
import { styled } from "@mui/material";
import Preloader from "../../_components/Preloader";
import { exportToExcel } from "../../../utils/exportToExcel";

const CustomHeadingCell = styled(TableCell)`
  font-weight: bold;
  color: #28bfdb;

  padding: 5px;
`;
const CustomBodyCell = styled(TableCell)`
  font-size: 13px;
  padding: 5px;
`;

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const InvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const tableRef = useRef(null);
  const [profileState, setProfileState] = useState(null);

  const [dataToExport, setDataToExport] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/restaurantinvoice");
        const data = await response.json();
        setInvoices(data.invoices);
        // Fetch profile data
        const token = getCookie("authToken");
        const usertoken = getCookie("userAuthToken");
        if (token) {
          const decoded = await jwtVerify(
            token,
            new TextEncoder().encode(SECRET_KEY)
          );
          const userId = decoded.payload.id;
          const profileResponse = await fetch(`/api/Profile/${userId}`);
          const profileData = await profileResponse.json();
          if (profileData.success) {
            setProfileState(profileData.data.state || null);
            // setFormData((prev) => ({
            //   ...prev,
            //   username: profileData.data.username || "",
            // }));
          } else {
            toast.error("Failed to fetch profile data");
          }
        } else if (usertoken) {
          const decoded = await jwtVerify(
            usertoken,
            new TextEncoder().encode(SECRET_KEY)
          );
          const userId = decoded.payload.profileId; // Use userId from the new token structure
          const profileResponse = await fetch(`/api/Profile/${userId}`);
          const profileData = await profileResponse.json();
          if (profileData.success) {
            setProfileState(profileData.data.state || null);
            setFormData((prev) => ({
              ...prev,
              username: profileData.data.username || "",
            }));
          } else {
            toast.error("Failed to fetch profile data");
          }
        } else {
          toast.error("Authentication token missing");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filterByDate = () => {
    if (startDate && endDate) {
      const filtered = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return (
          invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate)
        );
      });
      const exportData = filtered.map((item) => {
        let billingDate = GetCustomDate(item.date);
        let totalSgst = 0;
        let totalCgst = 0;
        let totalIgst = 0;

        let isSameState = item.state === profileState;
        if (isSameState) {
          totalSgst = item.sgstArray.reduce((acc, num) => acc + num, 0);
          totalCgst = item.cgstArray.reduce((acc, num) => acc + num, 0);
        } else {
          totalSgst = 0;
          totalCgst = 0;
          totalIgst = item.gst;
        }
        return {
          "Invoice Date": billingDate,
          "Invoice No": `INV-${item?.invoiceno}`,
          "Customer Name": item?.custname,
          GSTIN: item?.custgst,
          "Taxable Amount": item?.totalamt.toFixed(2),
          SGST: totalSgst.toFixed(2),
          CGST: totalCgst.toFixed(2),
          IGST: totalIgst.toFixed(2),
          "Total Amount": item?.payableamt.toFixed(2),
        };
      });
      setDataToExport(exportData);
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
          <title>Stock Report</title>
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

  const handleExport = () => {
    exportToExcel(dataToExport, "resturant_report");
  };

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        {isLoading && <Preloader />}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Restaurant Report
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
            {filteredInvoices.length > 0 && (
              <>
                <Button
                  variant="contained"
                  onClick={printTable}
                  size="small"
                  color="warning"
                >
                  Download PDF
                </Button>
                <Button
                  onClick={handleExport}
                  variant="contained"
                  color="success"
                  size="small"
                >
                  Export to Excel
                </Button>
              </>
            )}
          </div>

          <Box>
            <TableContainer component={Paper}>
              <Table ref={tableRef}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <CustomHeadingCell>Invoice Date</CustomHeadingCell>
                    <CustomHeadingCell>Invoice No.</CustomHeadingCell>
                    <CustomHeadingCell>Customer Name</CustomHeadingCell>
                    <CustomHeadingCell>GSTIN</CustomHeadingCell>
                    <CustomHeadingCell align="center">
                      Taxable Amt
                    </CustomHeadingCell>
                    <CustomHeadingCell align="center">SGST</CustomHeadingCell>
                    <CustomHeadingCell align="center">CGST</CustomHeadingCell>
                    <CustomHeadingCell align="center">IGST</CustomHeadingCell>
                    <CustomHeadingCell align="center">
                      Total Amt
                    </CustomHeadingCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length > 0 ? (
                    <>
                      {filteredInvoices.map((invoice) => {
                        let billingDate = GetCustomDate(invoice.date);
                        let totalSgst = 0;
                        let totalCgst = 0;
                        let totalIgst = 0;

                        let isSameState = invoice.state === profileState;
                        if (isSameState) {
                          totalSgst = invoice.sgstArray.reduce(
                            (acc, num) => acc + num,
                            0
                          );
                          totalCgst = invoice.cgstArray.reduce(
                            (acc, num) => acc + num,
                            0
                          );
                        } else {
                          totalSgst = 0;
                          totalCgst = 0;
                          totalIgst = invoice.gst;
                        }
                        return (
                          <TableRow
                            key={invoice._id}
                            sx={{ backgroundColor: "white" }}
                          >
                            <CustomBodyCell>{billingDate}</CustomBodyCell>
                            <CustomBodyCell>
                              INV-{invoice.invoiceno}
                            </CustomBodyCell>
                            <CustomBodyCell>{invoice.custname}</CustomBodyCell>
                            <CustomBodyCell>{invoice.custgst}</CustomBodyCell>
                            <CustomBodyCell sx={{ textAlign: "center" }}>
                              {invoice.totalamt.toFixed(2)}
                            </CustomBodyCell>
                            <CustomBodyCell sx={{ textAlign: "center" }}>
                              {totalSgst.toFixed(2)}
                            </CustomBodyCell>
                            <CustomBodyCell sx={{ textAlign: "center" }}>
                              {totalCgst.toFixed(2)}
                            </CustomBodyCell>
                            <CustomBodyCell sx={{ textAlign: "center" }}>
                              {totalIgst.toFixed(2)}
                            </CustomBodyCell>
                            <CustomBodyCell sx={{ textAlign: "center" }}>
                              {invoice.payableamt.toFixed(2)}
                            </CustomBodyCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <CustomBodyCell
                          colSpan={4}
                          sx={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          Grand Total
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {filteredInvoices
                            .reduce((sum, invoice) => sum + invoice.totalamt, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {filteredInvoices
                            .filter((item) => item.state === profileState)
                            .flatMap((item) => item.sgstArray) // flatten all cgst arrays
                            .reduce((sum, val) => sum + val, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {filteredInvoices
                            .filter((item) => item.state === profileState)
                            .flatMap((item) => item.cgstArray) // flatten all cgst arrays
                            .reduce((sum, val) => sum + val, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {filteredInvoices
                            .filter((item) => item.state !== profileState)
                            .reduce((sum, invoice) => sum + invoice.gst, 0)
                            .toFixed(2)}
                        </CustomBodyCell>
                        <CustomBodyCell
                          sx={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {filteredInvoices
                            .reduce(
                              (sum, invoice) => sum + invoice.payableamt,
                              0
                            )
                            .toFixed(2)}
                        </CustomBodyCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <CustomBodyCell colSpan={9} align="center">
                        No invoices found for the selected date range.
                      </CustomBodyCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default InvoicePage;
