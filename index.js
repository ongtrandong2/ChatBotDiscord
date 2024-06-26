require('dotenv/config');
const { Client } = require("discord.js");
const axios = require('axios');
const express = require('express');
const app = express();


app.listen(process.env.PORT || 3000, () => {
    console.log("server started");
});

app.post("/return", async (req, res) => {
    console.log("return");
    res.send("Bot has been invited to the channel.");
});

const client = new Client({
    intents:['Guilds','GuildMembers','GuildMessages','MessageContent']
});


client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

const IGNORE_PREFIX = "!b";

const CHANNELS = ["1225835289960779871","1225835289960779872","1226524002588033131"];


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!CHANNELS.includes(message.channel.id) && !message.mentions.has(client.user.id)) return;
    const optionReturn = {
        method: 'POST',
        url: 'https://chatbotdiscord-xoeb.onrender.com/return',
      };
    if (message.content.trim() === "!inv") {
        const responseReturn = await axios.request(optionReturn).catch((error) => console.error("OpenAI Error:\n",error));
        message.reply(responseReturn.data);
        console.log(responseReturn.data);
        return;
    }
    if (!message.content.startsWith(IGNORE_PREFIX)) return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    conversation.push({role: "system", content: "Chào Đông và những người bạn của Đông, Tôi có thể giúp gì cho bạn hôm nay?"});

    let previousMessage = await message.channel.messages.fetch({limit: 10});
    previousMessage.reverse();
    previousMessage.forEach((msg) => {
        if(msg.author.bot && msg.author.id !== client.user.id)
            return;
        if(msg.content.startsWith(IGNORE_PREFIX))
            return;

        const userName = msg.author.username.replace(/[^a-zA-Z0-9]/g, '');

        if(msg.author.id === client.user.id){
            conversation.push({role: "system",name: userName, content: msg.content});
            return;
        }
        
        conversation.push({role: "user",name: userName, content: msg.content});
    });

    const options = {
        method: 'POST',
        url: 'https://chatgpt-42.p.rapidapi.com/geminipro',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': 'e486906368mshe1a17a4be58f4a7p18c8d6jsn3e2257ae96a9',
            'X-RapidAPI-Host': 'chatgpt-42.p.rapidapi.com'
        },
        data: {
          messages: conversation,
          system_prompt: '',
          temperature: 0.9,
          top_k: 5,
          top_p: 0.9,
          max_tokens: 256,
          web_access: false
        }
      };
    const response = await axios.request(options).catch((error) => console.error("OpenAI Error:\n",error));
    clearInterval(sendTypingInterval);
    if(!response){
        message.reply("Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này. Hãy thử lại sau.");
        return;
    }
    console.log(response.data.result);
    message.reply(response.data.result)
});
client.login(process.env.TOKEN);