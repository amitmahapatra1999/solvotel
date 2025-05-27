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
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { useRouter } from "next/navigation";
import Preloader from "../../_components/Preloader";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPurchaseDates, setLastPurchaseDates] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [stockQuantities, setStockQuantities] = useState({});
  const tableRef = useRef(null);
  const router = useRouter();
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  // Fetch items, categories, and stock report data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = getCookie("authToken");
        const usertoken = getCookie("userAuthToken");
        if (!token && !usertoken) {
          router.push("/"); // Redirect to login if no token is found
          return;
        }

        let decoded, userId;
        if (token) {
          // Verify the authToken (legacy check)
          decoded = await jwtVerify(
            token,
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
        // Fetch the profile by userId to get the username
        const profileResponse = await fetch(`/api/Profile/${userId}`);
        const profileData = await profileResponse.json();
        if (!profileData.success || !profileData.data) {
          router.push("/"); // Redirect to login if profile not found
          return;
        }
        const username = profileData.data.username;

        const [itemsResponse, categoriesResponse, stockReportResponse] =
          await Promise.all([
            fetch(`/api/InventoryList?username=${username}`),
            fetch(`/api/InventoryCategory?username=${username}`),
            fetch(`/api/stockreport?username=${username}`),
          ]);

        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();
        const stockReportData = await stockReportResponse.json();

        // Process stock report data for dates and quantities
        const purchaseDates = {};
        const stockData = {};
        stockReportData.stockReports.forEach((report) => {
          if (!report.name) return;
          const itemId = report.name._id;
          const quantity = Number(report.quantityAmount) || 0;
          // Initialize stock data if not exists
          if (!stockData[itemId]) {
            stockData[itemId] = {
              instock: 0,
              outstock: 0,
            };
          }
          // Update last purchase date
          if (report.purorsell === "purchase" || report.purorsell === "sell") {
            const currentDate = new Date(report.purchasedate);
            if (
              !purchaseDates[itemId] ||
              new Date(purchaseDates[itemId]) < currentDate
            ) {
              purchaseDates[itemId] = report.purchasedate;
            }
          }
          // Update quantities
          if (report.purorsell === "purchase") {
            stockData[itemId].instock += quantity;
          } else if (report.purorsell === "sell") {
            stockData[itemId].outstock += quantity;
          }
        });

        setLastPurchaseDates(purchaseDates);
        setStockQuantities(stockData);
        setItems(itemsData.items || []);
        setCategories(categoriesData.products || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-GB");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert("Please enter both start and end dates");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = items.filter((item) => {
      const purchaseDate = lastPurchaseDates[item._id];
      if (purchaseDate === "N/A" || !purchaseDate) return false;
      const itemDate = new Date(purchaseDate);
      return itemDate >= start && itemDate <= end;
    });
    setFilteredItems(filtered);
    setShowTable(true);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setShowTable(false);
    setFilteredItems([]);
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

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen">
        {isLoading && <Preloader />}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Stock Reports
          </h1>
          <div className="space-x-3 flex mb-4">
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              className="w-1/4"
              size="small"
            />
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              className="w-1/4"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleFilter}
              color="primary"
              size="small"
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              size="small"
              color="secondary"
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

          {showTable && (
            <TableContainer component={Paper}>
              <Table ref={tableRef}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Item Code
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Group
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Category
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      CGST
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      SGST
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Instock
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Outstock
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Available Quantity
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Unit
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      Last Order Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item._id} sx={{ backgroundColor: "white" }}>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.itemCode}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.group}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.segment?.itemName}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.tax / 2}%
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.tax / 2}%
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {stockQuantities[item._id]?.instock || "N/A"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {stockQuantities[item._id]?.outstock || "N/A"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.stock}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.quantityUnit}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {formatDate(lastPurchaseDates[item._id])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
