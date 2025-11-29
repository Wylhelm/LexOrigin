# LexOrigin - Legislative Archaeology

<div align="center">

![LexOrigin Logo](https://img.shields.io/badge/LexOrigin-Legislative%20Archaeology-4f46e5?style=for-the-badge)

**Uncover the legislative intent behind Canadian immigration laws**

[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Ollama-LLM-black?logo=ollama)](https://ollama.ai)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-orange)](https://www.trychroma.com)

</div>

---

## 📖 Overview

LexOrigin is a RAG (Retrieval-Augmented Generation) application that helps legal professionals, researchers, and citizens understand the **legislative intent** behind Canadian immigration laws by analyzing parliamentary debates (Hansard) alongside the actual legal texts.

### Key Features

- 🔍 **AI-Powered Analysis** - Uses Ollama LLM to analyze legislative intent
- 📚 **2,200+ Legal Texts** - Immigration laws, regulations, and rules
- 🗣️ **525+ Parliamentary Debates** - Hansard excerpts on immigration topics
- 🎨 **4 Accessibility Themes** - Dark, Light, High Contrast, and Senior modes
- 📊 **Interactive Timeline** - Visualize debate history by date and party
- 🔎 **AI Semantic Search** - Find relevant laws using natural language

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 19 + TypeScript + Tailwind CSS + Framer Motion       │
│  Port: 3000                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  FastAPI + LangChain + ChromaDB                             │
│  Port: 8001                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Ollama LLM                              │
│  Model: gpt-oss:120b-cloud                                   │
│  Port: 11434                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Ollama** with `gpt-oss:120b-cloud` model (or any compatible model)
- **Conda** (recommended) or venv

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/LexOrigin.git
cd LexOrigin
```

### 2. Backend Setup

```bash
# Create and activate conda environment
conda create -n lexorigin python=3.11
conda activate lexorigin

# Install Python dependencies
pip install -r api/requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Fetch legal data (optional - data is included)
python -m api.scripts.fetch_immigration_laws
python -m api.scripts.fetch_hansard

# Start the backend server
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application

Open your browser and navigate to: **http://localhost:3000**

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_MODEL` | Ollama model to use | `gpt-oss:120b-cloud` |
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434` |
| `LEXORIGIN_FORCE_REFRESH` | Force data re-ingestion on startup | `false` |
| `CHROMA_PERSIST_DIR` | ChromaDB storage directory | `./api/database` |

---

## 📁 Project Structure

```
LexOrigin/
├── api/                          # Backend (FastAPI)
│   ├── data/                     # Data files
│   │   ├── immigration_laws.json # Legal texts
│   │   └── hansard_debates.json  # Parliamentary debates
│   ├── database/                 # ChromaDB storage
│   ├── scripts/                  # Data fetching scripts
│   │   ├── fetch_immigration_laws.py
│   │   └── fetch_hansard.py
│   ├── main.py                   # FastAPI application
│   ├── rag_engine.py             # RAG implementation
│   ├── prompts.py                # LLM prompts
│   ├── models.py                 # Pydantic models
│   └── requirements.txt          # Python dependencies
│
├── web/src/                      # Frontend (React)
│   ├── components/               # React components
│   │   ├── AccessibilityMenu.tsx
│   │   ├── CitationCard.tsx
│   │   ├── IntentPanel.tsx
│   │   ├── InteractiveTimeline.tsx
│   │   └── LawViewer.tsx
│   ├── contexts/                 # React contexts
│   │   └── ThemeContext.tsx
│   └── index.css                 # Global styles
│
├── index.html                    # HTML entry point
├── index.tsx                     # React entry point
├── package.json                  # Node.js dependencies
├── vite.config.ts                # Vite configuration
└── README.md                     # This file
```

---

## 🎨 Accessibility Features

LexOrigin includes 4 display modes for accessibility:

| Mode | Description |
|------|-------------|
| **Dark** | Default dark theme, easier on the eyes |
| **Light** | Standard light theme with clear contrast |
| **High Contrast** | Maximum contrast for visibility (WCAG AAA) |
| **Senior** | Larger text (125%), increased spacing, bigger buttons |

Access the theme selector via the ⚙️ icon in the header.

---

## 📊 Data Sources

### Legal Texts
- **Source**: [Justice Canada Laws Website](https://laws-lois.justice.gc.ca/)
- **Coverage**: Immigration and Refugee Protection Act (IRPA), Citizenship Act, Immigration Division Rules, and related regulations
- **Total**: 2,223 law sections

### Parliamentary Debates
- **Source**: [House of Commons Hansard](https://www.ourcommons.ca/)
- **Coverage**: Immigration-related debates from multiple parliamentary sessions
- **Total**: 525 debate excerpts

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/laws` | Get all legal texts |
| `GET` | `/api/stats` | Get collection statistics |
| `POST` | `/api/analyze-intent` | Analyze legislative intent |
| `POST` | `/api/search/laws` | AI semantic search for laws |

### Example: Analyze Intent

```bash
curl -X POST http://localhost:8001/api/analyze-intent \
  -H "Content-Type: application/json" \
  -d '{"law_text": "Section 36 of IRPA deals with inadmissibility on grounds of criminality"}'
```

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
pytest api/tests/

# Frontend tests
npm test
```

### Building for Production

```bash
# Build frontend
npm run build

# The built files will be in dist/
```

### Force Data Refresh

To re-ingest all data on server startup:

```bash
# Windows
set LEXORIGIN_FORCE_REFRESH=true
uvicorn api.main:app --port 8001

# Linux/Mac
LEXORIGIN_FORCE_REFRESH=true uvicorn api.main:app --port 8001
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Justice Canada** for providing open access to legal texts
- **House of Commons** for Hansard parliamentary records
- **Ollama** for local LLM inference
- **ChromaDB** for vector storage
- **LangChain** for RAG orchestration

---

<div align="center">

**Made with ❤️ for Canadian legal research**

[Report Bug](https://github.com/yourusername/LexOrigin/issues) · [Request Feature](https://github.com/yourusername/LexOrigin/issues)

</div>
