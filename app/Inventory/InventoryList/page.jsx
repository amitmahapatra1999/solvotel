"use client";
import React, { useState, useEffect } from "react";
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
import { styled } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import { Grid2, IconButton } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState({ type: "", itemId: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState(null);
  const router = useRouter();
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  // Fetch items and categories
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
        console.log(profileData);
        if (!profileData.success || !profileData.data) {
          router.push("/"); // Redirect to login if profile not found
          return;
        }
        const username = profileData.data.username;
        const [itemsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/InventoryList?username=${username}`),
          fetch(`/api/InventoryCategory?username=${username}`),
        ]);

        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setItems(itemsData.items || []);
        setCategories(categoriesData.products || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
        router.push("/"); // Redirect to login if any error occurs
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const updateCategoryStatus = async (segmentId) => {
    try {
      const token = getCookie("authToken"); // Get the token from cookies
      if (!token) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }
      // Verify the token
      const decoded = await jwtVerify(
        token,
        new TextEncoder().encode(SECRET_KEY)
      );
      const userId = decoded.payload.id;
      // Fetch the profile by userId to get the username
      const profileResponse = await fetch(`/api/Profile/${userId}`);
      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.data) {
        router.push("/"); // Redirect to login if profile not found
        return;
      }
      const username = profileData.data.username;

      const response = await fetch(`/api/InventoryCategory/${segmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: true, username: username }), // Include username in the request body
      });

      if (!response.ok) {
        throw new Error("Failed to update category status");
      }

      // Update local categories state
      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category._id === segmentId
            ? { ...category, isActive: true }
            : category
        )
      );
      //toast.success("Item updated successfully");
    } catch (error) {
      console.error("Error updating category status:", error);
      toast.error("Error updating category status:");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const method = currentItem ? "PUT" : "POST";
      const url = currentItem
        ? `/api/InventoryList/${currentItem._id}`
        : "/api/InventoryList";
      const token = getCookie("authToken"); // Get the token from cookies
      if (!token) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }
      // Verify the token
      const decoded = await jwtVerify(
        token,
        new TextEncoder().encode(SECRET_KEY)
      );
      const userId = decoded.payload.id;
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, username: username }), // Include username in the request body
      });

      const data = await response.json();
      if (method === "POST") {
        setItems((prev) => [...prev, data.item]);
        // Update category status when new item is added
        await updateCategoryStatus(formData.segment);
        toast.success("Item added successfully");
      } else {
        setItems((prev) =>
          prev.map((item) => (item._id === data.item._id ? data.item : item))
        );
      }
      setShowModal(false);
      setCurrentItem(null);
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Error saving item:");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const token = getCookie("authToken"); // Get the token from cookies
      if (!token) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }
      // Verify the token
      const decoded = await jwtVerify(
        token,
        new TextEncoder().encode(SECRET_KEY)
      );
      const userId = decoded.payload.id;
      // Fetch the profile by userId to get the username
      const profileResponse = await fetch(`/api/Profile/${userId}`);
      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.data) {
        router.push("/"); // Redirect to login if profile not found
        return;
      }
      const username = profileData.data.username;

      const response = await fetch(
        `/api/InventoryList/${id}?username=${username}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data.message);

      // Remove the deleted product from the state
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product:");
    }
  };

  const handleEditProduct = (item) => {
    setCurrentItem(item);
    setShowModal(true);
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
                Loading Inventory List...
              </span>
            </div>
          </div>
        )}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <div className="flex justify-between">
            <h1 className="text-3xl font-bold mb-4 text-cyan-900">
              Inventory List
            </h1>
            <button
              onClick={() => {
                setShowModal(true);
                setCurrentItem(null);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded mb-4"
            >
              Add Items +
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
                    Segment
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Auditable
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
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
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
                      {item.auditable}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {item.tax / 2}%
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {item.tax / 2}%
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditProduct(item)}
                        disabled={item.isActive}
                        sx={{ opacity: item.isActive ? 0.5 : 1 }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDeleteProduct(item._id)}
                        disabled={item.isActive}
                        sx={{ opacity: item.isActive ? 0.5 : 1 }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {items?.length === 0 && (
                  <TableRow sx={{ backgroundColor: "white" }}>
                    <TableCell colSpan={8} sx={{ textAlign: "center" }}>
                      No data in the table
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        {showModal && (
          <ItemModal
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            initialData={currentItem}
            categories={categories}
          />
        )}
      </div>
      <Footer />
    </>
  );
}

const ItemModal = ({ onClose, onSubmit, initialData, categories }) => {
  const [formData, setFormData] = useState(
    initialData || {
      itemCode: "",
      name: "",
      group: "",
      segment: "",
      auditable: "no",
      tax: "",
      stock: 0,
      quantityUnit: "pieces",
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = () => {
    return (
      formData.itemCode.trim() !== "" &&
      formData.name.trim() !== "" &&
      formData.group.trim() !== "" &&
      formData.segment !== "" &&
      formData.tax !== ""
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div
        className="bg-white p-6 rounded shadow-lg"
        style={{ width: "80%", maxWidth: "600px" }}
      >
        <h2 className="text-xl font-bold mb-4">
          {initialData ? "Edit" : "Add"} Item
        </h2>
        <Grid2 container spacing={2}>
          <Grid2 size={6}>
            <TextField
              id="itemCode"
              label="Item Code"
              variant="outlined"
              type="text"
              value={formData.itemCode}
              onChange={(e) =>
                setFormData({ ...formData, itemCode: e.target.value })
              }
              className="w-full"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <TextField
              id="name"
              label="Name"
              variant="outlined"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <TextField
              id="group"
              label="Group"
              variant="outlined"
              type="text"
              value={formData.group}
              onChange={(e) =>
                setFormData({ ...formData, group: e.target.value })
              }
              className="w-full"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <TextField
              id="segment"
              label="Segment"
              variant="outlined"
              select
              value={formData.segment}
              onChange={(e) =>
                setFormData({ ...formData, segment: e.target.value })
              }
              className="w-full"
              fullWidth
            >
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.itemName}
                </MenuItem>
              ))}
            </TextField>
          </Grid2>
          <Grid2 size={6}>
            <TextField
              id="auditable"
              label="Auditable"
              variant="outlined"
              select
              value={formData.auditable}
              onChange={(e) =>
                setFormData({ ...formData, auditable: e.target.value })
              }
              className="w-full"
              fullWidth
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>
          </Grid2>
          <Grid2 size={6}>
            <TextField
              id="tax"
              label="Tax (%)"
              variant="outlined"
              type="number"
              value={formData.tax}
              onChange={(e) =>
                setFormData({ ...formData, tax: parseFloat(e.target.value) })
              }
              className="w-full"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <TextField
              id="stock"
              label="Initial Stock"
              variant="outlined"
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: parseInt(e.target.value) })
              }
              className="w-full"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <TextField
              fullWidth
              id="quantityUnit"
              label="Quantity Unit"
              variant="outlined"
              select
              value={formData.quantityUnit}
              onChange={(e) =>
                setFormData({ ...formData, quantityUnit: e.target.value })
              }
              className="w-full"
            >
              <MenuItem value="pieces">Pieces</MenuItem>
              <MenuItem value="kgs">Kgs</MenuItem>
              <MenuItem value="grams">Grams</MenuItem>
              <MenuItem value="litres">Litres</MenuItem>
            </TextField>
          </Grid2>
        </Grid2>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`bg-green-600 text-white px-4 py-2 rounded ${
              !isFormValid() || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {initialData ? "Update" : "Add"} Item
          </button>
        </div>
      </div>
    </div>
  );
};
