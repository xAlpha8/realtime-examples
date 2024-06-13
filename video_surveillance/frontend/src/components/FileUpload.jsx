import React, { Fragment, useState } from 'react';
import axios from 'axios';
import './form.css'

const FileUpload = () => {
  const [file, setFile] = useState('');
  const [filename, setFilename] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const onChange = e => {
    setFile(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };

  const onSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true)
      const res = await axios.post('http://localhost:8080/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });
      
      console.log(res);
      const { file, response } = res.data;

      setMessage(response);
    } catch (err) {
      if (err.response.status === 500) {
        setMessage('There was a problem with the server');
      } else {
        setMessage(err.response.data.msg);
      }
    }
    setUploading(false)
  };

  return (
    <Fragment>
      {message ? <div className="alert alert-info">{message}</div> : null}
        <form onSubmit={onSubmit}>
        <div className="mb-5">
            <label htmlFor="name">Prompt</label>
            <input id="name" name="name" type="text" />
          </div>

        <div className='custom-file mb-4'>
          <input
            type='file'
            className='custom-file-input'
            id='customFile'
            onChange={onChange}
          />
        </div>

        {uploading && <div className="spinner"></div>}

        <input
          type='submit'
          value='Upload'
          className='btn btn-primary btn-block mt-4'
        />
      </form>
      {file ? (
        <div className='row mt-5'>
          <div className='col-md-6 m-auto'>
            <h3 className='text-center'>{filename}</h3>
            <video style={{ width: '100%' }} controls src={URL.createObjectURL(file)}>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      ) : null}
    </Fragment>
  );
};

export default FileUpload;



