# Technical Design Document: Code Quality Dashboard

## 1. Introduction

This document outlines the technical design and architecture of the Code Quality Dashboard. The dashboard is a full-stack application with a Node.js backend and a vanilla JavaScript frontend. It is designed to be deployed as a containerized application on Google Cloud.

## 2. Architecture

The application follows a simple client-server architecture:

*   **Frontend:** A single-page application (SPA) built with HTML, CSS, and vanilla JavaScript. It is responsible for rendering the UI and making API calls to the backend.
*   **Backend:** A Node.js server built with the Express framework. It provides a RESTful API for the frontend to interact with the BigQuery data source.
*   **Data Source:** A BigQuery table that stores the code quality data.

### 2.1. System Diagram

```
+-----------------+      +-----------------+      +-----------------+
|   Web Browser   | <--> |   Node.js API   | <--> |     BigQuery    |
| (Frontend)      |      | (Backend)       |      | (Data Source)   |
+-----------------+      +-----------------+      +-----------------+
```

## 3. Backend Design

The backend is a Node.js application that uses the Express framework to provide a RESTful API.

### 3.1. Dependencies

*   `express`: Web framework for Node.js.
*   `@google-cloud/bigquery`: Google Cloud client library for BigQuery.
*   `cors`: Middleware for enabling Cross-Origin Resource Sharing.
*   `dotenv`: Module for loading environment variables from a `.env` file.

### 3.2. API Endpoints

The backend exposes the following API endpoints:

*   `GET /api/config`: Returns the Google Cloud Project ID and BigQuery view name.
*   `GET /api/languages`: Returns a list of all available programming languages.
*   `GET /api/product-areas`: Returns a list of product areas for a given language.
*   `GET /api/region-tags`: Returns a list of region tags for a given language and product area.
*   `GET /api/details`: Returns the detailed evaluation data for a given language, product area, and region tag.
*   `GET /api/fetch-code`: Fetches the raw code file from a given GitHub URL.
*   `GET /healthz`: A health check endpoint that returns a 200 OK response.

### 3.3. Project Structure (Proposed)

To improve maintainability, the backend code should be refactored into the following structure:

```
/
├── config/
│   └── bigquery.js   # BigQuery client configuration
├── routes/
│   └── api.js        # API route definitions
├── services/
│   └── bigqueryService.js # Business logic for BigQuery interactions
├── server.js         # Main application entry point
└── ...
```

### 3.4. Code Quality

To ensure a high level of code quality and consistency, the project will use the following tools:

*   **ESLint:** A static analysis tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
*   **Prettier:** An opinionated code formatter that enforces a consistent style.
*   **`.nvmrc`:** A file that specifies the recommended Node.js version for the project, ensuring a consistent development environment.

## 4. Frontend Design

The frontend is a single-page application built with HTML, CSS, and vanilla JavaScript.

### 4.1. Dependencies

*   **Tailwind CSS:** A utility-first CSS framework for styling.
*   **Highlight.js:** A library for syntax highlighting.

### 4.2. Code Structure

The frontend code is organized into three main files:

*   `index.html`: The main HTML file that contains the structure of the application.
*   `style.css`: A file for any custom CSS that is not handled by Tailwind CSS.
*   `app.js`: The main JavaScript file that contains all the application logic.

### 4.3. UI Components

The UI is divided into three main panels:

*   **Navigation Panel:** Contains the language selection dropdown and the list of product areas.
*   **Region Tag Panel:** Contains the list of region tags for the selected product area.
*   **Detail Panel:** Displays the detailed evaluation data for the selected region tag.

## 5. Data Model

The data is stored in a BigQuery table with the following (simplified) schema:

*   `sample_language` (STRING): The programming language of the code sample.
*   `product_area` (STRING): The product area the code sample belongs to.
*   `region_tags` (ARRAY<STRING>): An array of region tags associated with the code sample.
*   `overall_compliance_score` (INTEGER): The overall quality score of the code sample.
*   `evaluation_data_raw_json` (STRING): A JSON string containing the detailed evaluation data.
*   `github_link` (STRING): A link to the code sample on GitHub.
*   `last_updated_date` (DATE): The date the code sample was last updated.
*   `evaluation_date` (DATE): The date the code quality evaluation was performed.

## 6. Deployment

The application is designed to be deployed as a containerized application on Google Cloud. See `docs/deployment_instructions.md` for detailed deployment instructions.
