"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Button,
  TextField,
  InputLabel,
  Select,
  Grid,
  Tab,
} from "@mui/material";
import { IconButton, Tooltip } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import Preloader from "../../_components/Preloader";
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { useRouter } from "next/navigation";
import axios from "axios";
import { GetCustomDate } from "../../../utils/DateFetcher"; // Import your date utility functions
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { set } from "mongoose";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function EventReport() {
  const [guests, setGuests] = useState([]);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState("");
  const [filteredGuests, setFilteredGuests] = useState([]);

  // New state for room pricing data
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

  // Modified useEffect for fetching guests
  useEffect(() => {
    const fetchGuests = async () => {
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

        const profileResponse = await fetch(`/api/Profile/${userId}`);
        const profileData = await profileResponse.json();
        if (!profileData.success || !profileData.data) {
          router.push("/");
          return;
        }
        const username = profileData.data.username;

        // Fetch guest data
        const response = await fetch(`/api/NewBooking?username=${username}`);
        const data = await response.json();

        if (data.success) {
          // Fetch all billing data
          const billingResponse = await fetch("/api/Billing");
          const billingData = await billingResponse.json();

          const guestMap = new Map();
          const sortedGuests = [...data.data].sort((a, b) => {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

          sortedGuests.forEach((guest) => {
            if (!guestMap.has(guest.mobileNo)) {
              // Check if the guest is checked out or has a cancelled bill
              const isCancelled =
                billingData.success &&
                billingData.data.some((bill) => {
                  const billRoomSet = new Set(bill.roomNo);
                  const hasMatchingRoom = guest.roomNumbers.some((roomNum) =>
                    billRoomSet.has(roomNum.toString())
                  );
                  return hasMatchingRoom && bill.Cancelled === "yes";
                });

              // Add a flag to indicate if edit/delete should be disabled
              guest.disableActions = guest.CheckedOut === true || isCancelled;
              guestMap.set(guest.mobileNo, guest);
            }
          });

          setGuests(Array.from(guestMap.values()));
        } else {
          setError("Failed to load guest data");
        }
      } catch (err) {
        setError("Error fetching guests");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuests();
  }, []);

  const handleSearch = () => {
    const filteredArray = guests?.filter((item) => {
      if (!item.dateofbirth && !item.dateofanniversary) return false;

      const dob = item.dateofbirth ? new Date(item.dateofbirth) : null;
      const doa = item.dateofanniversary
        ? new Date(item.dateofanniversary)
        : null;

      const isValidDob = dob instanceof Date && !isNaN(dob);
      const isValidDoa = doa instanceof Date && !isNaN(doa);
      console.log("isValidDob", isValidDob, dob);
      console.log("isValidDoa", isValidDoa, doa);

      const dobMonth = isValidDob ? dob.getMonth() : null;
      const doaMonth = isValidDoa ? doa.getMonth() : null;
      console.log("dobMonth", dobMonth);
      console.log("doaMonth", doaMonth);
      console.log("month", month);

      const matchesDobMonth = isValidDob && dobMonth === month;
      const matchesDoaMonth = isValidDoa && doaMonth === month;

      return matchesDobMonth || matchesDoaMonth;
    });

    if (!filteredArray || filteredArray.length === 0) {
      setError("No guests found for the selected month");
      setFilteredGuests([]);
    } else {
      setError(null);
      setFilteredGuests(filteredArray);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {isLoading && <Preloader />}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <h1 className="text-3xl font-bold text-cyan-900 mb-4">
                Birthday and Anniversary Report
              </h1>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label">
                  Select Month
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  label="Select Month"
                  onChange={(e) => setMonth(e.target.value)}
                  value={month}
                >
                  {MONTHS.map((item, index) => (
                    <MenuItem key={index} value={index}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={handleSearch}>
                Search
              </Button>
            </Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table aria-label="guest list">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                    Mobile
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                    Birth Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb" }}>
                    Anniversary Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGuests.map((guest) => {
                  let dob = GetCustomDate(guest.dateofbirth);
                  let doa = GetCustomDate(guest.dateofanniversary);

                  return (
                    <TableRow key={guest._id}>
                      <TableCell component="th">{guest.guestName}</TableCell>
                      <TableCell>{guest.mobileNo}</TableCell>
                      <TableCell>{guest.guestEmail || "N/A"}</TableCell>
                      <TableCell>{dob}</TableCell>
                      <TableCell>{doa}</TableCell>
                    </TableRow>
                  );
                })}
                {error && (
                  <TableRow>
                    <TableCell>{error}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
      <Footer />
    </>
  );
}
