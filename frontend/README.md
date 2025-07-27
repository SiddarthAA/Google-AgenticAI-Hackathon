# BangaloreNow Frontend

This is the frontend codebase for **BangaloreNow**, a real-time city dashboard for Bangalore built with React and Vite.

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed (recommend v18+).

```sh
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the root directory. Copy this template and fill in your values:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

- You need a [Google Maps API key](https://console.cloud.google.com/apis/credentials) with Maps JavaScript API enabled.
- You need Firebase credentials for authentication.

### 4. Run the Development Server

```sh
npm run dev
```

Your app should now be running at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

## Building for Production

```sh
npm run build
```

## Additional Notes

- If you want to use mock data, you can edit `map_viewer.jsx` and comment out the backend fetch logic.
- Make sure your backend API and authentication setup are configured as needed for production.

## Troubleshooting

- If you get errors about missing environment variables, double-check your `.env` file.
- If you have issues with Google Maps, ensure your API key has the correct permissions.

---

Happy hacking! 🚀
