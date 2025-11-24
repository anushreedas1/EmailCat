# Email Productivity Agent

An intelligent, prompt-driven system that processes email inboxes and performs automated tasks including email categorization, action-item extraction, auto-drafting replies, and chat-based inbox interaction.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Features

- **📧 Email Ingestion**: Load and manage emails from mock inbox
- **🧠 Prompt Brain**: Customize LLM behavior with configurable prompts for categorization, action extraction, and reply generation
- **🏷️ Auto-Categorization**: Automatically categorize emails (Important, Newsletter, Spam, To-Do, Uncategorized)
- **✅ Action Item Extraction**: Extract tasks and deadlines from emails automatically
- **💬 Email Agent Chat**: Interactive chat interface for inbox queries with special commands
- **✍️ Draft Generation**: AI-powered email reply drafting based on custom prompts
- **📝 Draft Editor**: Edit, save, and manage generated drafts with auto-save
- **🔒 Data Safety**: Drafts never auto-send, email content remains immutable
- **🔄 Error Handling**: Robust error handling with retry logic and user-friendly messages

## Prerequisites

- **Python 3.10+** (tested with Python 3.12)
- **Node.js 18+** (tested with Node.js 20)
- **OpenAI API key** (required for LLM features)

## Quick Start

### 1. Clone and Setup Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo OPENAI_API_KEY=your_api_key_here > .env

# Initialize database
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### 2. Setup Frontend

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 3. Verify Setup

- **Backend Health**: Visit `http://localhost:8000/health`
- **API Docs**: Visit `http://localhost:8000/docs`
- **Frontend**: Visit `http://localhost:3000`

## Project Structure

```
.
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── emails.py      # Email endpoints
│   │   │   ├── prompts.py     # Prompt configuration endpoints
│   │   │   ├── agent.py       # Chat and draft generation
│   │   │   └── drafts.py      # Draft management
│   │   ├── models/            # SQLAlchemy database models
│   │   │   ├── email.py
│   │   │   ├── action_item.py
│   │   │   ├── prompt_config.py
│   │   │   └── draft.py
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── services/          # Business logic layer
│   │   │   ├── email_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── prompt_service.py
│   │   │   └── draft_service.py
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database connection
│   │   └── main.py            # FastAPI application
│   ├── alembic/               # Database migrations
│   ├── data/
│   │   └── mock_inbox.json    # Sample email data
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── test_*.py              # Test files
│
└── frontend/                   # Next.js frontend
    ├── app/                   # Next.js app router
    │   ├── page.tsx           # Main application page
    │   ├── inbox/             # Inbox view page
    │   └── prompts/           # Prompt configuration page
    ├── components/            # React components
    │   ├── InboxView.tsx      # Email list component
    │   ├── PromptBrain.tsx    # Prompt configuration panel
    │   ├── EmailAgent.tsx     # Chat interface
    │   └── DraftEditor.tsx    # Draft editing component
    ├── lib/                   # Utilities and hooks
    │   ├── api/               # API client
    │   ├── hooks/             # Custom React hooks
    │   ├── error-handler.ts   # Error handling utilities
    │   └── toast.tsx          # Toast notifications
    └── types/                 # TypeScript type definitions
```

## Setup Instructions

### Backend Setup (Detailed)

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

   Key dependencies:
   - FastAPI 0.115.5
   - SQLAlchemy 2.0.36
   - OpenAI SDK 1.57.0
   - Pydantic 2.10.3
   - Hypothesis 6.122.3 (property-based testing)

4. **Configure Environment Variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=sqlite:///./email_agent.db
   ```

5. **Initialize Database**
   ```bash
   alembic upgrade head
   ```

   This creates the SQLite database with tables:
   - `emails` - Email storage
   - `action_items` - Extracted tasks
   - `prompts` - Prompt configurations
   - `drafts` - Generated email drafts

6. **Start Backend Server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The `--reload` flag enables auto-reload on code changes.

### Frontend Setup (Detailed)

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

   Key dependencies:
   - Next.js 16.0.3
   - React 19.2.0
   - React Query 5.62.7
   - Axios 1.7.9
   - Tailwind CSS 4.x

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production** (optional)
   ```bash
   npm run build
   npm start
   ```

## Usage Guide

### Loading the Mock Inbox

1. Start both backend and frontend servers
2. Open the application at `http://localhost:3000`
3. Click "Load Mock Inbox" button
4. The system will load 18 sample emails from `backend/data/mock_inbox.json`

### Configuring Prompts

The Prompt Brain allows you to customize how the LLM processes emails:

1. Navigate to the Prompt Brain panel
2. Edit the three prompt types:
   - **Categorization Prompt**: Controls how emails are categorized
   - **Action Item Prompt**: Controls task extraction
   - **Auto-Reply Prompt**: Controls draft generation style
3. Click "Save Prompts" to apply changes
4. Use "Reset to Defaults" to restore default prompts

**Example Categorization Prompt:**
```
Categorize this email into one of: Important, Newsletter, Spam, To-Do.
Consider urgency, sender, and content. Return only the category name.
```

### Processing Emails

1. Select an email from the inbox
2. Click "Process Email" to:
   - Categorize the email
   - Extract action items
   - Store results in database
3. View category badge and action items in the email details

### Using the Email Agent Chat

The chat interface supports natural language queries:

**Special Commands:**
- "What tasks do I need to do?" - Lists all action items
- "Show me all urgent emails" - Filters Important emails
- "Summarize this email" - Provides email summary

**General Queries:**
- Ask questions about selected email
- Request information about inbox
- Get help with email management

### Generating and Editing Drafts

1. Select an email
2. Click "Generate Draft" in the Email Agent
3. Review the generated draft in the Draft Editor
4. Edit subject and body as needed
5. Click "Save Draft" to persist changes
6. Auto-save runs every 30 seconds

**Draft Safety:** Drafts are never automatically sent. They remain in draft status until you manually send them through your email client.

## API Documentation

### Interactive Documentation

Visit `http://localhost:8000/docs` for Swagger UI with interactive API testing.

### Key Endpoints

#### Email Endpoints
- `POST /api/emails/load` - Load mock inbox
- `GET /api/emails` - Get all emails
- `GET /api/emails/{email_id}` - Get single email
- `POST /api/emails/{email_id}/process` - Process email

#### Prompt Endpoints
- `GET /api/prompts` - Get current prompts
- `PUT /api/prompts` - Update prompts
- `GET /api/prompts/defaults` - Get default prompts

#### Agent Endpoints
- `POST /api/agent/chat` - Chat with agent
- `POST /api/agent/draft` - Generate draft

#### Draft Endpoints
- `GET /api/drafts` - Get all drafts
- `GET /api/drafts/{draft_id}` - Get single draft
- `PUT /api/drafts/{draft_id}` - Update draft
- `DELETE /api/drafts/{draft_id}` - Delete draft

### Example API Calls

**Load Mock Inbox:**
```bash
curl -X POST http://localhost:8000/api/emails/load
```

**Get All Emails:**
```bash
curl http://localhost:8000/api/emails
```

**Process Email:**
```bash
curl -X POST http://localhost:8000/api/emails/{email_id}/process \
  -H "Content-Type: application/json" \
  -d '{"use_llm": true}'
```

## Testing

### Quick Test Run

Run all tests with a single command:

**Windows:**
```bash
python run_all_tests.py
# or
run_all_tests.bat
```

**Unix/Linux/Mac:**
```bash
python3 run_all_tests.py
# or
./run_all_tests.sh
```

### Individual Test Files

```bash
cd backend

# Database models
python test_models.py

# Service layer
python test_services.py

# LLM service
python test_llm_service.py

# API endpoints
python test_endpoints.py

# Data persistence (pytest)
python -m pytest test_data_persistence.py -v
```

### Test Coverage

The test suite covers:
- ✅ Database models and relationships
- ✅ Service layer business logic
- ✅ LLM integration and error handling
- ✅ API endpoints and validation
- ✅ Data persistence and safety
- ✅ Email content immutability
- ✅ Draft isolation and safety

### CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically:
- Runs all backend tests
- Performs frontend linting and type checking
- Builds the frontend
- Validates end-to-end integration

**Setup CI/CD:**
1. Push code to GitHub
2. Add `OPENAI_API_KEY` secret in repository settings
3. Workflow runs automatically on push to `master` branch

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

**Database errors:**
```bash
# Delete database and reinitialize
rm email_agent.db
alembic upgrade head
```

**OpenAI API errors:**
- Verify API key in `.env` file
- Check API key has sufficient credits
- Ensure no rate limiting issues

**Import errors:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# Change port in package.json or kill process
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

**API connection errors:**
- Verify backend is running on port 8000
- Check CORS configuration in `backend/app/main.py`
- Ensure no firewall blocking localhost connections

### Common Issues

**"Module not found" errors:**
- Ensure virtual environment is activated (backend)
- Run `pip install -r requirements.txt` (backend)
- Run `npm install` (frontend)

**LLM features not working:**
- Verify `OPENAI_API_KEY` is set in `.env`
- Check OpenAI API status
- Review backend logs for API errors

**Tests failing:**
- Ensure no backend server is running during tests
- Delete `email_agent.db` before running tests
- Check all dependencies are installed

## Development

### Backend Development

**Project uses:**
- FastAPI for REST API
- SQLAlchemy for ORM
- Alembic for migrations
- Pydantic for validation
- Hypothesis for property-based testing

**Adding new endpoints:**
1. Create route handler in `app/api/`
2. Add business logic in `app/services/`
3. Define schemas in `app/schemas/`
4. Write tests in `test_*.py`

**Database migrations:**
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Frontend Development

**Project uses:**
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS
- React Query for state management

**Adding new components:**
1. Create component in `components/`
2. Add types in `types/`
3. Use API client from `lib/api/`
4. Implement error handling with toast notifications

**Code style:**
```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Environment Variables

**Backend (.env):**
```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=sqlite:///./email_agent.db
```

**Frontend:**
No environment variables required for local development. API calls default to `http://localhost:8000`.

### Ports

- Backend: `8000`
- Frontend: `3000`
- API Docs: `8000/docs`

### CORS Configuration

CORS is configured in `backend/app/main.py` to allow:
- Origin: `http://localhost:3000`
- Methods: All
- Headers: All
- Credentials: Yes

## License

This project is provided as-is for educational and development purposes.

## Support

For issues, questions, or contributions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check test files for usage examples
4. Review component implementation files
