const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer"); //  Naya package
const path = require("path"); //  Naya package
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Multer (file upload) configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "frontend/public/uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Home route
router.get("/", (req, res) => {
  res.render("home");
});

// GET Profile Page (Updated with functional data)
router.get("/profile", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view this page.");
    return res.redirect("/login");
  }

  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy();
      return res.redirect("/login");
    }

    // --- NEW PLACEHOLDER DATA ---

    // 1. Data for "My Assignments" card
    const assignments = [
      {
        id: "BIN-007",
        location: "Library Entrance",
        level: 92,
        status: "full",
      },
      { id: "BIN-012", location: "Cafeteria West", level: 81, status: "full" },
      { id: "BIN-003", location: "Gymnasium Hall", level: 45, status: "ok" },
      { id: "BIN-009", location: "Admin Building", level: 60, status: "ok" },
    ];

    // 2. Data for "Performance Analytics" card
    const analytics = {
      // Data for a 7-day bar chart. Max count helps calculate percentage height.
      maxCount: 20,
      weeklyEmptied: [
        { day: "Mon", count: 12 },
        { day: "Tue", count: 15 },
        { day: "Wed", count: 8 },
        { day: "Thu", count: 17 },
        { day: "Fri", count: 11 },
        { day: "Sat", count: 9 },
        { day: "Sun", count: 5 },
      ],
    };

    // 3. Data for "Quick Actions" card
    const actions = [
      {
        label: "Report Damage",
        icon: "fa-solid fa-triangle-exclamation",
        link: "#",
      },
      { label: "Request Supplies", icon: "fa-solid fa-box", link: "#" },
      {
        label: "View Full Map",
        icon: "fa-solid fa-map-location-dot",
        link: "#",
      },
      { label: "Generate Report", icon: "fa-solid fa-file-lines", link: "#" },
    ];

    // Pass all the old and new data to the template
    res.render("profile", {
      user: user,
      stats: { binsMonitored: 24, activeAlerts: 3, binsEmptied: 112 },
      activities: [
        /* your existing activities data */
      ],
      assignments: assignments,
      analytics: analytics,
      actions: actions,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// GET Logout User
router.get("/logout", (req, res) => {
  // Destroy the user's session
  req.session.destroy((err) => {
    if (err) {
      // If there's an error, log it and redirect
      console.error("Error destroying session:", err);
      return res.redirect("/profile");
    }

    // Clear the session cookie and redirect to the home page
    res.clearCookie("connect.sid"); // The default session cookie name
    res.redirect("/");
  });
});

// POST Delete User Account (with password verification)
router.post("/profile/delete", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const { password } = req.body;
    const userId = req.session.user.id;

    // 1. Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      // This should rarely happen if the session is valid
      req.flash("error_msg", "User not found.");
      return res.redirect("/profile");
    }

    // 2. Compare the submitted password with the stored hash
    const isMatch = await user.matchPassword(password);

    // 3. If passwords do NOT match, send an error
    if (!isMatch) {
      // UPDATED ERROR MESSAGE
      req.flash(
        "error_msg",
        "The password you entered is incorrect. Please try again."
      );
      return res.redirect("/profile");
    }

    // 4. If passwords match, proceed with deletion
    await User.findByIdAndDelete(userId);
    console.log(`User with ID: ${userId} has been deleted.`);

    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  } catch (err) {
    console.error("Error deleting user account:", err);
    req.flash("error_msg", "An error occurred. Please try again.");
    res.redirect("/profile");
  }
});

// GET Signup page
router.get("/signup", (req, res) => {
  res.render("signup");
});

// POST Signup (Updated with better error handling)
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // --- Basic Validation ---
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered." });
    }

    // --- Create and Save User ---
    const newUser = new User({ username, email, password });
    await newUser.save(); // This is where Mongoose validation runs

    // This logs the new user in immediately.
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };
    // ✅ END: SESSION CREATION BLOCK

    console.log("New user registered and logged in:", newUser);

    res
      .status(201)
      .json({ success: true, message: `Welcome, ${newUser.username}!` });
  } catch (err) {
    console.error("SIGNUP ERROR:", err); // Log the full error for debugging

    // --- Smart Error Handling ---
    if (err.name === "ValidationError") {
      // If it's a Mongoose validation error (e.g., password too short)
      // We extract the first error message to send to the user.
      const message = Object.values(err.errors).map((val) => val.message)[0];
      return res.status(400).json({ success: false, message: message });
    }

    // For any other unexpected errors
    res
      .status(500)
      .json({ success: false, message: "Server error, please try again." });
  }
});

// GET Login page
router.get("/login", (req, res) => {
  res.render("login");
});

// POST Login (Updated to include role in session)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      req.flash("error_msg", "No account found with that email address.");
      return res.redirect("/login");
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      req.flash("error_msg", "Incorrect password. Please try again.");
      return res.redirect("/login");
    }

    // ✅ YAHAN BADLAV KIYA GAYA HAI
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role, // ✅ ROLE KO SESSION MEIN ADD KAREIN
    };

    // Agar user admin hai, to usey admin dashboard par bhejein
    if (user.role === "admin") {
      res.redirect("/admin/dashboard");
    } else {
      // Warna regular profile page par bhejein
      res.redirect("/profile");
    }
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "A server error occurred. Please try again later.");
    res.redirect("/login");
  }
});

// Terms route
router.get("/terms", (req, res) => {
  res.render("terms");
});

// POST Update User Profile
router.post("/profile/update", upload.single("avatar"), async (req, res) => {
  // Check karein ki user logged in hai ya nahi
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to continue.");
    return res.redirect("/login");
  }

  try {
    const { username, email } = req.body;
    const userId = req.session.user.id;

    // Database se user ko dhoondhein
    const user = await User.findById(userId);

    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    // Naye username aur email se update karein
    user.username = username;
    user.email = email;

    // Agar nayi profile picture upload hui hai, to usey update karein
    if (req.file) {
      // Path ko web-accessible banayein
      user.avatar = "/uploads/avatars/" + req.file.filename;
    }

    // Updated user ko database mein save karein
    await user.save();

    // Session ko bhi update karein taaki changes turant dikhein
    req.session.user.username = user.username;
    req.session.user.email = user.email;

    // Success message bhejein
    req.flash("success_msg", "Profile updated successfully!");
    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating profile:", err);
    req.flash("error_msg", "An error occurred while updating the profile.");
    res.redirect("/profile");
  }
});

// POST Change User Password
router.post("/profile/password", async (req, res) => {
  // 1. Check karein ki user logged in hai ya nahi
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to continue.");
    return res.redirect("/login");
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    // 2. Check karein ki naya password aur confirm password match karte hain
    if (newPassword !== confirmPassword) {
      req.flash("error_msg", "New passwords do not match.");
      return res.redirect("/profile");
    }

    // 3. Database se user ko dhoondhein
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    // 4. Current password ko verify karein
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      req.flash("error_msg", "Incorrect current password.");
      return res.redirect("/profile");
    }

    // 5. Naye password ko set karein (Mongoose pre-save hook isey hash kar dega)
    user.password = newPassword;
    await user.save();

    // 6. Success message bhejein
    req.flash("success_msg", "Password changed successfully!");
    res.redirect("/profile");
  } catch (err) {
    console.error("Error changing password:", err);
    req.flash("error_msg", "An error occurred while changing the password.");
    res.redirect("/profile");
  }
});

// GET route to show the forgot password form
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { error_msg: null, success_msg: null });
});

// POST route to handle the reset request
router.post("/forgot-password", async (req, res) => {
  try {
    // 1. Generate a random token
    const token = crypto.randomBytes(20).toString("hex");

    // 2. Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // NOTE: For security, don't reveal if the email exists or not
      return res.render("forgot-password", {
        success_msg:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // 3. Set token and expiry on the user model
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // 4. Send the email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Or your email provider
      auth: {
        user: "YOUR_EMAIL@gmail.com",
        pass: "YOUR_EMAIL_PASSWORD_OR_APP_PASSWORD",
      },
    });

    const mailOptions = {
      to: user.email,
      from: "passwordreset@demo.com",
      subject: "EcoVision Password Reset",
      text:
        `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `http://${req.headers.host}/reset/${token}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.render("forgot-password", {
      success_msg: "A reset link has been sent to your email.",
    });
  } catch (err) {
    // Handle error
    res.render("forgot-password", { error_msg: "An error occurred." });
  }
});


// GET route to show the reset form
router.get("/reset/:token", async (req, res) => {
  const user = await User.findOne({
    passwordResetToken: req.params.token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    // Handle invalid or expired token
    return res.redirect("/forgot-password"); // Redirect with an error message
  }
  res.render("reset-password", { token: req.params.token, error_msg: null });
});

// POST route to update the password
router.post("/reset/:token", async (req, res) => {
  const user = await User.findOne({
    passwordResetToken: req.params.token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    // Handle invalid or expired token
    return res.redirect("/forgot-password");
  }

  if (req.body.password === req.body.confirmPassword) {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    // Redirect to login with a success message
    res.redirect("/login");
  } else {
    // Passwords don't match
    res.render("reset-password", {
      token: req.params.token,
      error_msg: "Passwords do not match.",
    });
  }
});

module.exports = router;
