"use client";
import React, { useState, useEffect } from "react";
import { Hotel, Users, DollarSign, AlertCircle } from "lucide-react";
import Navbar from "../../../_components/Navbar";
import { Footer } from "../../../_components/Footer";
import { Typography } from "@mui/material";
import Preloader from "../../../_components/Preloader";

const RoomDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/rooms");
        const data = await response.json();
        if (data.success) {
          const groupedRooms = data.data.reduce((acc, room) => {
            const floor = room.floor;
            if (!acc[floor]) acc[floor] = [];
            acc[floor].push(room);
            return acc;
          }, {});

          Object.keys(groupedRooms).forEach((floor) => {
            groupedRooms[floor].sort((a, b) =>
              a.number.localeCompare(b.number)
            );
          });

          setRooms(groupedRooms);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const RoomBlock = ({ room }) => {
    const getGradient = (status) => {
      switch (status) {
        case "Vacant":
          return "bg-gradient-to-br from-emerald-400 via-green-400 to-teal-500";
        case "Confirmed":
          return "bg-gradient-to-br from-rose-400 via-pink-400 to-red-500";
        default:
          return "bg-gradient-to-br from-yellow-400 via-orange-400 to-amber-500";
      }
    };

    return (
      <div className="group animate-fade-in-up">
        <div
          className={`
                    p-6 m-2 w-48 h-40 rounded-xl
                    ${getGradient(room.occupied)}
                    shadow-lg text-white
                    transform transition-all duration-500
                    hover:scale-105 hover:rotate-1
                    group-hover:shadow-2xl
                    relative overflow-hidden
                    backdrop-blur-sm
                `}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">
                Room {room.number}
              </h3>
              <Hotel className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium tracking-wide backdrop-blur-sm">
                {room.category?.category || "Category N/A"}
              </p>

              <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                {room.occupied === "Confirmed" ? (
                  <Users className="w-5 h-5 animate-bounce" />
                ) : (
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                )}
                <span className="text-sm font-semibold">{room.occupied}</span>
              </div>

              <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-sm font-semibold">
                  Adult: {room.category.baseAdult} | Child:{" "}
                  {room.category.baseChild}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="bg-white min-h-screen">
        {isLoading && <Preloader />}
        <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-cyan-900 ">
              Room Classic Layout
            </h1>
            <Typography variant="h6">
              Total Rooms:{" "}
              {Object.values(rooms).reduce(
                (acc, rooms) => acc + rooms.length,
                0
              )}
            </Typography>
          </div>

          {Object.keys(rooms)
            .sort()
            .map((floor, index) => (
              <div
                key={floor}
                className="mb-8 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="transform transition-all duration-500 hover:translate-x-2">
                  <div
                    className=" font-semibold mb-4 p-4 rounded-lg shadow-md
                                bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100
                                border-l-4 border-indigo-500
                                hover:shadow-lg hover:from-purple-200 hover:via-indigo-200 hover:to-blue-200
                                transition-all duration-300 display flex items-center justify-between"
                  >
                    <p>Floor No: {floor}</p>
                    <p> {rooms[floor].length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {rooms[floor].map((room, roomIndex) => (
                    <div
                      key={room._id}
                      style={{ animationDelay: `${roomIndex * 100}ms` }}
                    >
                      <RoomBlock room={room} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RoomDashboard;
