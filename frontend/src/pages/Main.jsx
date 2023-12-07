import { useState, useCallback } from 'react';
import RecordRTC from 'recordrtc';
import { StereoAudioRecorder } from 'recordrtc';
import debounce from 'lodash/debounce';

const Main = () => {
  const [recording, setRecording] = useState(false);
  const [socket, setSocket] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [messages, setMessages] = useState([]);

  // Debounce the message processing function
  const processMessagesDebounced = useCallback(
    debounce((texts) => {
      setMessages((prevMessages) => {
        let newMessages = [...prevMessages];

        for (const key of Object.keys(texts)) {
          if (texts[key]) {
            newMessages.push(texts[key]);
          }
        }

        return newMessages;
      });
    }, 500), [] // Adjust the debounce time as needed (500 milliseconds in this example)
  );

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
          const res = JSON.parse(message.data);
          const texts = {};
          texts[res.audio_start] = res.text;

          // Use the debounced function to process messages
          processMessagesDebounced(texts);
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
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <div className="bg-gray-300 w-3/6 h-4/6 rounded-xl">
          <div className="chat chat-end">
            {messages.map((msg, index) => (
              <div key={index} className="chat-bubble">
                {msg}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <button
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            onClick={run}
          >
            {recording ? 'Stop Talk' : 'Start Talk'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Main;
