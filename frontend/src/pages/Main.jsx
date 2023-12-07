import { useState } from 'react';
import RecordRTC from 'recordrtc';
import { StereoAudioRecorder } from 'recordrtc';

const backend = 'https://www.talktogpt.pro';

const Main = () => {
  const [recording, setRecording] = useState(false);
  const [socket, setSocket] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [message, setMessage] = useState([]);
  const [gptResponse, setGPTResponse] = useState([]);

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


          // if it reaches end of the sentence
          if (msg[msg.length - 1] === "." || msg[msg.length - 1] === "?" || msg[msg.length - 1] === "!") {
            setMessage(prevMessages => [...prevMessages, msg]);
            fetchGPTPrompt(msg);
          }

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

  const fetchGPTPrompt = async (msg) => {
    try {
      const response = await fetch(`${backend}/gptprompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chat: msg })
      })
      const gptResponse = await response.json();


      const responseVoice = await fetch(`${backend}/gptvoice`, {
        method: 'POST',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({ prompt: gptResponse.choices[0].message.content })
      });

      const audioBuffer = await responseVoice.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.play();
      setGPTResponse(prevPrompts => [...prevPrompts, gptResponse.choices[0].message.content]);
      

    } catch (error) {
      console.error("Error: ", error);
    }
    
  }


  return (
    <>
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <div className="bg-gray-300 w-3/6 h-4/6 rounded-xl overflow-scroll p-12">
          {(message.length || gptResponse.length) > 0 &&
            message.map((item, index) => (
              <div key={`msg-${index}`}>
                <div className="chat chat-end mt-5">
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full">
                      <img alt="Tailwind CSS chat bubble component" src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
                    </div>
                  </div>
                  <div className="chat-bubble">{item}</div>
                </div>
  
                {gptResponse.length > index && (
                  <div className="chat chat-start">
                    <div className="chat-image avatar">
                      <div className="w-10 rounded-full">
                        <img alt="Tailwind CSS chat bubble component" src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
                      </div>
                    </div>
                    <div className="chat-bubble">{gptResponse[index]}</div>
                  </div>
                )}
              </div>
            ))}
  
        </div>
  
        <div className="mt-5">
          <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            onClick={run}>
            {recording ? "Stop Talk" : "Start Talk"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Main;
