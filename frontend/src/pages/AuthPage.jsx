import { useLocation } from "react-router-dom";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";

export default function AuthPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const mode = params.get("mode") || "login";
  return mode === "signup" ? <Signup /> : <Login />;
}
