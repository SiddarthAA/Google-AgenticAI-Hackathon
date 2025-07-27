"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar/Navbar";

// How close (in km) a report must be to be considered "local news"
const NEWS_RADIUS_KM = 30; // Adjust as needed (for "whole city" use a higher value)

function haversine(lat1, lon1, lat2, lon2) {
  // Calculate great-circle distance between two points (in km)
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const STORY_DURATION = 5000; // ms (5 seconds per story)

export default function NewsStoriesPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [newsStories, setNewsStories] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prog, setProg] = useState([]);
  const timer = useRef();

  // Get user location once on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          setUserLocation(null); // If denied, fallback to all city news
        }
      );
    }
  }, []);

  // Fetch reports from API and convert to news stories
  useEffect(() => {
    async function fetchReports() {
      const res = await fetch("http://localhost:4000/api/reports");
      const reports = await res.json();

      // If user location known, filter by proximity; else show all as "city news"
      let filtered = reports;
      if (userLocation && reports.length) {
        filtered = reports.filter((r) => {
          if (typeof r.lat !== "number" || typeof r.lon !== "number")
            return false;
          // If within NEWS_RADIUS_KM or if city-wide, show
          const dist = haversine(
            userLocation.lat,
            userLocation.lon,
            r.lat,
            r.lon
          );
          return dist <= NEWS_RADIUS_KM;
        });
        // If nothing local, fallback to all city news
        if (filtered.length === 0) filtered = reports;
      }

      // Convert reports to news format
      setNewsStories(
        filtered.map((r) => ({
          title: r.title || "Local Update",
          text: r.description || "",
          image: r.image || "",
          link: "", // You can link to a details page if you have one
        }))
      );
      setCurrent(0);
      setProg(Array(filtered.length).fill(0));
    }
    fetchReports();
  }, [userLocation]);

  // Progress bar
  useEffect(() => {
    if (!newsStories.length) return;
    setProg((prev) =>
      prev.map((p, idx) => (idx < current ? 1 : idx > current ? 0 : 0))
    );
    let start = Date.now();
    function advanceProgress() {
      setProg((prev) =>
        prev.map((p, idx) =>
          idx < current
            ? 1
            : idx > current
            ? 0
            : Math.min(1, (Date.now() - start) / STORY_DURATION)
        )
      );
    }
    timer.current = setInterval(advanceProgress, 40);
    const storyTimeout = setTimeout(() => {
      if (current < newsStories.length - 1) {
        setCurrent((c) => c + 1);
      }
    }, STORY_DURATION);

    return () => {
      clearInterval(timer.current);
      clearTimeout(storyTimeout);
    };
  }, [current, newsStories.length]);

  // Keyboard/Touch Shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft" && current > 0) setCurrent(current - 1);
      if (e.key === "ArrowRight" && current < newsStories.length - 1)
        setCurrent(current + 1);
      if (e.key === "Escape") setCurrent(0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, newsStories.length]);

  const onPrev = () => current > 0 && setCurrent(current - 1);
  const onNext = () => {
    if (current < newsStories.length - 1) setCurrent(current + 1);
  };

  return (
    <div className="bg-black min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex justify-center items-center">
        <div className="w-full max-w-md h-[70vh] bg-gradient-to-br from-black to-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
          {newsStories.length ? (
            <NewsStory
              news={newsStories[current]}
              onNext={onNext}
              onPrev={onPrev}
              progress={prog}
              isFirst={current === 0}
              isLast={current === newsStories.length - 1}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              {userLocation === null
                ? "Loading city news..."
                : "No news stories found for your area."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsStory({ news, onNext, onPrev, progress, isLast, isFirst }) {
  return (
    <div className="flex flex-col h-full relative select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 px-2 pt-2 z-20">
        {progress.map((p, idx) => (
          <div
            key={idx}
            className="flex-1 h-1 rounded bg-gray-800 overflow-hidden"
          >
            <div
              style={{ width: `${p * 100}%` }}
              className={`h-1 bg-blue-400 transition-all duration-100 linear`}
            ></div>
          </div>
        ))}
      </div>
      {/* News content */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pt-8 pb-12 relative">
        {news.image && (
          <img
            src={news.image}
            alt=""
            className="max-h-[35vh] w-auto object-cover rounded-lg mb-6 drop-shadow-lg"
          />
        )}
        <h2 className="text-white text-2xl font-bold mb-3 text-center drop-shadow">
          {news.title}
        </h2>
        <p className="text-gray-300 text-lg text-center">{news.text}</p>
        {news.link && (
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 text-blue-400 underline"
          >
            Learn more
          </a>
        )}
      </div>
      {/* Left/right hit areas for prev/next */}
      <button
        className="absolute top-0 left-0 w-1/3 h-full focus:outline-none"
        onClick={onPrev}
        disabled={isFirst}
        tabIndex={-1}
        aria-label="Previous"
      />
      <button
        className="absolute top-0 right-0 w-1/3 h-full focus:outline-none"
        onClick={onNext}
        disabled={isLast}
        tabIndex={-1}
        aria-label="Next"
      />
    </div>
  );
}
