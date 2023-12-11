const express = require('express');
const path = require('path'); 
const axios = require('axios');
const cors = require('cors');
const OpenAI = require("openai");
const HTTP_PORT = process.env.PORT || 8000; 

const app = express();

require('dotenv').config();


app.use(express.json());
// app.use(express.static(path.join(__dirname + "/public")));

const corsOptions = {
  origin: [
      'https://talktochatgpt-a2cc316d8b34.herokuapp.com/',
      "http://localhost:5173",
      "https://www.talktogpt.pro"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"], // accept HTTP methods list
  allowHeaders: ["Content-Type", "Authorization", "text/plain"] // accept header list
};
app.use(cors(corsOptions));




const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});



app.get('/', async (req, res) => {
  try {
    
    console.log("call");
    const response = await axios.post('https://api.assemblyai.com/v2/realtime/token',
      { expires_in: 3600 },
      { headers: { authorization: process.env.ASSEMBLY_API_KEY } });
    const { data } = response;
    console.log(data); 
    res.json(data);
  } catch (error) {
    const { response: { status, data } } = error;
    res.status(status).json(data);
  }
});

app.post("/gptprompt", async (req, res) => {
  try {
    const userTalk = req.body.chat;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: userTalk }],
      model: "gpt-3.5-turbo",
    });

    res.json(chatCompletion);
  } catch (error) {
    console.error("Error: ", error);
  }

})

app.post("/gptvoice", async (req, res) => {
  try {

    const gptResponse = req.body.prompt; 

    const options = {
      method: 'POST',
      headers: {'Accept': 'audio/mpeg', 'Content-Type': 'application/json', "xi-api-key": process.env.ELEVENLABS_API_KEY},
      body: `{"model_id":"eleven_monolingual_v1","text":"${gptResponse}","voice_settings":{"similarity_boost":0.5,"stability":0.5}}`
    };
    
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', options);
    const audioBuffer = await response.arrayBuffer(); 

    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer)); 
  } catch (error) {
    console.error("Error: ", error);
  }

})


app.listen(HTTP_PORT, () =>{
  console.log(`Server is listening on PORT: ${HTTP_PORT}`); 
});