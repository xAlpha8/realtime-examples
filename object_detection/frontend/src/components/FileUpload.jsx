import React, { useState, useEffect } from "react";

async function delay(delayInms) {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
}

async function retryableFetch(url, params, attempts) {
  let mult = 1;
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = await fetch(url, params);
      return res;
    } catch (err) {
      await delay(mult * 1000);
      mult *= 2;
      if (i == attempts - 1) {
        throw err;
      }
    }
  }
}

const FileUpload = () => {
  const [file, setFile] = useState("");
  const [filename, setFilename] = useState("");
  const [prompt, setPrompt] = useState("");
  const [functionUrl, setFunctionUrl] = useState(
    "https://infra.getadapt.ai/run/b84113e776b6ff63b351534e202275a5"
  );
  const [extractSegments, setExtractSegments] = useState(false)
  const [segmentsExtracted, setSegmentsExtracted] = useState({
    state: 'none',
  })
  const [offerUrl, setOfferUrl] = useState("http://0.0.0.0:8080");
  const [uploading, setUploading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const handleSelectSegment = (segment) => {
    console.log(segment)
    setSelectedSegment(segment)
  }
  const extractedSegmentsList = [
    {
      "id": "segment_1",
      'timestamp_start': "0:08",
      'timestamp_end': "0:15",
      'video_url': "data/ship_segment1.mp4"
    },
    {
      "id": "segment_2",
      'timestamp_start': "0:16",
      'timestamp_end': "0:22",
      'video_url': "data/ship_segment2.mp4"
    },
    {
      "id": "segment_3",
      'timestamp_start': "0:23",
      'timestamp_end': "0:31",
      'video_url': "data/ship_segment3.mp4"
    }
  ]
  const [preloadedVideos, setPreloadedVideos] = useState([
    {
      name: "Video_1.mp4",
      url: "data/1.mp4",
      prompt: "all boats, all birds",
    },
    {
      name: "Video_2.mp4",
      url: "data/2.mp4",
      prompt: "person lying on the floor",
    },
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
    if (extractSegments) {
      setSegmentsExtracted({ state: 'pending' });

      setTimeout(() => {
        setSegmentsExtracted({ state: 'done' });
      }, 5000);
    }
    setUploading(true);
    const formData = new FormData();
    console.log("File: ", file);
    console.log("Prompt: ", prompt, typeof prompt);
    formData.append("file", file);
    formData.append("prompt", prompt);
    if (offerUrl && offerUrl.length > 0) {
      try {
        const configResponse = await retryableFetch(
          offerUrl + "/submit",
          {
            method: "POST",
            body: formData,
          },
          5
        );
        if (!configResponse.ok) {
          throw new Error("Failed to configure the stream");
        }

        // Optionally, the server can respond with a specific endpoint or token
        const configData = await configResponse.json();
        console.log("Config Data: ", configData);
        const streamUrl = offerUrl + "/stream/" + configData.stream_id; // Assuming the server responds with a token

        // Set the video stream URL
        console.log("Video Stream URL: ", streamUrl);
        document.getElementById("outputVideo").src = streamUrl;
        setUploading(false);
      } catch (err) {
        console.error("Error fetching offer URL:", err);
        alert("There was a problem fetching the offer URL");
        setUploading(false);
      }
    } else if (functionUrl && functionUrl.length > 0) {
      fetch(functionUrl)
        .then((resp) => resp.json())
        .then((payload) => {
          console.log("Connecting with : ", payload.address);
          setOfferUrl(payload.address);
          return payload.address;
        })
        .then(async (offerUrl) => {
          const res = await retryableFetch(
            offerUrl + "/submit",
            {
              method: "POST",
              body: formData,
            },
            5
          );
          const videoStreamUrl = URL.createObjectURL(res.body);
          console.log(videoStreamUrl);
          document.getElementById("outputVideo").src = videoStreamUrl;
          setUploading(false);
        })
        .catch((err) => {
          console.error("Error fetching function URL:", err);
          alert("There was a problem fetching the function URL");
          setUploading(false);
        });
    } else {
      alert("Please enter a valid function URL");
      setUploading(false);
      return;
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    setPrompt("");
    setFile("");
    setFilename("");
    document.getElementById("outputVideo").src = null;
  };

  return (
    <div className="bg-gray-900 p-5 shadow-lg text-center mx-auto">
      {uploading && (
        <div className="border-8 border-white border-opacity-50 border-t-blue-500 rounded-full w-16 h-16 animate-spin mx-auto"></div>
      )}
      <div>
        <h2 className="text-white mb-6">Function URL:</h2>
        <input
          type="text"
          value={functionUrl}
          onChange={(e) => setFunctionUrl(e.target.value)}
          placeholder="Enter Function URL"
          className="w-full p-2.5 mb-5 border border-gray-800 rounded bg-gray-800 text-white"
        />
      </div>{" "}
      <div className="bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-6">
          Prompt-based Object Detection Demo
        </h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Input Video */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Input Video</h2>
            <div className="bg-gray-800 h-64 flex items-center justify-center">
              <div className="text-center">
                {file ? (
                  <video
                    id="inputVideo"
                    className="w-full h-64" // Adjust size as needed
                    controls
                    src={URL.createObjectURL(file)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setFile(file);
                      setFilename(file.name);
                    }}
                    className="mx-auto mb-2"
                  />
                )}
              </div>
            </div>
            {/* Text Input */}
            <form onSubmit={handleSubmit} className="mt-6">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter text and press ENTER"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mb-4"
              />
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="extractSegments"
                  className="mr-2"
                  checked={extractSegments}
                  onChange={(e) => setExtractSegments(e.target.checked)}
                />
                <label htmlFor="extractSegments" className="text-white">
                  Extract segments
                </label>
              </div>
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Submit
                </button>
                <button
                  onClick={handleClear}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Output Video */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Output Video</h2>
              <div className="bg-gray-800 h-64 flex items-center justify-center">
                <img id="outputVideo" className="w-full h-full" />
              </div>
            </div>

          </div>
          {/* Segments */}
          {segmentsExtracted.state === 'done' && (
            <div className="border border-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Extracted Segments</h2>
              <div className="bg-gray-800 h-64 overflow-y-auto">
                {extractedSegmentsList.map((segment) => (
                  <div key={segment.id} className="mb-4 p-2 border border-gray-700 rounded">
                    <p className="text-white mb-2">
                      {segment.timestamp_start} - {segment.timestamp_end}
                    </p>
                    <button
                      onClick={() => handleSelectSegment(segment)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {segmentsExtracted.state === 'pending' && (
            <div className="border border-gray-700 rounded-lg p-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {selectedSegment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-white">Selected Segment</h2>
                <video className="w-full max-h-[80vh]" controls autoPlay>
                  <source src={selectedSegment.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <button
                  onClick={() => setSelectedSegment(null)}
                  className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
