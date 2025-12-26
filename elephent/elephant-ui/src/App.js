import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const videoRef = useRef(null);

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
    setResult(null);
    setCurrentFrame(0);
  };

  const handleUpload = async () => {
    if (!videoFile) return alert("Please select a video");

    const formData = new FormData();
    formData.append('video', videoFile);

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Server Error");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch from server. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  // Update current frame based on video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !result?.frame_wise_predictions) return;

    const handleTimeUpdate = () => {
      const fps = 30; // Adjust according to your video FPS
      const frameIndex = Math.floor(video.currentTime * fps);
      if (frameIndex < result.frame_wise_predictions.length) {
        setCurrentFrame(frameIndex);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [result]);

  const currentPrediction = result?.frame_wise_predictions?.[currentFrame];

  const formatNumber = (num) => (num !== undefined && num !== null ? num.toFixed(3) : 'N/A');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Elephant Hybrid Classifier</h1>

      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: '10px' }}>
        {loading ? 'Processing...' : 'Upload & Predict'}
      </button>

      {videoFile && (
        <div style={{ marginTop: '20px' }}>
          <h2>Video Preview</h2>
          <video ref={videoRef} controls width="600">
            <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
            Your browser does not support the video tag.
          </video>

          {currentPrediction && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: currentPrediction.label === 'Aggressive' ? '#fdd' : '#dfd',
            }}>
              <strong>Current Frame:</strong> {currentFrame} <br />
              <strong>Label:</strong> {currentPrediction.label || 'N/A'} <br />
              <strong>Hybrid Aggressive:</strong> {formatNumber(currentPrediction.hybrid_aggressive)} <br />
              <strong>Hybrid Normal:</strong> {formatNumber(currentPrediction.hybrid_normal)} <br />
              <strong>Motion Score:</strong> {formatNumber(currentPrediction.motion_score)} <br />
              <strong>Dynamic Alpha:</strong> {formatNumber(currentPrediction.dynamic_alpha)}
            </div>
          )}
        </div>
      )}

      {result && result.frame_wise_predictions && (
        <div style={{ marginTop: '20px' }}>
          <h2>Frame-wise Predictions</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#eee' }}>
                  <th style={{ border: '1px solid #ccc', padding: '4px' }}>Frame</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px' }}>Label</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px' }}>Hybrid Aggressive</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px' }}>Hybrid Normal</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px' }}>Motion Score</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px' }}>Dynamic Alpha</th>
                </tr>
              </thead>
              <tbody>
                {result.frame_wise_predictions.map((f, idx) => (
                  <tr key={idx} style={{ backgroundColor: f.label === 'Aggressive' ? '#fdd' : '#dfd' }}>
                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{f.frame}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{f.label}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{formatNumber(f.hybrid_aggressive)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{formatNumber(f.hybrid_normal)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{formatNumber(f.motion_score)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{formatNumber(f.dynamic_alpha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
