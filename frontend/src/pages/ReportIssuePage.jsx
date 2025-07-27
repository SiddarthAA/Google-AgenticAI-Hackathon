// "use client";

// import { useState, useEffect } from "react";
// import { auth } from "../services/firebase"; // Adjust path if needed
// import Navbar from "../components/Navbar/Navbar";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, Camera, UploadCloud, AlertTriangle } from "lucide-react";

// const categories = [
//   { value: "traffic", label: "Traffic" },
//   { value: "weather", label: "Weather" },
//   { value: "infrastructure", label: "Infrastructure" },
//   { value: "event", label: "Event" },
//   { value: "emergency", label: "Emergency" },
//   { value: "other", label: "Other" },
// ];
// const severities = [
//   { value: "critical", label: "Critical" },
//   { value: "high", label: "High" },
//   { value: "medium", label: "Medium" },
//   { value: "low", label: "Low" },
// ];

// export default function ReportIssuePage() {
//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     category: "",
//     severity: "",
//     file: null,
//     fileUrl: "",
//     lat: null,
//     lng: null,
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [status, setStatus] = useState("");
//   const [geoError, setGeoError] = useState("");
//   const [uid, setUid] = useState(null);

//   // Get the current user's UID
//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       setUid(user?.uid || null);
//     });
//     return () => unsubscribe();
//   }, []);

//   // Get user's location
//   useEffect(() => {
//     if ("geolocation" in navigator) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           setForm((f) => ({
//             ...f,
//             lat: pos.coords.latitude,
//             lng: pos.coords.longitude,
//           }));
//         },
//         (err) => setGeoError("Location permission denied or unavailable.")
//       );
//     }
//   }, []);

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//   }

//   function handleFile(e) {
//     const file = e.target.files[0];
//     if (!file) return;
//     setForm((f) => ({
//       ...f,
//       file,
//       fileUrl: URL.createObjectURL(file),
//     }));
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setStatus("");
//     setSubmitting(true);

//     if (!form.title || !form.description || !form.category || !form.severity) {
//       setStatus("Please fill in all required fields.");
//       setSubmitting(false);
//       return;
//     }
//     if (!form.lat || !form.lng) {
//       setStatus("Location is required (allow location access).");
//       setSubmitting(false);
//       return;
//     }
//     if (!uid) {
//       setStatus("User not authenticated.");
//       setSubmitting(false);
//       return;
//     }

//     const payload = {
//       uid, // Attach user's UID
//       lat: form.lat,
//       lon: form.lng,
//       title: form.title,
//       description: form.description,
//       category: form.category,
//       severity: form.severity,
//       confidence: 1,
//       sources: 1,
//       image: form.fileUrl || "",
//       // timestamp will be set by backend
//     };

//     try {
//       const res = await fetch("http://localhost:4000/api/reports", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) throw new Error("Failed to submit");

//       setStatus("✅ Issue reported! Thank you for your feedback.");
//       setForm({
//         title: "",
//         description: "",
//         category: "",
//         severity: "",
//         file: null,
//         fileUrl: "",
//         lat: form.lat,
//         lng: form.lng,
//       });
//     } catch (error) {
//       setStatus("❌ Failed to report issue.");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
//   const staticMap =
//     form.lat && form.lng
//       ? `https://maps.googleapis.com/maps/api/staticmap?center=${form.lat},${form.lng}&zoom=15&size=400x200&markers=color:red%7C${form.lat},${form.lng}&key=${GOOGLE_MAPS_API_KEY}`
//       : "";

//   return (
//     <div className="min-h-screen bg-black">
//       <Navbar />
//       <div className="max-w-lg mx-auto pt-24 pb-10 px-4">
//         <h1 className="text-white text-3xl font-bold mb-3 flex items-center">
//           <AlertTriangle className="w-7 h-7 text-yellow-400 mr-2" />
//           Report an Issue
//         </h1>
//         <p className="mb-8 text-gray-400">
//           Help make your city safer &amp; smarter. Your report will be visible
//           to other citizens and authorities.
//         </p>
//         <Card className="bg-gradient-to-br from-white/10 to-black/10 border border-white/10 p-7 mb-5">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="text-gray-300 font-medium block mb-1">
//                 Title <span className="text-yellow-400">*</span>
//               </label>
//               <input
//                 name="title"
//                 required
//                 placeholder="E.g. Flooded road at Indiranagar"
//                 value={form.title}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
//               />
//             </div>
//             <div>
//               <label className="text-gray-300 font-medium block mb-1">
//                 Description <span className="text-yellow-400">*</span>
//               </label>
//               <textarea
//                 name="description"
//                 required
//                 placeholder="Describe the issue and its impact."
//                 value={form.description}
//                 onChange={handleChange}
//                 rows={4}
//                 className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 resize-none"
//               />
//             </div>
//             <div className="flex gap-4">
//               <div className="flex-1">
//                 <label className="text-gray-300 font-medium block mb-1">
//                   Category <span className="text-yellow-400">*</span>
//                 </label>
//                 <select
//                   name="category"
//                   required
//                   value={form.category}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-white/10"
//                 >
//                   <option value="">Select</option>
//                   {categories.map((cat) => (
//                     <option value={cat.value} key={cat.value}>
//                       {cat.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex-1">
//                 <label className="text-gray-300 font-medium block mb-1">
//                   Severity <span className="text-yellow-400">*</span>
//                 </label>
//                 <select
//                   name="severity"
//                   required
//                   value={form.severity}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-white/10"
//                 >
//                   <option value="">Select</option>
//                   {severities.map((sev) => (
//                     <option value={sev.value} key={sev.value}>
//                       {sev.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//             {/* Image */}
//             <div>
//               <label className="text-gray-300 font-medium block mb-2">
//                 Photo
//               </label>
//               {form.fileUrl && (
//                 <img
//                   src={form.fileUrl}
//                   alt="Preview"
//                   className="w-full max-h-48 mb-3 object-cover rounded-lg border border-blue-400/20"
//                 />
//               )}
//               <label className="flex items-center gap-3 cursor-pointer hover:text-blue-400 transition mb-3">
//                 <Camera className="w-5 h-5 text-white" />
//                 <span className="text-white hover:text-blue-400">
//                   {form.file ? "Change Photo" : "Upload Photo"}
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleFile}
//                     className="hidden"
//                   />
//                 </span>
//               </label>
//               <span className="block text-gray-500 text-xs">
//                 JPEG, PNG, or HEIF up to 8MB.
//               </span>
//             </div>
//             {/* Location */}
//             <div>
//               <label className="text-gray-300 font-medium block mb-1 flex items-center">
//                 <MapPin className="w-4 h-4 mr-1" />
//                 Location detected
//               </label>
//               {form.lat && form.lng ? (
//                 <div className="mb-2 text-blue-300 font-mono text-sm">
//                   {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
//                 </div>
//               ) : (
//                 <div className="mb-2 text-gray-500 text-sm">
//                   Location not detected yet.
//                 </div>
//               )}
//               {/* Static Google Map */}
//               {form.lat && form.lng && (
//                 <img
//                   src={staticMap}
//                   alt="Location map"
//                   className="rounded-lg border border-white/10 shadow"
//                   width={400}
//                   height={200}
//                   loading="lazy"
//                 />
//               )}
//               {geoError && (
//                 <div className="text-red-400 mt-2 text-sm">{geoError}</div>
//               )}
//             </div>
//             {/* Submit */}
//             <div>
//               <Button
//                 type="submit"
//                 className="w-full mt-2 bg-gradient-to-r from-yellow-400 to-red-400 font-bold text-black text-lg py-3 shadow-lg shadow-yellow-500/10"
//                 disabled={submitting}
//               >
//                 <UploadCloud className="mr-2 w-5 h-5" />
//                 {submitting ? "Submitting..." : "Submit Issue"}
//               </Button>
//               {status && (
//                 <div
//                   className={`mt-3 text-sm ${
//                     status.startsWith("✅") ? "text-green-400" : "text-red-400"
//                   }`}
//                 >
//                   {status}
//                 </div>
//               )}
//             </div>
//           </form>
//         </Card>
//       </div>
//     </div>
//   );
// }

//original day code
"use client";

import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "../components/Navbar/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Camera,
  UploadCloud,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const REPORT_ISSUE_ENDPOINT =
  "https://bangalorenow-backend-59317430987.asia-south1.run.app/send-event";

// Gemini API setup
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default function ReportIssuePage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    file: null,
    filePreview: "",
    lat: null,
    lng: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [geoError, setGeoError] = useState("");
  const [uid, setUid] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((f) => ({
            ...f,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }));
        },
        () => setGeoError("Location permission denied or unavailable.")
      );
    }
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({
      ...f,
      file,
      filePreview: URL.createObjectURL(file),
    }));
  }

  async function handleGenerate() {
    if (!form.file) return;
    setGenerating(true);
    setStatus("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(",")[1];
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt =
          "Give a short 2-3 line title and a concise 2-3 line description for this image, suitable for reporting a public issue. Do not use introductory phrases.";
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: form.file.type,
              data: base64,
            },
          },
          {
            text: prompt,
          },
        ]);
        let text =
          result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Remove any Markdown bold, "Title:", "Description:" prefixes
        text = text
          .replace(/\*\*/g, "")
          .replace(/^Title:\s*/i, "")
          .replace(/^Description:\s*/i, "")
          .trim();

        // Try to find explicit "Description:" separator
        let title = "",
          description = "";
        const descMatch = text.match(/^(.*?)\s*Description:\s*(.*)$/is);
        if (descMatch) {
          title = descMatch[1].trim();
          description = descMatch[2].trim();
        } else {
          // Otherwise, treat first line as title, rest as description
          const lines = text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          title = lines[0] || "";
          description = lines.slice(1).join(" ").trim();
        }

        // Final clean-up for edge cases
        title = title
          .replace(/^Title:\s*/i, "")
          .replace(/^Description:\s*/i, "")
          .trim();
        description = description
          .replace(/^Title:\s*/i, "")
          .replace(/^Description:\s*/i, "")
          .trim();

        if (!description && title) {
          description = title;
          title = "";
        }

        setForm((f) => ({
          ...f,
          title: title || f.title,
          description: description || f.description,
        }));
        setStatus(
          "✨ Generated title and description. You can edit them before submitting."
        );
      } catch (err) {
        setStatus("❌ Failed to generate summary.");
        console.error(err);
      } finally {
        setGenerating(false);
      }
    };
    reader.readAsDataURL(form.file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setSubmitting(true);

    if (!form.title || !form.description) {
      setStatus("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }
    if (!form.file) {
      setStatus("Please use your camera to click an image.");
      setSubmitting(false);
      return;
    }
    if (!form.lat || !form.lng) {
      setStatus("Location is required (allow location access).");
      setSubmitting(false);
      return;
    }
    if (!uid) {
      setStatus("User not authenticated.");
      setSubmitting(false);
      return;
    }

    let fileUrl = "";
    let fileStorageUuid = "";

    try {
      setStatus("Uploading image...");
      fileStorageUuid = `${uid}_${Date.now()}_${form.file.name}`;
      const storage = getStorage();
      const storageRef = ref(storage, `reports/${fileStorageUuid}`);
      await uploadBytes(storageRef, form.file);
      fileUrl = await getDownloadURL(storageRef);

      setStatus("Submitting report...");

      // Send as FormData instead of JSON
      const formData = new FormData();
      formData.append("uid", uid);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("latitude", form.lat); // <--- FIXED
      formData.append("longitude", form.lng); // <--- FIXED
      formData.append("url", fileUrl); // <--- FIXED
      formData.append("source", "user"); // (if required by backend)
      const res = await fetch(REPORT_ISSUE_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("✅ Issue reported! Thank you for your feedback.");
      setForm({
        title: "",
        description: "",
        file: null,
        filePreview: "",
        lat: form.lat,
        lng: form.lng,
      });
    } catch {
      setStatus("❌ Failed to report issue.");
    } finally {
      setSubmitting(false);
    }
  }

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const staticMap =
    form.lat && form.lng
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${form.lat},${form.lng}&zoom=15&size=400x200&markers=color:red%7C${form.lat},${form.lng}&key=${GOOGLE_MAPS_API_KEY}`
      : "";

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-lg mx-auto pt-24 pb-10 px-4">
        <h1 className="text-white text-3xl font-bold mb-3 flex items-center">
          <AlertTriangle className="w-7 h-7 text-yellow-400 mr-2" />
          Report an Issue
        </h1>
        <p className="mb-8 text-gray-400">
          Help make your city safer &amp; smarter. Your report will be visible
          to other citizens and authorities.
        </p>
        <Card className="bg-gradient-to-br from-white/10 to-black/10 border border-white/10 p-7 mb-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-gray-300 font-medium block mb-1">
                Title <span className="text-yellow-400">*</span>
              </label>
              <input
                name="title"
                required
                placeholder="E.g. Flooded road at Indiranagar"
                value={form.title}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="text-gray-300 font-medium block mb-1">
                Description <span className="text-yellow-400">*</span>
              </label>
              <textarea
                name="description"
                required
                placeholder="Describe the issue and its impact."
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>
            {/* Image */}
            <div>
              <label className="text-gray-300 font-medium block mb-2">
                Photo <span className="text-yellow-400">*</span>
              </label>
              {form.filePreview && (
                <img
                  src={form.filePreview}
                  alt="Preview"
                  className="w-full max-h-48 mb-3 object-cover rounded-lg border border-blue-400/20"
                />
              )}
              <label className="flex items-center gap-3 cursor-pointer hover:text-blue-400 transition mb-3">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-white hover:text-blue-400">
                  {form.file ? "Retake Photo" : "Click Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFile}
                    className="hidden"
                  />
                </span>
              </label>
              <span className="block text-gray-500 text-xs">
                Please use your camera to click an image of the issue. JPEG,
                PNG, or HEIF up to 8MB.
              </span>
              {/* Generate button */}
              {form.file && (
                <Button
                  type="button"
                  className="mt-3 bg-gradient-to-r from-blue-400 to-purple-400 font-bold text-black py-2 shadow-lg shadow-blue-500/10 flex items-center gap-2"
                  disabled={generating}
                  onClick={handleGenerate}
                >
                  <Wand2 className="mr-2 w-5 h-5" />
                  {generating
                    ? "Generating..."
                    : "Generate Title & Description"}
                </Button>
              )}
            </div>
            {/* Location */}
            <div>
              <label className="text-gray-300 font-medium block mb-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location detected
              </label>
              {form.lat && form.lng ? (
                <div className="mb-2 text-blue-300 font-mono text-sm">
                  {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                </div>
              ) : (
                <div className="mb-2 text-gray-500 text-sm">
                  Location not detected yet.
                </div>
              )}
              {form.lat && form.lng && (
                <img
                  src={staticMap}
                  alt="Location map"
                  className="rounded-lg border border-white/10 shadow"
                  width={400}
                  height={200}
                  loading="lazy"
                />
              )}
              {geoError && (
                <div className="text-red-400 mt-2 text-sm">{geoError}</div>
              )}
            </div>
            {/* Submit */}
            <div>
              <Button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-yellow-400 to-red-400 font-bold text-black text-lg py-3 shadow-lg shadow-yellow-500/10"
                disabled={submitting}
              >
                <UploadCloud className="mr-2 w-5 h-5" />
                {submitting ? "Submitting..." : "Submit Issue"}
              </Button>
              {status && (
                <div
                  className={`mt-3 text-sm ${
                    status.startsWith("✅") ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {status}
                </div>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
