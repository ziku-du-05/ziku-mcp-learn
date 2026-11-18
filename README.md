# 📄 Ready-to-use `README.md`

নিচের content সরাসরি আপনার project-এর root directory-তে **`README.md`** নামে save করতে পারেন। এটি GitHub README এবং Medium blog—দুই জায়গায় section-by-section ব্যবহার করার মতো করে লেখা হয়েছে।

> Replace the placeholders such as `YOUR_USERNAME`, screenshot paths, repository URL, and author information before publishing.

```md
# 📅 Google Calendar AI Assistant with React, Ollama and MCP

A full-stack AI-powered Google Calendar application built with:

- **React.js** for the frontend
- **Express.js** for the backend
- **Google Calendar API** for calendar data
- **Ollama** for running a local open-source language model
- **Model Context Protocol (MCP)** for standardized AI tool integration

The application displays upcoming Google Calendar events and includes an AI chat interface where users can ask questions such as:

> “What meetings do I have in the next seven days?”

The AI does not access Google Calendar directly. Instead, it calls an MCP tool exposed by a dedicated Google Calendar MCP server.

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Why I Built This Project](#-why-i-built-this-project)
3. [What Is MCP?](#-what-is-mcp)
4. [Features](#-features)
5. [Technology Stack](#-technology-stack)
6. [System Architecture](#-system-architecture)
7. [How the Application Works](#-how-the-application-works)
8. [Project Structure](#-project-structure)
9. [Prerequisites](#-prerequisites)
10. [Google Cloud Configuration](#-google-cloud-configuration)
11. [Project Installation](#-project-installation)
12. [Environment Variables](#-environment-variables)
13. [Running the Application](#-running-the-application)
14. [Testing the Calendar Feature](#-testing-the-calendar-feature)
15. [Testing the MCP Server](#-testing-the-mcp-server)
16. [Testing the AI Assistant](#-testing-the-ai-assistant)
17. [MCP Tool Definition](#-mcp-tool-definition)
18. [REST API Endpoints](#-rest-api-endpoints)
19. [AI Tool-Calling Flow](#-ai-tool-calling-flow)
20. [Loading State](#-loading-state)
21. [Performance and GPU Verification](#-performance-and-gpu-verification)
22. [Common Errors](#-common-errors)
23. [Security Considerations](#-security-considerations)
24. [Current Limitations](#-current-limitations)
25. [Future Improvements](#-future-improvements)
26. [What I Learned](#-what-i-learned)
27. [License](#-license)
28. [Author](#-author)

---

## 🚀 Project Overview

This project demonstrates how to integrate a local AI model with a real-world application using the **Model Context Protocol**.

The application has two main features:

### 1. Google Calendar Event Viewer

The React application connects to a Google account through OAuth 2.0 and displays upcoming events from the user's primary Google Calendar.

Once connected, use **Switch Google Account** next to **Refresh Events** to choose another account. A successful authorization replaces the saved account credentials; cancelling leaves the existing connection unchanged. This demo shares one saved account across all backend users and always displays that account's primary calendar.

### 2. AI Calendar Assistant

The user can ask calendar-related questions through a chat interface.

For example:

```text
Show my events for the next seven days.
```

```text
What is my next meeting?
```

```text
Do I have any meetings tomorrow?
```

```text
Summarize my schedule for this week.
```

The Ollama model identifies when calendar information is required and calls the appropriate MCP tool.

---

## 💡 Why I Built This Project

Traditional AI integrations often connect models to databases and APIs using custom functions.

This approach works, but every AI application may require a separate integration layer.

MCP provides a standardized interface between:

```text
AI applications
       ↓
MCP clients
       ↓
MCP servers
       ↓
External tools, APIs and data sources
```

In this project, Google Calendar is exposed as an MCP tool. The AI host discovers that tool and allows the Ollama model to use it.

---

## 🧠 What Is MCP?

**MCP stands for Model Context Protocol.**

It is an open protocol that allows AI applications to connect to external:

- APIs
- Databases
- File systems
- Business services
- Developer tools
- Local applications

An MCP server can expose three primary capabilities:

| Capability | Purpose |
|---|---|
| **Tools** | Functions that an AI model can call |
| **Resources** | Data or context an application can read |
| **Prompts** | Reusable prompt templates and workflows |

This project uses an MCP tool named:

```text
list_calendar_events
```

The tool retrieves upcoming events from the connected user's primary Google Calendar.

---

## ✨ Features

- Google OAuth 2.0 authentication
- Read-only access to Google Calendar
- Upcoming calendar event listing
- Support for recurring events
- React-based responsive user interface
- Local AI integration through Ollama
- MCP server over the `stdio` transport
- MCP client inside the Express backend
- Automatic MCP tool discovery
- AI function/tool calling
- Bengali and English prompt support
- AI loading and typing indicators
- Ollama performance measurement
- GPU usage verification
- Read-only and non-destructive MCP tool

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js and Vite |
| Backend | Node.js and Express.js |
| AI model runtime | Ollama |
| AI model | Configurable Ollama tool-capable model |
| AI tool protocol | Model Context Protocol |
| MCP transport | Standard input/output (`stdio`) |
| External API | Google Calendar API |
| Authentication | Google OAuth 2.0 |
| Validation | Zod |
| Styling | CSS |
| Language | JavaScript |

---

## 🏗 System Architecture

```text
┌─────────────────────────────────┐
│ React Application               │
│                                 │
│ ├── Calendar Event List         │
│ ├── Google Connect Button       │
│ └── AI Chat Interface           │
└────────────────┬────────────────┘
                 │ HTTP
                 ▼
┌─────────────────────────────────┐
│ Express Backend / MCP Host      │
│                                 │
│ ├── Google OAuth Routes         │
│ ├── Calendar REST API           │
│ ├── Ollama Client               │
│ └── MCP Client                  │
└─────────┬──────────────┬────────┘
          │              │ stdio
          │              ▼
          │    ┌────────────────────────┐
          │    │ Calendar MCP Server    │
          │    │                        │
          │    │ list_calendar_events  │
          │    └────────────┬───────────┘
          │                 │
          └─────────────────┤
                            ▼
                 ┌──────────────────────┐
                 │ Calendar Service     │
                 │ google-calendar.js   │
                 └──────────┬───────────┘
                            │ HTTPS
                            ▼
                 ┌──────────────────────┐
                 │ Google Calendar API  │
                 └──────────────────────┘
```

---

## 🔄 How the Application Works

### Calendar event listing flow

```text
React application
       ↓
GET /api/calendar/events
       ↓
Express backend
       ↓
Google Calendar service
       ↓
Google Calendar API
       ↓
Calendar events
       ↓
React event cards
```

### AI assistant flow

```text
User enters a calendar question
       ↓
React sends POST /api/chat
       ↓
Express backend sends the question to Ollama
       ↓
Ollama decides to call list_calendar_events
       ↓
MCP client calls the Calendar MCP server
       ↓
MCP server calls the Google Calendar service
       ↓
Google Calendar API returns events
       ↓
MCP result is returned to Ollama
       ↓
Ollama generates a natural-language answer
       ↓
React displays the answer
```

A calendar question normally requires two model calls:

1. The first model call selects the MCP tool.
2. The second model call generates the final answer from the tool result.

---

## 📁 Project Structure

```text
calendar-mcp-app/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBox.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── mcp/
│   │   │   └── calendar-server.js
│   │   ├── ai-host.js
│   │   ├── google-calendar.js
│   │   └── index.js
│   ├── .env
│   ├── token.json
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

### Important files

| File | Responsibility |
|---|---|
| `client/src/App.jsx` | Displays Google Calendar events |
| `client/src/components/ChatBox.jsx` | Provides the AI chat interface |
| `server/src/index.js` | Express routes and OAuth callbacks |
| `server/src/google-calendar.js` | Google OAuth and Calendar API logic |
| `server/src/mcp/calendar-server.js` | Exposes Calendar functionality through MCP |
| `server/src/ai-host.js` | Connects Ollama with the MCP client |
| `server/token.json` | Stores local OAuth tokens for the demo |

---

## ✅ Prerequisites

Before running the project, install or configure:

- Node.js
- npm
- Ollama
- A tool-capable Ollama model
- A Google account with Google Calendar
- A Google Cloud project
- Google Calendar API access

Verify Node.js:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

Verify Ollama:

```bash
ollama --version
```

Install a tool-capable model:

```bash
ollama pull qwen3
```

Check installed models:

```bash
ollama list
```

---

## ☁️ Google Cloud Configuration

### Step 1: Create a Google Cloud project

1. Open Google Cloud Console.
2. Create a new project.
3. Give the project a descriptive name.

Example:

```text
Calendar MCP App
```

### Step 2: Enable Google Calendar API

Navigate to:

```text
APIs & Services
→ Library
→ Google Calendar API
→ Enable
```

### Step 3: Configure the OAuth consent screen

Navigate to:

```text
Google Auth Platform
→ Branding
```

Configure:

- Application name
- User support email
- Developer contact information

For personal Gmail accounts, select:

```text
Audience: External
Publishing status: Testing
```

### Step 4: Add a test user

Navigate to:

```text
Google Auth Platform
→ Audience
→ Test users
```

Add the exact Google account that will be used to connect the calendar.

If the test user is not added, Google may show:

```text
Access blocked:
Calendar-mcp-app has not completed the Google verification process
```

### Step 5: Configure Calendar scope

The project requests this read-only scope:

```text
https://www.googleapis.com/auth/calendar.readonly
```

This allows the application to read calendar events without creating, modifying or deleting them.

### Step 6: Create an OAuth client

Navigate to:

```text
Google Auth Platform
→ Clients
→ Create Client
```

Select:

```text
Application type: Web application
```

Add this authorized redirect URI:

```text
http://localhost:4000/auth/google/callback
```

The redirect URI must exactly match the value used by the backend.

---

## 📦 Project Installation

### Step 1: Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/calendar-mcp-app.git
cd calendar-mcp-app
```

### Step 2: Install frontend dependencies

```bash
cd client
npm install
```

### Step 3: Install backend dependencies

```bash
cd ../server
npm install
```

If dependencies are not already listed in `package.json`, install them manually:

```bash
npm install express cors dotenv express-session googleapis ollama zod
```

Install the MCP packages:

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/client
```

---

## 🔐 Environment Variables

### Backend environment

Create:

```text
server/.env
```

Add:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback

SESSION_SECRET=replace_with_a_long_random_secret

OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3
```

### Frontend environment

Create:

```text
client/.env
```

Add:

```env
VITE_API_URL=http://localhost:4000
```

Restart the Vite development server after changing environment variables.

### Generate a session secret

You can generate a random session secret with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🙈 Git Ignore Configuration

Create or update the root `.gitignore` file:

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
client/.env
server/.env

# Google OAuth tokens
server/token.json

# Logs
*.log
npm-debug.log*

# Operating system files
.DS_Store
Thumbs.db
```

Never commit:

- Google client secrets
- Session secrets
- Access tokens
- Refresh tokens
- `token.json`

---

## ▶️ Running the Application

The application requires three running components:

1. Ollama
2. Express backend
3. React frontend

### Terminal 1: Start Ollama

Depending on your installation, Ollama may already be running.

If necessary:

```bash
ollama serve
```

Verify that the selected model exists:

```bash
ollama list
```

### Terminal 2: Start the backend

```bash
cd server
npm run dev
```

Expected output:

```text
Backend running on http://localhost:4000
```

The backend starts the MCP server automatically when the MCP client connects.

Do not manually start the MCP server for the regular application flow.

### Terminal 3: Start React

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 📅 Testing the Calendar Feature

### Step 1: Connect Google Calendar

Open the React application and click:

```text
Connect Google Calendar
```

### Step 2: Select the test account

Choose the same account that was added to the Google Cloud test-user list.

### Step 3: Allow read-only Calendar access

After authorization, Google redirects to:

```text
http://localhost:4000/auth/google/callback
```

The Express backend exchanges the authorization code for tokens and redirects the browser to:

```text
http://localhost:5173
```

### Step 4: Verify events

The application should display events from the upcoming configured period.

Each event may include:

- Event title
- Start date and time
- End date and time
- Location
- Description
- Link to Google Calendar

---

## 🔌 Testing the MCP Server

The MCP server can be tested independently with MCP Inspector.

From the `server` directory, run:

```bash
npx @modelcontextprotocol/inspector node src/mcp/calendar-server.js
```

In MCP Inspector:

1. Connect to the server.
2. Open the **Tools** section.
3. Select `list_calendar_events`.
4. Enter:

```json
{
  "days": 7,
  "maxResults": 10
}
```

5. Run the tool.

Example result:

```json
{
  "searchPeriodDays": 7,
  "count": 2,
  "events": [
    {
      "id": "calendar-event-id",
      "title": "Project Meeting",
      "start": "2026-11-20T10:00:00+06:00",
      "end": "2026-11-20T11:00:00+06:00",
      "location": "Google Meet"
    }
  ]
}
```

### Important stdio rule

The MCP server uses standard input and output as its protocol channel.

Do not use:

```javascript
console.log("Debug message");
```

Use standard error for logging:

```javascript
console.error("Debug message");
```

Writing regular logs to standard output can corrupt the MCP protocol stream.

---

## 🤖 Testing the AI Assistant

After connecting Google Calendar, try these prompts:

```text
Show my calendar events for the next seven days.
```

```text
What is my next meeting?
```

```text
Do I have any events tomorrow?
```

```text
আগামী সাত দিনে আমার কী কী ইভেন্ট আছে?
```

```text
আমার পরবর্তী মিটিং কখন?
```

```text
Summarize my schedule for the next 30 days.
```

The expected flow is:

```text
User question
→ Ollama
→ MCP tool selection
→ Google Calendar API
→ Tool result
→ Ollama final answer
→ React chat interface
```

---

## 🧰 MCP Tool Definition

The project exposes this tool:

```text
list_calendar_events
```

### Tool purpose

Returns upcoming events from the connected user's primary Google Calendar.

### Input schema

```json
{
  "days": {
    "type": "integer",
    "minimum": 1,
    "maximum": 365,
    "default": 30
  },
  "maxResults": {
    "type": "integer",
    "minimum": 1,
    "maximum": 100,
    "default": 20
  }
}
```

### Example tool call

```json
{
  "name": "list_calendar_events",
  "arguments": {
    "days": 7,
    "maxResults": 20
  }
}
```

### Tool annotations

The tool is defined as:

- Read-only
- Non-destructive
- Idempotent
- Connected to an external service

Conceptual configuration:

```javascript
annotations: {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
}
```

---

## 🌐 REST API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Checks backend status |
| `GET` | `/api/auth/status` | Checks Google connection status |
| `GET` | `/auth/google` | Starts Google OAuth |
| `GET` | `/auth/google/callback` | Handles Google OAuth callback |
| `GET` | `/api/calendar/events` | Returns upcoming events |
| `POST` | `/api/chat` | Sends a message to the AI assistant |

### Calendar events request

```http
GET /api/calendar/events?days=30
```

Example response:

```json
{
  "success": true,
  "count": 2,
  "events": [
    {
      "id": "event-id",
      "title": "Project Meeting",
      "start": "2026-11-20T10:00:00+06:00",
      "end": "2026-11-20T11:00:00+06:00",
      "location": "Online"
    }
  ]
}
```

### AI chat request

```http
POST /api/chat
Content-Type: application/json
```

Request:

```json
{
  "message": "Show my events for the next seven days.",
  "timezone": "Asia/Dhaka"
}
```

Response:

```json
{
  "success": true,
  "answer": "You have two upcoming events in the next seven days."
}
```

---

## 🔁 AI Tool-Calling Flow

The Express backend acts as the MCP host.

Its responsibilities are:

1. Start the Calendar MCP server as a child process.
2. Connect through an MCP client.
3. Discover available MCP tools.
4. Convert MCP tool schemas into Ollama tool definitions.
5. Send the tools and user question to Ollama.
6. Receive tool-call requests from the model.
7. Execute the requested tool through the MCP client.
8. Return the tool result to Ollama.
9. Return the final AI response to React.

Simplified pseudocode:

```javascript
const { tools } = await mcpClient.listTools();

const response = await ollama.chat({
  model: process.env.OLLAMA_MODEL,
  messages,
  tools: convertMcpToolsToOllamaTools(tools),
});

if (response.message.tool_calls?.length) {
  const toolResult = await mcpClient.callTool({
    name: toolName,
    arguments: toolArguments,
  });

  messages.push({
    role: "tool",
    tool_name: toolName,
    content: JSON.stringify(toolResult),
  });

  // Ask Ollama to create the final response.
}
```

---

## ⏳ Loading State

While the AI is processing a request, the React chat interface:

- Displays an animated spinner
- Shows an “Assistant is thinking” message
- Displays animated typing dots
- Disables the input field
- Disables the Send button
- Prevents duplicate requests

The state is managed with:

```javascript
const [isLoading, setIsLoading] = useState(false);
```

Before the request:

```javascript
setIsLoading(true);
```

After success or failure:

```javascript
finally {
  setIsLoading(false);
}
```

The visual indicator is conditionally rendered:

```jsx
{isLoading && (
  <div className="chat-message assistant loading-message">
    <span className="spinner" />
    <strong>Assistant is thinking</strong>
  </div>
)}
```

---

## ⚡ Performance and GPU Verification

### Check the Ollama processor

Send a chat request, then run:

```bash
ollama ps
```

Check the `PROCESSOR` column.

| Processor output | Meaning |
|---|---|
| `100% GPU` | The model is fully loaded on the GPU |
| `100% CPU` | The model is running on the CPU |
| Mixed CPU/GPU | The model is partially offloaded to the GPU |

### NVIDIA GPU monitoring

For NVIDIA GPUs:

```bash
nvidia-smi
```

Continuous monitoring:

```bash
nvidia-smi -l 1
```

Check:

- GPU utilization
- VRAM usage
- Ollama process
- Temperature
- Power usage

### Keep the model loaded

To reduce cold-start time:

```javascript
const response = await ollama.chat({
  model: process.env.OLLAMA_MODEL,
  messages,
  tools,

  keep_alive: "30m",
  stream: false,
});
```

### Disable unnecessary reasoning

For simple calendar queries, a supported model can be configured with:

```javascript
think: false
```

Example:

```javascript
const response = await ollama.chat({
  model: process.env.OLLAMA_MODEL,
  messages,
  tools,

  think: false,
  keep_alive: "30m",

  options: {
    num_ctx: 4096,
    num_predict: 300,
    temperature: 0.2,
  },

  stream: false,
});
```

### Measure every stage

The application can measure:

```text
Ollama tool-selection time
MCP tool execution time
Google Calendar API time
Ollama final-answer time
```

Example log:

```text
Ollama round 1: 3200 ms
MCP tool "list_calendar_events": 720 ms
Ollama round 2: 4100 ms
```

This makes it easier to identify whether the bottleneck is:

- Model inference
- Model loading
- Google API
- MCP communication
- Final answer generation

---

## 🚧 Common Errors

### 1. Google app verification error

Error:

```text
Access blocked:
Calendar-mcp-app has not completed the Google verification process
```

Solution:

```text
Google Auth Platform
→ Audience
→ Test users
→ Add the Google account
→ Save
```

Use the exact same Google account when connecting the calendar.

---

### 2. Redirect URI mismatch

Error:

```text
redirect_uri_mismatch
```

Verify that both Google Cloud and `server/.env` contain:

```text
http://localhost:4000/auth/google/callback
```

The following values must match exactly:

- Protocol
- Hostname
- Port
- Callback path
- Trailing slash

---

### 3. Google Calendar is not connected

Delete the old local token:

#### Windows PowerShell

```powershell
Remove-Item token.json -ErrorAction SilentlyContinue
```

#### macOS or Linux

```bash
rm -f token.json
```

Restart the backend and reconnect Google Calendar.

---

### 4. Ollama connection refused

Verify that Ollama is running:

```bash
ollama list
```

If necessary:

```bash
ollama serve
```

Confirm the backend configuration:

```env
OLLAMA_HOST=http://127.0.0.1:11434
```

---

### 5. Model does not call the MCP tool

Possible causes:

- The selected model does not support tool calling well.
- Tool description is unclear.
- The user prompt is ambiguous.
- The MCP client is not connected.
- The tool input schema is invalid.

Use a clear tool description:

```javascript
description:
  "List upcoming events from the connected user's primary Google Calendar."
```

---

### 6. MCP protocol parsing error

Do not write debug messages to standard output inside the MCP server:

```javascript
console.log("MCP server started"); // Avoid
```

Use:

```javascript
console.error("MCP server started"); // Correct
```

---

### 7. First AI request is slow

The first request may include:

```text
Model loading
+ Prompt processing
+ Tool selection
+ Google Calendar API request
+ Final response generation
```

Use `keep_alive` and compare the first request with the second request.

---

## 🔒 Security Considerations

This repository is designed as a local, single-user learning project.

### Implemented safeguards

- Read-only Google Calendar scope
- OAuth state validation
- HTTP-only session cookie
- Input validation
- MCP tool argument validation
- Non-destructive MCP tool
- Chat message length limit
- Secrets stored in environment variables
- OAuth tokens excluded from Git

### Never expose these values

```text
GOOGLE_CLIENT_SECRET
SESSION_SECRET
Access tokens
Refresh tokens
token.json
```

### Recommended production protections

A production application should include:

- Application-level user authentication
- HTTPS
- Secure cookies
- Persistent session storage
- Encrypted OAuth token storage
- Per-user Google tokens
- Rate limiting
- Request logging
- Audit logging
- Token revocation
- Content Security Policy
- Strict CORS rules
- Tool authorization
- User confirmation for destructive actions

---

## ⚠️ Current Limitations

This version is intended for local development and learning.

### Single-user token storage

The project stores Google OAuth tokens in:

```text
server/token.json
```

This means the current version supports one Google account at a time.

It is not suitable for a public multi-user deployment.

### No persistent conversation history

The React application keeps messages in component state. Refreshing the page clears the chat history.

### Read-only calendar operations

The current MCP server can only list events.

It cannot:

- Create events
- Update events
- Delete events
- Accept meeting invitations

### No streaming AI response

The AI answer is shown after the complete Ollama response is generated.

---

## 🗺 Future Improvements

Planned improvements include:

- User registration and login
- Per-user encrypted Google OAuth tokens
- Database integration
- AI response streaming
- Chat history persistence
- Multiple Google Calendar support
- Date-range filtering
- Calendar selection
- Event search
- Event creation through MCP
- Event update and cancellation
- User confirmation before write operations
- Better timezone handling
- Docker support
- Production deployment configuration
- Automated tests
- Mobile-friendly interface
- Voice-based calendar queries

### Possible future MCP tools

```text
list_calendar_events
get_calendar_event
search_calendar_events
create_calendar_event
update_calendar_event
delete_calendar_event
find_available_time
```

Any write operation should require explicit user confirmation.

---

## 📚 What I Learned

This project helped demonstrate several important software-development concepts:

### 1. MCP is not an AI model

MCP is a protocol that connects an AI application to external tools and data.

### 2. The backend acts as the MCP host

The Express backend manages:

- Ollama
- MCP client connection
- Tool discovery
- Tool execution
- Tool result processing

### 3. MCP does not replace REST

The React event list uses REST:

```text
React → Express REST API → Google Calendar
```

The AI assistant uses MCP:

```text
Ollama → MCP Client → MCP Server → Google Calendar
```

Both interfaces reuse the same Calendar service.

### 4. Business logic should not be duplicated

The Google Calendar API logic exists in one service:

```text
google-calendar.js
```

It is reused by:

```text
Express REST routes
        +
Calendar MCP tools
```

### 5. Tool calling usually needs multiple model requests

The model first selects a tool and then creates a response from the tool result.

### 6. Local AI performance depends on hardware

Performance is affected by:

- Model size
- Quantization
- Available VRAM
- CPU/GPU offloading
- Context size
- Output length
- Model loading
- Reasoning configuration

---

## 📸 Screenshots

Add screenshots after placing image files in a `docs/images` directory.

### Calendar event list

```md
![Calendar Event List](docs/images/calendar-events.png)
```

### Google OAuth connection

```md
![Google OAuth](docs/images/google-oauth.png)
```

### AI chat assistant

```md
![Calendar AI Assistant](docs/images/ai-chat.png)
```

### AI loading state

```md
![AI Loading State](docs/images/ai-loading.png)
```

### MCP Inspector

```md
![MCP Inspector](docs/images/mcp-inspector.png)
```

### Ollama GPU usage

```md
![Ollama GPU Usage](docs/images/ollama-gpu.png)
```

---

## 🧪 Suggested Demo Scenario

For a project demonstration:

1. Start Ollama.
2. Start the Express backend.
3. Start the React frontend.
4. Connect a test Google account.
5. Display upcoming Calendar events.
6. Open MCP Inspector and run the Calendar tool.
7. Ask the AI:

```text
Show my events for the next seven days.
```

8. Display the AI loading indicator.
9. Show the generated Calendar summary.
10. Run `ollama ps` to demonstrate GPU or CPU usage.

---

## 📖 Useful Documentation

For additional learning, refer to the official documentation for:

- Model Context Protocol
- MCP TypeScript SDK
- MCP Inspector
- Ollama tool calling
- Ollama JavaScript library
- Google Calendar API
- Google OAuth 2.0
- React
- Vite
- Express.js

Always check the current documentation because SDK APIs and package versions can change.

---

## 📄 License

This project is licensed under the MIT License.

Create a `LICENSE` file containing the MIT License before publishing the repository.

---

## 👤 Author

**Md Saidul Islam Ziku**

Software developer learning and building applications with:

- React
- Node.js
- Local AI models
- Model Context Protocol
- Google APIs

### Connect

- GitHub: `https://github.com/ziku-du-05/ziku-mcp-learn`
- Medium: `https://medium.com/@determind15ziku`
- LinkedIn: `https://linkedin.com/in/ziku15`

---

## ⭐ Support

If this project helped you understand MCP and local AI integration:

- Star the repository
- Share the article
- Report issues
- Suggest improvements
- Build your own MCP server

---

## 📝 Final Summary

This project connects a React application, an Express backend, Google Calendar, Ollama and MCP into one end-to-end AI application.

The main architecture is:

```text
React
→ Express MCP Host
→ Ollama
→ MCP Client
→ Calendar MCP Server
→ Google Calendar API
```

The most important lesson is:

> MCP provides a standardized bridge between AI applications and external tools, while existing application services continue to manage the actual business and API logic.
```

---

# ✍️ Medium Blog Section Order

Medium-এ README হুবহু paste না করে নিচের article flow ব্যবহার করলে বেশি readable হবে:

| Section | Medium heading |
|---|---|
| 1 | **Building a Google Calendar AI Assistant with React, Ollama and MCP** |
| 2 | **What We Are Going to Build** |
| 3 | **Why MCP Matters** |
| 4 | **Understanding the Architecture** |
| 5 | **Setting Up React and Express** |
| 6 | **Connecting Google Calendar with OAuth 2.0** |
| 7 | **Displaying Calendar Events in React** |
| 8 | **Building the Google Calendar MCP Server** |
| 9 | **Connecting the MCP Client to Ollama** |
| 10 | **Adding the AI Chat Interface** |
| 11 | **Understanding the End-to-End Tool-Calling Flow** |
| 12 | **Adding an AI Loading State** |
| 13 | **Measuring Performance and GPU Usage** |
| 14 | **Common Problems and Solutions** |
| 15 | **Security and Production Limitations** |
| 16 | **What I Learned** |
| 17 | **Conclusion and Next Steps** |

### Suggested Medium subtitle

> Learn how to connect a React application to Google Calendar and let a local Ollama model access events through the Model Context Protocol.

### Suggested tags

```text
Model Context Protocol
Ollama
React
Artificial Intelligence
Google Calendar
```

## ✅ Before publishing

- Replace every `YOUR_USERNAME`
- Add actual screenshots
- Remove secrets and `token.json`
- Verify installation commands from a fresh clone
- Add a `LICENSE` file
- Add repository and Medium profile links
- Mention clearly that it is a **single-user local demo**

The MCP package names and stdio usage in this README align with the current official TypeScript SDK documentation; the SDK separates server and client into `@modelcontextprotocol/server` and `@modelcontextprotocol/client`. ([github.com](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/README.md?utm_source=openai)) Google’s official Calendar documentation confirms the read-only Calendar scope and the `events.list` approach used by the project. ([developers.google.com](https://developers.google.com/workspace/calendar/api/quickstart/nodejs?utm_source=openai)) Vite’s current documentation lists Node.js `20.19+` or `22.12+` for current releases. ([vite.dev](https://vite.dev/guide/?utm_source=openai))