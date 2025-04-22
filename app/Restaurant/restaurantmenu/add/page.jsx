"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import Navbar from "../../../_components/Navbar";
import { Footer } from "../../../_components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Form } from "react-hook-form";

export default function AddRestaurant() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    itemCategory: "",
    itemSegment: "",
    itemCode: "",
    itemName: "",
    price: "",
    sgst: "",
    cgst: "",
    total: "",
    showInProfile: "Yes (Visible)",
    isSpecialItem: "No (Not Editable)",
    discountAllowed: "Yes (Allowed)",
    storeItemCode: "",
    ingredientCode: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };

      const gst =
        parseFloat(updatedData.sgst || 0) + parseFloat(updatedData.cgst || 0);

      if (name === "cgst" || name === "sgst" || name === "price") {
        // Calculate total when gst or tariff changes
        const price = parseFloat(updatedData.price).toFixed(2) || 0;
        updatedData.total = (((100 + gst) / 100) * price).toFixed(2);
      }

      if (name === "total") {
        // Calculate tariff when total is changed
        const total = parseFloat(updatedData.total).toFixed(2) || 0;
        updatedData.price = (total / ((100 + gst) / 100)).toFixed(2);
      }

      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/menuItem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Menu item added successfully:", result);
        toast.success("Menu item added successfully");
        router.back();
      } else {
        toast.error("Error adding menu item");
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  return (
    <div className="bg-white min-h-screen">
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

      <div
        className="py-10"
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "85%",
          margin: "0 auto",
        }}
      >
        <h2 className="text-3xl font-semibold text-cyan-900 mb-2">
          Add Restaurant Menu Item
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "4px",
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <Grid2 container spacing={3}>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Item Category*
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="itemCategory"
                  name="itemCategory"
                  value={formData.itemCategory}
                  onChange={handleInputChange}
                  label="Item Category*"
                >
                  {[
                    "Beverages",
                    "Bread",
                    "Breakfast",
                    "Chicken",
                    "Chinese",
                    "Dessert",
                    "Drinks",
                    "Egg",
                    "Ice-cream",
                    "Mutton",
                    "Paneer",
                    "Raita",
                    "Rice",
                    "Sea Fish",
                    "Salad",
                    "Soup",
                    "Special Item",
                    "Starter",
                    "Tandoori",
                    "Tandoori Bread",
                    "Veg Thali",
                    "Veg Special",
                    "Others",
                  ].map((category, index) => (
                    <MenuItem key={index} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Item Segment*
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="itemSegment"
                  name="itemSegment"
                  value={formData.itemSegment}
                  onChange={handleInputChange}
                  label="Item Segment*"
                >
                  {[
                    "Type or Select",
                    "Beverages",
                    "Breakfast",
                    "Chicken",
                    "Drinks",
                    "Egg",
                    "Ice-cream",
                    "Sea Fish",
                    "Mutton",
                    "Paneer",
                    "Raita",
                    "Thali",
                    "Others",
                  ].map((category, index) => (
                    <MenuItem key={index} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <TextField
                  id="Item Code"
                  label="Item Code"
                  variant="outlined"
                  type="text"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>
            </Grid2>
            <Grid2 size={9}>
              <FormControl fullWidth>
                <TextField
                  id="Item Name"
                  label="Item Name"
                  variant="outlined"
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>
            </Grid2>
            <Grid2 size={3}>
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="Price (INR)"
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>
            </Grid2>

            <Grid2 size={3}>
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="CGST (%)"
                  id="cgst"
                  name="cgst"
                  value={formData.cgst}
                  onChange={handleInputChange}
                />
              </FormControl>
            </Grid2>
            <Grid2 size={3}>
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="SGST (%)"
                  type="number"
                  id="sgst"
                  name="sgst"
                  value={formData.sgst}
                  onChange={handleInputChange}
                />
              </FormControl>
            </Grid2>
            <Grid2 size={3}>
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="IGST (%)"
                  type="number"
                  id="gst"
                  name="gst"
                  value={
                    parseFloat(formData.sgst || 0) +
                    parseFloat(formData.cgst || 0)
                  }
                  onChange={handleInputChange}
                  readOnly
                />
              </FormControl>
            </Grid2>
            <Grid2 size={3}>
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="Total (incl. GST)"
                  type="number"
                  id="total"
                  name="total"
                  value={formData.total}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>
            </Grid2>

            <Grid2 size={4}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Show in Profile?
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  label="Show in Profile?"
                  id="showInProfile"
                  name="showInProfile"
                  value={formData.showInProfile}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Yes (Visible)">Yes (Visible)</MenuItem>
                  <MenuItem value="No (Hidden)">No (Hidden)</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Is Special Item?
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  label="Is Special Item?"
                  id="isSpecialItem"
                  name="isSpecialItem"
                  value={formData.isSpecialItem}
                  onChange={handleInputChange}
                >
                  <MenuItem value="No (Not Editable)">
                    No (Not Editable)
                  </MenuItem>
                  <MenuItem value="Yes (Editable)">Yes (Editable)</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Discount Allowed?
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  label="Discount Allowed?"
                  id="discountAllowed"
                  name="discountAllowed"
                  value={formData.discountAllowed}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Yes (Allowed)">Yes (Allowed)</MenuItem>
                  <MenuItem value="No (Not Allowed)">No (Not Allowed)</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <TextField
                  id="Store Item Code"
                  label="Store Item Code"
                  variant="outlined"
                  type="text"
                  name="storeItemCode"
                  value={formData.storeItemCode}
                  onChange={handleInputChange}
                />
              </FormControl>
            </Grid2>
            <Grid2 size={8}>
              <FormControl fullWidth>
                <TextField
                  id="Ingredient Code"
                  label="Ingredient Code"
                  variant="outlined"
                  type="text"
                  name="ingredientCode"
                  value={formData.ingredientCode}
                  onChange={handleInputChange}
                />
              </FormControl>
            </Grid2>
          </Grid2>

          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button
              type="submit"
              style={{
                backgroundColor: "#4299e1",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
