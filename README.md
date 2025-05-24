# Edvent Chat - Real-time Chat Service with Node.js & Socket.IO

[![Node.js](https://img.shields.io/badge/Node.js-22.13-4F39F6)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-4F39F6)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📌 Overview

**Edvent Chat** is a real-time chat service built with Node.js (Express) and Socket.IO. It is designed to enable quick and secure communication between students and support teachers on online education platforms.

The project features JWT-based user authentication, MongoDB as the database, and integrates with a Django API to fetch the support teacher’s ID dynamically.

It is tightly integrated with the [Edvent Service](https://github.com/dilshod1405/edvent-service) — the main education platform.

---

## 🚀 Features

- Real-time WebSocket chat with Socket.IO  
- JWT authentication for secure socket connections  
- MongoDB for storing chat messages  
- Integration with Django API to retrieve support teacher IDs  
- Docker and Docker Compose support for easy deployment  

---

## ⚙️ Getting Started

### Prerequisites

- Docker & Docker Compose installed  
- Git installed  
- A `.env` file with environment variables set (see below)  

---

### Setup & Run

1. Clone the repository:

    ```bash
    git clone https://github.com/dilshod1405/edvent-chat.git
    cd edvent_chat
    ```

2. Create and fill in the `.env` file:

    ```env
    MONGO_URI=mongodb://mongo:27017/edvent_chat
    PORT=5000
    DJANGO_API_URL=http://your-django-api-url
    JWT_SECRET=your_jwt_secret_key (django secret key)
    ```

3. Start the services with Docker Compose:

    ```bash
    docker-compose up -d --build
    ```

4. The chat server will be running at:

    ```
    http://localhost:5000
    ```

---

## 🛠️ Project Structure

```
├── config
│   └── db.js               # MongoDB connection config
├── middleware
│   └── auth.js             # JWT socket authentication middleware
├── models
│   └── Message.js          # MongoDB schema for chat messages
├── routes
│   └── index.js            # Express API routes
├── server.js               # Main server entrypoint
├── Dockerfile              # Docker image build config
├── docker-compose.yml      # Docker Compose config for containers
├── .env                    # Environment variables file
└── README.md               # This documentation file
```

---

## 📦 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

---

## 📡 Socket.IO Events

### 🔑 Authentication Middleware

Each connection must include a valid JWT in the handshake query:

```js
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### 📤 `send_message`

Send a message to a support teacher.

**Client emits:**

```json
{
  "content": "Hello, I need help!"
}
```

**Server responds (to sender and receiver):**

```json
{
  "content": "Hello, I need help!",
  "senderId": "USER_ID",
  "receiverId": "SUPPORT_ID",
  "timestamp": "2025-05-24T12:00:00.000Z",
  "lessonId": "LESSON_ID"
}
```

### 📥 `new_message`

This event is emitted by the server when a new message is sent or received.

---

## 🔐 Security Notes

- Keep your JWT secret and MongoDB URI private and **do not commit `.env` files to GitHub**.  
- Secure your Django API with proper authentication and HTTPS.  
- Validate and sanitize all user inputs on both client and server side.

---

## 👨‍💻 Author

Dilshod  
[GitHub Profile](https://github.com/dilshod1405)

---

## 📄 License

This project is licensed under the MIT License.

---

### Enjoy real-time chatting with Edvent Chat! 🚀