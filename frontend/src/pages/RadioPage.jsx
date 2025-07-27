"use client";

import { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  MapPin,
  AlertTriangle,
  Bell,
  Shield,
  Navigation,
  Clock,
  X,
} from "lucide-react";

// <--- PUT YOUR GOOGLE API KEY BELOW!
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const fallbackLocation = {
  area: "Koramangala",
  coordinates: { lat: 12.9352, lng: 77.6245 },
  radius: 2,
};

const alerts = [
  {
    id: 1,
    type: "traffic",
    severity: "high",
    title: "Heavy Traffic Alert",
    message:
      "Major congestion on Outer Ring Road near Silk Board Junction. Expected delay: 25-30 minutes.",
    location: "Silk Board Junction",
    distance: "1.2 km",
    // timestamp: "2 min ago",
    active: true,
    coordinates: { lat: 12.9716, lng: 77.5946 },
  },
  {
    id: 2,
    type: "weather",
    severity: "medium",
    title: "Weather Alert",
    message:
      "Heavy rainfall expected in your area. Carry umbrella and avoid low-lying areas.",
    location: "Koramangala",
    distance: "0.5 km",
    // timestamp: "5 min ago",
    active: true,
    coordinates: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: 3,
    type: "emergency",
    severity: "critical",
    title: "Emergency Services",
    message:
      "Ambulance and fire services responding to incident. Avoid 5th Block main road.",
    location: "Koramangala 5th Block",
    distance: "0.8 km",
    // timestamp: "8 min ago",
    active: false,
    coordinates: { lat: 12.9341, lng: 77.6269 },
  },
];

const currentTrack = {
  title: "Midnight City",
  artist: "M83",
  album: "Hurry Up, We're Dreaming",
  duration: "4:03",
  currentTime: "2:15",
};

export default function RadioPage() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  // No need for progress anymore
  // const [progress, setProgress] = useState(55);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [alertHistory, setAlertHistory] = useState(alerts);

  const [userLocation, setUserLocation] = useState(fallbackLocation);
  const [locationStatus, setLocationStatus] = useState("Detecting location…");

  // Request browser location ON LOAD
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(fallbackLocation);
      setLocationStatus("Location not supported. Showing Koramangala.");
      return;
    }
    setLocationStatus("Detecting location…");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        try {
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_MAPS_KEY}`
          );
          const data = await resp.json();
          let areaName = "";
          if (data.results && data.results.length > 0) {
            const preferredTypes = [
              "sublocality_level_1",
              "sublocality",
              "neighborhood",
              "locality",
            ];
            for (const result of data.results) {
              for (const part of result.address_components) {
                if (part.types.some((type) => preferredTypes.includes(type))) {
                  areaName = part.long_name;
                  break;
                }
              }
              if (areaName) break;
            }
          }
          setUserLocation({
            area: areaName || fallbackLocation.area,
            coordinates: coords,
            radius: 2,
          });
          setLocationStatus("");
        } catch (e) {
          setUserLocation({ ...fallbackLocation, coordinates: coords });
          setLocationStatus("Could not get address, using fallback.");
        }
      },
      (err) => {
        setUserLocation(fallbackLocation);
        setLocationStatus("Permission denied. Showing Koramangala.");
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (alertsEnabled && playing) {
      const interval = setInterval(() => {
        const activeAlerts = alertHistory.filter((alert) => alert.active);
        if (activeAlerts.length > 0 && Math.random() > 0.7) {
          const randomAlert =
            activeAlerts[Math.floor(Math.random() * activeAlerts.length)];
          setActiveAlert(randomAlert);
          if (randomAlert.severity === "critical") setPlaying(false);
        }
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [alertsEnabled, playing, alertHistory]);

  // Remove progress update effect

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };
  const dismissAlert = () => {
    setActiveAlert(null);
    if (playing) handlePlay();
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "traffic":
        return "🚗";
      case "weather":
        return "🌧️";
      case "emergency":
        return "🚨";
      case "infrastructure":
        return "⚡";
      default:
        return "📢";
    }
  };
  const getAlertColor = (severity) => {
    switch (severity) {
      case "critical":
        return "from-red-500 to-red-600";
      case "high":
        return "from-orange-500 to-orange-600";
      case "medium":
        return "from-yellow-500 to-yellow-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };
  const EqualizerBars = () => (
    <div className="flex items-end space-x-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-gradient-to-t from-blue-500 to-purple-400 rounded-full transition-all duration-300 ${
            playing && !activeAlert ? "animate-pulse" : ""
          }`}
          style={{
            height:
              playing && !activeAlert ? `${Math.random() * 100 + 20}%` : "20%",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-20 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Location UI */}
          <div className="flex flex-col items-center mb-2 gap-2">
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-blue-900 text-blue-200 px-4 py-2 font-semibold">
                <MapPin className="w-4 h-4 mr-2 inline" />
                {userLocation.area}
              </Badge>
              <Badge className="bg-gray-900 text-gray-200 px-3 py-2 font-medium">
                <Shield className="w-4 h-4 mr-1 inline" />
                Protected zone: {userLocation.radius}km
              </Badge>
            </div>
            {locationStatus && (
              <div className="text-blue-400 text-xs">{locationStatus}</div>
            )}
          </div>

          {/* Active Alert Overlay */}
          {activeAlert && (
            <Card
              className={`mb-6 bg-gradient-to-r ${getAlertColor(
                activeAlert.severity
              )} border-0 shadow-2xl animate-pulse`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">
                      {getAlertIcon(activeAlert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {activeAlert.title}
                        </h3>
                        <Badge className="bg-white/20 text-white font-bold">
                          {activeAlert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-white/90 mb-3">
                        {activeAlert.message}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-white/80">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {activeAlert.location}
                        </span>
                        <span className="flex items-center">
                          <Navigation className="w-4 h-4 mr-1" />
                          {activeAlert.distance} away
                        </span>
                        {/* <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {activeAlert.timestamp}
                        </span> */}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissAlert}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Player */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  {/* Album Art Section */}
                  <div className="relative h-32 md:h-32">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Status badges (no image/space below protected zone) */}
                    <div className="absolute top-4 left-4 flex space-x-2 z-10">
                      <Badge className="bg-green-500 text-white font-bold">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                        LIVE
                      </Badge>
                      {locationEnabled && (
                        <Badge className="bg-blue-500 text-white font-bold">
                          <MapPin className="w-3 h-3 mr-1" />
                          {userLocation.area}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <div
                        className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                          alertsEnabled
                            ? "bg-green-500/20 border border-green-500/30"
                            : "bg-gray-500/20 border border-gray-500/30"
                        }`}
                      >
                        <Bell
                          className={`w-4 h-4 ${
                            alertsEnabled ? "text-green-400" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            alertsEnabled ? "text-green-300" : "text-gray-400"
                          }`}
                        >
                          {alertsEnabled ? "Alerts ON" : "Alerts OFF"}
                        </span>
                      </div>
                    </div>
                    {/* Now playing overlay */}
                    <div className="absolute top-14 left-4 right-4 z-0">
                      <p className="text-gray-300 mb-0">
                        Music with intelligent city alerts
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                        <span className="flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          Protected zone: {userLocation.radius}km
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Player Controls */}
                  <div className="p-6">
                    <div className="flex items-center justify-center space-x-6 mb-6">
                      <Button
                        onClick={playing ? handlePause : handlePlay}
                        disabled={!!activeAlert}
                        className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/25 disabled:opacity-50"
                      >
                        {playing && !activeAlert ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAlertsEnabled(!alertsEnabled)}
                          className={`${
                            alertsEnabled ? "text-green-400" : "text-gray-400"
                          } hover:text-green-400`}
                        >
                          <Bell className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocationEnabled(!locationEnabled)}
                          className={`${
                            locationEnabled ? "text-blue-400" : "text-gray-400"
                          } hover:text-blue-400`}
                        >
                          <MapPin className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-gray-400 hover:text-white"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </Button>
                        <div className="w-24">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) =>
                              handleVolumeChange(
                                Number.parseInt(e.target.value)
                              )
                            }
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center mt-6">
                      <EqualizerBars />
                    </div>
                    {activeAlert && (
                      <div className="mt-4 text-center">
                        <p className="text-red-400 text-sm font-medium">
                          🚨 Music paused for emergency alert - Tap dismiss to
                          resume
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alert Panel */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                    Your Location
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Area</span>
                      <span className="text-white font-semibold">
                        {userLocation.area}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Alert Radius</span>
                      <span className="text-white font-semibold">
                        {userLocation.radius} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status</span>
                      <Badge
                        className={
                          alertsEnabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {alertsEnabled ? "Protected" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                    Recent Alerts
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {alertHistory.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          alert.active
                            ? "bg-white/10 border-yellow-500/30"
                            : "bg-white/5 border-white/10 opacity-60"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">
                            {getAlertIcon(alert.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-white text-sm truncate">
                                {alert.title}
                              </h4>
                              <Badge
                                className={`text-xs ${
                                  alert.severity === "critical"
                                    ? "bg-red-500/20 text-red-400"
                                    : alert.severity === "high"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{alert.location}</span>
                              {/* <span>{alert.timestamp}</span> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        onEnded={() => setPlaying(false)}
        onLoadStart={() => {
          /*setProgress(0);*/
        }}
      />
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}

// "use client";

// import { useRef, useState, useEffect } from "react";
// import Navbar from "../components/Navbar/Navbar";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   Play,
//   Pause,
//   Volume2,
//   VolumeX,
//   MapPin,
//   AlertTriangle,
//   Bell,
//   Shield,
//   Navigation,
//   Clock,
//   X,
// } from "lucide-react";
// import Hls from "hls.js"; // <-- Added for HLS support

// // <--- PUT YOUR GOOGLE API KEY BELOW!
// const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// const fallbackLocation = {
//   area: "Koramangala",
//   coordinates: { lat: 12.9352, lng: 77.6245 },
//   radius: 2,
// };

// const alerts = [
//   {
//     id: 1,
//     type: "traffic",
//     severity: "high",
//     title: "Heavy Traffic Alert",
//     message:
//       "Major congestion on Outer Ring Road near Silk Board Junction. Expected delay: 25-30 minutes.",
//     location: "Silk Board Junction",
//     distance: "1.2 km",
//     timestamp: "2 min ago",
//     active: true,
//     coordinates: { lat: 12.9716, lng: 77.5946 },
//   },
//   {
//     id: 2,
//     type: "weather",
//     severity: "medium",
//     title: "Weather Alert",
//     message:
//       "Heavy rainfall expected in your area. Carry umbrella and avoid low-lying areas.",
//     location: "Koramangala",
//     distance: "0.5 km",
//     timestamp: "5 min ago",
//     active: true,
//     coordinates: { lat: 12.9352, lng: 77.6245 },
//   },
//   {
//     id: 3,
//     type: "emergency",
//     severity: "critical",
//     title: "Emergency Services",
//     message:
//       "Ambulance and fire services responding to incident. Avoid 5th Block main road.",
//     location: "Koramangala 5th Block",
//     distance: "0.8 km",
//     timestamp: "8 min ago",
//     active: false,
//     coordinates: { lat: 12.9341, lng: 77.6269 },
//   },
// ];

// const currentTrack = {
//   title: "Midnight City",
//   artist: "M83",
//   album: "Hurry Up, We're Dreaming",
//   duration: "4:03",
//   currentTime: "2:15",
// };

// // Change this to your HLS stream URL
// const HLS_STREAM_URL = "https://storage.cloud.google.com/audiolaus/main.m3u8";

// export default function RadioPage() {
//   const audioRef = useRef(null);
//   const [playing, setPlaying] = useState(false);
//   const [volume, setVolume] = useState(75);
//   const [isMuted, setIsMuted] = useState(false);
//   const [activeAlert, setActiveAlert] = useState(null);
//   const [alertsEnabled, setAlertsEnabled] = useState(true);
//   const [locationEnabled, setLocationEnabled] = useState(true);
//   const [alertHistory, setAlertHistory] = useState(alerts);

//   const [userLocation, setUserLocation] = useState(fallbackLocation);
//   const [locationStatus, setLocationStatus] = useState("Detecting location…");

//   // Setup HLS stream
//   useEffect(() => {
//     if (!audioRef.current) return;

//     if (Hls.isSupported()) {
//       const hls = new Hls();
//       hls.loadSource(HLS_STREAM_URL);
//       hls.attachMedia(audioRef.current);
//       // Cleanup on unmount
//       return () => hls.destroy();
//     } else if (audioRef.current.canPlayType("application/vnd.apple.mpegurl")) {
//       // Safari
//       audioRef.current.src = HLS_STREAM_URL;
//     }
//   }, [audioRef]);

//   // Request browser location ON LOAD
//   useEffect(() => {
//     if (!navigator.geolocation) {
//       setUserLocation(fallbackLocation);
//       setLocationStatus("Location not supported. Showing Koramangala.");
//       return;
//     }
//     setLocationStatus("Detecting location…");
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const coords = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//         };
//         try {
//           const resp = await fetch(
//             `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_MAPS_KEY}`
//           );
//           const data = await resp.json();
//           let areaName = "";
//           if (data.results && data.results.length > 0) {
//             const preferredTypes = [
//               "sublocality_level_1",
//               "sublocality",
//               "neighborhood",
//               "locality",
//             ];
//             for (const result of data.results) {
//               for (const part of result.address_components) {
//                 if (part.types.some((type) => preferredTypes.includes(type))) {
//                   areaName = part.long_name;
//                   break;
//                 }
//               }
//               if (areaName) break;
//             }
//           }
//           setUserLocation({
//             area: areaName || fallbackLocation.area,
//             coordinates: coords,
//             radius: 2,
//           });
//           setLocationStatus("");
//         } catch (e) {
//           setUserLocation({ ...fallbackLocation, coordinates: coords });
//           setLocationStatus("Could not get address, using fallback.");
//         }
//       },
//       (err) => {
//         setUserLocation(fallbackLocation);
//         setLocationStatus("Permission denied. Showing Koramangala.");
//       },
//       { enableHighAccuracy: true, maximumAge: 0 }
//     );
//   }, []);

//   useEffect(() => {
//     if (alertsEnabled && playing) {
//       const interval = setInterval(() => {
//         const activeAlerts = alertHistory.filter((alert) => alert.active);
//         if (activeAlerts.length > 0 && Math.random() > 0.7) {
//           const randomAlert =
//             activeAlerts[Math.floor(Math.random() * activeAlerts.length)];
//           setActiveAlert(randomAlert);
//           if (randomAlert.severity === "critical") setPlaying(false);
//         }
//       }, 15000);
//       return () => clearInterval(interval);
//     }
//   }, [alertsEnabled, playing, alertHistory]);

//   const handlePlay = () => {
//     if (audioRef.current) {
//       audioRef.current.play();
//       setPlaying(true);
//     }
//   };
//   const handlePause = () => {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       setPlaying(false);
//     }
//   };
//   const handleVolumeChange = (newVolume) => {
//     setVolume(newVolume);
//     if (audioRef.current) {
//       audioRef.current.volume = newVolume / 100;
//     }
//   };
//   const toggleMute = () => {
//     setIsMuted(!isMuted);
//     if (audioRef.current) {
//       audioRef.current.muted = !isMuted;
//     }
//   };
//   const dismissAlert = () => {
//     setActiveAlert(null);
//     if (playing) handlePlay();
//   };

//   const getAlertIcon = (type) => {
//     switch (type) {
//       case "traffic":
//         return "🚗";
//       case "weather":
//         return "🌧️";
//       case "emergency":
//         return "🚨";
//       case "infrastructure":
//         return "⚡";
//       default:
//         return "📢";
//     }
//   };
//   const getAlertColor = (severity) => {
//     switch (severity) {
//       case "critical":
//         return "from-red-500 to-red-600";
//       case "high":
//         return "from-orange-500 to-orange-600";
//       case "medium":
//         return "from-yellow-500 to-yellow-600";
//       default:
//         return "from-blue-500 to-blue-600";
//     }
//   };
//   const EqualizerBars = () => (
//     <div className="flex items-end space-x-1 h-8">
//       {[...Array(5)].map((_, i) => (
//         <div
//           key={i}
//           className={`w-1 bg-gradient-to-t from-blue-500 to-purple-400 rounded-full transition-all duration-300 ${
//             playing && !activeAlert ? "animate-pulse" : ""
//           }`}
//           style={{
//             height:
//               playing && !activeAlert ? `${Math.random() * 100 + 20}%` : "20%",
//             animationDelay: `${i * 0.1}s`,
//           }}
//         />
//       ))}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-black">
//       <Navbar />

//       <div className="pt-20 px-4 pb-8">
//         <div className="max-w-6xl mx-auto">
//           {/* Location UI */}
//           <div className="flex flex-col items-center mb-2 gap-2">
//             <div className="flex flex-wrap justify-center gap-3">
//               <Badge className="bg-blue-900 text-blue-200 px-4 py-2 font-semibold">
//                 <MapPin className="w-4 h-4 mr-2 inline" />
//                 {userLocation.area}
//               </Badge>
//               <Badge className="bg-gray-900 text-gray-200 px-3 py-2 font-medium">
//                 <Shield className="w-4 h-4 mr-1 inline" />
//                 Protected zone: {userLocation.radius}km
//               </Badge>
//             </div>
//             {locationStatus && (
//               <div className="text-blue-400 text-xs">{locationStatus}</div>
//             )}
//           </div>

//           {/* Active Alert Overlay */}
//           {activeAlert && (
//             <Card
//               className={`mb-6 bg-gradient-to-r ${getAlertColor(
//                 activeAlert.severity
//               )} border-0 shadow-2xl animate-pulse`}
//             >
//               <CardContent className="p-6">
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start space-x-4">
//                     <div className="text-3xl">
//                       {getAlertIcon(activeAlert.type)}
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <h3 className="text-xl font-bold text-white">
//                           {activeAlert.title}
//                         </h3>
//                         <Badge className="bg-white/20 text-white font-bold">
//                           {activeAlert.severity.toUpperCase()}
//                         </Badge>
//                       </div>
//                       <p className="text-white/90 mb-3">
//                         {activeAlert.message}
//                       </p>
//                       <div className="flex items-center space-x-4 text-sm text-white/80">
//                         <span className="flex items-center">
//                           <MapPin className="w-4 h-4 mr-1" />
//                           {activeAlert.location}
//                         </span>
//                         <span className="flex items-center">
//                           <Navigation className="w-4 h-4 mr-1" />
//                           {activeAlert.distance} away
//                         </span>
//                         <span className="flex items-center">
//                           <Clock className="w-4 h-4 mr-1" />
//                           {activeAlert.timestamp}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={dismissAlert}
//                     className="text-white hover:bg-white/20"
//                   >
//                     <X className="w-5 h-5" />
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Main Player */}
//             <div className="lg:col-span-2">
//               <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 overflow-hidden">
//                 <CardContent className="p-0">
//                   {/* Album Art Section */}
//                   <div className="relative h-32 md:h-32">
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
//                     {/* Status badges (no image/space below protected zone) */}
//                     <div className="absolute top-4 left-4 flex space-x-2 z-10">
//                       <Badge className="bg-green-500 text-white font-bold">
//                         <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
//                         LIVE
//                       </Badge>
//                       {locationEnabled && (
//                         <Badge className="bg-blue-500 text-white font-bold">
//                           <MapPin className="w-3 h-3 mr-1" />
//                           {userLocation.area}
//                         </Badge>
//                       )}
//                     </div>
//                     <div className="absolute top-4 right-4 z-10">
//                       <div
//                         className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
//                           alertsEnabled
//                             ? "bg-green-500/20 border border-green-500/30"
//                             : "bg-gray-500/20 border border-gray-500/30"
//                         }`}
//                       >
//                         <Bell
//                           className={`w-4 h-4 ${
//                             alertsEnabled ? "text-green-400" : "text-gray-400"
//                           }`}
//                         />
//                         <span
//                           className={`text-sm font-medium ${
//                             alertsEnabled ? "text-green-300" : "text-gray-400"
//                           }`}
//                         >
//                           {alertsEnabled ? "Alerts ON" : "Alerts OFF"}
//                         </span>
//                       </div>
//                     </div>
//                     {/* Now playing overlay */}
//                     <div className="absolute top-14 left-4 right-4 z-0">
//                       <p className="text-gray-300 mb-0">
//                         Music with intelligent city alerts
//                       </p>
//                       <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
//                         <span className="flex items-center">
//                           <Shield className="w-4 h-4 mr-1" />
//                           Protected zone: {userLocation.radius}km
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                   {/* Player Controls */}
//                   <div className="p-6">
//                     <div className="flex items-center justify-center space-x-6 mb-6">
//                       <Button
//                         onClick={playing ? handlePause : handlePlay}
//                         disabled={!!activeAlert}
//                         className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/25 disabled:opacity-50"
//                       >
//                         {playing && !activeAlert ? (
//                           <Pause className="w-6 h-6" />
//                         ) : (
//                           <Play className="w-6 h-6 ml-1" />
//                         )}
//                       </Button>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-4">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => setAlertsEnabled(!alertsEnabled)}
//                           className={`${
//                             alertsEnabled ? "text-green-400" : "text-gray-400"
//                           } hover:text-green-400`}
//                         >
//                           <Bell className="w-5 h-5" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => setLocationEnabled(!locationEnabled)}
//                           className={`${
//                             locationEnabled ? "text-blue-400" : "text-gray-400"
//                           } hover:text-blue-400`}
//                         >
//                           <MapPin className="w-5 h-5" />
//                         </Button>
//                       </div>
//                       <div className="flex items-center space-x-3">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={toggleMute}
//                           className="text-gray-400 hover:text-white"
//                         >
//                           {isMuted || volume === 0 ? (
//                             <VolumeX className="w-5 h-5" />
//                           ) : (
//                             <Volume2 className="w-5 h-5" />
//                           )}
//                         </Button>
//                         <div className="w-24">
//                           <input
//                             type="range"
//                             min="0"
//                             max="100"
//                             value={volume}
//                             onChange={(e) =>
//                               handleVolumeChange(
//                                 Number.parseInt(e.target.value)
//                               )
//                             }
//                             className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex justify-center mt-6">
//                       <EqualizerBars />
//                     </div>
//                     {activeAlert && (
//                       <div className="mt-4 text-center">
//                         <p className="text-red-400 text-sm font-medium">
//                           🚨 Music paused for emergency alert - Tap dismiss to
//                           resume
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Alert Panel */}
//             <div className="space-y-6">
//               <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
//                 <CardContent className="p-6">
//                   <h3 className="text-xl font-bold text-white mb-4 flex items-center">
//                     <MapPin className="w-5 h-5 mr-2 text-blue-400" />
//                     Your Location
//                   </h3>
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-400">Area</span>
//                       <span className="text-white font-semibold">
//                         {userLocation.area}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-400">Alert Radius</span>
//                       <span className="text-white font-semibold">
//                         {userLocation.radius} km
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-400">Status</span>
//                       <Badge
//                         className={
//                           alertsEnabled
//                             ? "bg-green-500/20 text-green-400"
//                             : "bg-gray-500/20 text-gray-400"
//                         }
//                       >
//                         {alertsEnabled ? "Protected" : "Disabled"}
//                       </Badge>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//               <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
//                 <CardContent className="p-6">
//                   <h3 className="text-xl font-bold text-white mb-4 flex items-center">
//                     <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
//                     Recent Alerts
//                   </h3>
//                   <div className="space-y-3 max-h-64 overflow-y-auto">
//                     {alertHistory.map((alert) => (
//                       <div
//                         key={alert.id}
//                         className={`p-3 rounded-lg border transition-all duration-200 ${
//                           alert.active
//                             ? "bg-white/10 border-yellow-500/30"
//                             : "bg-white/5 border-white/10 opacity-60"
//                         }`}
//                       >
//                         <div className="flex items-start space-x-3">
//                           <span className="text-lg">
//                             {getAlertIcon(alert.type)}
//                           </span>
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center space-x-2 mb-1">
//                               <h4 className="font-semibold text-white text-sm truncate">
//                                 {alert.title}
//                               </h4>
//                               <Badge
//                                 className={`text-xs ${
//                                   alert.severity === "critical"
//                                     ? "bg-red-500/20 text-red-400"
//                                     : alert.severity === "high"
//                                     ? "bg-orange-500/20 text-orange-400"
//                                     : "bg-yellow-500/20 text-yellow-400"
//                                 }`}
//                               >
//                                 {alert.severity}
//                               </Badge>
//                             </div>
//                             <p className="text-xs text-gray-300 mb-2 line-clamp-2">
//                               {alert.message}
//                             </p>
//                             <div className="flex items-center justify-between text-xs text-gray-500">
//                               <span>{alert.location}</span>
//                               <span>{alert.timestamp}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </div>
//       </div>

//       <audio
//         ref={audioRef}
//         controls
//         onEnded={() => setPlaying(false)}
//         onLoadStart={() => {
//           /*setProgress(0);*/
//         }}
//       />
//       <style jsx>{`
//         .slider::-webkit-slider-thumb {
//           appearance: none;
//           width: 16px;
//           height: 16px;
//           border-radius: 50%;
//           background: linear-gradient(45deg, #3b82f6, #8b5cf6);
//           cursor: pointer;
//           box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
//         }
//         .slider::-moz-range-thumb {
//           width: 16px;
//           height: 16px;
//           border-radius: 50%;
//           background: linear-gradient(45deg, #3b82f6, #8b5cf6);
//           cursor: pointer;
//           border: none;
//           box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
//         }
//       `}</style>
//     </div>
//   );
// }
