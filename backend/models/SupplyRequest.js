// Isme user kya kya supply request bhejta he admin ko.
const mongoose = require("mongoose");

const SupplyRequestSchema = new mongoose.Schema(
  {
    supplyType: {
      type: String,
      required: [true, "Please select a supply type."],
      enum: ["Bin Liners", "Cleaning Solution", "Gloves", "Other"],
    },
    quantity: {
      type: Number,
      required: [true, "Please enter a quantity."],
      min: 1,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedByUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplyRequest", SupplyRequestSchema);
