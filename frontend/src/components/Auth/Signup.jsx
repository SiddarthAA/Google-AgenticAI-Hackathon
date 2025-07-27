// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { auth, googleProvider } from "../../services/firebase";
// import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Mail, Lock, Chrome, AlertCircle } from "lucide-react";

// export default function Signup() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
//   const navigate = useNavigate();

//   // Handle Email/Password Signup
//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError("");
//     setIsLoading(true);
//     try {
//       const userCred = await createUserWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       const user = userCred.user;
//       const token = await user.getIdToken();

//       await fetch("http://localhost:4000/api/user", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           uid: user.uid,
//           name: user.displayName || "",
//           email: user.email || "",
//           avatar: user.photoURL || "",
//           bio: "",
//           joinDate: new Date().toLocaleDateString("en-GB"),
//           verified: user.emailVerified,
//           premium: false,
//           signalsReported: 0,
//           alertsReceived: 0,
//           streakDays: 0,
//           rewardsEarned: 0,
//           listeningHours: 0,
//           accuracyScore: 0,
//         }),
//       });
//       navigate("/home");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle Google Signup
//   const handleGoogleSignup = async () => {
//     setError("");
//     setIsGoogleLoading(true);
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const user = result.user;
//       const token = await user.getIdToken();

//       await fetch("http://localhost:4000/api/user", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           uid: user.uid,
//           name: user.displayName || "",
//           email: user.email || "",
//           avatar: user.photoURL || "",
//           bio: "",
//           joinDate: new Date().toLocaleDateString("en-GB"),
//           verified: user.emailVerified,
//           premium: false,
//           signalsReported: 0,
//           alertsReceived: 0,
//           streakDays: 0,
//           rewardsEarned: 0,
//           listeningHours: 0,
//           accuracyScore: 0,
//         }),
//       });
//       navigate("/home");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsGoogleLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
//       {/* Background Effects */}
//       <div className="absolute inset-0">
//         <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-900 to-purple-950/50" />
//         <div
//           className="absolute inset-0 opacity-20"
//           style={{
//             backgroundImage: `
//               linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
//               linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
//             `,
//             backgroundSize: "40px 40px",
//           }}
//         />
//         <div className="absolute inset-0">
//           {[...Array(15)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
//               style={{
//                 left: `${Math.random() * 100}%`,
//                 top: `${Math.random() * 100}%`,
//                 animationDelay: `${Math.random() * 3}s`,
//                 animationDuration: `${2 + Math.random() * 2}s`,
//               }}
//             />
//           ))}
//         </div>
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
//         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
//       </div>

//       {/* Signup Card */}
//       <Card className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
//         <div className="p-8">
//           {/* Header */}
//           <div className="text-center mb-4">
//             <h1 className="text-3xl font-bold text-white mb-2 -mt-4">
//               Create your account
//             </h1>
//             <p className="text-gray-400">
//               Join Signal and simplify city information
//             </p>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
//               <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
//               <p className="text-red-300 text-sm">{error}</p>
//             </div>
//           )}

//           {/* Signup Form */}
//           <form onSubmit={handleSignup} className="space-y-6">
//             {/* Email Field */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
//                   placeholder="Enter your email"
//                   required
//                   autoComplete="email"
//                 />
//               </div>
//             </div>

//             {/* Password Field */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
//                   placeholder="Enter your password"
//                   required
//                   autoComplete="new-password"
//                 />
//               </div>
//             </div>

//             {/* Sign Up Button */}
//             <Button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <div className="flex items-center justify-center">
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
//                   Creating account...
//                 </div>
//               ) : (
//                 "Sign Up"
//               )}
//             </Button>
//           </form>

//           {/* Divider */}
//           <div className="my-8 flex items-center">
//             <div className="flex-1 border-t border-white/10"></div>
//             <span className="px-4 text-gray-400 text-sm">or</span>
//             <div className="flex-1 border-t border-white/10"></div>
//           </div>

//           {/* Google Sign Up */}
//           <Button
//             type="button"
//             onClick={handleGoogleSignup}
//             disabled={isGoogleLoading}
//             variant="outline"
//             className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isGoogleLoading ? (
//               <div className="flex items-center justify-center">
//                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
//                 Signing up...
//               </div>
//             ) : (
//               <div className="flex items-center justify-center">
//                 <Chrome className="w-5 h-5 mr-3" />
//                 Sign up with Google
//               </div>
//             )}
//           </Button>
//         </div>
//         <div className="text-center">
//           <p className="-mt-4 text-sm text-gray-400">
//             Already have an account?{" "}
//             <Link
//               to="/auth?mode=login"
//               className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
//             >
//               Log in
//             </Link>
//           </p>
//         </div>
//       </Card>

//       {/* Bottom Text */}
//       <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
//         <p className="text-gray-500 text-sm">
//           Secure authentication powered by Firebase
//         </p>
//       </div>
//     </div>
//   );
// }

//original day code
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, googleProvider } from "../../services/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Lock, Chrome, AlertCircle, Tag } from "lucide-react";

const FILTER_TAGS = [
  "Traffic",
  "Weather",
  "Infrastructure",
  "Events",
  "Emergency",
  "Health",
  "Education",
  "Transport",
  "Power",
  "Other",
];

function setCookie(name, value, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
}

export default function SignupWithTags() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  function handleTagClick(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function saveTagsToCookie(tags) {
    setCookie("preferences", JSON.stringify(tags));
  }

  function saveUidToCookie(uid) {
    setCookie("uid", uid);
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (selectedTags.length === 0) {
      setError("Please select at least one interest tag.");
      setIsLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCred.user;
      const token = await user.getIdToken();

      saveTagsToCookie(selectedTags);
      saveUidToCookie(user.uid);

      const payload = {
        uid: user.uid,
        name: user.displayName || "",
        phone_number: 0,
        avatar_url: user.photoURL || "",
        join_date: new Date().toISOString(),
        verified: user.emailVerified,
        events_reported: 0,
        reward_points: 0,
        confidence_score: 0,
        preferences: selectedTags,
      };

      await fetch(
        "https://bangalorenow-backend-59317430987.asia-south1.run.app/register/user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setIsGoogleLoading(true);

    if (selectedTags.length === 0) {
      setError("Please select at least one interest tag.");
      setIsGoogleLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      saveTagsToCookie(selectedTags);
      saveUidToCookie(user.uid);

      const payload = {
        uid: user.uid,
        name: user.displayName || "",
        phone_number: 0,
        avatar_url: user.photoURL || "",
        join_date: new Date().toISOString(),
        verified: user.emailVerified,
        events_reported: 0,
        reward_points: 0,
        confidence_score: 0,
        preferences: selectedTags,
      };

      await fetch(
        "https://bangalorenow-backend-59317430987.asia-south1.run.app/register/user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      {/* ...background effects omitted for brevity... */}
      <Card className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-2 -mt-4">
              Create your account
            </h1>
            <p className="text-gray-400">
              Join Signal and simplify city information
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Email & Password Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Filter Tags Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose your interests
              </label>
              <div className="flex flex-wrap gap-2">
                {FILTER_TAGS.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border
                      ${
                        selectedTags.includes(tag)
                          ? "bg-blue-600 border-blue-600 text-white font-bold"
                          : "bg-white/5 border-white/10 text-gray-300"
                      }
                      transition-all duration-150`}
                  >
                    <Tag className="w-4 h-4" />
                    {tag}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Select at least one tag to personalize your experience.
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating account...
                </div>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
            variant="outline"
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Signing up...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Chrome className="w-5 h-5 mr-3" />
                Sign up with Google
              </div>
            )}
          </Button>
        </div>
        <div className="text-center">
          <p className="-mt-4 text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/auth?mode=login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </Card>

      {/* Bottom Text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-gray-500 text-sm">
          Secure authentication powered by Firebase
        </p>
      </div>
    </div>
  );
}
