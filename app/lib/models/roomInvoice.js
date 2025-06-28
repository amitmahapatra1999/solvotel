import mongoose from "mongoose";

const roomInvoiceSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,

      trim: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const RoomInvoice =
  mongoose.models.RoomInvoice ||
  mongoose.model("RoomInvoice", roomInvoiceSchema);

export default RoomInvoice;
