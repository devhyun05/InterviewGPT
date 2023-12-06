const express = require('express');
const OpenAI = require("openai");
const axios = require('axios');
const cors = require('cros');

const openai = new OpenAI({
    apiKey: "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"
}); 

async function main() {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{role: "user", content: "Hello"}], 
        model: "gpt-3.5-turbo",
    });
    console.log(chatCompletion.choices[0]);
}

main(); 
