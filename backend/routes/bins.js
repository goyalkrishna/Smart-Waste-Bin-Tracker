const express = require("express");
const router = express.Router();
const Bin = require("../models/Bin");
const DamageReport = require("../models/DamageReport");
const SupplyRequest = require("../models/SupplyRequest");
const Alert = require("../models/Alert");

router.get("/map", (req, res) => {
  // Make sure user is logged in to view the map
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("map");
});

// API endpoint to get all bins and simulate real-time data
router.get("/api/bins", async (req, res) => {
  try {
    const bins = await Bin.find();

    // This array will hold all the update promises
    // This array will hold all the update promises
    const updatePromises = bins.map(async (bin) => {
      // ✅ Add 'async' here
      let currentLevel = bin.fillLevel;

      if (Math.random() > 0.5) {
        if (currentLevel > 80 && Math.random() > 0.4) {
          currentLevel = Math.floor(Math.random() * 4) + 1;
        } else {
          currentLevel += Math.floor(Math.random() * 10) + 5;
        }
      }

      if (currentLevel > 100) {
        currentLevel = 100;
      }

      bin.fillLevel = currentLevel;

      if (bin.fillLevel >= 80 && bin.status === "Active") {
        // ✅ Add 'await' here
        const existingAlert = await Alert.findOne({
          bin: bin._id,
          status: "Active",
          type: "Critical",
        });
        if (!existingAlert) {
          const newAlert = new Alert({
            type: "Critical",
            message: `Bin ${bin.binId} at ${bin.location} is nearly full.`,
            bin: bin._id,
          });
          await newAlert.save(); // ✅ And add 'await' here
        }
      }
      else {
        // Agar bin ka level 80 se neeche hai, toh check karo ki koi active alert hai ya nahi
        const existingAlert = await Alert.findOne({
          bin: bin._id,
          status: "Active",
          type: "Critical",
        });

        // Agar active alert milta hai, to use "Resolved" mark kar do
        if (existingAlert) {
          existingAlert.status = "Resolved";
          await existingAlert.save();
        }
      }

      return bin.save();
    });

    // Wait for all the bin updates to complete before sending the response
    const updatedBins = await Promise.all(updatePromises);

    res.json(updatedBins);
  } catch (err) {
    console.error("Error in /api/bins route:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Yeh nayi POST route add karein
router.post("/api/generate-summary", async (req, res) => {
  try {
    // Data ab seedhe frontend se aa raha hai
    const bins = req.body.bins;

    if (!bins || bins.length === 0) {
      return res.json({
        summary: "<p>No bin data available to generate a report.</p>",
      });
    }

    const fullBins = bins.filter((b) => b.fillLevel >= 80);
    const moderateBins = bins.filter(
      (b) => b.fillLevel >= 30 && b.fillLevel < 80
    );

    const prompt = `
            Generate a concise, professional status summary for a waste management dashboard based on the following real-time data.
            Total bins monitored: ${bins.length}.
            Bins requiring immediate attention (80% or fuller): ${
              fullBins.length
            }. If this number is greater than 0, list their IDs and locations: ${fullBins
      .map((b) => `${b.binId} at ${b.location}`)
      .join(", ")}.
            Bins at moderate levels (30-79%): ${moderateBins.length}.
            The remaining bins are at low levels.
            Based on this data, provide a brief, actionable recommendation for the collection team.
            Format the entire output as clean HTML using only <p>, <strong>, and <ul>/<li> tags.
        `;

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      throw new Error(errorBody.error.message);
    }

    const result = await apiResponse.json();
    const summaryText = result.candidates[0].content.parts[0].text;

    res.json({ summary: summaryText });
  } catch (error) {
    console.error("Gemini API error:", error);
    res
      .status(500)
      .json({ summary: `<p><strong>Error:</strong> ${error.message}</p>` });
  }
});

// ✅ UPDATED report damage route
router.post("/api/report-damage", async (req, res) => {
  if (!req.session.user) {
    return res
      .status(401)
      .json({ message: "You must be logged in to report damage." });
  }

  const { binId, location, description } = req.body;

  if (!binId || !location || !description) {
    return res.status(400).json({ message: "Please fill out all fields." });
  }

  try {
    const newReport = new DamageReport({
      binId,
      location,
      description,
      reportedBy: req.session.user.id, // The user's unique ID
      reportedByUsername: req.session.user.username, // ✅ The user's name
    });

    await newReport.save();

    const relatedBin = await Bin.findOne({ binId: binId });
    if (relatedBin) {
      const newAlert = new Alert({
        type: "Warning",
        message: `Damage reported for Bin ${relatedBin.binId} by user ${req.session.user.username}.`,
        bin: relatedBin._id,
      });
      await newAlert.save();
    }

    res.status(201).json({ message: "Damage report submitted successfully!" });
  } catch (error) {
    console.error("Error submitting damage report:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// new POST route for supply requests
router.post("/api/request-supplies", async (req, res) => {
  if (!req.session.user) {
    return res
      .status(401)
      .json({ message: "You must be logged in to request supplies." });
  }

  const { supplyType, quantity, notes } = req.body;

  if (!supplyType || !quantity) {
    return res
      .status(400)
      .json({ message: "Please select a supply and quantity." });
  }

  try {
    const newRequest = new SupplyRequest({
      supplyType,
      quantity,
      notes,
      requestedBy: req.session.user.id,
      requestedByUsername: req.session.user.username,
    });

    await newRequest.save();
    res.status(201).json({ message: "Supply request submitted successfully!" });
  } catch (error) {
    console.error("Error submitting supply request:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

module.exports = router;
