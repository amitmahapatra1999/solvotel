"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../_components/Navbar";
import Preloader from "../_components/Preloader";
import { Footer } from "../_components/Footer";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { IconButton } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GetCustomDate } from "../../utils/DateFetcher";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export default function ExpensePage() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  useEffect(() => {
    const fetchExpenses = async () => {
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
        // Fetch products with username filter
        const response = await fetch(`/api/expense?username=${username}`);

        const data = await response.json();
        console.log(data);

        setProducts(data.data || []);
      } catch (error) {
        console.error("Failed to fetch Payment Method", error);
        toast.error("Failed to fetch Payment Method");
        router.push("/"); // Redirect to login if any error occurs
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, [router]);

  const handleAddProduct = async (formData) => {
    try {
      const method = currentProduct ? "PUT" : "POST";
      const url = currentProduct
        ? `/api/expense/${currentProduct?._id}`
        : "/api/expense";

      const token = getCookie("authToken");
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
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
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          date: formData.date,
          description: formData.description,
          amount: formData.amount,
          modeOfPayment: formData.modeOfPayment,
          username: username, // Include username in the request body
        }),
      });
      const data = await response.json();

      if (method === "POST") setProducts((prev) => [...prev, data.data]);
      else
        setProducts((prev) =>
          prev.map((product) =>
            product?._id === data.product?._id ? data.data : data
          )
        );
      setShowModal(false);
      setCurrentProduct(null);
      toast.success("Product saved successfully");
    } catch (error) {
      console.error("Error saving product", error);
      toast.error("Error saving product");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const token = getCookie("authToken");
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
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
      const response = await fetch(`/api/expense/${id}?username=${username}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`);
      }
      const data = await response.json();

      // Remove the deleted product from the state
      setProducts((prev) => prev.filter((product) => product?._id !== id));
      toast.success("Payment Method deleted successfully");
    } catch (error) {
      console.error("Error deleting Payment Method:", error);
      toast.error("Error deleting Payment Method:");
    }
  };
  //calling the delete function:
  const handleDeleteConfirm = async () => {
    if (selectedCategory) {
      await handleDeleteProduct(selectedCategory); // Delete the product
      setOpenDeleteDialog(false); // Close the dialog
      setSelectedCategory(null); // Reset the selected product ID
    }
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
          <div className="flex justify-between">
            <h1 className="text-3xl font-bold mb-4 text-cyan-900">Expenses</h1>
            <button
              onClick={() => {
                setShowModal(true);
                setCurrentProduct(null);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded mb-4"
            >
              Add New +
            </button>
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
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Title
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Description
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    MOP
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
                {products.map((product) => (
                  <TableRow
                    key={product?._id}
                    sx={{ backgroundColor: "white" }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>
                      {GetCustomDate(product?.date)}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {product?.title}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {product?.description}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {product?.amount}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {product?.modeOfPayment}
                    </TableCell>

                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setShowModal(true);
                          setCurrentProduct(product);
                        }}
                        disabled={product?.isActive}
                        sx={{ opacity: product?.isActive ? 0.5 : 1 }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setSelectedCategory(product?._id); // Store the product ID
                          setOpenDeleteDialog(true); // Open the confirmation dialog
                        }}
                        disabled={product?.isActive}
                        sx={{ opacity: product?.isActive ? 0.5 : 1 }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {products?.length === 0 && (
                  <TableRow sx={{ backgroundColor: "white" }}>
                    <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                      No data in the table
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Delete Item</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this item? This action cannot be
            undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {showModal && (
          <AddProductModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAddProduct}
            initialValue={currentProduct || ""}
          />
        )}
      </div>

      <Footer />
    </>
  );
}

const AddProductModal = ({ onClose, onSubmit, initialValue }) => {
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    description: "",
    amount: "",
    modeOfPayment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (initialValue) {
      setFormData({
        date: initialValue.date || "",
        title: initialValue.title || "",
        description: initialValue.description || "",
        amount: initialValue.amount || "",
        modeOfPayment: initialValue.modeOfPayment || "",
      });
    }
  }, [initialValue]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96 relative">
        <h2 className="text-xl font-bold mb-4">Add/Edit Expense</h2>
        <div className="mb-8 space-y-5">
          <TextField
            id="date"
            label="Date"
            variant="outlined"
            type="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            id="title"
            label="Title"
            variant="outlined"
            type="text"
            value={formData.title}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            id="description"
            label="Description"
            variant="outlined"
            type="text"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            id="amount"
            label="Amount"
            variant="outlined"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            id="modeOfPayment"
            label="Mode Of Payment"
            variant="outlined"
            type="text"
            value={formData.modeOfPayment}
            onChange={handleChange}
            fullWidth
          />
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !formData.date ||
              !formData.title ||
              !formData.amount ||
              isSubmitting
            }
            className={`bg-green-600 text-white px-4 py-2 rounded ${
              !formData.date ||
              !formData.title ||
              !formData.amount ||
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {initialValue ? "Update" : "Add"} Method
          </button>
        </div>
      </div>
    </div>
  );
};
