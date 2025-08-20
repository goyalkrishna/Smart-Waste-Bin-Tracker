// This file is used when user wants to report damage to admin.

const mongoose = require("mongoose");

const DamageReportSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description of the damage."],
      maxlength: 500,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This links the report to the User model
      required: true,
    },
    reportedByUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model("DamageReport", DamageReportSchema);
