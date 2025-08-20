const mongoose = require("mongoose");

const BinSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: String,
      required: true,
    },
    fillLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["Active", "Under Maintenance"],
      default: "Active",
    },
    lastEmptied: {
      type: Date,
      default: Date.now,
    },

    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bin", BinSchema);
