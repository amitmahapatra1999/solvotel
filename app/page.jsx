"use client";

import Image from "next/image";
import * as React from "react";
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
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [timestamp, setTimestamp] = useState(null);
  const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

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

    const checkAuthStatus = async () => {
      const token = getCookie("authToken");
      if (token) {
        try {
          const decoded = await jwtVerify(
            token,
            new TextEncoder().encode(SECRET_KEY)
          );
          const userId = decoded.payload.id;
          const profileResponse = await fetch(`/api/Profile/${userId}`);
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.data) {
            const profileComplete = profileData.data.Profile_Complete;
            if (profileComplete === "no") {
              router.push("/master/profile");
            } else {
              router.push("/property/roomdashboard");
            }
          }
        } catch (error) {
          console.error("Error verifying token or fetching profile:", error);
          // Token is invalid or expired, proceed to login page
        }
      }
    };
    checkAuthStatus();
  }, [router]);

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important: This ensures cookies are sent with the request
      });
      const data = await response.json();

      if (data.success) {
        const token = getCookie("authToken");
        if (token) {
          const decoded = await jwtVerify(
            token,
            new TextEncoder().encode(SECRET_KEY)
          );
          const userId = decoded.payload.id;
          const profileResponse = await fetch(`/api/Profile/${userId}`);
          const profileData = await profileResponse.json();

          if (profileData.success && profileData.data) {
            const profileComplete = profileData.data.Profile_Complete;
            if (profileComplete === "no") {
              router.push("/master/profile");
            } else {
              router.push("/property/roomdashboard");
            }
          }
        }
      } else {
        alert(data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Failed to log in");
      setIsLoading(false);
    } finally {
    }
  };
  //
  return (
    <main>
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-900">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div
              className="   shadow-xl flex flex-col items-center"
              style={{
                background: "#607D8B",
                borderRadius: "50%",
                padding: "2.5em",
              }}
            >
              <div className="loader"></div>
              <span className="mt-4 text-white">Signing In...</span>
            </div>
          </div>
        )}
        <div className="mb-8">
          <Image
            src="/Hotel-Logo.png"
            alt="BookingMaster.in"
            width={200}
            height={60}
            priority
          />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-3xl font-semibold text-center mb-6 text-cyan-900">
            Hotel Login
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                SUBMIT
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/forgotcredentials"
              className="text-sm text-cyan-600 hover:text-cyan-500"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-white text-sm">
          © {timestamp}, solvotel. All Rights Reserved.
        </div>
      </div>
    </main>
  );
}
