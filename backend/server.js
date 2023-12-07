const express = require('express');
// const OpenAI = require("openai");
const axios = require('axios');
const cors = require('cors');
const app = express();



app.use(express.json());
app.use(cors()); 

require('dotenv').config(); 
// const openai = new OpenAI({
//     apiKey: "process.env"
// }); 

// async function main() {
//     const chatCompletion = await openai.chat.completions.create({
//         messages: [{role: "user", content: "Hello"}], 
//         model: "gpt-3.5-turbo",
//     });
//     console.log(chatCompletion.choices[0]);
// }

// main(); 

app.get('/', async (req, res) => {
    try {
      const response = await axios.post('https://api.assemblyai.com/v2/realtime/token', 
        { expires_in: 3600 },
        { headers: { authorization: process.env.ASSEMBLY_API_KEY } });
      const { data } = response;
      res.json(data);
    } catch (error) {
      const {response: {status, data}} = error;
      res.status(status).json(data);
    }
  });
  
  app.set('port', 8000);
  const server = app.listen(app.get('port'), () => {
    console.log(`Server is running on port ${server.address().port}`);
  });