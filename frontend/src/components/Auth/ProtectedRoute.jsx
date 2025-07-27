import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { auth } from "../../services/firebase";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to /auth (pass current location for redirect-back if you want)
  if (!user) {
    // NOTE: key is to return <Navigate ... />
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Otherwise, render the protected page
  return children;
}
