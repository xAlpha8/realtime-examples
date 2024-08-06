import React, { useState, useEffect } from "react";
import forwardIcon from "../icons/noun-forward.svg";
import arrowIcon from "../icons/noun-pixel-arrow.svg";
import crossIcon from "../icons/noun-pixel-cross.svg";

const delay = (delayInms) => new Promise((resolve) => setTimeout(resolve, delayInms));

const retryableFetch = async (url, params, attempts) => {
  let mult = 1;
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = await fetch(url, params);
      return res;
    } catch (err) {
      await delay(mult * 1000);
      mult *= 2;
      if (i === attempts - 1) {
        throw err;
      }
    }
  }
};

const FileUpload2 = () => {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [prompt, setPrompt] = useState("");
  const [functionUrl, setFunctionUrl] = useState("https://infra.getadapt.ai/run/b84113e776b6ff63b351534e202275a5");
  const [extractSegments, setExtractSegments] = useState(false);
  const [offerUrl, setOfferUrl] = useState("http://0.0.0.0:8080");
  const [uploading, setUploading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const extractedSegmentsList = [
    { id: "segment_1", timestamp_start: "0:08", timestamp_end: "0:15", video_url: "data/ship_segment1.mp4" },
    { id: "segment_2", timestamp_start: "0:22", timestamp_end: "0:30", video_url: "data/ship_segment2.mp4" },
    { id: "segment_3", timestamp_start: "0:45", timestamp_end: "0:55", video_url: "data/ship_segment3.mp4" },
  ];

  const [preloadedVideos] = useState([
    { name: "Video_1.mp4", url: "data/1.mp4", prompt: "all boats, all birds" },
    { name: "Video_2.mp4", url: "data/2.mp4", prompt: "person lying on the floor" },
  ]);

  const uploadPreloadedVideo = async (video) => {
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const file = new File([blob], video.name, { type: "video/mp4" });
      setFile(file);
      setFilename(file.name);
      setPrompt(video.prompt);
    } catch (err) {
      alert("Error fetching preloaded video: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    try {
      if (offerUrl && offerUrl.length > 0) {
        const configResponse = await retryableFetch(offerUrl + "/submit", { method: "POST", body: formData }, 5);
        if (!configResponse.ok) {
          throw new Error("Failed to configure the stream");
        }
        const configData = await configResponse.json();
        const streamUrl = offerUrl + "/stream/" + configData.stream_id;
        document.getElementById("outputVideo").src = streamUrl;
      } else if (functionUrl && functionUrl.length > 0) {
        const payload = await fetch(functionUrl).then((resp) => resp.json());
        setOfferUrl(payload.address);
        const res = await retryableFetch(payload.address + "/submit", { method: "POST", body: formData }, 5);
        const videoStreamUrl = URL.createObjectURL(res.body);
        document.getElementById("outputVideo").src = videoStreamUrl;
      } else {
        throw new Error("Please enter a valid function URL");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("There was a problem: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    setPrompt("");
    setFile(null);
    setFilename("");
    document.getElementById("outputVideo").src = "";
  };

  return (
    <div id="realtime-container" className="md:h-screen">
      <div className="max-h-48 p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h1 className="text-xl font-bold">Adapt</h1>
          <img src={forwardIcon} className="h-8" alt="File Upload logo" />
        </div>
        <div className="flex gap-1 items-center">
          <button type="button" className="nes-btn is-primary" onClick={handleSubmit}>
            Start
          </button>
          <button type="button" className="nes-btn is-error" onClick={handleClear}>
            Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 grid-rows-4 md:grid-rows-2 gap-4 md:h-5/6 mx-4 h-[48rem]">
        <div className="col-span-4 md:col-span-3 row-span-2 border border-solid border-black rounded-md flex justify-center items-center overflow-hidden">
          <div className="nes-text is-disabled media-container-label" hidden={isConnected}>
            Input Video
          </div>
          {file && (
            <video id="inputVideo" className="w-full h-full" controls src={URL.createObjectURL(file)}>
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        <div className="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col">
          <div id="output-container" className="h-full flex items-center justify-center">
            <div className="nes-text is-disabled media-container-label" hidden={isConnected}>
              Output Video
            </div>
            <img id="outputVideo" className="w-full h-full" alt="Output Video" />
          </div>
        </div>

        <div className="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col">
          <div id="segments-container" className="h-full overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">Extracted Segments</h2>
            {extractedSegmentsList.map((segment) => (
              <div key={segment.id} className="mb-4 p-2 border border-gray-700 rounded">
                <p className="text-black mb-2">
                  {segment.timestamp_start} - {segment.timestamp_end}
                </p>
                <button
                  onClick={() => setCurrentVideo(segment.video_url)}
                  className="nes-btn is-primary"
                >
                  Play
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-h-48 p-4 flex justify-center gap-4 items-center">
        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="functionUrl">
              Function URL:
            </label>
            <input
              type="text"
              id="functionUrl"
              value={functionUrl}
              onChange={(e) => setFunctionUrl(e.target.value)}
              placeholder="Enter Function URL"
              className="nes-input"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prompt">
              Prompt:
            </label>
            <input
              type="text"
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter text and press ENTER"
              className="nes-input"
            />
          </div>
          <div className="mb-4">
            <label className="nes-checkbox">
              <input
                type="checkbox"
                checked={extractSegments}
                onChange={(e) => setExtractSegments(e.target.checked)}
              />
              <span>Extract segments</span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="file"
              accept="video/mp4"
              onChange={(e) => {
                const file = e.target.files[0];
                setFile(file);
                setFilename(file.name);
              }}
              className="nes-btn"
            />
            <button type="submit" className="nes-btn is-primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUpload2;