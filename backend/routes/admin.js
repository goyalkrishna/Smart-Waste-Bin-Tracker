const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Bin = require("../models/Bin");
const bcrypt = require("bcryptjs");
const Alert = require("../models/Alert");
const DamageReport = require("../models/DamageReport");
const SupplyRequest = require("../models/SupplyRequest");

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  res
    .status(403)
    .send("Access Denied: You do not have permission to view this page.");
};

// Admin Dashboard Route
// ✅ YEH AAPKA NAYA AUR COMPLETE ADMIN DASHBOARD ROUTE HAI

router.get("/admin/dashboard", isAdmin, async (req, res) => {
  try {
    // Hum saara data ek saath fetch karenge taaki speed acchi rahe
    const [
      loggedInUser,
      allUsers,
      allBins,
      allAlerts,
      allDamageReports,
      allSupplyRequests,
    ] = await Promise.all([
      User.findById(req.session.user.id),
      User.find({}),
      Bin.find({}).sort({ binId: 1 }),
      Alert.find({}).sort({ createdAt: -1 }).populate("bin"),
      DamageReport.find({}).sort({ createdAt: -1 }),
      SupplyRequest.find({}).sort({ createdAt: -1 }),
    ]);

    // Stats ka calculation
    const stats = {
      users: allUsers.length,
      bins: allBins.length,
      fullBins: allBins.filter((b) => b.fillLevel >= 80).length,
      alerts: allAlerts.filter((a) => a.status === "Active").length, // Sirf active alerts count karein
      emptyBins: allBins.filter((b) => b.fillLevel < 30).length,
      halfBins: allBins.filter((b) => b.fillLevel >= 30 && b.fillLevel < 80)
        .length,
    };

    // Saara data admin page par bhejein
    res.render("admin", {
      user: loggedInUser,
      users: allUsers,
      stats: stats,
      bins: allBins,
      alerts: allAlerts,
      damageReports: allDamageReports, // Naya data
      supplyRequests: allSupplyRequests, // Naya data
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).send("Server Error");
  }
});

// ✅ NEW: Sirf user count fetch karne ke liye API route
router.get("/api/users-count", isAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ count: userCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to delete a user
router.delete("/api/users/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// API endpoint to toggle a bin's maintenance status
router.post("/api/bins/:id/maintenance", isAdmin, async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    // Toggle the status
    bin.status = bin.status === "Active" ? "Under Maintenance" : "Active";

    await bin.save();
    res.status(200).json({ message: "Bin status updated successfully", bin });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to DELETE a bin
router.delete("/api/bins/:id", isAdmin, async (req, res) => {
  try {
    await Bin.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Bin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to ADD a new user
router.post("/api/users/add", isAdmin, async (req, res) => {
  const { username, email, password, role, adminPassword } = req.body;

  // 1. Validate input
  if (!username || !email || !password || !role || !adminPassword) {
    return res.status(400).json({ message: "Please fill all fields." });
  }

  try {
    // 2. Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists." });
    }

    // 3. Verify admin's password
    const adminUser = await User.findById(req.session.user.id);
    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Your admin password is incorrect." });
    }

    // 4. Hash new user's password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // Don't send the password back
    const userToReturn = { ...newUser._doc };
    delete userToReturn.password;

    res
      .status(201)
      .json({ message: "User created successfully", user: userToReturn });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to UPDATE a user
router.put("/api/users/:id", isAdmin, async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const userId = req.params.id;

    // Find the user and update their details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        email,
        role,
      },
      { new: true }
    ); // {new: true} returns the updated document

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to MARK AN ALERT AS RESOLVED
router.post("/api/alerts/:id/resolve", isAdmin, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    alert.status = "Resolved";
    await alert.save();
    res.status(200).json({ message: "Alert marked as resolved." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to DELETE AN ALERT
router.delete("/api/alerts/:id", isAdmin, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Alert deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to get the count of active alerts
router.get("/api/alerts/active-count", isAdmin, async (req, res) => {
  try {
    const count = await Alert.countDocuments({ status: "Active" });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to get ONLY ACTIVE alerts
router.get("/api/alerts/active", isAdmin, async (req, res) => {
  try {
    const activeAlerts = await Alert.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .populate("bin");
    res.json(activeAlerts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// --- Damage Reports ---
router.post("/api/reports/damage/:id/update", isAdmin, async (req, res) => {
  try {
    const report = await DamageReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Cycle through statuses: Pending -> In Progress -> Resolved
    if (report.status === "Pending") {
      report.status = "In Progress";
    } else if (report.status === "In Progress") {
      report.status = "Resolved";
    }
    // Agar status 'Resolved' hai, toh kuch na karein

    await report.save();
    res.status(200).json({ message: "Status updated", report });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete report
router.delete("/api/reports/damage/:id", isAdmin, async (req, res) => {
  try {
    await DamageReport.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Report deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// --- Supply Requests ---
// Update status
router.post("/api/requests/supply/:id/update", isAdmin, async (req, res) => {
  try {
    const request = await SupplyRequest.findById(req.params.id);
    // Cycle through statuses: Pending -> Approved -> Completed
    if (request.status === "Pending") request.status = "Approved";
    else if (request.status === "Approved") request.status = "Completed";
    await request.save();
    res.status(200).json({ message: "Status updated", request });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// Delete request
router.delete("/api/requests/supply/:id", isAdmin, async (req, res) => {
  try {
    await SupplyRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
