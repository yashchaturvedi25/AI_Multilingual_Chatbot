const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");
const chatbox = document.querySelector(".chatbox");
const voiceButton = document.querySelector("#voice-input-btn");

let userMessage = "";
const inputInitHeight = chatInput.scrollHeight;

// Text-to-Speech (TTS) setup
const synth = window.speechSynthesis;

// Speech Recognition Setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-GB";
recognition.continuous = false;
recognition.interimResults = false;

// OpenAI API Credentials (Don't hardcode in production!)
const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "check"//replace with your openai api key

// Function to create chat messages
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing"
        ? `<p></p>`
        : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
};

// Function to make the chatbot speak
const speakResponse = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.rate = 1; // Normal speaking rate
    synth.speak(utterance);
};

// Function to fetch response from OpenAI
const generateResponse = async (incomingChatLi) => {
    const messageElement = incomingChatLi.querySelector("p");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }],
        }),
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        console.log("API Response:", data); // Debugging API response

        if (data.choices && data.choices.length > 0) {
            const botResponse = data.choices[0].message.content.trim();
            messageElement.textContent = botResponse;
            speakResponse(botResponse);
        } else {
            throw new Error("Invalid response from API");
        }
    } catch (error) {
        console.error("Error fetching API response:", error);
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
        speakResponse("Oops! Something went wrong. Please try again.");
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
};

// Function to handle user input
const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Append user message to chat
    const outgoingChatLi = createChatLi(userMessage, "outgoing");
    chatbox.appendChild(outgoingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Add chatbot response after a short delay
    setTimeout(() => {
        const incomingChatLi = createChatLi("Typing...", "incoming");
        chatbox.appendChild(incomingChatLi);
        generateResponse(incomingChatLi);
    }, 600);
};

// Adjust textarea height dynamically
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Send message on Enter key press
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});

// Event listeners for buttons
sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

// Voice input functionality
voiceButton.addEventListener("click", () => {
    recognition.start();
});

recognition.onresult = (event) => {
    userMessage = event.results[0][0].transcript;
    chatInput.value = userMessage;
    handleChat();
};

recognition.onerror = (event) => {
    console.error("Speech Recognition Error: ", event.error);
};
