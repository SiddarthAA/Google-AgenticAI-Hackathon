import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Replace with your Gemini API key from Google AI Studio (see instructions below)
const API_KEY = "AIzaSyCgyj9oJr44xupdBGIrfaQHpodeDBD6loU";
const genAI = new GoogleGenerativeAI(API_KEY);

const ImageSummarizerPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setSummary("");
  };

  const handleGetSummary = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setSummary("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(",")[1];
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt =
          "Summarize this image in 2-3 short lines. Do not start with any introductory phrase.";

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: selectedFile.type,
              data: base64,
            },
          },
          {
            text: prompt,
          },
        ]);
        let text =
          result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No summary found.";
        // Remove generic description prefixes
        text = text.replace(/^.*description.*?:\s*/i, "");
        setSummary(text);
      } catch (err) {
        setSummary("Error getting summary.");
        console.error(err);
      }
      setLoading(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", textAlign: "center" }}>
      <h3>Gemini Image Summary</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      <br />
      <button
        style={{ marginTop: 10 }}
        onClick={handleGetSummary}
        disabled={!selectedFile || loading}
      >
        {loading ? "Processing..." : "Get Summary"}
      </button>
      {summary && (
        <div
          style={{
            marginTop: 24,
            padding: "14px 10px",
            background: "#fafaff",
            borderRadius: 8,
            border: "1px solid #eee",
          }}
        >
          <div style={{ marginTop: 8 }}>{summary}</div>
        </div>
      )}
    </div>
  );
};

export default ImageSummarizerPage;
