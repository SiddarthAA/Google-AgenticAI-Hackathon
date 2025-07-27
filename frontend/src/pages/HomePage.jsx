"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
  HeatmapLayer,
} from "@react-google-maps/api";
import {
  Search,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Eye,
  EyeOff,
  Radio,
  Layers,
  Target,
  RefreshCw,
} from "lucide-react";

import { getAuth } from "firebase/auth"; // <-- Import Firebase Auth

// Utility to get cookies as object
function getCookies() {
  return Object.fromEntries(
    document.cookie
      .split("; ")
      .map((c) => c.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

// Utility to set the FILTER_TAGS cookie securely
function setFilterTagsCookie(tags, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `FILTER_TAGS=${encodeURIComponent(
    JSON.stringify(tags)
  )}; expires=${expires}; path=/; Secure; SameSite=Strict`;
}

function getFilterTagsCookie() {
  const cookies = getCookies();
  return cookies.FILTER_TAGS || "[]";
}

// Calculate intensity based on proximity and severity
function computeIntensities(reports) {
  const toRad = (d) => (d * Math.PI) / 180;
  const threshold = 2; // 2km

  return reports.map((report) => {
    let intensity = 1;
    const severityMultiplier = {
      critical: 3,
      high: 2.5,
      medium: 1.5,
      low: 1,
    };

    reports.forEach((r) => {
      if (r === report) return;
      const R = 6371;
      const dLat = toRad(r.lat - report.lat);
      const dLon = toRad(r.lon - report.lon);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(report.lat)) *
          Math.cos(toRad(r.lat)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      if (dist <= threshold) {
        intensity += 0.5 * severityMultiplier[r.severity];
      }
    });

    return {
      ...report,
      intensity: intensity * severityMultiplier[report.severity],
    };
  });
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1e3a8a" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#374151" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
];

function IssueListPanel({ issues, onIssueClick, isVisible, onToggle }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "high":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-green-400 bg-green-500/20 border-green-500/30";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "traffic":
        return "🚗";
      case "weather":
        return "🌧️";
      case "event":
        return "📢";
      case "infrastructure":
        return "⚡";
      case "emergency":
        return "🚨";
      default:
        return "📍";
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20">
      <Card className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-80 max-w-[90vw]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-400" />
              Live Issues
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-gray-400 hover:text-white"
            >
              {isVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>

          {isVisible && (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {issues.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Issues in current view</p>
                </div>
              ) : (
                issues.map((issue, idx) => (
                  <div
                    key={issue.title + idx}
                    className="group cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all duration-200"
                    onClick={() => onIssueClick(issue)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {getCategoryIcon(issue.category)}
                        </span>
                        <h4 className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">
                          {issue.title}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                      {issue.description}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="text-green-400 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {issue.confidence}%
                        </span>
                        <span className="text-blue-400 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {issue.sources}
                        </span>
                      </div>
                      <span className="text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {issue.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MapControls({ onRefresh, heatmapVisible, onToggleHeatmap }) {
  return (
    <div className="absolute top-4 right-4 z-20 space-y-2 hidden md:block">
      <Card className="bg-black/80 backdrop-blur-xl border border-white/10">
        <div className="p-2 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="w-full text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHeatmap}
            className={`w-full ${
              heatmapVisible ? "text-blue-400 bg-blue-500/20" : "text-white"
            } hover:bg-white/10`}
          >
            <Layers className="w-4 h-4 mr-2" />
            Heatmap
          </Button>
        </div>
      </Card>
    </div>
  );
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function HomePage() {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["visualization"],
  });

  const [search, setSearch] = useState("");
  const [center, setCenter] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [visibleIssues, setVisibleIssues] = useState([]);
  const [isListVisible, setIsListVisible] = useState(true);
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);

  // Firebase Auth instance
  const auth = getAuth();

  // Set FILTER_TAGS cookie securely if not present
  useEffect(() => {
    if (!getFilterTagsCookie()) {
      setFilterTagsCookie([]);
    }
  }, []);

  // Fetch live reports and process intensities with UID in query
  useEffect(() => {
    async function fetchAndProcessReports() {
      try {
        const user = auth.currentUser;
        let uidParam = "";
        if (user && user.uid) {
          uidParam = `?uid=${encodeURIComponent(user.uid)}`;
        }

        const resp = await fetch(
          `https://bangalorenow-backend-59317430987.asia-south1.run.app/events${uidParam}`,
          {
            credentials: "include",
            headers: {
              "X-User-FILTER-TAGS": getFilterTagsCookie(),
            },
          }
        );
        const data = await resp.json();
        console.log("📦 API Response:", data);
        const processed = computeIntensities(data);
        console.log("🔥 With Intensity:", processed);
        setReports(processed);
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    }

    fetchAndProcessReports();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          setGeoError("Using Bengaluru as default location");
          setCenter({ lat: 12.9716, lng: 77.5946 });
        }
      );
    } else {
      setGeoError("Geolocation not supported, using Bengaluru center");
      setCenter({ lat: 12.9716, lng: 77.5946 });
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search) return;

    setIsLoading(true);
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          search + ", Bengaluru"
        )}&key=${GOOGLE_MAPS_API_KEY}`,
        {
          credentials: "include",
          headers: {
            "X-User-FILTER-TAGS": getFilterTagsCookie(),
          },
        }
      );
      const data = await resp.json();
      if (data.results?.[0]) {
        setCenter(data.results[0].geometry.location);
        setZoom(15);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Improved heatmap gradient with edge coloring and smooth transitions
  const heatmapGradient = [
    "rgba(0,255,255,0)", // Transparent (edge)
    "rgba(0,255,255,0.4)", // Cyan
    "rgba(0,255,0,0.7)", // Green
    "rgba(255,255,0,0.7)", // Yellow
    "rgba(255,165,0,0.8)", // Orange
    "rgba(255,0,0,1)", // Red (center)
  ];

  const heatmapData =
    window.google && isLoaded
      ? reports.map((r) => ({
          location: new window.google.maps.LatLng(r.lat, r.lon),
          weight: r.intensity,
        }))
      : [];

  const updateVisibleIssues = useCallback(
    (map) => {
      const bounds = map.getBounds();
      if (!bounds) return;
      setVisibleIssues(
        reports.filter((i) =>
          bounds.contains(new window.google.maps.LatLng(i.lat, i.lon))
        )
      );
    },
    [reports]
  );

  const handleMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      setZoom(map.getZoom());
      updateVisibleIssues(map);

      map.addListener("zoom_changed", () => {
        setZoom(map.getZoom());
        updateVisibleIssues(map);
      });

      map.addListener("dragend", () => {
        updateVisibleIssues(map);
      });
    },
    [updateVisibleIssues]
  );

  const handleIssueClick = (issue) => {
    if (mapRef.current && window.google) {
      const scale = Math.pow(2, mapRef.current.getZoom());
      const worldCoordinateCenter = mapRef.current
        .getProjection()
        .fromLatLngToPoint(new window.google.maps.LatLng(issue.lat, issue.lon));

      // Offset in pixels (e.g., move up 100px)
      const pixelOffset = { x: 0, y: 100 / scale };

      const newCenter = mapRef.current
        .getProjection()
        .fromPointToLatLng(
          new window.google.maps.Point(
            worldCoordinateCenter.x,
            worldCoordinateCenter.y - pixelOffset.y
          )
        );

      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(16);
    }

    setSelected(issue);
    setIsListVisible(false);
  };
  function getWindowPayload(bounds) {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const nw = { lat: ne.lat(), lon: sw.lng() };
    const se = { lat: sw.lat(), lon: ne.lng() };
    const centerLat = (ne.lat() + sw.lat()) / 2;
    const centerLon = (ne.lng() + sw.lng()) / 2;
    const geohash = simpleGeohash(centerLat, centerLon);

    return {
      ne: { lat: ne.lat(), lon: ne.lng() },
      sw: { lat: sw.lat(), lon: sw.lng() },
      nw,
      se,
      geohash,
    };
  }

  const handleRefresh = () => {
    async function fetchAndProcessReports() {
      try {
        const user = auth.currentUser;
        let uidParam = "";
        if (user && user.uid) {
          uidParam = `?uid=${encodeURIComponent(user.uid)}`;
        }

        const resp = await fetch(
          `https://bangalorenow-backend-59317430987.asia-south1.run.app/events${uidParam}`,
          {
            credentials: "include",
            headers: {
              "X-User-FILTER-TAGS": getFilterTagsCookie(),
            },
          }
        );
        const data = await resp.json();
        console.log("📦 API Response:", data);
        const processed = computeIntensities(data);
        console.log("🔥 With Intensity:", processed);
        setReports(processed);
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    }
    fetchAndProcessReports();
    if (mapRef.current) {
      updateVisibleIssues(mapRef.current);
    }
  };

  const showIssueList = !selected && isListVisible;
  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-20 px-4 pb-4">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <Card className="bg-black/50 backdrop-blur-sm border border-white/10 mb-6">
            <div className="p-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="Search locations in Bengaluru..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type="text"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </form>
              {geoError && (
                <p className="text-yellow-400 text-sm mt-2">{geoError}</p>
              )}
            </div>
          </Card>

          {/* Map Container */}
          <Card className="bg-black/50 backdrop-blur-sm border border-white/10 overflow-hidden">
            <div className="relative h-[600px] lg:h-[700px]">
              {isLoaded && center ? (
                <>
                  {showIssueList && (
                    <IssueListPanel
                      issues={visibleIssues}
                      onIssueClick={handleIssueClick}
                      isVisible={isListVisible}
                      onToggle={() => setIsListVisible(!isListVisible)}
                    />
                  )}

                  <MapControls
                    onRefresh={handleRefresh}
                    heatmapVisible={heatmapVisible}
                    onToggleHeatmap={() => setHeatmapVisible(!heatmapVisible)}
                  />

                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={zoom}
                    onLoad={handleMapLoad}
                    options={{
                      styles: darkMapStyle,
                      fullscreenControl: false,
                      mapTypeControl: false,
                      streetViewControl: false,
                      clickableIcons: false,
                      backgroundColor: "#000000",
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    {heatmapVisible && (
                      <HeatmapLayer
                        data={heatmapData}
                        options={{
                          radius: Math.max(40, Math.min(80, zoom * 5)),
                          opacity: 0.7,
                          gradient: heatmapGradient,
                          dissipating: true,
                          maxIntensity: Math.max(
                            ...reports.map((r) => r.intensity),
                            10
                          ),
                        }}
                      />
                    )}
                    {reports.map((marker, idx) => (
                      <Marker
                        key={idx}
                        position={{ lat: marker.lat, lng: marker.lon }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          fillColor:
                            marker.severity === "critical"
                              ? "#ef4444"
                              : marker.severity === "high"
                              ? "#f97316"
                              : marker.severity === "medium"
                              ? "#eab308"
                              : "#22c55e",
                          fillOpacity: 0.9,
                          scale: marker.severity === "critical" ? 10 : 8,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                        onClick={() => handleIssueClick(marker)}
                      />
                    ))}

                    {selected && (
                      <InfoWindow
                        position={{ lat: selected.lat, lng: selected.lon }}
                        onCloseClick={() => {
                          setSelected(null);
                          setIsListVisible(true); // re-open the issues panel
                        }}
                        options={{
                          pixelOffset: new window.google.maps.Size(0, -30),
                          maxWidth: 320,
                        }}
                      >
                        <div
                          style={{
                            zIndex: 9999,
                            position: "relative",
                            width: "100%",
                          }}
                        >
                          <Card className="bg-black text-white w-full max-w-xs mx-auto z-30 relative shadow-lg p-3">
                            <img
                              src={selected.image || "/placeholder.svg"}
                              alt={selected.title}
                              className="w-full h-32 sm:h-40 object-cover rounded-lg mb-3"
                            />
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-lg">
                                {selected.title}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  selected.severity === "critical"
                                    ? "bg-red-500/20 text-red-400"
                                    : selected.severity === "high"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : selected.severity === "medium"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {selected.severity}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">
                              {selected.description}
                            </p>
                            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                              <span className="text-green-400">
                                Confidence: {selected.confidence}%
                              </span>
                              <span className="text-blue-400">
                                {selected.sources} sources
                              </span>
                              <span className="text-gray-400">
                                {selected.timestamp}
                              </span>
                            </div>
                          </Card>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
//original day code
// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import Navbar from "../components/Navbar/Navbar";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import {
//   GoogleMap,
//   Marker,
//   InfoWindow,
//   useJsApiLoader,
//   HeatmapLayer,
// } from "@react-google-maps/api";
// import {
//   Search,
//   MapPin,
//   AlertTriangle,
//   TrendingUp,
//   Users,
//   Clock,
//   Eye,
//   EyeOff,
//   Radio,
//   Layers,
//   Target,
//   RefreshCw,
// } from "lucide-react";

// function debounce(fn, delay = 400) {
//   let timer;
//   return (...args) => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(() => fn(...args), delay);
//   };
// }

// function simpleGeohash(lat, lon) {
//   return `${lat.toFixed(3)}:${lon.toFixed(3)}`;
// }

// function getWindowPayload(bounds) {
//   const ne = bounds.getNorthEast();
//   const sw = bounds.getSouthWest();
//   const nw = { lat: ne.lat(), lon: sw.lng() };
//   const se = { lat: sw.lat(), lon: ne.lng() };
//   const centerLat = (ne.lat() + sw.lat()) / 2;
//   const centerLon = (ne.lng() + sw.lng()) / 2;
//   const geohash = simpleGeohash(centerLat, centerLon);

//   return {
//     ne: { lat: ne.lat(), lon: ne.lng() },
//     sw: { lat: sw.lat(), lon: sw.lng() },
//     nw,
//     se,
//     geohash,
//   };
// }

// function computeIntensities(reports) {
//   const toRad = (d) => (d * Math.PI) / 180;
//   const threshold = 2; // 2km

//   return reports.map((report) => {
//     let intensity = 1;
//     const severityMultiplier = {
//       critical: 3,
//       high: 2.5,
//       medium: 1.5,
//       low: 1,
//     };

//     reports.forEach((r) => {
//       if (r === report) return;
//       const R = 6371;
//       const dLat = toRad(r.lat - report.lat);
//       const dLon = toRad(r.lon - report.lon);
//       const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(report.lat)) *
//           Math.cos(toRad(r.lat)) *
//           Math.sin(dLon / 2) ** 2;
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//       const dist = R * c;

//       if (dist <= threshold) {
//         intensity += 0.5 * severityMultiplier[r.severity];
//       }
//     });

//     return {
//       ...report,
//       intensity: intensity * severityMultiplier[report.severity],
//     };
//   });
// }

// const darkMapStyle = [
//   { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
//   { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
//   { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
//   {
//     featureType: "administrative",
//     elementType: "geometry",
//     stylers: [{ color: "#1f2937" }],
//   },
//   {
//     featureType: "poi",
//     elementType: "geometry",
//     stylers: [{ color: "#111827" }],
//   },
//   {
//     featureType: "water",
//     elementType: "geometry",
//     stylers: [{ color: "#1e3a8a" }],
//   },
//   {
//     featureType: "road",
//     elementType: "geometry",
//     stylers: [{ color: "#1f2937" }],
//   },
//   {
//     featureType: "road.highway",
//     elementType: "geometry",
//     stylers: [{ color: "#374151" }],
//   },
//   {
//     featureType: "landscape",
//     elementType: "geometry",
//     stylers: [{ color: "#111827" }],
//   },
// ];

// function IssueListPanel({ issues, onIssueClick, isVisible, onToggle }) {
//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case "critical":
//         return "text-red-400 bg-red-500/20 border-red-500/30";
//       case "high":
//         return "text-orange-400 bg-orange-500/20 border-orange-500/30";
//       case "medium":
//         return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
//       default:
//         return "text-green-400 bg-green-500/20 border-green-500/30";
//     }
//   };

//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case "traffic":
//         return "🚗";
//       case "weather":
//         return "🌧️";
//       case "event":
//         return "📢";
//       case "infrastructure":
//         return "⚡";
//       case "emergency":
//         return "🚨";
//       default:
//         return "📍";
//     }
//   };

//   return (
//     <div className="absolute top-4 left-4 z-20">
//       <Card className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-80 max-w-[90vw]">
//         <div className="p-4">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-bold text-white flex items-center">
//               <Target className="w-5 h-5 mr-2 text-blue-400" />
//               Live Issues
//             </h3>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onToggle}
//               className="text-gray-400 hover:text-white"
//             >
//               {isVisible ? (
//                 <EyeOff className="w-4 h-4" />
//               ) : (
//                 <Eye className="w-4 h-4" />
//               )}
//             </Button>
//           </div>
//           {isVisible && (
//             <div className="max-h-96 overflow-y-auto space-y-3">
//               {issues.length === 0 ? (
//                 <div className="text-center py-8 text-gray-400">
//                   <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
//                   <p className="text-sm">No Issues in current view</p>
//                 </div>
//               ) : (
//                 issues.map((issue, idx) => (
//                   <div
//                     key={issue.title + idx}
//                     className="group cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all duration-200"
//                     onClick={() => onIssueClick(issue)}
//                   >
//                     <div className="flex items-center justify-between mb-2">
//                       <div className="flex items-center">
//                         <span className="text-lg mr-2">
//                           {getCategoryIcon(issue.category)}
//                         </span>
//                         <h4 className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">
//                           {issue.title}
//                         </h4>
//                       </div>
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
//                           issue.severity
//                         )}`}
//                       >
//                         {issue.severity}
//                       </span>
//                     </div>
//                     <p className="text-xs text-gray-300 mb-3 line-clamp-2">
//                       {issue.description}
//                     </p>
//                     <div className="flex items-center justify-between text-xs">
//                       <div className="flex items-center space-x-3">
//                         <span className="text-green-400 flex items-center">
//                           <TrendingUp className="w-3 h-3 mr-1" />
//                           {issue.confidence}%
//                         </span>
//                         <span className="text-blue-400 flex items-center">
//                           <Users className="w-3 h-3 mr-1" />
//                           {issue.sources}
//                         </span>
//                       </div>
//                       <span className="text-gray-400 flex items-center">
//                         <Clock className="w-3 h-3 mr-1" />
//                         {issue.timestamp}
//                       </span>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//       </Card>
//     </div>
//   );
// }

// function MapControls({ onRefresh, heatmapVisible, onToggleHeatmap }) {
//   return (
//     <div className="absolute top-4 right-4 z-20 space-y-2 hidden md:block">
//       <Card className="bg-black/80 backdrop-blur-xl border border-white/10">
//         <div className="p-2 space-y-2">
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={onRefresh}
//             className="w-full text-white hover:bg-white/10"
//           >
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Refresh
//           </Button>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={onToggleHeatmap}
//             className={`w-full ${
//               heatmapVisible ? "text-blue-400 bg-blue-500/20" : "text-white"
//             } hover:bg-white/10`}
//           >
//             <Layers className="w-4 h-4 mr-2" />
//             Heatmap
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// }

// const containerStyle = {
//   width: "100%",
//   height: "100%",
// };

// // Default Bengaluru bounds if geolocation fails
// const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };
// const DEFAULT_ZOOM = 12;
// const DEFAULT_BOUNDS = {
//   north: 13.1,
//   south: 12.85,
//   east: 77.7,
//   west: 77.52,
// };

// export default function HomePage() {
//   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
//   const { isLoaded } = useJsApiLoader({
//     googleMapsApiKey: GOOGLE_MAPS_API_KEY,
//     libraries: ["visualization"],
//   });

//   const [search, setSearch] = useState("");
//   const [center, setCenter] = useState(null);
//   const [geoError, setGeoError] = useState("");
//   const [reports, setReports] = useState([]);
//   const [selected, setSelected] = useState(null);
//   const [zoom, setZoom] = useState(DEFAULT_ZOOM);
//   const [visibleIssues, setVisibleIssues] = useState([]);
//   const [isListVisible, setIsListVisible] = useState(true);
//   const [heatmapVisible, setHeatmapVisible] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);
//   const mapRef = useRef(null);

//   // Debounced version of updateVisibleIssues
//   const debouncedUpdateVisibleIssues = useRef();

//   // Fetch reports for map window (send window payload even for first fetch)
//   const fetchReportsForWindow = useCallback(async (bounds) => {
//     if (!bounds) return;
//     const windowQuery = getWindowPayload(bounds);
//     console.log("🗺️ Window Query (sent to backend):", windowQuery);
//     try {
//       const resp = await fetch("http://localhost:4000/api/reports/window", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(windowQuery),
//       });
//       const data = await resp.json();
//       console.log("📦 API Response:", data);
//       const processed = computeIntensities(data);
//       setReports(processed);
//       // filter visible issues immediately
//       setVisibleIssues(
//         processed.filter((i) =>
//           bounds.contains(new window.google.maps.LatLng(i.lat, i.lon))
//         )
//       );
//     } catch (err) {
//       console.error("Error fetching reports:", err);
//     }
//   }, []);

//   // On initial load get user position or use default, and fetch by window
//   useEffect(() => {
//     if (!isLoaded) return;
//     // Step 1: Set center (from geolocation or default)
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) =>
//           setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//         () => {
//           setGeoError("Using Bengaluru as default location");
//           setCenter(DEFAULT_CENTER);
//         }
//       );
//     } else {
//       setGeoError("Geolocation not supported, using Bengaluru center");
//       setCenter(DEFAULT_CENTER);
//     }
//   }, [isLoaded]);

//   // Step 2: When map has loaded and center is set, fetch window once
//   useEffect(() => {
//     if (!isLoaded || !center) return;
//     // Wait for mapRef to be set and bounds available
//     const interval = setInterval(() => {
//       let bounds;
//       if (mapRef.current && mapRef.current.getBounds()) {
//         bounds = mapRef.current.getBounds();
//       } else if (center) {
//         // If bounds not available, use default bounds around center
//         bounds = {
//           getNorthEast: () => ({
//             lat: () => DEFAULT_BOUNDS.north,
//             lng: () => DEFAULT_BOUNDS.east,
//           }),
//           getSouthWest: () => ({
//             lat: () => DEFAULT_BOUNDS.south,
//             lng: () => DEFAULT_BOUNDS.west,
//           }),
//           contains: (latLng) => {
//             const lat = latLng.lat();
//             const lng = latLng.lng();
//             return (
//               lat >= DEFAULT_BOUNDS.south &&
//               lat <= DEFAULT_BOUNDS.north &&
//               lng >= DEFAULT_BOUNDS.west &&
//               lng <= DEFAULT_BOUNDS.east
//             );
//           },
//         };
//       }
//       if (bounds) {
//         fetchReportsForWindow(bounds);
//         clearInterval(interval);
//       }
//     }, 100);
//     return () => clearInterval(interval);
//   }, [isLoaded, center, fetchReportsForWindow]);

//   // Debounced client-side update of visible issues on drag/zoom
//   debouncedUpdateVisibleIssues.current = debounce((map) => {
//     const bounds = map.getBounds();
//     if (!bounds) return;
//     const windowQuery = getWindowPayload(bounds);
//     console.log("🗺️ Window Query (client-side only):", windowQuery);
//     setVisibleIssues(
//       reports.filter((i) =>
//         bounds.contains(new window.google.maps.LatLng(i.lat, i.lon))
//       )
//     );
//   }, 400);

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     if (!search) return;

//     setIsLoading(true);
//     try {
//       const resp = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//           search + ", Bengaluru"
//         )}&key=${GOOGLE_MAPS_API_KEY}`
//       );
//       const data = await resp.json();
//       if (data.results?.[0]) {
//         setCenter(data.results[0].geometry.location);
//         setZoom(15);
//       }
//     } catch (err) {
//       console.error("Search error:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const heatmapData =
//     window.google && isLoaded
//       ? reports.map((r) => ({
//           location: new window.google.maps.LatLng(r.lat, r.lon),
//           weight: r.intensity,
//         }))
//       : [];

//   const heatmapGradient = [
//     "rgba(0,0,0,0)",
//     "rgba(59,130,246,0.3)",
//     "rgba(59,130,246,0.6)",
//     "rgba(147,51,234,0.7)",
//     "rgba(239,68,68,0.8)",
//     "rgba(255,255,255,0.9)",
//   ];

//   const handleMapLoad = useCallback((map) => {
//     mapRef.current = map;
//     setZoom(map.getZoom());
//     debouncedUpdateVisibleIssues.current(map);

//     map.addListener("zoom_changed", () => {
//       setZoom(map.getZoom());
//       debouncedUpdateVisibleIssues.current(map);
//     });

//     map.addListener("dragend", () => {
//       debouncedUpdateVisibleIssues.current(map);
//     });
//   }, []);

//   const handleIssueClick = (issue) => {
//     if (mapRef.current) {
//       mapRef.current.panTo({ lat: issue.lat, lng: issue.lon });
//       mapRef.current.setZoom(16);
//     }
//     setSelected(issue);
//     setIsListVisible(false);
//   };

//   const handleRefresh = () => {
//     if (mapRef.current && mapRef.current.getBounds()) {
//       fetchReportsForWindow(mapRef.current.getBounds());
//       debouncedUpdateVisibleIssues.current(mapRef.current);
//     }
//   };

//   const showIssueList = !selected && isListVisible;
//   return (
//     <div className="min-h-screen bg-black">
//       <Navbar />

//       <div className="pt-20 px-4 pb-4">
//         <div className="max-w-7xl mx-auto">
//           {/* Search Bar */}
//           <Card className="bg-black/50 backdrop-blur-sm border border-white/10 mb-6">
//             <div className="p-4">
//               <form onSubmit={handleSearch} className="flex gap-4">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                   <input
//                     className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
//                     placeholder="Search locations in Bengaluru..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     type="text"
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   disabled={isLoading}
//                   className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
//                 >
//                   {isLoading ? (
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     "Search"
//                   )}
//                 </Button>
//               </form>
//               {geoError && (
//                 <p className="text-yellow-400 text-sm mt-2">{geoError}</p>
//               )}
//             </div>
//           </Card>

//           {/* Map Container */}
//           <Card className="bg-black/50 backdrop-blur-sm border border-white/10 overflow-hidden">
//             <div className="relative h-[600px] lg:h-[700px]">
//               {isLoaded && center ? (
//                 <>
//                   {showIssueList && (
//                     <IssueListPanel
//                       issues={visibleIssues}
//                       onIssueClick={handleIssueClick}
//                       isVisible={isListVisible}
//                       onToggle={() => setIsListVisible(!isListVisible)}
//                     />
//                   )}

//                   <MapControls
//                     onRefresh={handleRefresh}
//                     heatmapVisible={heatmapVisible}
//                     onToggleHeatmap={() => setHeatmapVisible(!heatmapVisible)}
//                   />

//                   <GoogleMap
//                     mapContainerStyle={containerStyle}
//                     center={center}
//                     zoom={zoom}
//                     onLoad={handleMapLoad}
//                     options={{
//                       styles: darkMapStyle,
//                       fullscreenControl: false,
//                       mapTypeControl: false,
//                       streetViewControl: false,
//                       clickableIcons: false,
//                       backgroundColor: "#000000",
//                       disableDefaultUI: true,
//                       zoomControl: true,
//                     }}
//                   >
//                     {heatmapVisible && (
//                       <HeatmapLayer
//                         data={heatmapData}
//                         options={{
//                           radius: Math.max(20, Math.min(50, zoom * 2)),
//                           opacity: 0.7,
//                           gradient: heatmapGradient,
//                         }}
//                       />
//                     )}
//                     {reports.map((marker, idx) => (
//                       <Marker
//                         key={idx}
//                         position={{ lat: marker.lat, lng: marker.lon }}
//                         icon={{
//                           path: window.google.maps.SymbolPath.CIRCLE,
//                           fillColor:
//                             marker.severity === "critical"
//                               ? "#ef4444"
//                               : marker.severity === "high"
//                               ? "#f97316"
//                               : marker.severity === "medium"
//                               ? "#eab308"
//                               : "#22c55e",
//                           fillOpacity: 0.9,
//                           scale: marker.severity === "critical" ? 10 : 8,
//                           strokeColor: "#ffffff",
//                           strokeWeight: 2,
//                         }}
//                         onClick={() => handleIssueClick(marker)}
//                       />
//                     ))}

//                     {selected && (
//                       <InfoWindow
//                         position={{ lat: selected.lat, lng: selected.lon }}
//                         onCloseClick={() => {
//                           setSelected(null);
//                           setIsListVisible(true); // re-open the issues panel
//                         }}
//                         options={{
//                           pixelOffset: new window.google.maps.Size(0, -30),
//                         }}
//                       >
//                         <div style={{ zIndex: 9999, position: "relative" }}>
//                           <Card className="bg-black border border-white/20 text-white w-72 z-30 relative">
//                             <div className="p-4">
//                               <img
//                                 src={selected.image || "/placeholder.svg"}
//                                 alt={selected.title}
//                                 className="w-full h-32 object-cover rounded-lg mb-3"
//                               />
//                               <div className="flex items-center justify-between mb-2">
//                                 <h3 className="font-bold text-lg">
//                                   {selected.title}
//                                 </h3>
//                                 <span
//                                   className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                     selected.severity === "critical"
//                                       ? "bg-red-500/20 text-red-400"
//                                       : selected.severity === "high"
//                                       ? "bg-orange-500/20 text-orange-400"
//                                       : selected.severity === "medium"
//                                       ? "bg-yellow-500/20 text-yellow-400"
//                                       : "bg-green-500/20 text-green-400"
//                                   }`}
//                                 >
//                                   {selected.severity}
//                                 </span>
//                               </div>
//                               <p className="text-gray-300 text-sm mb-3">
//                                 {selected.description}
//                               </p>
//                               <div className="flex items-center justify-between text-xs">
//                                 <span className="text-green-400">
//                                   Confidence: {selected.confidence}%
//                                 </span>
//                                 <span className="text-blue-400">
//                                   {selected.sources} sources
//                                 </span>
//                                 <span className="text-gray-400">
//                                   {selected.timestamp}
//                                 </span>
//                               </div>
//                             </div>
//                           </Card>
//                         </div>
//                       </InfoWindow>
//                     )}
//                   </GoogleMap>
//                 </>
//               ) : (
//                 <div className="flex items-center justify-center h-full">
//                   <div className="text-center">
//                     <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
//                     <p className="text-gray-400">Loading map...</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import Navbar from "../components/Navbar/Navbar";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import {
//   GoogleMap,
//   Marker,
//   InfoWindow,
//   useJsApiLoader,
//   HeatmapLayer,
// } from "@react-google-maps/api";
// import {
//   Search,
//   MapPin,
//   AlertTriangle,
//   TrendingUp,
//   Users,
//   Clock,
//   Eye,
//   EyeOff,
//   Radio,
//   Layers,
//   Target,
//   RefreshCw,
// } from "lucide-react";
// import { getAuth } from "firebase/auth";

// // --- FAKE_REPORTS DATA ---
// const FAKE_REPORTS = [
//   {
//     title: "Heavy Traffic on Hosur Road",
//     description:
//       "Traffic jam between Silk Board and Electronic City. Avoid route.",
//     category: "traffic",
//     severity: "high",
//     lat: 12.9121,
//     lon: 77.6226,
//     confidence: 87,
//     sources: 5,
//     timestamp: "3 min ago",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ugGMKQnSqsT8PXv7VGZHmOhgDjyUsuGf9czcSknEtPNaziZlQw0awBAJzcRhljaEBo4&usqp=CAU",
//   },
//   {
//     title: "Flooded Street at Koramangala 4th Block",
//     description: "Heavy rainfall has caused waterlogging near Forum Mall.",
//     category: "weather",
//     severity: "medium",
//     lat: 12.934533,
//     lon: 77.615673,
//     confidence: 65,
//     sources: 3,
//     timestamp: "10 min ago",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ugGMKQnSqsT8PXv7VGZHmOhgDjyUsuGf9czcSknEtPNaziZlQw0awBAJzcRhljaEBo4&usqp=CAU",
//   },
//   {
//     title: "Power Outage in Indiranagar",
//     description: "Scheduled maintenance, power expected to resume by 2 PM.",
//     category: "infrastructure",
//     severity: "low",
//     lat: 12.971891,
//     lon: 77.641151,
//     confidence: 92,
//     sources: 2,
//     timestamp: "5 min ago",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ugGMKQnSqsT8PXv7VGZHmOhgDjyUsuGf9czcSknEtPNaziZlQw0awBAJzcRhljaEBo4&usqp=CAU",
//   },
//   {
//     title: "Metro Delay at MG Road Station",
//     description: "Technical issue, trains delayed by 20 min.",
//     category: "infrastructure",
//     severity: "medium",
//     lat: 12.9751,
//     lon: 77.6036,
//     confidence: 75,
//     sources: 4,
//     timestamp: "15 min ago",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ugGMKQnSqsT8PXv7VGZHmOhgDjyUsuGf9czcSknEtPNaziZlQw0awBAJzcRhljaEBo4&usqp=CAU",
//   },
//   {
//     title: "Accident on Outer Ring Road",
//     description:
//       "Multi-vehicle collision near Marathahalli. Emergency services on site.",
//     category: "emergency",
//     severity: "critical",
//     lat: 12.9561,
//     lon: 77.7019,
//     confidence: 80,
//     sources: 6,
//     timestamp: "8 min ago",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ugGMKQnSqsT8PXv7VGZHmOhgDjyUsuGf9czcSknEtPNaziZlQw0awBAJzcRhljaEBo4&usqp=CAU",
//   },
//   {
//     title: "Event: Farmers Market at Lalbagh",
//     description: "Local farmers market open till 7 PM.",
//     category: "event",
//     severity: "low",
//     lat: 12.9507,
//     lon: 77.5848,
//     confidence: 99,
//     sources: 1,
//     timestamp: "Now",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ugGMKQnSqsT8PXv7VGZHmOhgDjyUsuGf9czcSknEtPNaziZlQw0awBAJzcRhljaEBo4&usqp=CAU",
//   },
//   {
//     title: "Roadwork at Bannerghatta Road",
//     description: "Lane closed for repairs near Meenakshi Mall.",
//     category: "infrastructure",
//     severity: "medium",
//     lat: 12.891,
//     lon: 77.603,
//     confidence: 70,
//     sources: 2,
//     timestamp: "12 min ago",
//     image: "",
//   },
//   {
//     title: "Rain Alert: Richmond Town",
//     description: "Rain expected in next 30 minutes. Drive carefully.",
//     category: "weather",
//     severity: "low",
//     lat: 12.9634,
//     lon: 77.5971,
//     confidence: 60,
//     sources: 1,
//     timestamp: "6 min ago",
//     image: "",
//   },
//   {
//     title: "Fire Alert in Whitefield",
//     description: "Small fire at ITPL campus, fire brigade on site.",
//     category: "emergency",
//     severity: "high",
//     lat: 12.9877,
//     lon: 77.7287,
//     confidence: 85,
//     sources: 7,
//     timestamp: "4 min ago",
//     image: "",
//   },
//   {
//     title: "Traffic Update: Yeshwanthpur",
//     description: "Traffic slow due to market crowd. Alternate route advised.",
//     category: "traffic",
//     severity: "medium",
//     lat: 13.0285,
//     lon: 77.5552,
//     confidence: 68,
//     sources: 3,
//     timestamp: "9 min ago",
//     image: "",
//   },
// ];

// // --- UTILITY FUNCTIONS ---
// function getCookies() {
//   return Object.fromEntries(
//     document.cookie
//       .split("; ")
//       .map((c) => c.split("="))
//       .map(([k, v]) => [k, decodeURIComponent(v)])
//   );
// }

// function setFilterTagsCookie(tags, days = 30) {
//   const expires = new Date(Date.now() + days * 864e5).toUTCString();
//   document.cookie = `FILTER_TAGS=${encodeURIComponent(
//     JSON.stringify(tags)
//   )}; expires=${expires}; path=/; Secure; SameSite=Strict`;
// }

// function getFilterTagsCookie() {
//   const cookies = getCookies();
//   return cookies.FILTER_TAGS || "[]";
// }

// function computeIntensities(reports) {
//   const toRad = (d) => (d * Math.PI) / 180;
//   const threshold = 2;
//   return reports.map((report) => {
//     let intensity = 1;
//     const severityMultiplier = {
//       critical: 3,
//       high: 2.5,
//       medium: 1.5,
//       low: 1,
//     };
//     reports.forEach((r) => {
//       if (r === report) return;
//       const R = 6371;
//       const dLat = toRad(r.lat - report.lat);
//       const dLon = toRad(r.lon - report.lon);
//       const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(report.lat)) *
//           Math.cos(toRad(r.lat)) *
//           Math.sin(dLon / 2) ** 2;
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//       const dist = R * c;
//       if (dist <= threshold) {
//         intensity += 0.5 * severityMultiplier[r.severity];
//       }
//     });
//     return {
//       ...report,
//       intensity: intensity * severityMultiplier[report.severity],
//     };
//   });
// }

// const darkMapStyle = [
//   { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
//   { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
//   { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
//   {
//     featureType: "administrative",
//     elementType: "geometry",
//     stylers: [{ color: "#1f2937" }],
//   },
//   {
//     featureType: "poi",
//     elementType: "geometry",
//     stylers: [{ color: "#111827" }],
//   },
//   {
//     featureType: "water",
//     elementType: "geometry",
//     stylers: [{ color: "#1e3a8a" }],
//   },
//   {
//     featureType: "road",
//     elementType: "geometry",
//     stylers: [{ color: "#1f2937" }],
//   },
//   {
//     featureType: "road.highway",
//     elementType: "geometry",
//     stylers: [{ color: "#374151" }],
//   },
//   {
//     featureType: "landscape",
//     elementType: "geometry",
//     stylers: [{ color: "#111827" }],
//   },
// ];

// function IssueListPanel({ issues, onIssueClick, isVisible, onToggle }) {
//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case "critical":
//         return "text-red-400 bg-red-500/20 border-red-500/30";
//       case "high":
//         return "text-orange-400 bg-orange-500/20 border-orange-500/30";
//       case "medium":
//         return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
//       default:
//         return "text-green-400 bg-green-500/20 border-green-500/30";
//     }
//   };

//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case "traffic":
//         return "🚗";
//       case "weather":
//         return "🌧️";
//       case "event":
//         return "📢";
//       case "infrastructure":
//         return "⚡";
//       case "emergency":
//         return "🚨";
//       default:
//         return "📍";
//     }
//   };

//   return (
//     <div className="absolute top-4 left-4 z-20">
//       <Card className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-80 max-w-[90vw]">
//         <div className="p-4">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-bold text-white flex items-center">
//               <Target className="w-5 h-5 mr-2 text-blue-400" />
//               Live Issues
//             </h3>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onToggle}
//               className="text-gray-400 hover:text-white"
//             >
//               {isVisible ? (
//                 <EyeOff className="w-4 h-4" />
//               ) : (
//                 <Eye className="w-4 h-4" />
//               )}
//             </Button>
//           </div>

//           {isVisible && (
//             <div className="max-h-96 overflow-y-auto space-y-3">
//               {issues.length === 0 ? (
//                 <div className="text-center py-8 text-gray-400">
//                   <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
//                   <p className="text-sm">No Issues in current view</p>
//                 </div>
//               ) : (
//                 issues.map((issue, idx) => (
//                   <div
//                     key={issue.title + idx}
//                     className="group cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all duration-200"
//                     onClick={() => onIssueClick(issue)}
//                   >
//                     <div className="flex items-start justify-between mb-2">
//                       <div className="flex items-center">
//                         <span className="text-lg mr-2">
//                           {getCategoryIcon(issue.category)}
//                         </span>
//                         <h4 className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">
//                           {issue.title}
//                         </h4>
//                       </div>
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
//                           issue.severity
//                         )}`}
//                       >
//                         {issue.severity}
//                       </span>
//                     </div>

//                     <p className="text-xs text-gray-300 mb-3 line-clamp-2">
//                       {issue.description}
//                     </p>

//                     <div className="flex items-center justify-between text-xs">
//                       <div className="flex items-center space-x-3">
//                         <span className="text-green-400 flex items-center">
//                           <TrendingUp className="w-3 h-3 mr-1" />
//                           {issue.confidence}%
//                         </span>
//                         <span className="text-blue-400 flex items-center">
//                           <Users className="w-3 h-3 mr-1" />
//                           {issue.sources}
//                         </span>
//                       </div>
//                       <span className="text-gray-400 flex items-center">
//                         <Clock className="w-3 h-3 mr-1" />
//                         {issue.timestamp}
//                       </span>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//       </Card>
//     </div>
//   );
// }

// function MapControls({ onRefresh, heatmapVisible, onToggleHeatmap }) {
//   return (
//     <div className="absolute top-4 right-4 z-20 space-y-2 hidden md:block">
//       <Card className="bg-black/80 backdrop-blur-xl border border-white/10">
//         <div className="p-2 space-y-2">
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={onRefresh}
//             className="w-full text-white hover:bg-white/10"
//           >
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Refresh
//           </Button>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={onToggleHeatmap}
//             className={`w-full ${
//               heatmapVisible ? "text-blue-400 bg-blue-500/20" : "text-white"
//             } hover:bg-white/10`}
//           >
//             <Layers className="w-4 h-4 mr-2" />
//             Heatmap
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// }

// const containerStyle = {
//   width: "100%",
//   height: "100%",
// };

// export default function HomePage() {
//   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
//   const { isLoaded } = useJsApiLoader({
//     googleMapsApiKey: GOOGLE_MAPS_API_KEY,
//     libraries: ["visualization"],
//   });

//   const [search, setSearch] = useState("");
//   const [center, setCenter] = useState(null);
//   const [geoError, setGeoError] = useState("");
//   const [reports, setReports] = useState([]);
//   const [selected, setSelected] = useState(null);
//   const [zoom, setZoom] = useState(12);
//   const [visibleIssues, setVisibleIssues] = useState([]);
//   const [isListVisible, setIsListVisible] = useState(true);
//   const [heatmapVisible, setHeatmapVisible] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);
//   const mapRef = useRef(null);

//   // Firebase Auth instance
//   const auth = getAuth();

//   useEffect(() => {
//     // Always set fake reports, even if filter tags cookie is not present
//     const processed = computeIntensities(FAKE_REPORTS);
//     setReports(processed);

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) =>
//           setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//         () => {
//           setGeoError("Using Bengaluru as default location");
//           setCenter({ lat: 12.9716, lng: 77.5946 });
//         }
//       );
//     } else {
//       setGeoError("Geolocation not supported, using Bengaluru center");
//       setCenter({ lat: 12.9716, lng: 77.5946 });
//     }
//   }, []);

//   const heatmapGradient = [
//     "rgba(0,255,255,0)",
//     "rgba(0,255,255,0.4)",
//     "rgba(0,255,0,0.7)",
//     "rgba(255,255,0,0.7)",
//     "rgba(255,165,0,0.8)",
//     "rgba(255,0,0,1)",
//   ];

//   const heatmapData =
//     window.google && isLoaded
//       ? reports.map((r) => ({
//           location: new window.google.maps.LatLng(r.lat, r.lon),
//           weight: r.intensity,
//         }))
//       : [];

//   const updateVisibleIssues = useCallback(
//     (map) => {
//       const bounds = map.getBounds();
//       if (!bounds) return;
//       setVisibleIssues(
//         reports.filter((i) =>
//           bounds.contains(new window.google.maps.LatLng(i.lat, i.lon))
//         )
//       );
//     },
//     [reports]
//   );

//   const handleMapLoad = useCallback(
//     (map) => {
//       mapRef.current = map;
//       setZoom(map.getZoom());
//       updateVisibleIssues(map);

//       map.addListener("zoom_changed", () => {
//         setZoom(map.getZoom());
//         updateVisibleIssues(map);
//       });

//       map.addListener("dragend", () => {
//         updateVisibleIssues(map);
//       });
//     },
//     [updateVisibleIssues]
//   );

//   const handleIssueClick = (issue) => {
//     if (mapRef.current && window.google) {
//       const scale = Math.pow(2, mapRef.current.getZoom());
//       const worldCoordinateCenter = mapRef.current
//         .getProjection()
//         .fromLatLngToPoint(new window.google.maps.LatLng(issue.lat, issue.lon));

//       // Offset in pixels (e.g., move up 100px)
//       const pixelOffset = { x: 0, y: 100 / scale };

//       const newCenter = mapRef.current
//         .getProjection()
//         .fromPointToLatLng(
//           new window.google.maps.Point(
//             worldCoordinateCenter.x,
//             worldCoordinateCenter.y - pixelOffset.y
//           )
//         );

//       mapRef.current.panTo(newCenter);
//       mapRef.current.setZoom(16);
//     }

//     setSelected(issue);
//     setIsListVisible(false);
//   };

//   const handleRefresh = () => {
//     // Just re-apply fake data on refresh
//     const processed = computeIntensities(FAKE_REPORTS);
//     setReports(processed);
//     if (mapRef.current) {
//       updateVisibleIssues(mapRef.current);
//     }
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     if (!search) return;
//     setIsLoading(true);
//     try {
//       const resp = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//           search + ", Bengaluru"
//         )}&key=${GOOGLE_MAPS_API_KEY}`,
//         {
//           credentials: "include",
//           headers: {
//             "X-User-FILTER-TAGS": getFilterTagsCookie(),
//           },
//         }
//       );
//       const data = await resp.json();
//       if (data.results?.[0]) {
//         setCenter(data.results[0].geometry.location);
//         setZoom(15);
//       }
//     } catch (err) {
//       console.error("Search error:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const showIssueList = !selected && isListVisible;

//   return (
//     <div className="min-h-screen bg-black">
//       <Navbar />

//       <div className="pt-20 px-4 pb-4">
//         <div className="max-w-7xl mx-auto">
//           {/* Search Bar */}
//           <Card className="bg-black/50 backdrop-blur-sm border border-white/10 mb-6">
//             <div className="p-4">
//               <form onSubmit={handleSearch} className="flex gap-4">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                   <input
//                     className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
//                     placeholder="Search locations in Bengaluru..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     type="text"
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   disabled={isLoading}
//                   className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
//                 >
//                   {isLoading ? (
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     "Search"
//                   )}
//                 </Button>
//               </form>
//               {geoError && (
//                 <p className="text-yellow-400 text-sm mt-2">{geoError}</p>
//               )}
//             </div>
//           </Card>

//           {/* Map Container */}
//           <Card className="bg-black/50 backdrop-blur-sm border border-white/10 overflow-hidden">
//             <div className="relative h-[600px] lg:h-[700px]">
//               {isLoaded && center ? (
//                 <>
//                   {showIssueList && (
//                     <IssueListPanel
//                       issues={visibleIssues}
//                       onIssueClick={handleIssueClick}
//                       isVisible={isListVisible}
//                       onToggle={() => setIsListVisible(!isListVisible)}
//                     />
//                   )}

//                   <MapControls
//                     onRefresh={handleRefresh}
//                     heatmapVisible={heatmapVisible}
//                     onToggleHeatmap={() => setHeatmapVisible(!heatmapVisible)}
//                   />

//                   <GoogleMap
//                     mapContainerStyle={containerStyle}
//                     center={center}
//                     zoom={zoom}
//                     onLoad={handleMapLoad}
//                     options={{
//                       styles: darkMapStyle,
//                       fullscreenControl: false,
//                       mapTypeControl: false,
//                       streetViewControl: false,
//                       clickableIcons: false,
//                       backgroundColor: "#000000",
//                       disableDefaultUI: true,
//                       zoomControl: true,
//                     }}
//                   >
//                     {heatmapVisible && (
//                       <HeatmapLayer
//                         data={heatmapData}
//                         options={{
//                           radius: Math.max(40, Math.min(80, zoom * 5)),
//                           opacity: 0.7,
//                           gradient: heatmapGradient,
//                           dissipating: true,
//                           maxIntensity: Math.max(
//                             ...reports.map((r) => r.intensity),
//                             10
//                           ),
//                         }}
//                       />
//                     )}
//                     {reports.map((marker, idx) => (
//                       <Marker
//                         key={idx}
//                         position={{ lat: marker.lat, lng: marker.lon }}
//                         icon={{
//                           path: window.google.maps.SymbolPath.CIRCLE,
//                           fillColor:
//                             marker.severity === "critical"
//                               ? "#ef4444"
//                               : marker.severity === "high"
//                               ? "#f97316"
//                               : marker.severity === "medium"
//                               ? "#eab308"
//                               : "#22c55e",
//                           fillOpacity: 0.9,
//                           scale: marker.severity === "critical" ? 10 : 8,
//                           strokeColor: "#ffffff",
//                           strokeWeight: 2,
//                         }}
//                         onClick={() => handleIssueClick(marker)}
//                       />
//                     ))}

//                     {selected && (
//                       <InfoWindow
//                         position={{ lat: selected.lat, lng: selected.lon }}
//                         onCloseClick={() => {
//                           setSelected(null);
//                           setIsListVisible(true); // re-open the issues panel
//                         }}
//                         options={{
//                           pixelOffset: new window.google.maps.Size(0, -30),
//                           maxWidth: 320,
//                         }}
//                       >
//                         <div
//                           style={{
//                             zIndex: 9999,
//                             position: "relative",
//                             width: "100%",
//                           }}
//                         >
//                           <Card className="bg-black text-white w-full max-w-xs mx-auto z-30 relative shadow-lg p-3">
//                             <img
//                               src={selected.image || "/placeholder.svg"}
//                               alt={selected.title}
//                               className="w-full h-32 sm:h-40 object-cover rounded-lg mb-3"
//                             />
//                             <div className="flex items-center justify-between mb-2">
//                               <h3 className="font-bold text-lg">
//                                 {selected.title}
//                               </h3>
//                               <span
//                                 className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                   selected.severity === "critical"
//                                     ? "bg-red-500/20 text-red-400"
//                                     : selected.severity === "high"
//                                     ? "bg-orange-500/20 text-orange-400"
//                                     : selected.severity === "medium"
//                                     ? "bg-yellow-500/20 text-yellow-400"
//                                     : "bg-green-500/20 text-green-400"
//                                 }`}
//                               >
//                                 {selected.severity}
//                               </span>
//                             </div>
//                             <p className="text-gray-300 text-sm mb-3">
//                               {selected.description}
//                             </p>
//                             <div className="flex flex-wrap items-center justify-between text-xs gap-2">
//                               <span className="text-green-400">
//                                 Confidence: {selected.confidence}%
//                               </span>
//                               <span className="text-blue-400">
//                                 {selected.sources} sources
//                               </span>
//                               <span className="text-gray-400">
//                                 {selected.timestamp}
//                               </span>
//                             </div>
//                           </Card>
//                         </div>
//                       </InfoWindow>
//                     )}
//                   </GoogleMap>
//                 </>
//               ) : (
//                 <div className="flex items-center justify-center h-full">
//                   <div className="text-center">
//                     <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
//                     <p className="text-gray-400">Loading map...</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
