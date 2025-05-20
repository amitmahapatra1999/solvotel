import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
    },
    username: {
      // New field
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
