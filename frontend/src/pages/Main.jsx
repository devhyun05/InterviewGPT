import { useState } from 'react'; 

const Main = () => {
    let [recording, setRecording] = useState(false); 
    let [socket, setSocket] = useState();
    let [recorder, setRecorder] = useState(); 
    let [message, setMessage] = useState(""); 
    const run = async () => {
        if (recording) {
            if (socket) {
                socket.send(JSON.stringify({ terminate_session: true}));
                socket.close();
                socket = null; 
            }

            if (recorder) {
                recorder.pauseRecording();
                recorder = null;
            }
        } else {
            const response = await fetch("http://localhost:8000");
            const data = await response.json();

            if (data.error) {
                alert(data.error);
                return; 
            }

            const { token } = data; 

            socket = await new WebSocket(
                `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`,
            );

            // handle incoming messages to display transcription to user
            const texts = {};
            socket.onmessage = (message) => {
                let msg = "";
                const res = JSON.parse(message.data);
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

            socket.onerror = (event) => {
                console.error(event);
                socket.close(); 
            };

            socket.onclose = (event) => {
                console.log(event);
                socket = null; 
            };

            
        }
    }
    return (
        <>

        </>
    )
}

export default Main; 
