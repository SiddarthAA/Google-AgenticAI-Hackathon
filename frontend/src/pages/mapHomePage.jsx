import { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
} from "@vis.gl/react-google-maps";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.209 });
  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  //   useEffect(() => {
  //     fetch("/api/locations")
  //       .then((res) => res.json())
  //       .then((data) => setMarkers(data));
  //   }, []);

  useEffect(() => {
    // Dummy data until backend is ready
    setMarkers([
      {
        lat: 28.6139,
        lon: 77.209,
        title: "Connaught Place",
        description: "Historic shopping and commercial hub in Delhi.",
        image: "https://images.unsplash.com/photo-1464983953574-0892a716854b",
      },
      {
        lat: 28.7041,
        lon: 77.1025,
        title: "Red Fort",
        description: "17th-century fort complex.",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      },
      // ...add more if desired
    ]);
  }, []);

  // Map search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search) return;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        search
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const result = await response.json();
    if (result.results && result.results[0]) {
      setCenter(result.results[0].geometry.location);
    }
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <section className="flex flex-col items-center h-screen bg-gray-100">
        <form onSubmit={handleSearch} className="my-4 flex w-full max-w-xl">
          <input
            className="flex-1 border rounded-l p-2"
            placeholder="Search location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 rounded-r"
          >
            Search
          </button>
        </form>
        <div style={{ height: 500, width: "90%", borderRadius: 20 }}>
          <Map
            defaultZoom={12}
            defaultCenter={center}
            style={{ width: "100%", height: "100%" }}
            center={center}
          >
            {markers.map((marker, idx) => (
              <Marker
                key={idx}
                position={{ lat: marker.lat, lng: marker.lon }}
                onClick={() => setSelected(marker)}
              />
            ))}
            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lon }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="p-2">
                  <img
                    src={selected.image}
                    alt={selected.title}
                    className="mb-2 w-40 rounded"
                  />
                  <h3 className="font-bold">{selected.title}</h3>
                  <p className="text-sm">{selected.description}</p>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </section>
    </APIProvider>
  );
}
