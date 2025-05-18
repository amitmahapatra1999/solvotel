"use client";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  BoltIcon,
} from "lucide-react";
import {
  Modal,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Footer } from "../../_components/Footer";
import Navbar from "../../_components/Navbar";
import { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BookingMasterControlPanel() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(15);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [tableData, setTableData] = useState([]); // Use state to store fetched data
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null); // Track the selected table for editing
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch table data from the API when component mounts
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/tables"); // Fetch data from the API route

        const data = await response.json();
        if (data.success) {
          setTableData(data.data); // Set the fetched table data
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableData();
  }, []);

  const filteredData = tableData.filter((item) =>
    Object.values(item).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumn) {
      if (a[sortColumn] < b[sortColumn])
        return sortDirection === "asc" ? -1 : 1;
      if (a[sortColumn] > b[sortColumn])
        return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tables/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setTableData((prevTables) =>
          prevTables.filter((table) => table._id !== id)
        );
        toast.success("Table deleted successfully");
      } else {
        console.error("Failed to delete table:", data.error);
        toast.error("Failed to delete table:");
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Error deleting table:");
    } finally {
      setIsLoading(false);
    }
  };

  const EditTableModal = ({ open, onClose, tableData, onSave }) => {
    const [formData, setFormData] = useState(tableData || {});

    useEffect(() => {
      setFormData(tableData || {});
      //toast.success("Table updated successfully"); // Update form data when tableData changes
    }, [tableData]);

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      //toast.success("Table updated successfully");
    };

    const handleSave = () => {
      onSave(formData);
      toast.success("Table updated successfully");
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose}>
        <div className="flex items-center justify-center h-screen">
          <Paper sx={{ width: 400, padding: 4 }}>
            <Typography variant="h5" gutterBottom>
              Edit Table
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={14}>
                <TextField
                  fullWidth
                  label="Table No."
                  name="tableNo"
                  value={formData.tableNo || ""}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={14}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="pos-select-label">POS</InputLabel>
                  <Select
                    labelId="pos-select-label"
                    name="pos"
                    value={formData.pos || ""}
                    onChange={handleChange}
                  >
                    <MenuItem value="pos1">POS 1</MenuItem>
                    <MenuItem value="pos2">POS 2</MenuItem>
                    <MenuItem value="pos3">POS 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* <FormControl fullWidth margin="normal">
                    <InputLabel id="status-select-label">Active Status</InputLabel>
                    <Select
                        labelId="status-select-label"
                        name="activeStatus"
                        value={formData.activeStatus || ''}
                        onChange={handleChange}
                    >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                    </Select>
                </FormControl> */}
              <Grid item xs={12} className="flex justify-end gap-2">
                <Button onClick={onClose} color="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  color="primary"
                  variant="contained"
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </div>
      </Modal>
    );
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
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="loader"></div>
            <span className="mt-4 text-gray-700">Loading Table Lists...</span>
          </div>
        </div>
      )}
      <div className="container mx-auto py-10" style={{ maxWidth: "85%" }}>
        <div className="flex justify-between mb-4">
          <h2 className="text-3xl font-bold  text-cyan-900">Table List</h2>
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => router.push("/Restaurant/Tables/add")}
          >
            Add New +
          </button>
        </div>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {["Table No.", "POS", "Action"].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: "bold",
                      color: "#28bfdb",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSort(header.toLowerCase())}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {header}
                      {sortColumn === header.toLowerCase() &&
                        (sortDirection === "asc" ? (
                          <ChevronUpIcon
                            style={{
                              marginLeft: "5px",
                              width: "16px",
                              height: "16px",
                            }}
                          />
                        ) : (
                          <ChevronDownIcon
                            style={{
                              marginLeft: "5px",
                              width: "16px",
                              height: "16px",
                            }}
                          />
                        ))}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.slice(0, displayCount).length > 0 ? (
                sortedData.slice(0, displayCount).map((item) => (
                  <TableRow
                    key={item._id}
                    sx={{ borderBottom: "1px solid #e5e5e5" }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>
                      {item.tableNo}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {item.pos}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {/* <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color:
                                  item.active === "yes" ? "#1c7c1c" : "#a83232",
                                backgroundColor:
                                  item.active === "yes" ? "#dff7df" : "#fddede",
                              }}
                            >
                              {item.active === "yes" ? "Active" : "Inactive"}
                            </span> */}
                      <IconButton
                        style={{ marginLeft: "10px", color: "#2563eb" }}
                        onClick={() => {
                          setSelectedTable(item); // Set the selected table data
                          setIsModalOpen(true); // Open the modal
                        }}
                      >
                        <PencilIcon style={{ width: "16px", height: "16px" }} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(item._id)}
                        sx={{ color: "#D32F2F" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                    }}
                  >
                    No data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <EditTableModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tableData={selectedTable}
          onSave={(updatedTable) => {
            // Update the table data
            const updatedData = tableData.map((table) =>
              table._id === updatedTable._id ? updatedTable : table
            );
            setTableData(updatedData);

            // Optionally, send the updated data to the backend
            fetch(`/api/tables/${updatedTable._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedTable),
            }).catch((error) => console.error("Error updating table:", error));
          }}
        />
      </div>

      <Footer />
    </div>
  );
}
