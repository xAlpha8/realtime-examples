import React, { useState, useEffect } from 'react';
import './form.css';

const FileUpload = () => {
  const [file, setFile] = useState('');
  const [filename, setFilename] = useState('');
  const [message, setMessage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preloadedVideos, setPreloadedVideos] = useState([
    { name: 'Video_1.mp4', url: 'data/1.mp4' },
    { name: 'Video_2.mp4', url: 'data/2.mp4' },
    { name: 'Video_3.mp4', url: 'data/3.mp4' },
    { name: 'Video_4.mp4', url: 'data/4.mp4' },
  ]);

  const onChange = e => {
    setFile(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };

  const onSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }
    formData.append('file', file);
    formData.append('prompt', prompt);

    try {
      setUploading(true);
      const res = await fetch('http://localhost:8080/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setMessage(data.response);
    } catch (err) {
      setMessage('There was a problem with the server');
    }
    setUploading(false);
  };

  const uploadPreloadedVideo = async (video) => {
    try {
      setUploading(true);
      const response = await fetch(video.url);
      const blob = await response.blob();
        const file = new File([blob], video.name, { type: 'video/mp4' }); // Set the correct MIME type here
        const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);

      const res = await fetch('http://localhost:8080/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log(data);
      setMessage(data.response);
    } catch (err) {
      setMessage('There was a problem with the server');
    }
    setUploading(false);
  };

  useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(file);
      }
    };
  }, [file]);

  return (
    <div className="container">
      {message && <div className="alert alert-info">{message}</div>}
      <div className="preloaded-videos">
        {preloadedVideos.map((video, index) => (
          <div key={index} className='video-container'>
            <h3 className='text-center'>{video.name}</h3>
            <video style={{ width: '100%' }} controls src={video.url}>
              Your browser does not support the video tag.
            </video>
            <button className='btn btn-primary btn-block mt-2' onClick={() => uploadPreloadedVideo(video)}>Analyze</button>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label htmlFor="name">Prompt</label>
          <textarea id="name" name="name" value={prompt} onChange={(e) => setPrompt(e.target.value)}></textarea>
        </div>

        {/* <div className='custom-file mb-4'>
          <input
            type='file'
            className='custom-file-input'
            id='customFile'
            onChange={onChange}
          />
        </div> */}

        {uploading && <div className="spinner"></div>}

        {/* <input
          type='submit'
          value='Upload'
          className='btn btn-primary btn-block mt-4'
        /> */}
      </form>
      {/* {file ? (
        <div className='row mt-5'>
          <div className='col-md-6 m-auto'>
            <h3 className='text-center'>{filename}</h3>
            <video style={{ width: '100%' }} controls src={URL.createObjectURL(file)}>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      ) : null} */}
    </div>
  );
};

export default FileUpload;