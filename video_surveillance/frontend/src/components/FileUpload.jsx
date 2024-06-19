import React, { useState, useEffect } from 'react';

async function delay (delayInms) {
  return new Promise(resolve => setTimeout(resolve, delayInms));
};

async function retryableFetch(url, params, attempts) {
  let mult = 1
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = await fetch(url, params)
      return res
    } catch (err) {
      await delay(mult * 1000)
      mult *= 2
      if (i == attempts - 1) {
        throw err
      }
    }
  }
}

const FileUpload = () => {
  const [file, setFile] = useState('');
  const [filename, setFilename] = useState('');
  const [message, setMessage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [offerUrl, setOfferUrl] = useState('')
  const [functionUrl, setFunctionUrl] = useState('https://infra.getadapt.ai/run/db68da48f00b62e7fdf47eb2a9316d1b')
  const [uploading, setUploading] = useState(false);
  const [preloadedVideos, setPreloadedVideos] = useState([
    { name: 'Video_1.mp4', url: 'data/1.mp4' },
    { name: 'Video_2.mp4', url: 'data/2.mp4' },
    { name: 'Video_3.mp4', url: 'data/3.mp4' },
    { name: 'Video_4.mp4', url: 'data/4.mp4' },
  ]);


  const uploadPreloadedVideo = async (video) => {
    try {
      setUploading(true);
      const response = await fetch(video.url);
      const blob = await response.blob();
        const file = new File([blob], video.name, { type: 'video/mp4' }); // Set the correct MIME type here
        const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);

      if (functionUrl && functionUrl.length > 0) {
        fetch(functionUrl)
        .then(resp => resp.json())
        .then(payload => {
          console.log("Connecting with : ", payload.address);
          setOfferUrl(payload.address);
          return payload.address;
        }).then(
          async (offerUrl) => {
            const res = await retryableFetch(offerUrl + '/submit', {
              method: 'POST',
              body: formData,
            }, 5);
            const data = await res.json();
            console.log(data);
            setMessage(data.response);
            setUploading(false);
          }
        )
        .catch(err => {
          console.error('Error fetching function URL:', err);
            setMessage('There was a problem fetching the function URL');
            setUploading(false);
          });
      } else {
        setMessage('Please enter a valid function URL');
        setUploading(false);
        return;
      }
    } catch (err) {
      setMessage('There was a problem with the server');
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(file);
      }
    };
  }, [file]);

  return (
    <div class="bg-gray-900 p-5 rounded-lg shadow-lg text-center mx-5">
      {message && <div className="mb-5 p-2.5 rounded bg-orange-600 text-white whitespace-pre-wrap text-left pl-5">{message}</div>}
      {uploading && <div className="border-8 border-white border-opacity-50 border-t-blue-500 rounded-full w-16 h-16 animate-spin mx-auto"></div>}
      <div class="flex flex-wrap justify-center w-100 mr-2.5">
  {preloadedVideos.map((video, index) => (
    <div key={index} className="flex flex-col items-center mb-5 mr-5">
      <h3 className='text-center mb-2'>{video.name}</h3>
      <video className="w-4/5" controls src={video.url}>
        Your browser does not support the video tag.
      </video>
      <button class="mt-2 w-2/5 p-2.5 border-none rounded bg-blue-600 text-white text-lg cursor-pointer hover:bg-blue-700" onClick={() => uploadPreloadedVideo(video)}>Analyze</button>
    </div>
  ))}
</div>
        <div className="mb-5">
        <label class="block mb-1 font-bold">Prompt</label>
          <textarea id="name" name="name" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full h-25 resize-y p-2.5 mb-5 border border-gray-800 rounded bg-gray-800 text-white"></textarea>
        </div>
        <div>
          <h2>Function URL:</h2>
          <input
            type="text"
            value={functionUrl}
            onChange={(e) => setFunctionUrl(e.target.value)}
            placeholder="Enter Function URL"
            className="w-full p-2.5 mb-5 border border-gray-800 rounded bg-gray-800 text-white"
          />
        </div>
    </div>
  );
};

export default FileUpload;