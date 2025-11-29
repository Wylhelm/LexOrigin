# Statement of Work (SOW)
## Project: LexOrigin - Legislative Archaeology Platform

**Date:** November 29, 2025  
**Version:** 1.0  
**Prepared By:** AI Architect Team

---

## 1. Executive Summary

**LexOrigin** represents a paradigm shift in legal research, moving beyond static text analysis to "Legislative Archaeology." Traditional legal research tools focus on *what* the law says. LexOrigin focuses on *why* it says it.

By integrating a Retrieval-Augmented Generation (RAG) engine with vector databases containing both statutory law (Canadian Immigration Law) and historical parliamentary debates (Hansard), LexOrigin allows legal professionals, historians, and policy analysts to trace the "genetic code" of legislation. It reconstructs the legislative intent by correlating final legal texts with the arguments, controversies, and sentiments expressed during their enactment.

## 2. Project Scope

The project encompasses the end-to-end development of the LexOrigin platform, including data pipeline engineering, AI model orchestration, and a reactive web interface.

### 2.1 Core Objectives
1.  **Ingest & Index:** Create a searchable vector index of complex legal hierarchies and unstructured parliamentary debates.
2.  **Correlate:** Algorithmically link specific law sections to relevant historical debates using semantic similarity.
3.  **Analyze:** Deploy Generative AI to summarize legislative intent, detect controversy levels, and extract key arguments.
4.  **Visualize:** Provide an interactive timeline of how legal concepts evolved through parliamentary discourse.

## 3. Technical Architecture

The system follows a modern, decoupled microservices architecture designed for scalability and modular AI upgrades.

### 3.1 Backend Infrastructure
*   **Framework:** FastAPI (Python 3.10+) for high-performance, async REST endpoints.
*   **AI Orchestration:** LangChain for managing LLM context windows and prompt engineering.
*   **Vector Database:** ChromaDB (Persistent) for high-speed semantic retrieval of laws and debates.
*   **Inference Engine:** Ollama (running locally or cloud-hosted) serving models like `gpt-oss:20b-cloud`.
*   **Data Pipeline:** Custom ingestion scripts for JSON-structured legal datasets and Hansard records.

### 3.2 Frontend Interface
*   **Framework:** React 19 (Vite) for a responsive Single Page Application (SPA).
*   **Styling:** TailwindCSS for a modern, accessibility-compliant design system.
*   **State Management:** React Hooks for handling asynchronous AI streams and search states.
*   **Visualization:** Interactive timeline components to render chronological debate flows.

## 4. Functional Modules

### Module A: The Legal Corpus (Data Layer)
*   **Ingestion Engine:** Automated parsing of `immigration_laws.json` into hierarchical vector embeddings.
*   **Debate Archive:** Processing of `hansard_debates.json` with metadata extraction (Speaker, Party, Date, Sentiment).
*   **Vector Store:** Implementation of ChromaDB with `sentence-transformers/all-MiniLM-L6-v2` for semantic embedding.

### Module B: The "Archeologist" (RAG Engine)
*   **Semantic Search:** "Fuzzy" search capabilities allowing users to find laws using natural language concepts rather than exact legal citation.
*   **Query Enhancement:** LLM-based pre-processing to rewrite user queries for optimal vector retrieval.
*   **Legislative Intent Analysis:** A specialized RAG pipeline that:
    1.  Receives a specific law section.
    2.  Retrieves the top $N$ semantically relevant parliamentary debates.
    3.  Synthesizes a "Legislative Intent" report including controversy score (Low/Medium/High) and consensus analysis.

### Module C: The Explorer Interface (UX/UI)
*   **Split-View Workspace:** A resizable dual-pane interface (Law Viewer vs. Analysis Panel).
*   **Citation Cards:** Dynamic cards linking AI summaries back to source truths (specific Hansard records).
*   **Interactive Timeline:** A chronological visualization of debates relevant to the selected law, color-coded by political party or sentiment.
*   **Accessibility Suite:** Integrated contrast modes, text sizing, and reduced motion settings.

## 5. Project Phasing & Timeline

| Phase | Duration | Key Deliverables |
| :--- | :--- | :--- |
| **1. Foundation** | Week 1-2 | Python Environment, FastAPI Setup, ChromaDB schema design, Raw Data Ingestion scripts. |
| **2. The "Brain"** | Week 3-4 | RAG Engine implementation, Prompt Engineering for "Intent Analysis," Vector retrieval tuning. |
| **3. The Interface** | Week 5-6 | React setup, Law Viewer component, Split-pane logic, Timeline visualization. |
| **4. Integration** | Week 7 | Connecting Frontend to FastAPI, implementing Real-time Analysis streams, Error handling. |
| **5. Polish** | Week 8 | Accessibility implementation, UI/UX refinement, Performance optimization, Dockerization. |

## 6. Assumptions & Constraints

*   **Data Availability:** Assumes access to structured JSON datasets for Laws and Hansard debates.
*   **Compute:** AI Inference requires a GPU-enabled environment (local NVIDIA GPU or cloud endpoint) for acceptable latency.
*   **Model:** The system is optimized for `gpt-oss` models via Ollama but is architected to be model-agnostic.

## 7. Acceptance Criteria

1.  **Accuracy:** The system must correctly retrieve relevant debates for a given law with >80% semantic relevance.
2.  **Latency:** Simple searches must return in <500ms; Deep AI analysis must complete in <15s.
3.  **Traceability:** Every AI-generated assertion must cite a specific source document (Law ID or Debate ID).

---

**Approved By:**

_________________________  
*Chief Technology Officer*

_________________________  
*Project Lead*

