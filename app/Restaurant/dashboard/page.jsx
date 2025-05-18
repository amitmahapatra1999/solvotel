"use client";
import { useEffect, useState } from "react";
import { Footer } from "../../_components/Footer";
import Navbar from "../../_components/Navbar";
import {
  Modal,
  Box,
  Button,
  Card,
  Typography,
  CardContent,
  CardHeader,
} from "@mui/material";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Today");
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = ["Today", "Tomorrow", "Day After Tomorrow"];

  useEffect(() => {
    async function fetchTables() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/tables");
        const data = await response.json();
        setTables(data.data);
      } catch (error) {
        console.error("Error fetching tables:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchBookings() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/RestaurantBooking");
        const data = await response.json();
        setBookings(data.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTables();
    fetchBookings();
  }, []);

  const getBookingsForSelectedDay = () => {
    const currentDate = new Date();

    if (activeTab === "Tomorrow") {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (activeTab === "Day After Tomorrow") {
      currentDate.setDate(currentDate.getDate() + 2);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const selectedDate = `${year}-${month}-${day}`;

    return bookings.filter(
      (booking) => booking.date.split("T")[0] === selectedDate
    );
  };

  const handleBookingDetails = (bookings) => {
    setSelectedBooking(bookings);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="loader"></div>
              <span className="mt-4 text-gray-700">
                Loading Restaurant Dashboard...
              </span>
            </div>
          </div>
        )}

        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <h1 className="text-3xl font-bold text-cyan-900 mb-4">
            Restaurant Dashboard
          </h1>
          <div className="mb-6">
            <nav className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === tab
                      ? "bg-gray-200 text-gray-800"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.length > 0 ? (
              tables.map((table) => {
                const todayBookings = getBookingsForSelectedDay();
                const bookingsForTable = todayBookings.filter(
                  (b) => b.tableNo === table.tableNo
                );

                return (
                  <Card
                    key={table._id}
                    sx={{
                      backgroundColor:
                        bookingsForTable.length > 0 ? "#E3FCEF" : "#FFFFFF",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    <CardHeader
                      avatar={<TableRestaurantIcon style={{ color: "#fff" }} />}
                      title={`Table-${table.tableNo}`}
                      titleTypographyProps={{
                        variant: "h6",
                        fontWeight: "bold",
                        color: "#fff",
                      }}
                      sx={{
                        backgroundColor: "#FFC107",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    />
                    <CardContent sx={{ padding: "16px" }}>
                      {bookingsForTable.length > 0 ? (
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          startIcon={<BookmarkAddedIcon />}
                          onClick={() => handleBookingDetails(bookingsForTable)}
                          sx={{
                            textTransform: "capitalize",
                            borderRadius: "8px",
                            backgroundColor: "#007BFF",
                            ":hover": {
                              backgroundColor: "#0056b3",
                            },
                          }}
                        >
                          Booking Details
                        </Button>
                      ) : (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <TableRestaurantIcon fontSize="small" /> No bookings
                          for this table.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p>No tables available.</p>
            )}
          </div>
        </div>

        {selectedBooking && (
          <Modal open={modalOpen} onClose={closeModal}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 450,
                background: "linear-gradient(135deg, #9B6FCE, #4E92D6)",
                boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
                borderRadius: 3,
                p: 3,
                overflow: "hidden",
              }}
            >
              <Card
                sx={{
                  bgcolor: "#f9f9f9",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                  borderRadius: 2,
                  padding: 3,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    color: "#007BFF",
                    textAlign: "center",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <BookmarkAddedIcon fontSize="large" /> Booking Details
                </Typography>
                {selectedBooking.map((booking, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 3, // Add spacing between booking details
                      // Optional: Add padding for better aesthetics
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <TableRestaurantIcon /> <strong>Table:</strong>{" "}
                      {booking.tableNo}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <EventIcon /> <strong>Date:</strong>{" "}
                      {new Date(booking.date).toDateString()}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AccessTimeIcon /> <strong>Time:</strong> {booking.time}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <PersonIcon /> <strong>Guest Name:</strong>{" "}
                      {booking.guestName}
                    </Typography>
                    {index < selectedBooking.length - 1 && <hr />}
                  </Box>
                ))}
              </Card>
            </Box>
          </Modal>
        )}
      </div>
      <Footer />
    </>
  );
}
