
# Seeker: AI Agent-based Research Application

<h3 align="center">An autonomous AI agent to assist journalists, lawyers, and academic researchers with complex research tasks, providing structured answers with clear citations and provenance.</h3>

## Introduction

In professions like journalism, law, and academic research, the ability to quickly gather, synthesize, and cite information from vast sources is critical. Traditional search methods are often time-consuming and linear. **Seeker** is an advanced research assistant powered by the Google Gemini API, designed to automate and enhance this process.

Seeker acts as an autonomous agent that interprets complex user queries, plans a multi-step research workflow, utilizes various tools (like document and web search), and synthesizes the findings into a structured, well-cited response. It's built to be a reliable partner for professionals who demand accuracy, transparency, and efficiency in their research.

## Key Features

-   **Autonomous AI Agent**: Interprets natural language requests and plans a multi-step research strategy.
-   **Cited & Verifiable Answers**: Provides answers with clear citations, including source, page/paragraph, and date, to ensure provenance and trust.
-   **Transparent Process**: Features a **Trace View** that shows the AI's exact plan and execution steps, allowing for full auditability of the research process.
-   **Long-Term Memory**: Remembers context across sessions to personalize the experience and build upon previous research.
-   **Multi-Tool Capability**: Designed to use a suite of tools, including internal document retrieval and external web searches, to gather comprehensive information.
-   **Secure & Private**: Built on Firebase for secure user authentication and data storage.
-   **Modern UI/UX**: A clean, responsive, and intuitive interface with both **Light and Dark modes**, designed for focus and productivity.
-   **Session Management**: Organizes research into distinct, titled sessions that can be revisited or deleted.

## Tech Stack

-   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore for data storage)
-   **AI Model**: [Google Gemini API](https://ai.google.dev/) (using `gemini-2.5-pro`)
-   **Development/Build**: [Vite](https://vitejs.dev/)

## Project Structure

The project is organized into a standard React application structure:

```
/
├── app/
│   ├── components/      # Reusable React components
│   ├── services/        # Modules for external services (Firebase, Gemini)
│   ├── hooks/           # Custom React hooks (e.g., useAuth)
│   ├── utils/           # Helper functions (e.g., response parsing)
│   ├── App.tsx          # Main application component
│   ├── index.tsx        # Entry point of the React app
│   ├── types.ts         # TypeScript type definitions
│   └── constants.ts     # Core constants, including the main system prompt
├── .gitignore
└── package.json
```

vibe coded using GoogleAI Studio