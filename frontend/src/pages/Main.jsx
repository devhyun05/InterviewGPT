import { useState } from 'react';
import RecordRTC from 'recordrtc'; 
import { StereoAudioRecorder } from 'recordrtc';

const Main = () => {
  const [recording, setRecording] = useState(false);
  const [socket, setSocket] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [message, setMessage] = useState('');

  const run = async () => {
    if (recording) {
      if (socket) {
        socket.send(JSON.stringify({ terminate_session: true }));
        socket.close();
        setSocket(null);
      }

      if (recorder) {
        recorder.pauseRecording();
        setRecorder(null);
      }
    } else {
      try {
        const response = await fetch('http://localhost:8000');
        const data = await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        const { token } = data;

        const newSocket = new WebSocket(
          `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
        );

        newSocket.onmessage = (message) => {
          let msg = '';
          const res = JSON.parse(message.data);
          const texts = {};
          texts[res.audio_start] = res.text;
          const keys = Object.keys(texts);
          keys.sort((a, b) => a - b);
          for (const key of keys) {
            if (texts[key]) {
              msg += `${texts[key]}`;
            }
          }
          setMessage(msg);
        };

        newSocket.onerror = (event) => {
          console.error(event);
          newSocket.close();
        };

        newSocket.onclose = (event) => {
          console.log(event);
          setSocket(null);
        };

        newSocket.onopen = () => {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
              const newRecorder = new RecordRTC(stream, {
                type: 'audio',
                mimeType: 'audio/webm;codecs=pcm',
                recorderType: StereoAudioRecorder,
                timeSlice: 250,
                desiredSampRate: 16000,
                numberOfAudioChannels: 1,
                bufferSize: 16384,
                audioBitsPerSecond: 128000,
                ondataavailable: (blob) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64data = reader.result;
                    if (newSocket) {
                      newSocket.send(
                        JSON.stringify({
                          audio_data: base64data.split('base64,')[1],
                        })
                      );
                    }
                  };
                  reader.readAsDataURL(blob);
                },
              });

              newRecorder.startRecording();
              setRecorder(newRecorder);
            })
            .catch((err) => console.error(err));
        };

        setSocket(newSocket);
      } catch (error) {
        console.error(error);
      }
    }

    setRecording(!recording);
  };

  return (
    <>
      <button onClick={run}>Start Recording</button>
      <p>{message}</p>
    </>
  );
};

export default Main;
