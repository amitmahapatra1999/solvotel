"use client";
import { useEffect, useState } from "react";

import { useParams } from "next/navigation";
import axios from "axios";
import Navbar from "../../../../_components/Navbar";
import { Footer } from "../../../../_components/Footer";
import PrintableRoomInvoice from "./printRoomInvoice";
import PrintableServiceInvoice from "./printServiceInvoice";
import PrintableFoodInvoice from "./printFoodInvoice";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

const BookingDashboard = () => {
  const { id } = useParams();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingDueAmount, setRemainingDueAmount] = useState(0);
  const [printableRoomInvoice, setPrintableRoomInvoice] = useState(null);
  const [printableFoodInvoice, setPrintableFoodInvoice] = useState(null);
  const [printableServiceInvoice, setPrintableServiceInvoice] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  // Modal States

  const [openServicesModal, setOpenServicesModal] = useState(false);
  const [openFoodModal, setOpenFoodModal] = useState(false);

  const [openBillPaymentModal, setOpenBillPaymentModal] = useState(false);
  // Service Form States
  const [serviceName, setServiceName] = useState("");
  const [serviceCGST, setServiceCGST] = useState("0"); // Changed from serviceTax to serviceCGST
  const [serviceSGST, setServiceSGST] = useState("0");
  const [servicePrice, setServicePrice] = useState("0");
  const [serviceTotal, setServiceTotal] = useState("0");
  const [services, setServices] = useState([]);
  // Food Form States
  const [menuItems, setMenuItems] = useState([]);
  const [selectedFoodItem, setSelectedFoodItem] = useState([]);
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState("");
  const [foodCGST, setFoodCGST] = useState(""); // Changed from foodTax to foodCGST
  const [foodSGST, setFoodSGST] = useState("");
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [selectedFoodItems, setSelectedFoodItems] = useState([]);
  // Payment Form States
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  // Separated Items Lists
  const [foodItems, setFoodItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  // Add new state variables for remarks
  const [foodRemarks, setFoodRemarks] = useState("");
  const [serviceRemarks, setServiceRemarks] = useState("");
  const [roomRemarks, setRoomRemarks] = useState("");
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  const [paymentMethods, setPaymentMethods] = useState([]);

  // Modal Styles
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  // Calculate service total when price or tax changes
  useEffect(() => {
    if (servicePrice && (serviceCGST || serviceSGST)) {
      const price = Number.parseFloat(servicePrice);
      const cgstRate = Number.parseFloat(serviceCGST);
      const sgstRate = Number.parseFloat(serviceSGST);

      const cgstAmount = (price * cgstRate) / 100;
      const sgstAmount = (price * sgstRate) / 100;

      const total = price + cgstAmount + sgstAmount;
      setServiceTotal(total.toFixed(2));
    } else {
      setServiceTotal("");
    }
  }, [servicePrice, serviceCGST, serviceSGST]); // dependencies

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
        const menuResponse = await fetch("/api/menuItem");
        const menuData = await menuResponse.json();
        setMenuItems(menuData.data);
      } catch (err) {
        console.error("Error fetching menu items:", err);
      }
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find(
            (row) =>
              row.startsWith("authToken=") || row.startsWith("userAuthToken=")
          )
          .split("=")[1];
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch menu items for comparison
        const menuResponse = await axios.get("/api/menuItem", { headers });
        const menuItemsList = menuResponse.data.data;
        // Fetch billing details
        const billingResponse = await axios.get(`/api/Billing/${id}`, {
          headers,
        });
        const billingData = billingResponse.data.data;
        setRemainingDueAmount(billingData.dueAmount);

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

            // Extract CGST and SGST values properly
            let cgstValue = 0;
            let sgstValue = 0;
            // First try to get from cgstArray and sgstArray
            if (roomCGST[itemIndex] !== undefined) {
              cgstValue = parseFloat(roomCGST[itemIndex]);
            }

            if (roomSGST[itemIndex] !== undefined) {
              sgstValue = parseFloat(roomSGST[itemIndex]);
            }

            // If not found, try to get from taxList in the new format [sgst, cgst]
            if ((cgstValue === 0 && sgstValue === 0) && roomTaxes[itemIndex]) {
              if (Array.isArray(roomTaxes[itemIndex]) && roomTaxes[itemIndex].length === 2) {
                sgstValue = parseFloat(roomTaxes[itemIndex][0] || 0);
                cgstValue = parseFloat(roomTaxes[itemIndex][1] || 0);
              } else {
                // Fallback to old format
                const totalTax = parseFloat(roomTaxes[itemIndex] || 0);
                cgstValue = totalTax / 2;
                sgstValue = totalTax / 2;
              }
            }


            const itemDetails = {
              name: item,
              price: parseFloat(roomPrices[itemIndex] || 0),
              quantity: parseInt(roomQuantities[itemIndex] || 1),
              tax: cgstValue + sgstValue,
              cgst: cgstValue,
              sgst: sgstValue,
              roomIndex: roomIndex,
            };



            if (menuItem) {
              foodItemsArray.push(itemDetails);
            } else if (item !== "Room Charge") {
              serviceItemsArray.push(itemDetails);
            }
          });
        });

        setFoodItems([...foodItemsArray]);
        setServiceItems(serviceItemsArray);
        setServices([...serviceItemsArray]);

        // Fetch room details - Modified to handle multiple rooms
        const roomsResponse = await axios.get("/api/rooms", { headers });
        const matchedRooms = roomsResponse.data.data.filter((room) =>
          billingData.roomNo.includes(String(room.number))
        );

        if (matchedRooms.length === 0) {
          throw new Error("No matching rooms found");
        }

        // Fetch room categories
        const roomCategoriesResponse = await axios.get("/api/roomCategories", {
          headers,
        });

        // Get categories for all matched rooms
        const matchedCategories = matchedRooms.map((room) =>
          roomCategoriesResponse.data.data.find(
            (category) => category._id === room.category._id
          )
        );

        // Fetch bookings
        const newBookingsResponse = await axios.get("/api/NewBooking", {
          headers,
        });
        const bookingResult = newBookingsResponse.data.data;
        const filteredBookingData = bookingResult?.find((item, index) => {
          if (item?.bookingId === billingData.bookingId) {
            return item;
          }
        });

        setBookingData({
          billing: billingData,
          bookings: filteredBookingData, // Use unique bookings
          rooms: matchedRooms,
          categories: matchedCategories,
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching booking details:", err);
      }
    };
    fetchBookingDetails();
  }, [id]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
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

  // Handler functions for modals
  const handleOpenServicesModal = () => {
    setOpenServicesModal(true);
    setServiceName("");
    setServicePrice("");
    setServiceCGST("");
    setServiceSGST("");
    setServiceTotal("");
  };
  const handleCloseServicesModal = () => {
    setOpenServicesModal(false);
    setServiceName("");
    setServicePrice("");
    setServiceCGST("");
    setServiceSGST("");
    setServiceTotal("");
  };

  const handleRoomPrintPreview = (billing) => {
    setPrintableRoomInvoice(billing);
    setShowPrintModal(true);
  };

  const handleServicePrintPreview = (billing) => {
    setPrintableServiceInvoice(billing);
    setShowPrintModal(true);
  };

  const handleFoodPrintPreview = (billing) => {
    setPrintableFoodInvoice(billing);
    setShowPrintModal(true);
  };

  const handleOpenFoodModal = () => {
    setOpenFoodModal(true);
    setSelectedFoodItem([]);
    setFoodName("");
    setFoodPrice("");
    setFoodCGST("");
    setFoodSGST("");
  };
  const handleCloseFoodModal = () => setOpenFoodModal(false);
  const handleOpenBillPaymentModal = () => setOpenBillPaymentModal(true);
  const handleCloseBillPaymentModal = () => {
    setOpenBillPaymentModal(false);
    setPaymentAmount("");
  };

  // Handler functions for form submissions
  const handleAddService = async () => {
    if (!serviceName || !servicePrice) {
      alert("Please enter service name and price");
      return;
    }
    try {
      const token = document.cookie
        .split("; ")
        .find(
          (row) =>
            row.startsWith("authToken=") || row.startsWith("userAuthToken=")
        )
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };

      // Get current billing data
      const billingResponse = await axios.get(`/api/Billing/${id}`, {
        headers,
      });
      const billing = billingResponse.data.data;

      // Calculate total tax rate for backward compatibility
      const totalTaxRate =
        Number.parseFloat(serviceCGST || 0) +
        Number.parseFloat(serviceSGST || 0);

      // Prepare arrays for update with proper initialization
      const updatedItemList = Array.isArray(billing.itemList)
        ? [...billing.itemList]
        : [];
      const updatedPriceList = Array.isArray(billing.priceList)
        ? [...billing.priceList]
        : [];
      const updatedTaxList = Array.isArray(billing.taxList)
        ? [...billing.taxList]
        : [];
      const updatedQuantityList = Array.isArray(billing.quantityList)
        ? [...billing.quantityList]
        : [];
      const updatedCGSTArray = Array.isArray(billing.cgstArray)
        ? [...billing.cgstArray]
        : [];
      const updatedSGSTArray = Array.isArray(billing.sgstArray)
        ? [...billing.sgstArray]
        : [];

      // Ensure arrays have room index
      while (updatedItemList.length <= selectedRoomIndex) {
        updatedItemList.push([]);
      }
      while (updatedPriceList.length <= selectedRoomIndex) {
        updatedPriceList.push([]);
      }
      while (updatedTaxList.length <= selectedRoomIndex) {
        updatedTaxList.push([]);
      }
      while (updatedQuantityList.length <= selectedRoomIndex) {
        updatedQuantityList.push([]);
      }
      while (updatedCGSTArray.length <= selectedRoomIndex) {
        updatedCGSTArray.push([]);
      }
      while (updatedSGSTArray.length <= selectedRoomIndex) {
        updatedSGSTArray.push([]);
      }

      // Add new service to arrays
      updatedItemList[selectedRoomIndex].push(serviceName);
      updatedPriceList[selectedRoomIndex].push(Number.parseFloat(servicePrice));
      updatedTaxList[selectedRoomIndex].push([
        Number.parseFloat(serviceSGST || 0),
        Number.parseFloat(serviceCGST || 0)
      ]);
      // Store total tax rate for compatibility
      updatedQuantityList[selectedRoomIndex].push(1);
      // Keep these for backward compatibility
      // Keep these for backward compatibility
      updatedCGSTArray[selectedRoomIndex].push(
        Number.parseFloat(serviceCGST || 0)
      );
      updatedSGSTArray[selectedRoomIndex].push(
        Number.parseFloat(serviceSGST || 0)
      );

      const serviceRemarksArray = Array.isArray(billing.ServiceRemarks)
        ? [...billing.ServiceRemarks]
        : [];
      if (serviceRemarks) {
        serviceRemarksArray.push(serviceRemarks);
      }

      const response = await axios.put(
        `/api/Billing/${id}`,
        {
          itemList: updatedItemList,
          priceList: updatedPriceList,
          taxList: updatedTaxList,
          quantityList: updatedQuantityList,
          cgstArray: updatedCGSTArray,
          sgstArray: updatedSGSTArray,
          roomIndex: selectedRoomIndex,
          ServiceRemarks: serviceRemarksArray,
        },
        { headers }
      );

      // Update local state
      const newService = {
        roomIndex: selectedRoomIndex,
        name: serviceName,
        price: Number.parseFloat(serviceTotal),
        tax: totalTaxRate,
        cgst: Number.parseFloat(serviceCGST || 0),
        sgst: Number.parseFloat(serviceSGST || 0),
        quantity: 1,
      };
      setServices([...services, newService]);
      handleCloseServicesModal();
      window.location.reload();
    } catch (error) {
      console.error("Error adding service:", error);
      alert(
        "Failed to add service: " +
        (error.response?.data?.error || error.message)
      );
    }
  };

  const handleFoodItemChange = (event) => {
    const selectedItem = menuItems.find(
      (item) => item.itemName === event.target.value
    );
    if (selectedItem) {
      setSelectedFoodItem(selectedItem);
      setFoodName(selectedItem.itemName || "");
      setFoodPrice(selectedItem.price?.toString() || "0");
      setFoodCGST(selectedItem.cgst?.toString() || "0");
      setFoodSGST(selectedItem.sgst?.toString() || "0");
      setFoodQuantity(1);
    }
  };

  const calculateTotalWithTax = (price, cgst, sgst, quantity) => {
    const basePrice = Number.parseFloat(price) * quantity;
    const cgstAmount = (basePrice * cgst) / 100;
    const sgstAmount = (basePrice * sgst) / 100;
    return basePrice + cgstAmount + sgstAmount;
  };

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value);
    if (value > 0) {
      setFoodQuantity(value);
    }
  };

  const handleAddToList = () => {
    if (!selectedFoodItem) {
      alert("Please select a food item");
      return;
    }

    const totalPriceWithTax = calculateTotalWithTax(
      selectedFoodItem.price,
      selectedFoodItem.cgst || 0,
      selectedFoodItem.sgst || 0,
      foodQuantity
    );

    const newItem = {
      selectedFoodItem,
      quantity: foodQuantity,
      totalPrice: totalPriceWithTax,
    };
    setSelectedFoodItems([...selectedFoodItems, newItem]);
    setSelectedFoodItem([]);
    setFoodName("");
    setFoodPrice("");
    setFoodCGST("");
    setFoodSGST("");
    setFoodQuantity(1);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = selectedFoodItems.filter((_, idx) => idx !== index);
    setSelectedFoodItems(updatedItems);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = selectedFoodItems.map((item, idx) => {
      if (idx === index) {
        const totalPriceWithTax = calculateTotalWithTax(
          item.selectedFoodItem.price,
          item.selectedFoodItem.cgst || 0,
          item.selectedFoodItem.sgst || 0,
          newQuantity
        );
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: totalPriceWithTax,
        };
      }
      return item;
    });
    setSelectedFoodItems(updatedItems);
  };

  const handleAddFood = async () => {
    if (selectedFoodItems.length === 0) {
      alert("Please add at least one food item");
      return;
    }
    try {
      const token = document.cookie
        .split("; ")
        .find(
          (row) =>
            row.startsWith("authToken=") || row.startsWith("userAuthToken=")
        )
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };

      // Get current billing state
      const billingResponse = await axios.get(`/api/Billing/${id}`, {
        headers,
      });
      const currentBilling = billingResponse.data.data;

      // Update arrays immutably with proper initialization
      const updatedItemList = Array.isArray(currentBilling.itemList)
        ? [...currentBilling.itemList]
        : [];
      const updatedPriceList = Array.isArray(currentBilling.priceList)
        ? [...currentBilling.priceList]
        : [];
      const updatedQuantityList = Array.isArray(currentBilling.quantityList)
        ? [...currentBilling.quantityList]
        : [];
      const updatedTaxList = Array.isArray(currentBilling.taxList)
        ? [...currentBilling.taxList]
        : [];
      const updatedCGSTArray = Array.isArray(currentBilling.cgstArray)
        ? [...currentBilling.cgstArray]
        : [];
      const updatedSGSTArray = Array.isArray(currentBilling.sgstArray)
        ? [...currentBilling.sgstArray]
        : [];

      // Ensure arrays have room index
      while (updatedItemList.length <= selectedRoomIndex) {
        updatedItemList.push([]);
      }
      while (updatedPriceList.length <= selectedRoomIndex) {
        updatedPriceList.push([]);
      }
      while (updatedTaxList.length <= selectedRoomIndex) {
        updatedTaxList.push([]);
      }
      while (updatedQuantityList.length <= selectedRoomIndex) {
        updatedQuantityList.push([]);
      }
      while (updatedCGSTArray.length <= selectedRoomIndex) {
        updatedCGSTArray.push([]);
      }
      while (updatedSGSTArray.length <= selectedRoomIndex) {
        updatedSGSTArray.push([]);
      }

      // Calculate total price of all new food items
      let totalFoodPrice = 0;

      // Add each food item to the arrays
      selectedFoodItems.forEach((item) => {
        const itemPrice = Number(item.selectedFoodItem.price);
        const itemQuantity = Number(item.quantity);
        const cgstRate = Number(item.selectedFoodItem.cgst || 0);
        const sgstRate = Number(item.selectedFoodItem.sgst || 0);

        console.log("Item Price:", itemPrice);
        console.log("Item Quantity:", itemQuantity);
        console.log("CGST Rate:", cgstRate);
        console.log("SGST Rate:", sgstRate);

        updatedItemList[selectedRoomIndex].push(item.selectedFoodItem.itemName);
        updatedPriceList[selectedRoomIndex].push(itemPrice);
        updatedQuantityList[selectedRoomIndex].push(itemQuantity);

        // Store tax values in the new format [sgst, cgst]
        updatedTaxList[selectedRoomIndex].push([sgstRate, cgstRate]);

        // Store CGST and SGST separately
        updatedCGSTArray[selectedRoomIndex].push(cgstRate);
        updatedSGSTArray[selectedRoomIndex].push(sgstRate);

        // Calculate this item's total price with tax
        const itemTotal = itemPrice * itemQuantity * (1 + (cgstRate + sgstRate) / 100);
        totalFoodPrice += itemTotal;
      });

      const foodRemarksArray = Array.isArray(currentBilling.FoodRemarks)
        ? [...currentBilling.FoodRemarks]
        : [];
      if (foodRemarks) {
        foodRemarksArray.push(foodRemarks);
      }

      // Calculate new total and due amounts
      const currentTotal = Number(currentBilling.totalAmount) || 0;
      const currentDueAmount = Number(currentBilling.dueAmount) || 0;

      const newTotalAmount = currentTotal + totalFoodPrice;
      const newDueAmount = currentDueAmount + totalFoodPrice;

      await axios.put(
        `/api/Billing/${id}`,
        {
          itemList: updatedItemList,
          priceList: updatedPriceList,
          quantityList: updatedQuantityList,
          taxList: updatedTaxList,
          cgstArray: updatedCGSTArray,
          sgstArray: updatedSGSTArray,
          roomIndex: selectedRoomIndex,
          FoodRemarks: foodRemarksArray,
          totalAmount: newTotalAmount,
          dueAmount: newDueAmount
        },
        { headers }
      );

      // Update local state with new food items - THIS IS THE KEY CHANGE
      const foodUpdates = selectedFoodItems.map((item) => ({
        name: item.selectedFoodItem.itemName,
        price: Number(item.selectedFoodItem.price),
        tax: Number(item.selectedFoodItem.cgst || 0) + Number(item.selectedFoodItem.sgst || 0),
        cgst: Number(item.selectedFoodItem.cgst || 0),
        sgst: Number(item.selectedFoodItem.sgst || 0),
        quantity: Number(item.quantity),
        roomIndex: selectedRoomIndex,
      }));

      console.log("Food Updates:", foodUpdates); // Log the food updates her

      setFoodItems([...foodItems, ...foodUpdates]);
      setRemainingDueAmount(newDueAmount);
      handleCloseFoodModal();
      // window.location.reload();
    } catch (error) {
      console.error("Error adding food:", error);
      alert(
        "Failed to add food items: " +
        (error.response?.data?.error || error.message)
      );
    }
  };

  const handleAddPayment = async () => {
    const paymentAmountNum = Number(paymentAmount);
    if (!paymentAmount || paymentAmountNum <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    if (paymentAmountNum > remainingDueAmount) {
      alert(
        `Payment amount cannot exceed remaining due amount of ${remainingDueAmount}`
      );
      return;
    }
    if (!modeOfPayment) {
      alert("Please select a mode of payment");
      return;
    }
    try {
      const currentDate = new Date().toISOString();
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(
        `/api/Billing/${id}`,
        {
          amountAdvanced: paymentAmountNum + bookingData.billing.amountAdvanced,
          DateOfPayment: [currentDate],
          ModeOfPayment: [modeOfPayment],
          AmountOfPayment: [paymentAmountNum],
          RoomRemarks: [roomRemarks], // Add room remarks
        },
        { headers }
      );
      const updatedBillingData = response.data.data;
      const updatedBookingData = { ...bookingData };
      updatedBookingData.billing = updatedBillingData;
      setBookingData(updatedBookingData);
      setRemainingDueAmount(updatedBillingData.dueAmount);
      handleCloseBillPaymentModal();
      setPaymentAmount("");
      setModeOfPayment("");
      window.location.reload();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert(error.response?.data?.error || "Failed to add payment");
    }
  };

  const handleCompletePayment = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Update Billing API
      await axios.put(
        `/api/Billing/${id}`,
        {
          Bill_Paid: "yes",
          dueAmount: 0,
        },
        { headers }
      );

      // Step 2: Update NewBooking API to set CheckOut to true
      await axios.put(
        `/api/NewBooking/${bookingData.bookings._id}`, // Use the first booking's ID
        {
          CheckedOut: true,
        },
        { headers }
      );

      // Step 3: Update multiple rooms
      const roomUpdatePromises = bookingData.rooms.map(async (room) => {
        // Get current room data
        const currentRoomResponse = await axios.get(`/api/rooms/${room._id}`, {
          headers,
        });
        const currentRoomData = currentRoomResponse.data.data;

        // Find position of current bill in the waitlist
        const currentPosition = currentRoomData.billWaitlist.findIndex(
          (billId) =>
            billId._id.toString() === bookingData.billing._id.toString()
        );

        // Prepare update data
        let updateData = {
          billWaitlist: currentRoomData.billWaitlist,
          guestWaitlist: currentRoomData.guestWaitlist,
          checkInDateList: currentRoomData.checkInDateList,
          checkOutDateList: currentRoomData.checkOutDateList,
        };

        // Check if there's a next booking
        const hasNextBooking =
          currentPosition < currentRoomData.billWaitlist.length - 1;

        if (hasNextBooking) {
          updateData = {
            ...updateData,
            currentBillingId: currentRoomData.billWaitlist[currentPosition + 1],
            currentGuestId: currentRoomData.guestWaitlist[currentPosition + 1],
            occupied: "Vacant",
            clean: true,
            billingStarted: "No",
          };
        } else {
          updateData = {
            ...updateData,
            currentBillingId: null,
            currentGuestId: null,
            occupied: "Vacant",
            clean: true,
            billingStarted: "No",
          };
        }

        // Update room with new data
        return axios.put(`/api/rooms/${room._id}`, updateData, { headers });
      });

      // Wait for all room updates to complete
      await Promise.all(roomUpdatePromises);

      // Update state
      setRemainingDueAmount(0);
      alert("Payment completed successfully for all rooms!");
      window.location.reload();
    } catch (error) {
      console.error("Error completing payment:", error);
      alert("Failed to complete payment");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <div className="loader" />
          <span className="mt-4 text-gray-700">Loading Bill...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  const { billing, booking, room, category } = bookingData;
  const numberOfNights =
    (new Date(bookingData?.bookings?.checkOut) -
      new Date(bookingData?.bookings?.checkIn)) /
    (1000 * 60 * 60 * 24);

  let checkInStatus =
    bookingData?.bookings?.CheckedIn == true &&
    bookingData?.bookings?.CheckedOut == false;
  let checkOutStatus =
    bookingData?.bookings?.CheckedIn == true &&
    bookingData?.bookings?.CheckedOut == true;

  console.log(`checkinStatus: ${checkInStatus}`);
  console.log(`checkOutStatus: ${checkOutStatus}`);

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6">
          {/* Header */}
          <h2 className="text-xl font-semibold text-gray-800">
            Booking Dashboard{" "}
            <span className="text-gray-500">
              ({bookingData.bookings.bookingId})
            </span>
          </h2>

          {/* Booking Information */}
          <div className="mt-4 bg-blue-100 p-4 rounded">
            <p className="text-lg font-semibold">
              {bookingData.bookings.guestName}{" "}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Check-In:{" "}
              <strong>
                {new Date(bookingData.bookings.checkIn).toLocaleDateString(
                  "en-GB"
                )}
              </strong>{" "}
              | Expected Check-Out:{" "}
              <strong>
                {new Date(bookingData.bookings.checkOut).toLocaleDateString(
                  "en-GB"
                )}
              </strong>{" "}
              | Phone No: <strong>+91 {bookingData.bookings.mobileNo}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Guest ID: <strong>{bookingData.bookings.guestid}</strong> | Date
              of Birth:{" "}
              <strong>
                {new Date(bookingData.bookings.dateofbirth).toLocaleDateString(
                  "en-GB"
                )}
              </strong>{" "}
              | Booking Type:{" "}
              <strong>{bookingData.bookings.bookingType}</strong> | Booking
              Source: <strong>{bookingData.bookings.bookingSource}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Booked On:{" "}
              <strong>
                {new Date(bookingData.bookings.createdAt).toLocaleDateString(
                  "en-GB"
                )}
              </strong>{" "}
              | No. Of guest(s):{" "}
              <strong>
                {bookingData.bookings.adults} Adult{" "}
                {bookingData.bookings.children} Child
              </strong>{" "}
              | Meal Plan: <strong>{bookingData.bookings.mealPlan}</strong> |
              Notes: <strong>{bookingData.bookings.remarks || "-"}</strong>
            </p>
          </div>

          {/* Rooms Booked */}
          <div className="mt-6 bg-blue-50 p-4 rounded">
            <h3 className="font-semibold text-gray-800">Rooms Booked</h3>
            <p className="text-sm text-gray-700">
              {new Date(bookingData.bookings.checkIn).toLocaleDateString()} (
              {new Date(bookingData.bookings.checkIn).toLocaleString(
                "default",
                {
                  weekday: "short",
                }
              )}
              ) &raquo; Rooms:{" "}
              {Array.isArray(billing.roomNo)
                ? billing.roomNo.join(", ")
                : billing.roomNo}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-4 gap-2">
            {[
              // In your button configuration array:
              {
                label: "Add Services",
                color: "primary",
                variant: "contained",
                onClick: handleOpenServicesModal,
                disabled:
                  billing.Bill_Paid === "yes" ||
                  billing.Cancelled === "yes" ||
                  checkInStatus == false ||
                  checkOutStatus == true,
              },
              {
                label: "Add Food",
                color: "success",
                variant: "contained",
                onClick: handleOpenFoodModal,
                disabled:
                  billing.Bill_Paid === "yes" ||
                  billing.Cancelled === "yes" ||
                  checkInStatus == false ||
                  checkOutStatus == true,
              },
              {
                label: "Bill Payment",
                color: remainingDueAmount <= 0 ? "secondary" : "error",
                variant: "contained",
                onClick:
                  remainingDueAmount > 0
                    ? handleOpenBillPaymentModal
                    : undefined,
                disabled:
                  remainingDueAmount <= 0 ||
                  billing.Cancelled === "yes" ||
                  checkInStatus == false ||
                  checkOutStatus == true,
              },
            ].map((btn, index) => (
              <Button
                key={index}
                variant={btn.variant}
                color={btn.color}
                onClick={btn.onClick}
                disabled={btn.disabled}
                fullWidth
              >
                {btn.label}
              </Button>
            ))}
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleRoomPrintPreview(billing)}
              fullWidth
            >
              Print Invoice
            </Button>
          </div>
          {/* Bill Payment Modal */}
          <Modal
            open={openBillPaymentModal}
            onClose={handleCloseBillPaymentModal}
            aria-labelledby="bill-payment-modal"
          >
            <Box sx={modalStyle}>
              <Typography id="bill-payment-modal" variant="h6" component="h2">
                Bill Payment
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                label="Payment Amount"
                type="number"
                helperText={`Remaining Due: ₹${remainingDueAmount.toFixed(2)}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{
                  max: remainingDueAmount,
                  min: 0,
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                select
                label="Mode of Payment"
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="" disabled></option>
                {paymentMethods.map((item, index) => (
                  <option key={index} value={item?.itemName}>
                    {item?.itemName}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                label="Remarks (Optional)"
                multiline
                rows={3}
                value={roomRemarks}
                onChange={(e) => setRoomRemarks(e.target.value)}
              />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddPayment}
                  disabled={
                    Number.parseFloat(paymentAmount) > remainingDueAmount
                  }
                >
                  Submit Payment
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseBillPaymentModal}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Modal>

          {/* Billing Summary */}
          <div className="mt-6 bg-green-200 p-4 rounded">
            <h3 className="font-semibold text-gray-800">Billing Summary</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="text-gray-700">
                <p>Total Amount:</p>
                <p>Paid Amount:</p>
                <p>Due Amount:</p>
              </div>
              <div className="text-gray-800 font-semibold text-right">
                <p>{Number.parseFloat(billing.totalAmount).toFixed(2)}</p>

                <p>{Number.parseFloat(billing.amountAdvanced).toFixed(2)}</p>

                <p>{Number.parseFloat(billing.dueAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payments and Room Tokens */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 text-center ml-16">
              Payments ({billing.DateOfPayment.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-center">Mode of Payment</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Rows for each payment in the arrays */}
                {billing.DateOfPayment.map((date, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">
                      {new Date(date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-2 text-center">
                      {billing.ModeOfPayment[index]}
                    </td>
                    <td className="p-2 text-right">
                      {Number.parseFloat(
                        billing.AmountOfPayment[index]
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              variant="contained"
              color="warning"
              className="mt-6 mb-4"
              disabled={
                remainingDueAmount > 0 ||
                billing.Bill_Paid === "yes" ||
                billing.Cancelled === "yes" ||
                new Date(bookingData.bookings.checkIn).toLocaleDateString(
                  "en-GB"
                ) > new Date().toLocaleDateString("en-GB")
              }
              onClick={handleCompletePayment}
            >
              Complete Payment
            </Button>

            <h3 className="mt-4 font-semibold text-gray-800 text-center ml-16">
              Room Tokens ({billing.roomNo.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-center">Room Details</th>
                  <th className="p-2 text-center">Tariff</th>
                  <th className="p-2 text-center">CGST</th>
                  <th className="p-2 text-center"> SGST</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookingData.rooms.map((room, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">{index + 1}</td>
                    <td className="p-2 text-center">
                      Room # {room?.number} - {room?.category?.category}
                    </td>
                    <td className="p-2 text-center">
                      {room?.category?.tariff}
                    </td>
                    <td className="p-2 text-center">{room?.category?.cgst}%</td>
                    <td className="p-2 text-center">{room?.category?.sgst}%</td>
                    <td className="p-2 text-right">
                      {parseFloat(room?.category?.total) * numberOfNights}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              variant="contained"
              color="info"
              className="mt-4 mb-4"
              onClick={() => handleRoomPrintPreview(billing)}
            >
              Print Room Invoice
            </Button>
            {/* Room Invoice Modal */}
            {showPrintModal && printableRoomInvoice && (
              <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-2 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => {
                        setShowPrintModal(false);
                        setPrintableRoomInvoice(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  <PrintableRoomInvoice billId={id} />
                </div>
              </div>
            )}
            {/* Services Table */}
            <h3 className="font-semibold text-gray-800 text-center ml-16">
              Services ({services.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Room No.</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-center">Rate</th>
                  <th className="p-2 text-center">CGST</th>
                  <th className="p-2 text-center">SGST</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">
                      Room #{billing.roomNo[service.roomIndex]}
                    </td>
                    <td className="p-2 text-left">{service.name}</td>
                    <td className="p-2 text-center">{service.price}</td>
                    <td className="p-2 text-center">
                      {service.cgst || service.tax / 2}%
                    </td>
                    <td className="p-2 text-center">
                      {service.sgst || service.tax / 2}%
                    </td>
                    <td className="p-2 text-right">
                      {service.price +
                        (service.price * (service.cgst + service.sgst)) / 100}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Add Services Modal */}
            <Modal
              open={openServicesModal}
              onClose={handleCloseServicesModal}
              aria-labelledby="add-services-modal"
            >
              <Box sx={modalStyle}>
                <Typography id="add-services-modal" variant="h6" component="h2">
                  Add Service
                </Typography>
                {/* Room Selection Dropdown */}
                <FormControl fullWidth margin="normal">
                  <Typography
                    id="add-services-modal"
                    variant="h9"
                    component="h1"
                    sx={{ color: "text.secondary" }}
                    mb={1}
                  >
                    Select Room
                  </Typography>
                  <Select
                    value={selectedRoomIndex}
                    onChange={(e) =>
                      setSelectedRoomIndex(Number(e.target.value))
                    }
                  >
                    {billing.roomNo.map((room, index) => (
                      <MenuItem key={index} value={index}>
                        Room {room}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Service Details"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Service Price"
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="CGST (%)"
                  type="number"
                  value={serviceCGST}
                  onChange={(e) => setServiceCGST(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="SGST (%)"
                  type="number"
                  value={serviceSGST}
                  onChange={(e) => setServiceSGST(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  readOnly
                  disabled
                  label="Total Amount"
                  type="number"
                  value={serviceTotal}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Remarks (Optional)"
                  multiline
                  rows={3}
                  value={serviceRemarks}
                  onChange={(e) => setServiceRemarks(e.target.value)}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddService}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCloseServicesModal}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Modal>

            {/* Add Food Modal */}
            <Modal
              open={openFoodModal}
              onClose={handleCloseFoodModal}
              aria-labelledby="add-food-modal"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 600,
                  bgcolor: "background.paper",
                  border: "2px solid #000",
                  boxShadow: 24,
                  p: 4,
                  maxHeight: "80vh", // Set a maximum height
                  overflowY: "auto", // Enables scrolling
                }}
              >
                <Typography id="add-food-modal" variant="h6" component="h2">
                  Add Food Items
                </Typography>
                {/* Room Selection Dropdown */}
                <FormControl fullWidth margin="normal">
                  <Typography
                    id="add-foods-modal"
                    variant="h9"
                    component="h1"
                    sx={{ color: "text.secondary" }}
                    mb={1}
                  >
                    Select Room
                  </Typography>
                  <Select
                    value={selectedRoomIndex}
                    onChange={(e) =>
                      setSelectedRoomIndex(Number(e.target.value))
                    }
                  >
                    {billing.roomNo.map((room, index) => (
                      <MenuItem key={index} value={index}>
                        Room {room}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Food Selection Form */}
                <div className="mb-4">
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Food Item</InputLabel>
                    <Select
                      value={foodName}
                      label="Food Item"
                      onChange={handleFoodItemChange}
                    >
                      {menuItems?.map((item) => (
                        <MenuItem key={item._id} value={item.itemName}>
                          {item.itemName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    margin="normal"
                    readOnly
                    disabled
                    label="Food Price"
                    value={foodPrice}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    readOnly
                    disabled
                    label="CGST (%)"
                    value={foodCGST}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    readOnly
                    disabled
                    label="SGST (%)"
                    value={foodSGST}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    type="number"
                    label="Quantity"
                    value={foodQuantity}
                    onChange={handleQuantityChange}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Food Remarks (Optional)"
                    multiline
                    rows={3}
                    value={foodRemarks}
                    onChange={(e) => setFoodRemarks(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleAddToList}
                    disabled={!selectedFoodItem}
                    sx={{ mt: 2 }}
                  >
                    Add to List
                  </Button>
                </div>

                {/* Selected Items Table */}
                {selectedFoodItems.length > 0 && (
                  <div className="mt-4">
                    <Typography className="text-center" variant="h6">
                      Selected Items
                    </Typography>
                    <table className="w-full mt-2">
                      <thead>
                        <tr>
                          <th className="text-left">Item Name</th>
                          <th className="text-center">Price</th>
                          <th className="text-center">Quantity</th>
                          <th className="text-center">Total</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFoodItems.map((item, index) => (
                          <tr key={index}>
                            <td className="text-left">
                              {item.selectedFoodItem.itemName}
                            </td>
                            <td className="text-center">
                              ₹{item.selectedFoodItem.price}
                            </td>
                            <td className="text-center">
                              <div>
                                <Button
                                  size="small"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      index,
                                      item.quantity - 1
                                    )
                                  }
                                >
                                  -
                                </Button>
                                <span className="text-center mx-2">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="small"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      index,
                                      item.quantity + 1
                                    )
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </td>
                            <td className="text-center">
                              ₹{item.totalPrice.toFixed(2)}
                            </td>
                            <td className="text-right">
                              <Button
                                color="error"
                                size="small"
                                onClick={() => handleRemoveItem(index)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddFood}
                    disabled={selectedFoodItems.length === 0}
                  >
                    Submit All Items
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCloseFoodModal}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Modal>
            <Button
              variant="contained"
              color="info"
              className="mt-4 mb-4"
              onClick={() => handleServicePrintPreview(billing)}
            >
              Print Service Invoice
            </Button>
            {/* Food Items Table */}
            <h3 className="font-semibold text-gray-800 text-center ml-16">
              Food Items ({foodItems.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Room No.</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-center">Quantity</th>
                  <th className="p-2 text-center">CGST</th>
                  <th className="p-2 text-center">SGST</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {foodItems.map((food, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">
                      Room #{billing.roomNo[food.roomIndex]}
                    </td>
                    <td className="p-2 text-left">{food.name}</td>
                    <td className="p-2 text-left">{parseFloat(food.price).toFixed(2)}</td>
                    <td className="p-2 text-center">{food.quantity}</td>
                    <td className="p-2 text-center">
                      {parseFloat(food.cgst).toFixed(1)}%
                    </td>
                    <td className="p-2 text-center">
                      {parseFloat(food.sgst).toFixed(1)}%
                    </td>
                    <td className="p-2 text-right">
                      {(parseFloat(food.price) * food.quantity * (1 + (parseFloat(food.cgst) + parseFloat(food.sgst)) / 100)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              variant="contained"
              color="info"
              className="mt-4 mb-4"
              onClick={() => handleFoodPrintPreview(billing)}
            >
              Print Food Invoice
            </Button>
            {/* Food Invoice Modal */}
            {showPrintModal && printableFoodInvoice && (
              <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded"
                      onClick={() => {
                        setShowPrintModal(false);
                        setPrintableFoodInvoice(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  <PrintableFoodInvoice billId={id} />
                </div>
              </div>
            )}

            {/* Similar modification for Service Invoice Modal */}
            {showPrintModal && printableServiceInvoice && (
              <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded"
                      onClick={() => {
                        setShowPrintModal(false);
                        setPrintableServiceInvoice(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  <PrintableServiceInvoice billId={id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingDashboard;
