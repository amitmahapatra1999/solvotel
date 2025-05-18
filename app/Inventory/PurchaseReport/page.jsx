"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import { ToastContainer, toast } from "react-toastify"; //impo
import "react-toastify/dist/ReactToastify.css"; //impo
import TextField from "@mui/material/TextField";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
} from "@heroicons/react/outline"; // Ensure you have @heroicons/react installed

const PurchaseReportPage = () => {
  const [purchaseReports, setPurchaseReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseorderno, setPurchaseorderno] = useState("");
  const [purchasedate, setPurchasedate] = useState("");
  const [Invoiceno, setInvoiceno] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityAmount, setQuantityAmount] = useState("");
  const [rate, setRate] = useState("");
  const [total, setTotal] = useState("");
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [duplicateError, setDuplicateError] = useState({
    purchaseorderno: false,
    Invoiceno: false,
  });

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Ref to access the table
  const tableRef = useRef(null);
  const router = useRouter();
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

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

        const [itemsResponse, purchaseResponse] = await Promise.all([
          fetch(`/api/InventoryList?username=${username}`),
          fetch(`/api/stockreport?username=${username}`),
        ]);

        const itemsData = await itemsResponse.json();
        const purchaseData = await purchaseResponse.json();
        setItems(itemsData.items || []);
        if (purchaseResponse.ok) {
          const purchases = purchaseData.stockReports.filter(
            (report) => report.purorsell === "purchase"
          );
          setPurchaseReports(purchases);
          setFilteredReports(purchases);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        setError("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Function to check for duplicates
  const checkForDuplicates = (field, value) => {
    return purchaseReports.some((report) => {
      if (field === "purchaseorderno") {
        return report.purchaseorderno.toLowerCase() === value.toLowerCase();
      } else if (field === "invoiceno") {
        return report.Invoiceno.toLowerCase() === value.toLowerCase();
      }
      return false;
    });
  };

  // Modify useEffect to include duplicate checks
  useEffect(() => {
    if (quantityAmount && rate && selectedItem) {
      const taxMultiplier = 1 + selectedItem.tax / 100;
      const calculatedTotal =
        parseFloat(quantityAmount) * parseFloat(rate) * taxMultiplier;
      setTotal(calculatedTotal.toFixed(2));
      // Check for validation conditions
      const isDisabled =
        !purchaseorderno ||
        !purchasedate ||
        !Invoiceno ||
        duplicateError.purchaseorderno ||
        duplicateError.Invoiceno;
      setIsSaveDisabled(isDisabled);
    } else {
      setTotal("");
      setIsSaveDisabled(true);
    }
  }, [
    quantityAmount,
    rate,
    selectedItem,
    purchaseorderno,
    purchasedate,
    Invoiceno,
    duplicateError,
  ]);

  // Update the handlers for purchaseorderno and invoiceno
  const handlePurchaseOrderChange = (e) => {
    const value = e.target.value;
    setPurchaseorderno(value);
    const isDuplicate = checkForDuplicates("purchaseorderno", value);
    setDuplicateError((prev) => ({
      ...prev,
      purchaseorderno: isDuplicate,
    }));
  };

  const handleInvoiceNoChange = (e) => {
    const value = e.target.value;
    setInvoiceno(value);
    const isDuplicate = checkForDuplicates("invoiceno", value);
    setDuplicateError((prev) => ({
      ...prev,
      invoiceno: isDuplicate,
    }));
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setPurchaseorderno("");
    setPurchasedate("");
    setInvoiceno("");
    setSelectedItem(null);
    setQuantityAmount("");
    setRate("");
    setTotal("");
    setIsModalOpen(false);
    setDuplicateError({
      purchaseorderno: false,
      invoiceno: false,
    });
  };

  const handleItemChange = (itemId) => {
    const item = items.find((item) => item._id === itemId);
    setSelectedItem(item || null);
  };

  const handlePurchase = async () => {
    if (
      !purchaseorderno ||
      !purchasedate ||
      !Invoiceno ||
      !selectedItem ||
      !quantityAmount ||
      !rate
    ) {
      toast.warn("🥲 Please fill in all fields!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    }
    if (!selectedItem) {
      setError("Please select an item");
      return;
    }
    const purchaseData = {
      purchaseorderno,
      name: selectedItem._id,
      purchasedate: new Date(purchasedate),
      Invoiceno,
      quantity: selectedItem._id,
      quantityAmount: parseFloat(quantityAmount),
      unit: selectedItem._id,
      rate: parseFloat(rate),
      taxpercent: selectedItem._id,
      total: parseFloat(total),
      purorsell: "purchase",
      username: selectedItem.username, // Include username in the request body
    };
    try {
      const response = await fetch("/api/stockreport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });
      const result = await response.json();
      if (response.ok) {
        await updateStockQuantity(
          selectedItem._id,
          parseFloat(quantityAmount),
          selectedItem.stock
        );
        setPurchaseReports((prevReports) => [
          ...prevReports,
          result.stockReport,
        ]);
        handleCloseModal();
        toast.success("👍 Item Purchased Successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          onClose: () => window.location.reload(),
        });
      } else {
        setError(result.error || "Failed to save purchase report");
        toast.error("👎 Failed to save purchase report", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error("Error saving purchase report:", error);
      setError("Error saving purchase report");
    }
  };

  const updateStockQuantity = async (itemId, quantityAmount, currentStock) => {
    try {
      const newStock = currentStock + quantityAmount;
      const response = await fetch(`/api/InventoryList/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stock: newStock,
          username: selectedItem.username,
        }), // Include username in the request body
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error("Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      throw error;
    }
  };

  // Filter Function
  const filterByDate = () => {
    if (startDate && endDate) {
      const filtered = purchaseReports.filter((report) => {
        const purchaseDate = new Date(report.purchasedate);
        return (
          purchaseDate >= new Date(startDate) &&
          purchaseDate <= new Date(endDate)
        );
      });
      setFilteredReports(filtered);
    } else {
      setFilteredReports(purchaseReports); // Show all reports if no dates are selected
    }
  };

  const printTable = () => {
    if (!tableRef.current) return;

    const tableHTML = tableRef.current.outerHTML;
    const originalContent = document.body.innerHTML;

    // Replace body content with table HTML
    document.body.innerHTML = `
      <html>
        <head>
          <title>Stock Report</title>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            table, th, td {
              border: 1px solid black;
            }
            th, td {
              padding: 8px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${tableHTML}
        </body>
      </html>
    `;

    // Trigger print
    window.print();

    // Restore original content
    document.body.innerHTML = originalContent;

    // Reattach React event listeners after restoring DOM
    window.location.reload();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="bg-white min-h-screen">
        <ToastContainer //position
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
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="loader"></div>
              <span className="mt-4 text-gray-700">
                Loading Purchase Reports...
              </span>
            </div>
          </div>
        )}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Purchase Report
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
              className="w-1/4"
              size="small"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={filterByDate}
              className="ml-2"
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setFilteredReports(purchaseReports); // Reset to show all reports
              }}
              className="ml-2"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={printTable}
              className="ml-2"
              sx={{
                backgroundColor: "orange",
                "&:hover": {
                  backgroundColor: "darkorange",
                },
              }}
            >
              Download/Export
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setIsModalOpen(true)}
            >
              Purchase Stock
            </Button>
          </div>

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
                    Purchase No
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Item Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Purchase Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Invoice No
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Purchased Quantity
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
                    Rate
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
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow
                      key={report._id}
                      sx={{
                        "& > td": {
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          textAlign: "center",
                          background: `linear-gradient(
                                      to right,
                                      ${
                                        report.purorsell === "purchase"
                                          ? "#1ebc1e"
                                          : "#f24a23"
                                      } 5%, 
                                      white 5%
                                      )`,
                        }}
                      >
                        {report.purchaseorderno}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.name?.name}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {(() => {
                          const date = new Date(report.purchasedate);
                          const day = String(date.getDate()).padStart(2, "0");
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const year = date.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.Invoiceno}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.quantityAmount}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.unit?.quantityUnit}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.rate}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.taxpercent?.tax / 2}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.taxpercent?.tax / 2}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {report.total}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No Purchase reports available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Modal open={isModalOpen} onClose={handleCloseModal}>
          <Box
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-1/2 shadow-md max-h-[90%] overflow-y-auto"
            sx={{ borderRadius: 2 }}
          >
            <h2 className="text-xl font-bold mb-4">New Sales</h2>
            <form className="space-y-4">
              <TextField
                required
                id="purchaseorderno"
                label="Purchase Order No"
                variant="outlined"
                value={purchaseorderno}
                onChange={handlePurchaseOrderChange}
                className="w-full"
                error={duplicateError.purchaseorderno}
                helperText={
                  duplicateError.purchaseorderno
                    ? "This Sales Order No already exists"
                    : ""
                }
              />
              <TextField
                required
                id="purchasedate"
                label="Purchase Date"
                variant="outlined"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={purchasedate}
                onChange={(e) => setPurchasedate(e.target.value)}
                className="w-full"
              />
              <TextField
                required
                id="Invoiceno"
                label="Invoice No"
                variant="outlined"
                value={Invoiceno}
                onChange={handleInvoiceNoChange}
                className="w-full"
                error={duplicateError.invoiceno}
                helperText={
                  duplicateError.invoiceno
                    ? "This Invoice No already exists"
                    : ""
                }
              />
              <TextField
                required
                select
                id="itemname"
                variant="outlined"
                value={selectedItem?._id || ""}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </TextField>
              <TextField
                required
                id="unit"
                label="Unit"
                variant="outlined"
                value={selectedItem?.quantityUnit || ""}
                disabled
                className="w-full"
              />
              <TextField
                required
                id="stock"
                label="Current Stock"
                variant="outlined"
                value={selectedItem?.stock || "0"}
                disabled
                className="w-full"
              />
              <TextField
                required
                id="quantityAmount"
                label="Purchase Quantity"
                variant="outlined"
                type="number"
                value={quantityAmount}
                onChange={(e) => setQuantityAmount(e.target.value)}
                className="w-full"
              />
              <TextField
                required
                id="rate"
                label="Rate"
                variant="outlined"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full"
              />
              <TextField
                required
                id="taxpercent"
                label="IGST Tax Percent"
                variant="outlined"
                value={selectedItem?.tax || ""}
                disabled
                className="w-full"
              />
              <TextField
                required
                id="taxpercent"
                label="SGST Tax Percent"
                variant="outlined"
                value={(selectedItem?.tax / 2).toFixed(2) || ""}
                disabled
                className="w-full"
              />
              <TextField
                required
                id="taxpercent"
                label="CGST Tax Percent"
                variant="outlined"
                value={(selectedItem?.tax / 2).toFixed(2) || ""}
                disabled
                className="w-full"
              />
              <TextField
                required
                id="total"
                label="Total"
                variant="outlined"
                value={total}
                disabled
                className="w-full"
              />
              <div className="flex justify-end">
                <Button
                  variant="contained"
                  color="success"
                  sx={{ mr: 2 }}
                  onClick={handlePurchase}
                  disabled={isSaveDisabled}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Box>
        </Modal>
      </div>
      <Footer />
    </div>
  );
};

export default PurchaseReportPage;
