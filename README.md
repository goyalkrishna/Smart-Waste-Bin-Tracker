# EcoVision - Smart Waste Bin Tracker

**EcoVision** is a full-stack web application designed to revolutionize waste management for smart cities and campuses. It utilizes real-time data to monitor bin fill levels, generate intelligent alerts, and optimize collection routes, leading to cleaner environments and significant operational savings.

---

## ✨ Key Features

-   **Real-Time Dashboard:** A dynamic user dashboard that displays live bin fill levels with intuitive visual animations.
-   **Interactive Map View:** A map that shows the real-time status and location of all bins, color-coded for easy identification.
-   **Smart Alert System:** Automatically generates "Critical" alerts when bins are nearly full and "Warning" alerts for damage reports. The system also auto-resolves alerts when bins are emptied.
-   **AI-Powered Reporting:** Utilizes the Gemini API to generate concise, actionable summaries of the current waste situation for management teams.
-   **Comprehensive Admin Panel:** A powerful admin dashboard to:
    -   Manage all users (Add, Edit, Delete).
    -   Manage all bins (View live status, Mark for maintenance, Delete).
    -   View and manage all active alerts and user-submitted reports.
-   **User Interaction:** Staff can report damaged bins and request supplies directly through the platform.
-   **Secure Authentication:** A complete user authentication system with login, signup, and secure password reset functionality.

---

## 🛠️ Tech Stack

-   **Frontend:** HTML5, CSS3, JavaScript (EJS for templating)
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB with Mongoose
-   **Authentication:** express-session
-   **APIs:** Google Gemini API for AI reports
-   **Deployment:** Ready for platforms like Render

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js installed on your machine.
-   MongoDB installed locally or a MongoDB Atlas account.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/EcoVision-Waste-Bin-Tracker.git](https://github.com/your-username/EcoVision-Waste-Bin-Tracker.git)
    cd EcoVision-Waste-Bin-Tracker
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project and add the following variables. Replace the values with your own keys and secrets.

    ```env
    # MongoDB Connection String
    MONGO_URI=your_mongodb_connection_string

    # Session Secret for user authentication
    SESSION_SECRET=a_very_long_and_random_secret_key

    # Google Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key

    # Gmail credentials for password reset emails
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_gmail_app_password
    ```

4.  **Run the application:**
    ```bash
    npm start
    ```
    The application will be running on `http://localhost:3000`.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

