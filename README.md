# Financial System AI Chatbot

A comprehensive financial management system built with modern web technologies, featuring an AI-powered chatbot interface for managing bills, vouchers, payments, and financial transactions.

## 🌐 Deployment
The application is deployed on Vercel:
- Live URL: https://financial-sys-ai-chatbot-yrui.vercel.app/
- Notes: The system was deployed on the Vercel, and AI Chatbot was deployed on the Render as free plan, so it will spin down with inactivity, to activate it need wait for around 60 seconds.
  
## 👨‍💻 Account
- Admin:{ 
    username: admin, 
    password: abc123
    }
- Staff:{ 
    username: staff, 
    password: abc123
    }
- User:{ 
    username: user1, 
    password: abc123
    }

## 🎯 Overview

Financial System AI Chatbot is a full-featured financial application designed to streamline financial workflows and provide intelligent assistance through an integrated chatbot. The system helps users manage bills, vouchers, and payments efficiently with AI-powered insights.

## ✨ Key Features

### 📊 Financial Dashboard
- **Summary View**: Quick overview of recent financial activity
- **Bills Management**: Track and manage billing information with approval workflows
- **Vouchers**: Handle voucher creation, tracking, and status management
- **Payments**: Record and monitor payment transactions
- **Status Tracking**: Real-time status updates for all financial documents

### 🔐 User Management & Authentication
- Role-based access control (Admin, Staff and users)
- Secure authentication middleware
- User-specific views and permissions
- Dashboard customization based on user roles

### 💰 Financial Features
- **Bill Handling**: Create, approve, and track bills with payment status
- **Voucher Processing**: Link vouchers to bills and track their lifecycle
- **Payment Recording**: Record payments with full audit trails

### 🤖 AI Chatbot Integration
The AI Chatbot is built with a sophisticated multi-layered architecture designed to provide intelligent financial assistance with conversation memory, context understanding, and accurate data retrieval.

#### **Core Architecture**
- **Framework**: FastAPI (Python) deployed on Render
- **AI Models**: 
  - Primary: Ollama Remote (GPT-OSS 120B model)
  - Fallback: Groq API integration
  - Local: Ollama support for on-premise deployments
- **Database**: PostgreSQL with Prisma ORM for conversation storage
- **API Communication**: RESTful endpoints with CORS support

#### **Key Components**

**1. Chat Engine (`chat.py`)**
   - Main POST `/chat` endpoint for processing user messages
   - Conversation lifecycle management (create/retrieve conversations)
   - Message persistence with role-based storage (user/assistant)
   - Intelligent prompt construction with context injection
   - Response formatting with financial data formatting rules:
     - Currency: MYR (Malaysian Ringgit)
     - ID Prefixing: Bills (B00), Users (U00), Vouchers (V00), Payments (P00)
     - Date Format: DD Month YYYY, HH:MM AM/PM (Malaysia Time Zone)

**2. Intent Detection (`services/intent.py`)**
   - **Intent Types**: Detects financial queries for bills, payments, vouchers, and pending approvals
   - **Format Follow-up Detection**: Identifies reformatting requests (emoji, tables, bullets) vs. new data queries
   - **Finance Followup Resolution**: Understands contextual references (it, them, that) by analyzing conversation history
   - Keyword-based pattern matching with flexible matching

**3. Financial Data Retrieval (`services/finance.py`)**
   - **Role-Based Access Control**:
     - **Admin**: Views all pending bills and vouchers
     - **Staff**: Views own created bills and vouchers, plus their assigned payments
     - **Users**: Views bills they are responsible for, linked vouchers, and their payments
   - **Keyword Filtering**: Extracts and filters results by description using stopword removal
   - **Smart Filtering Logic**: Only applies filters when meaningful keywords exist (ignores "all", "show", "please", etc.)
   - **Data Categories**: Bills, Vouchers, Payments

**4. Conversation Memory (`services/memory.py`)**
   - Loads last 20 messages from conversation history
   - Maintains context for multi-turn conversations
   - Deduplicates messages to prevent repetition

**5. Conversation Management (`conversation.py`)**
   - CRUD operations for conversations:
     - GET: Retrieve all user conversations sorted by recency
     - POST: Create new conversation with auto-titled naming
     - PUT: Update conversation titles for better organization
     - DELETE: Remove conversation and associated messages
   - Full audit trail with `createdAt` and `updatedAt` timestamps

**6. Message Tracking (`messages.py`)**
   - GET endpoint to retrieve messages in a conversation
   - Ordered chronologically by creation time
   - Stores both user and assistant messages

**7. LLM Backends**
   - **Ollama Remote (`services/ollama_remote.py`)**: Primary backend using environment variables for host, model, and API key
   - **Groq (`services/groq.py`)**: Fallback high-performance LLM API (GPT-OSS 120B)
   - **Local Ollama (`services/ollama.py`)**: Support for on-premise Llama3 model via localhost

#### **Database Schema**
- **Conversations**: User ID, title, creation/update timestamps
- **Messages**: Conversation ID, role (user/assistant), content, timestamp
- **Linked Entities**: Bills, vouchers, payments with user role-based filtering

#### **Smart Features**
- ✅ Duplicate message detection and removal
- ✅ Format-aware response generation (no empty sections)
- ✅ Context-aware financial data queries
- ✅ Multi-turn conversation support with history context
- ✅ Strict data validation (no fabricated data)
- ✅ Structured output formatting (tables, lists, cards)

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** (61.7%) - Progressive web framework
- **Nuxt.js 3** - Vue meta-framework for production applications
- **Tailwind CSS** - Utility-first CSS framework

### Backend & Data
- **Prisma** - Modern ORM for database management
- **Node.js/JavaScript** - Core backend
- **PostgreSQL Database** - Primary data storage
- **Python** - FastAPI for AI Chatbot
- **FastAPI** - Modern async Python web framework
- **Psycopg2** - PostgreSQL adapter for Python

### AI & LLM
- **Ollama** - Local and remote LLM inference
- **Groq API** - High-performance LLM backend
- **Pydantic** - Data validation for API requests
