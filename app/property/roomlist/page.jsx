"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Modal,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Delete, Edit } from "@mui/icons-material";

export default function BookingManagement() {
  const [rooms, setRooms] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [category, setCategory] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [clean, setClean] = useState("Yes");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomNumberError, setRoomNumberError] = useState("");
  const [floorNumberError, setFloorNumberError] = useState("");

  // Function to validate positive number
  const isPositiveNumber = (value) => {
    const num = Number(value);
    return /^\d+$/.test(value) && num > 0;
  };

  // Handle room number input change
  const handleRoomNumberChange = (e) => {
    const value = e.target.value;
    setRoomNumber(value);
    if (value === "") {
      setRoomNumberError("Room number is required");
    } else if (!isPositiveNumber(value)) {
      setRoomNumberError("Please enter a positive number");
    } else {
      setRoomNumberError("");
    }
  };

  // Handle floor number input change
  const handleFloorNumberChange = (e) => {
    const value = e.target.value;
    setFloorNumber(value);
    if (value === "") {
      setFloorNumberError("Floor number is required");
    } else if (!isPositiveNumber(value)) {
      setFloorNumberError("Please enter a positive number");
    } else {
      setFloorNumberError("");
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      roomNumber !== "" &&
      floorNumber !== "" &&
      category !== "" &&
      isPositiveNumber(roomNumber) &&
      isPositiveNumber(floorNumber)
    );
  };

  // Function to sort room numbers
  const sortRoomNumbers = (roomsArray) => {
    return [...roomsArray].sort((a, b) => {
      const aNum = parseInt(a.number.replace(/\D/g, ""));
      const bNum = parseInt(b.number.replace(/\D/g, ""));
      if (aNum === bNum) {
        return a.number.localeCompare(b.number);
      }
      return aNum - bNum;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const categoriesResponse = await fetch("/api/roomCategories");
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data);

        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();
        if (roomsData.success) {
          const sortedRooms = sortRoomNumbers(roomsData.data);
          setRooms(sortedRooms);
        } else {
          console.error(roomsData.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setRoomNumber("");
    setCategory("");
    setFloorNumber("");
    setClean("Yes");
    setRoomNumberError("");
    setFloorNumberError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const newRoom = {
      number: roomNumber,
      category,
      floor: floorNumber,
      clean: clean === "Yes",
    };

    try {
      const roomsResponse = await fetch("/api/rooms");
      const roomsData = await roomsResponse.json();
      const existingRooms = roomsData.data;

      const roomExists = existingRooms.some(
        (room) => room.number === roomNumber
      );

      if (roomExists) {
        toast.error("Room number already exists!", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        return;
      }
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRoom),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("New room added successfully!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();
        if (roomsData.success) {
          const sortedRooms = sortRoomNumbers(roomsData.data);
          setRooms(sortedRooms);
        } else {
          console.log("Failed to fetch updated rooms:", roomsData.error);
        }

        setRoomNumber("");
        setCategory("");
        setFloorNumber("");
        setClean("Yes");
        setRoomNumberError("");
        setFloorNumberError("");
        handleCloseModal();
      } else {
        const errorData = await res.json();
        console.error("Failed to create new room:", errorData.error);
        toast.error("Failed to add new room!", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while creating the room:", error);
      toast.error("Failed to add new room!", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  const deleteRoom = async (id) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Room deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
          onClose: () => window.location.reload(),
        });
      } else {
        toast.error("Failed to delete room.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("An error occurred while trying to delete the room.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="min-h-screen bg-white">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="loader"></div>
              <span className="mt-4 text-gray-700">Loading Room Lists...</span>
            </div>
          </div>
        )}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <div className="flex justify-between">
            <h1 className="text-3xl font-bold mb-4 text-cyan-900">
              Room Management
            </h1>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenModal}
              className="mb-4"
              style={{ marginBottom: "16px" }}
            >
              Add Room
            </Button>
          </div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Room Number
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Floor
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Clean
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Occupancy
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                    }}
                  >
                    Billing Started
                  </TableCell>
                  <TableCell
                    align="center"
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
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room._id}>
                      <TableCell align="center">{room.number}</TableCell>
                      <TableCell align="center">
                        {room.category?.category || "Category N/A"}
                      </TableCell>
                      <TableCell align="center">{room.floor}</TableCell>
                      <TableCell align="center">
                        {room.clean ? (
                          <Typography
                            sx={{
                              bgcolor: "#81C784",
                              color: "white",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            Yes
                          </Typography>
                        ) : (
                          <Typography
                            sx={{
                              bgcolor: "#E57373",
                              color: "white",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            No
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {room.occupied === "Vacant" ? (
                          <Typography
                            sx={{
                              bgcolor: "#FFD54F",
                              color: "black",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            Vacant
                          </Typography>
                        ) : (
                          <Typography
                            sx={{
                              bgcolor: "#64B5F6",
                              color: "white",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            Confirmed
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {room.billingStarted === "Yes" ? (
                          <Typography
                            sx={{
                              bgcolor: "#4CAF50",
                              color: "white",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            Yes
                          </Typography>
                        ) : (
                          <Typography
                            sx={{
                              bgcolor: "#FF7043",
                              color: "white",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            No
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center items-center space-x-2">
                          <IconButton
                            color="secondary"
                            onClick={() => deleteRoom(room._id)}
                          >
                            <Delete />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No rooms available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="add-room-modal-title"
        >
          <Box sx={modalStyle}>
            <Typography
              id="add-room-modal-title"
              variant="h6"
              component="h2"
              className="mb-4"
            >
              Add New Room
            </Typography>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <TextField
                  fullWidth
                  label="Room Number"
                  variant="outlined"
                  value={roomNumber}
                  onChange={handleRoomNumberChange}
                  required
                  error={!!roomNumberError}
                  helperText={roomNumberError}
                />
              </div>
              <div className="mb-4">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Room Category</InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    label="Room Category"
                    required
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div className="mb-4">
                <TextField
                  fullWidth
                  label="Floor Number"
                  variant="outlined"
                  value={floorNumber}
                  onChange={handleFloorNumberChange}
                  required
                  error={!!floorNumberError}
                  helperText={floorNumberError}
                />
              </div>
              <div className="mb-4">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Clean Status</InputLabel>
                  <Select
                    value={clean}
                    onChange={(e) => setClean(e.target.value)}
                    label="Clean Status"
                    required
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!isFormValid()}
                >
                  Add Room
                </Button>
              </div>
            </form>
          </Box>
        </Modal>
      </div>
      <Footer />
    </>
  );
}