
## TalkToGPT

TalkToGPT is a website designed to enhance English speaking skills by utilizing chatGPT. It recognizes the 
user's voice, sends it to GPT, and GPT responds with synthesized voice using a voice API.


## Tech Stack

**Frontend:** React, Tailwind CSS

**Backend:** Node, Express

**Others:** assembly API, openAI API, elevenlabs API

## Pre-requisite

To run this project, you will need to add the following environment variables to your .env file


`OPENAI_API_KEY=""`

`ASSEMBLY_API_KEY=""`

`ELEVENLABS_API_KEY=""`



## Run Locally


Install dependencies

```bash
  cd backend && npm install
  cd frontend && npm install
```

Start the server and run the program
```bash
  cd backend 
  node server.js
```

Start the frontend 

```bash
  cd frontend
  npm run dev
```




