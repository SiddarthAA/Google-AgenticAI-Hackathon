// /services/dummyMarkers.js
export function fetchLocationMarkers() {
    return Promise.resolve([
      {
        lat: 28.6139,
        lon: 77.2090,
        title: "Connaught Place",
        description: "Historic shopping and commercial hub in Delhi.",
        image: "https://images.unsplash.com/photo-1464983953574-0892a716854b"
      },
      {
        lat: 28.7041,
        lon: 77.1025,
        title: "Red Fort",
        description: "A 17th-century fort complex.",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
      },
      // ... add more if desired
    ]);
  }
  