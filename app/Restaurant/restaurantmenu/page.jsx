// app/Restaurant/restaurantmenu/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Paper,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { Footer } from "../../_components/Footer";
import Navbar from "../../_components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RestaurantList() {
  const router = useRouter();
  const [restaurantItems, setRestaurantItems] = useState([]);
  const [error, setError] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/menuItem");
        const result = await response.json();
        if (result.success) {
          setRestaurantItems(result.data);
        } else {
          setError(result.error || "Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpenEditModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
  };

  const handleEditSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/menuItem/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedItem),
      });
      const result = await response.json();
      if (result.success) {
        setRestaurantItems((prev) =>
          prev.map((item) =>
            item._id === selectedItem._id ? result.data : item
          )
        );
        toast.success("Item updated successfully");
        setOpenEditModal(false);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Error updating item:", err);
      toast.error("Error updating item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/menuItem/${selectedItem._id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setRestaurantItems((prev) =>
          prev.filter((item) => item._id !== selectedItem._id)
        );
        toast.success("Item deleted successfully");
        setOpenDeleteDialog(false);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Error deleting item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
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
      <div className="bg-white min-h-screen">
        <Box>
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                <div className="loader"></div>
                <span className="mt-4 text-gray-700">
                  Loading Restaurant Menus...
                </span>
              </div>
            </div>
          )}
          <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
            <div className="flex justify-between mb-4">
              <h2 className="text-3xl font-bold  text-cyan-900">
                Restaurant Menu
              </h2>
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => router.push("/Restaurant/restaurantmenu/add")}
              >
                Add New +
              </button>
            </div>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                      Item Code
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                      Segment
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                      Price (INR)
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {restaurantItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.itemCategory}</TableCell>
                      <TableCell>{item.itemSegment}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditClick(item)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteClick(item)}>
                            <Delete color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {restaurantItems?.length === 0 && (
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

          {/* Edit Modal */}
          <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)}>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Item Code"
                fullWidth
                disabled // Item Code should not be editable as it's unique
                value={selectedItem?.itemCode || ""}
              />
              <TextField
                margin="dense"
                label="Item Category"
                fullWidth
                value={selectedItem?.itemCategory || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    itemCategory: e.target.value,
                  }))
                }
              />
              <TextField
                margin="dense"
                label="Item Segment"
                fullWidth
                value={selectedItem?.itemSegment || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    itemSegment: e.target.value,
                  }))
                }
              />
              <TextField
                margin="dense"
                label="Item Name"
                fullWidth
                value={selectedItem?.itemName || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    itemName: e.target.value,
                  }))
                }
              />
              <TextField
                margin="dense"
                label="Price"
                type="number"
                fullWidth
                value={selectedItem?.price || ""}
                onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0;
                  const sgst = parseFloat(selectedItem.sgst || 0);
                  const cgst = parseFloat(selectedItem.cgst || 0);
                  const gst = sgst + cgst;
                  const total = ((100 + gst) / 100) * price;
                  setSelectedItem((prev) => ({
                    ...prev,
                    price,
                    total: total.toFixed(2),
                  }));
                }}
              />
              <TextField
                margin="dense"
                label="SGST (%)"
                type="number"
                fullWidth
                value={selectedItem?.sgst || ""}
                onChange={(e) => {
                  const sgst = parseFloat(e.target.value) || 0;
                  const price = parseFloat(selectedItem.price || 0);
                  const cgst = parseFloat(selectedItem.cgst || 0);
                  const gst = sgst + cgst;
                  const total = ((100 + gst) / 100) * price;
                  setSelectedItem((prev) => ({
                    ...prev,
                    sgst,
                    total: total.toFixed(2),
                  }));
                }}
              />
              <TextField
                margin="dense"
                label="CGST (%)"
                type="number"
                fullWidth
                value={selectedItem?.cgst || ""}
                onChange={(e) => {
                  const cgst = parseFloat(e.target.value) || 0;
                  const price = parseFloat(selectedItem.price || 0);
                  const sgst = parseFloat(selectedItem.sgst || 0);
                  const gst = sgst + cgst;
                  const total = ((100 + gst) / 100) * price;
                  setSelectedItem((prev) => ({
                    ...prev,
                    cgst,
                    total: total.toFixed(2),
                  }));
                }}
              />
              {/* Read-only GST Field */}
              <TextField
                margin="dense"
                label="GST (%)"
                type="number"
                fullWidth
                value={
                  (
                    parseFloat(selectedItem?.sgst || 0) +
                    parseFloat(selectedItem?.cgst || 0)
                  ).toFixed(2) || ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
              <TextField
                margin="dense"
                label="Total (incl. GST)"
                type="number"
                fullWidth
                value={selectedItem?.total || ""}
                onChange={(e) => {
                  const total = parseFloat(e.target.value) || 0;
                  const sgst = parseFloat(selectedItem.sgst || 0);
                  const cgst = parseFloat(selectedItem.cgst || 0);
                  const gst = sgst + cgst;
                  const price = total / ((100 + gst) / 100);
                  setSelectedItem((prev) => ({
                    ...prev,
                    total,
                    price: price.toFixed(2),
                  }));
                }}
              />
              <TextField
                margin="dense"
                label="Show in Profile"
                select
                fullWidth
                SelectProps={{ native: true }}
                value={selectedItem?.showInProfile || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    showInProfile: e.target.value,
                  }))
                }
              >
                <option value="Yes (Visible)">Yes (Visible)</option>
                <option value="No (Hidden)">No (Hidden)</option>
              </TextField>
              <TextField
                margin="dense"
                label="Is Special Item"
                select
                fullWidth
                SelectProps={{ native: true }}
                value={selectedItem?.isSpecialItem || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    isSpecialItem: e.target.value,
                  }))
                }
              >
                <option value="Yes (Editable)">Yes (Editable)</option>
                <option value="No (Not Editable)">No (Not Editable)</option>
              </TextField>
              <TextField
                margin="dense"
                label="Discount Allowed"
                select
                fullWidth
                SelectProps={{ native: true }}
                value={selectedItem?.discountAllowed || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    discountAllowed: e.target.value,
                  }))
                }
              >
                <option value="Yes (Allowed)">Yes (Allowed)</option>
                <option value="No (Not Allowed)">No (Not Allowed)</option>
              </TextField>
              <TextField
                margin="dense"
                label="Store Item Code"
                fullWidth
                value={selectedItem?.storeItemCode || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    storeItemCode: e.target.value,
                  }))
                }
              />
              <TextField
                margin="dense"
                label="Ingredient Code"
                fullWidth
                value={selectedItem?.ingredientCode || ""}
                onChange={(e) =>
                  setSelectedItem((prev) => ({
                    ...prev,
                    ingredientCode: e.target.value,
                  }))
                }
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
              <Button onClick={handleEditSave} color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this menu item?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} color="error">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </div>
      <Footer />
    </>
  );
}
