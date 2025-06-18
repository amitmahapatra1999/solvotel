"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import Preloader from "../../_components/Preloader";
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
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [roomNumber, setRoomNumber] = useState("");
  const [category, setCategory] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [clean, setClean] = useState("Yes");

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

  const sortRoomNumbers = (roomsArray) => {
    return [...roomsArray].sort((a, b) => {
      const aNum = parseInt(a.number.replace(/\D/g, ""));
      const bNum = parseInt(b.number.replace(/\D/g, ""));
      return aNum === bNum ? a.number.localeCompare(b.number) : aNum - bNum;
    });
  };

  const fetchRoomsAndCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesRes = await fetch("/api/roomCategories");
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData.data || []);

      const roomsRes = await fetch("/api/rooms");
      const roomsData = await roomsRes.json();
      if (roomsData.success) {
        setRooms(sortRoomNumbers(roomsData.data));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndCategories();
  }, []);

  const resetForm = () => {
    setRoomNumber("");
    setCategory("");
    setFloorNumber("");
    setClean("Yes");
    setEditingRoom(null);
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setRoomNumber(room.number);
      setCategory(room.category?._id || "");
      setFloorNumber(room.floor);
      setClean(room.clean ? "Yes" : "No");
    } else {
      resetForm();
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomPayload = {
      number: roomNumber,
      category,
      floor: floorNumber,
      clean: clean === "Yes",
    };

    try {
      const method = editingRoom ? "PUT" : "POST";
      const endpoint = editingRoom
        ? `/api/rooms/${editingRoom._id}`
        : "/api/rooms";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomPayload),
        credentials: "include",
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(editingRoom ? "Room updated!" : "Room added!", {
          position: "top-center",
        });
        fetchRoomsAndCategories();
        handleCloseModal();
      } else {
        toast.error(result.error || "Failed to save room.");
      }
    } catch (err) {
      console.error("Room save error:", err);
      toast.error("An error occurred while saving room.");
    }
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
        toast.success("Room deleted successfully!");
        fetchRoomsAndCategories();
      } else {
        toast.error("Failed to delete room.");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("An error occurred while deleting the room.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="min-h-screen bg-white">
        {isLoading && <Preloader />}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <div className="flex justify-between">
            <h1 className="text-3xl font-bold mb-4 text-cyan-900">
              Room Management
            </h1>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenModal()}
            >
              Add Room
            </Button>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  {[
                    "Room Number",
                    "Category",
                    "Floor",
                    "Clean",
                    "Occupancy",
                    "Billing Started",
                    "Action",
                  ].map((title) => (
                    <TableCell
                      key={title}
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        color: "#28bfdb",
                        textAlign: "center",
                      }}
                    >
                      {title}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room._id}>
                      <TableCell align="center">{room.number}</TableCell>
                      <TableCell align="center">
                        {room.category?.category || "N/A"}
                      </TableCell>
                      <TableCell align="center">{room.floor}</TableCell>
                      <TableCell align="center">
                        <Typography
                          sx={{
                            bgcolor: room.clean ? "#81C784" : "#E57373",
                            color: "white",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            px: 2,
                            py: 0.5,
                            borderRadius: "8px",
                          }}
                        >
                          {room.clean ? "Yes" : "No"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          sx={{
                            bgcolor:
                              room.occupied === "Vacant"
                                ? "#FFD54F"
                                : "#64B5F6",
                            color:
                              room.occupied === "Vacant" ? "black" : "white",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            px: 2,
                            py: 0.5,
                            borderRadius: "8px",
                          }}
                        >
                          {room.occupied}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          sx={{
                            bgcolor:
                              room.billingStarted === "Yes"
                                ? "#4CAF50"
                                : "#FF7043",
                            color: "white",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            px: 2,
                            py: 0.5,
                            borderRadius: "8px",
                          }}
                        >
                          {room.billingStarted}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex justify-center items-center space-x-2">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenModal(room)}
                          >
                            <Edit />
                          </IconButton>
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

          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="room-modal-title"
          >
            <Box sx={modalStyle}>
              <Typography id="room-modal-title" variant="h6" className="mb-4">
                {editingRoom ? "Edit Room" : "Add Room"}
              </Typography>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <TextField
                    fullWidth
                    label="Room Number"
                    variant="outlined"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    required
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
                    onChange={(e) => setFloorNumber(e.target.value)}
                    required
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
                  <Button type="submit" variant="contained" color="primary">
                    {editingRoom ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </Box>
          </Modal>
        </div>
      </div>
      <Footer />
    </>
  );
}
