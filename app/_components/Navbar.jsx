"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  UserCircle,
  Building2,
  BedDouble,
  ListChecks,
  Users2,
  BookOpen,
  ClipboardList,
  UtensilsCrossed,
  LayoutDashboard,
  TableProperties,
  Menu,
  Receipt,
  FileText,
  Package,
  FolderTree,
  PackageSearch,
  ShoppingCart,
  BarChart3,
  LogOut,
  Monitor,
  Utensils,
  PaintBucket,
  PartyPopper,
  Calculator,
} from "lucide-react";
import { jwtVerify } from "jose"; // Import jwtVerify for token verification
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [roles, setRoles] = useState([]); // State to store user's roles
  const [userAuthToken, setUserAuthToken] = useState(null); // State to store userAuthToken
  const [authToken, setAuthToken] = useState(null); // State to store authToken
  const router = useRouter();

  // Fetch and verify tokens and roles on mount
  useEffect(() => {
    const fetchTokensAndRoles = async () => {
      // Fetch userAuthToken
      const userToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userAuthToken="))
        ?.split("=")[1];
      // Fetch authToken
      const legacyToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!userToken && !legacyToken) {
        setRoles([]); // No tokens, no roles
        setUserAuthToken(null); // Clear userAuthToken state
        setAuthToken(null); // Clear authToken state
        return;
      }

      try {
        const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

        if (userToken) {
          const decoded = await jwtVerify(
            userToken,
            new TextEncoder().encode(SECRET_KEY)
          );
          setRoles(decoded.payload.roles || []); // Extract roles from userAuthToken payload
          setUserAuthToken(userToken); // Store userAuthToken in state
        }
        if (legacyToken) {
          const decoded = await jwtVerify(
            legacyToken,
            new TextEncoder().encode(SECRET_KEY)
          );
          setRoles(decoded.payload.roles || []); // Extract roles from authToken payload (if available)
          setAuthToken(legacyToken); // Store authToken in state
        }
      } catch (error) {
        console.error("Error verifying tokens:", error);
        toast.error("Invalid or expired session. Please log in again.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
        setRoles([]); // Clear roles on error
        setUserAuthToken(null); // Clear userAuthToken on error
        setAuthToken(null); // Clear authToken on error
        // Clear both tokens from cookies
        document.cookie =
          "userAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        // document.cookie = "userClientToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie =
          "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        // document.cookie = "clientToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    };

    fetchTokensAndRoles();
  }, []); // Run once on mount

  const handleMouseEnter = (index) => {
    setOpenDropdown(index);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const deleteSpecificCookies = () => {
    // Delete userAuthToken if it exists
    if (userAuthToken) {
      document.cookie =
        "userAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
    // Delete authToken if it exists
    if (authToken) {
      document.cookie =
        "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);

    // Delete specific cookies based on which tokens exist
    deleteSpecificCookies();

    // Determine redirect based on tokens
    let redirectPath = "/";
    if (userAuthToken && !authToken) {
      redirectPath = "/user/login"; // Redirect to user login if only userAuthToken exists
    } else if (!userAuthToken && authToken) {
      redirectPath = "/"; // Redirect to root if only authToken exists
    } // If both exist or neither, redirect to root (handled by default)

    // Add a small delay before redirecting
    setTimeout(() => {
      setIsLoggingOut(false);
      setRoles([]); // Clear roles on logout
      setUserAuthToken(null); // Clear userAuthToken on logout
      setAuthToken(null); // Clear authToken on logout
      router.push(redirectPath);
    }, 800);
  };

  // Determine which dropdowns to show based on token presence and roles
  const showMaster =
    authToken ||
    (!userAuthToken &&
      !authToken &&
      (roles.includes("Property & Frontdesk") ||
        roles.includes("Restaurant") ||
        roles.includes("Inventory")));
  const showProperty =
    authToken ||
    ((userAuthToken || authToken) && roles.includes("Property & Frontdesk"));

  const showRestaurant =
    authToken || ((userAuthToken || authToken) && roles.includes("Restaurant"));
  const showInventory =
    authToken || ((userAuthToken || authToken) && roles.includes("Inventory"));

  return (
    <nav className="bg-blue-900 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href={userAuthToken || authToken ? "/property/roomdashboard" : "/"}
        >
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Image
              src="/Hotel-Logo.png"
              alt="BookingMaster.in"
              width={150}
              height={60}
              priority
              className="pr-4"
            />
          </div>
        </Link>

        <ul className="flex space-x-6 text-white">
          {/* Master Dropdown (shown if authToken exists or no tokens and any role exists) */}
          {showMaster && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(1)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <User className="w-4 h-4" />
                <span>Admin</span>
              </button>
              {openDropdown === 1 && (
                <ul className="absolute top-[100%] left-0 w-48 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/master/users">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <Users2 className="w-4 h-4 hover:text-blue-900 " />
                      <span>Users</span>
                    </li>
                  </Link>
                  <Link href="/master/profile">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <UserCircle className="w-4 h-4 hover:text-blue-900" />
                      <span>Profile</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}

          {/* Property (shown if authToken exists or logged in with userAuthToken and has role) */}
          {showProperty && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(2)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <Building2 className="w-4 h-4" />
                <span>Property</span>
              </button>
              {openDropdown === 2 && (
                <ul className="absolute top-[100%] left-0 w-56 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/property/roomcategories">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <ListChecks className="w-4 h-4 hover:text-blue-900" />
                      <span>Room Categories</span>
                    </li>
                  </Link>
                  <Link href="/property/roomlist">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <BedDouble className="w-4 h-4 hover:text-blue-900" />
                      <span>Room List</span>
                    </li>
                  </Link>
                  <Link href="/property/guests">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <Users2 className="w-4 h-4 hover:text-blue-900" />
                      <span>Guests</span>
                    </li>
                  </Link>
                  <Link href="/property/event-report">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <PartyPopper className="w-4 h-4 hover:text-blue-900" />
                      <span>Guest Event Report</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}
          {/* Property (shown if authToken exists or logged in with userAuthToken and has role) */}
          {showProperty && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(3)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <Monitor className="w-4 h-4" />
                <span>Frontoffice</span>
              </button>
              {openDropdown === 3 && (
                <ul className="absolute top-[100%] left-0 w-56 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/property/roomdashboard">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <LayoutDashboard className="w-4 h-4 hover:text-blue-900" />
                      <span>Room Dashboard</span>
                    </li>
                  </Link>

                  <Link href="/property/billing">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <BookOpen className="w-4 h-4 hover:text-blue-900" />
                      <span>Booking</span>
                    </li>
                  </Link>
                  <Link href="/property/roomreport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <ClipboardList className="w-4 h-4 hover:text-blue-900" />
                      <span>Room Report</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}
          {showProperty && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(4)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <PaintBucket className="w-4 h-4" />
                <span>Housekeeping</span>
              </button>
              {openDropdown === 4 && (
                <ul className="absolute top-[100%] left-0 w-56 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/property/roomdashboard/classiclayout">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <LayoutDashboard className="w-4 h-4 hover:text-blue-900" />
                      <span>Dashboard</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}

          {/* Restaurant Dropdown (shown if authToken exists or logged in with userAuthToken and has role) */}
          {showRestaurant && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(5)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <Utensils className="w-4 h-4" />
                <span>Restaurant</span>
              </button>
              {openDropdown === 5 && (
                <ul className="absolute top-[100%] left-0 w-48 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/Restaurant/dashboard">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <LayoutDashboard className="w-4 h-4 hover:text-blue-900" />
                      <span>Dashboard</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/Tables">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <TableProperties className="w-4 h-4 hover:text-blue-900" />
                      <span>Tables</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/restaurantmenu">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <Menu className="w-4 h-4 hover:text-blue-900" />
                      <span>Restaurant Menu</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/restaurantbooking">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <BookOpen className="w-4 h-4 hover:text-blue-900" />
                      <span>Booking</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/invoice">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <Receipt className="w-4 h-4 hover:text-blue-900" />
                      <span>Invoice</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/restaurantreport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <FileText className="w-4 h-4 hover:text-blue-900" />
                      <span>Invoice Report</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}

          {/* Inventory Dropdown (shown if authToken exists or logged in with userAuthToken and has role) */}
          {showInventory && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(6)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <ShoppingCart className="w-4 h-4" />
                <span>Inventory</span>
              </button>
              {openDropdown === 6 && (
                <ul className="absolute top-[100%] left-0 w-48 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/Inventory/Category">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <FolderTree className="w-4 h-4 hover:text-blue-900" />
                      <span>Category</span>
                    </li>
                  </Link>
                  <Link href="/Inventory/InventoryList">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <PackageSearch className="w-4 h-4 hover:text-blue-900" />
                      <span>Inventory List</span>
                    </li>
                  </Link>
                  <Link href="/Inventory/PurchaseReport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <ShoppingCart className="w-4 h-4 hover:text-blue-900" />
                      <span>Purchase Item</span>
                    </li>
                  </Link>
                  <Link href="/Inventory/SalesReport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <Receipt className="w-4 h-4 hover:text-blue-900" />
                      <span>Sales Item</span>
                    </li>
                  </Link>
                  <Link href="/Inventory/StockReport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <BarChart3 className="w-4 h-4 hover:text-blue-900" />
                      <span>Stock Report</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}
          {showMaster && (
            <li
              className="relative group"
              onMouseEnter={() => handleMouseEnter(7)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-1 py-2 rounded-t-sm flex items-center space-x-1 hover:bg-cyan-800 transition-colors duration-300">
                <Calculator className="w-4 h-4" />
                <span>Accounts</span>
              </button>
              {openDropdown === 7 && (
                <ul className="absolute top-[100%] left-0 w-48 bg-white text-gray-800 rounded-b-lg shadow-xl z-10">
                  <Link href="/Inventory/StockReport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <ShoppingCart className="w-4 h-4 hover:text-blue-900 " />
                      <span>Stock Report</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/restaurantreport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <Utensils className="w-4 h-4 hover:text-blue-900" />
                      <span>Restaurant Invoice Report</span>
                    </li>
                  </Link>
                  <Link href="/Restaurant/restaurantreport">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <ClipboardList className="w-4 h-4 hover:text-blue-900" />
                      <span>Room Invoice Report</span>
                    </li>
                  </Link>
                  <Link href="/reports/booking-report">
                    <li className="px-4 py-2 hover:text-blue-900 flex items-center space-x-2 transition-colors duration-200">
                      <ClipboardList className="w-4 h-4 hover:text-blue-900" />
                      <span>Room Booking Report</span>
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}

          {/* Logout Button (shown if either token exists) */}
          {(userAuthToken || authToken || roles.length > 0) && (
            <li className="ml-6">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`
                  flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 
                  text-white rounded-lg transform transition-all duration-300
                  ${isLoggingOut ? "scale-95 opacity-80" : "hover:scale-105"}
                  focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 
                  shadow-md hover:shadow-lg
                `}
              >
                <LogOut
                  className={`w-4 h-4 transform transition-transform duration-500 ${
                    isLoggingOut ? "rotate-90" : ""
                  }`}
                />
                <span
                  className={`transition-opacity duration-300 ${
                    isLoggingOut ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
