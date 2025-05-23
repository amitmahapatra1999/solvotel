// app/admin/login/page.jsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { setCookie } from "cookies-next";
import { useEffect, useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [timestamp, setTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to delete specific cookies
  const deleteSpecificCookies = () => {
    // Delete authToken if it exists
    if (
      document.cookie.split("; ").find((row) => row.startsWith("authToken="))
    ) {
      document.cookie =
        "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
    // Delete adminauthToken if it exists
    if (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("adminauthToken="))
    ) {
      document.cookie =
        "adminauthToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
    // Delete userAuthToken if it exists
    if (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("userAuthToken="))
    ) {
      document.cookie =
        "userAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
  };

  useEffect(() => {
    setTimestamp(new Date().getFullYear());
    // Delete adminauthToken and userAuthToken if they exist
    deleteSpecificCookies();
  }, []);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important: This ensures cookies are sent with the request
      });
      const data = await response.json();

      if (data.success) {
        router.push("/admin/dashboard");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div className="flex items-center flex-col justify-center min-h-screen bg-gradient-to-br from-cyan-700 to-cyan-600">
        <div className="mb-8">
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                <div className="loader"></div>
                <span className="mt-4 text-gray-700">Signing In...</span>
              </div>
            </div>
          )}
          <Image
            src="/Hotel-Logo.png"
            alt="BookingMaster.in"
            width={300}
            height={60}
            priority
          />
        </div>
        {/* <Image
            src="/Hotel-Logo.png"
            alt="BookingMaster.in"
            width={300}
            height={60}
            priority
          /> */}
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-3xl font-semibold text-center mb-6 text-cyan-900">
            Admin Login
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <TextField
                id="username"
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <FormControl variant="outlined" fullWidth>
                <InputLabel htmlFor="outlined-adornment-password">
                  Password
                </InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword
                            ? "hide the password"
                            : "display the password"
                        }
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                />
              </FormControl>
            </div>
            <div>
              <button
                type="submit" // Change button type to "submit" for form submission
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                SUBMIT
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-white text-sm">
          © {timestamp}, Hotel Booking. All Rights Reserved.
        </div>
      </div>

      {/* <p className="text-center mt-4 text-gray-500">
            © {timestamp}, Hotel Booking. All Rights Reserved.
          </p> */}
    </main>
  );
}
