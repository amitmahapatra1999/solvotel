// app/Restaurant/invoice/page.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreateInvoicePage from "./createinvoice";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import PrintableInvoice from "./PrintableInvoice"; // Import the PrintableInvoice component
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";

const InvoicePage = () => {
  const [menu, setMenu] = useState();
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [printableInvoice, setPrintableInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileState, setProfileState] = useState(null);

  // Date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        const menuResponse = await fetch("/api/menuItem");
        const menuData = await menuResponse.json();
        setMenu(menuData.data || []);
      } catch (error) {
        console.error("Failed to fetch menu data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/restaurantinvoice");
        const data = await response.json();
        // Sort invoices by date in descending order (newest first)
        const sortedInvoices = data.invoices.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setInvoices(sortedInvoices);
        setFilteredInvoices(sortedInvoices);
      } catch (error) {
        console.error(error);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/paymentMethod");
        const data = await response.json();
        // Sort invoices by date in descending order (newest first)

        setPaymentMethods(data.products);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPaymentMethods();
  }, []);

  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          } else {
            toast.error("Failed to fetch profile data");
          }
        } else {
          toast.error("Authentication token missing");
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Error fetching initial data");
      }
    };
    fetchData();
  }, []);

  // Modify the filter function to maintain the sort order
  const filterByDate = () => {
    if (startDate && endDate) {
      const filtered = invoices
        .filter((invoice) => {
          const invoiceDate = new Date(invoice.date);
          return (
            invoiceDate >= new Date(startDate) &&
            invoiceDate <= new Date(endDate)
          );
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Keep newest first
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices([...invoices]); // Show all invoices sorted
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/restaurantinvoice/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const updatedInvoices = invoices.filter(
          (invoice) => invoice._id !== id
        );
        setInvoices(updatedInvoices);
        setFilteredInvoices(updatedInvoices);
        toast.success("Invoice deleted successfully");
      } else {
        console.error("Failed to delete invoice");
        toast.error("Failed to delete invoice");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (invoice) => {
    setCurrentInvoice(invoice);

    setShowModal(true);
  };

  const handlePrintPreview = (invoice) => {
    setPrintableInvoice(invoice);
    setShowPrintModal(true);
  };

  const handleInvoiceSave = async (updatedInvoice) => {
    if (currentInvoice) {
      // Update (PUT request)
      try {
        const response = await fetch(
          `/api/restaurantinvoice/${currentInvoice._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedInvoice),
          }
        );
        if (response.ok) {
          const updatedInvoices = invoices.map((invoice) =>
            invoice._id === currentInvoice._id ? updatedInvoice : invoice
          );
          // Sort after updating
          const sortedInvoices = updatedInvoices.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          setInvoices(sortedInvoices);
          setFilteredInvoices(sortedInvoices);
          setCurrentInvoice(null);
          setShowModal(false);
          toast.success("Invoice updated successfully");
        } else {
          console.error("Failed to update invoice");
          toast.error("Failed to update invoice");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Add new invoice
      const newInvoices = [updatedInvoice, ...invoices]; // Add new invoice at the beginning
      setInvoices(newInvoices);
      setFilteredInvoices(newInvoices);
      setShowModal(false);
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setCurrentInvoice(null);
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
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="loader"></div>
              <span className="mt-4 text-gray-700">
                Loading Restaurant Invoices...
              </span>
            </div>
          </div>
        )}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Restaurant Invoices
          </h1>

          <div className="space-x-3 flex mb-4 ">
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
              color="success"
              onClick={() => {
                setCurrentInvoice(null);
                setShowModal(true);
              }}
              sx={{
                minWidth: "150px",
                height: "40px",
              }}
            >
              Create Invoice
            </Button>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Invoice ID.
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Customer Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Total Amount
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
                    CGST
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    IGST
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Payable Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Payment Method
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => {
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
                        <TableCell sx={{ textAlign: "center" }}>
                          {invoice.invoiceno}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {(() => {
                            const date = new Date(invoice.date);
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
                          {invoice.custname}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {invoice.totalamt.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {totalSgst.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {totalCgst.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {totalIgst.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {invoice.payableamt.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {invoice.paymentMethod}
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            display: "flex",
                            gap: "2px",
                            justifyContent: "center",
                          }}
                        >
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit />
                          </IconButton>

                          <IconButton
                            color="secondary"
                            onClick={() => handleDelete(invoice._id)}
                          >
                            <Delete />
                          </IconButton>
                          {/* <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          onClick={() => handlePrintPreview(invoice)}
                        >
                          Print
                        </Button> */}
                          <IconButton
                            color="secondary"
                            onClick={() => handlePrintPreview(invoice)}
                          >
                            <PrintOutlinedIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No invoices available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Modal for Create/Edit Invoice */}
          {showModal && (
            <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <CreateInvoicePage
                paymentMethods={paymentMethods}
                onInvoiceCreate={handleInvoiceSave}
                existingInvoice={currentInvoice}
                onCancel={handleCancelModal}
              />
            </div>
          )}

          {showPrintModal && printableInvoice && (
            <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-end mb-4">
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => {
                      setShowPrintModal(false);
                      setPrintableInvoice(null);
                    }}
                  >
                    Close
                  </button>
                </div>
                <PrintableInvoice invoiceId={printableInvoice._id} />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default InvoicePage;
