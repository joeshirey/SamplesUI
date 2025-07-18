# Technical Design Document: Code Quality Dashboard

## 1. Introduction

This document outlines the technical design and architecture of the Code Quality Dashboard. The dashboard is a full-stack application with a Node.js backend and a vanilla JavaScript frontend. It is designed to be deployed as a containerized application on Google Cloud.

## 2. Architecture

The application follows a modular, service-oriented architecture:

- **Frontend:** A single-page application (SPA) built with HTML, CSS, and vanilla JavaScript. It is responsible for rendering the UI and making API calls to the backend.
- **Backend:** A Node.js server built with the Express framework. It provides a RESTful API for the frontend to interact with the data source.
- **Data Source:** A BigQuery table that stores the code quality data.

### 2.1. System Diagram

```
+-----------------+      +-----------------+      +-----------------+
|   Web Browser   | <--> |   Node.js API   | <--> |     BigQuery    |
| (Frontend)      |      | (Backend)       |      | (Data Source)   |
+-----------------+      +-----------------+      +-----------------+
```

## 3. Backend Design

The backend is a Node.js application that uses the Express framework to provide a RESTful API. It is structured into distinct modules for configuration, routing, and data services.

### 3.1. Project Structure

The backend code is organized into the following structure:

```
/
├── config/
│   └── index.js        # Centralized configuration management
├── routes/
│   └── api.js          # API route definitions
├── services/
│   └── bigqueryService.js # Business logic for BigQuery interactions
├── .env                # Local environment variables
├── .env.sample         # Sample environment file
├── server.js           # Main application entry point
└── ...
```

### 3.2. Key Dependencies

- `express`: Web framework for Node.js.
- `@google-cloud/bigquery`: Google Cloud client library for BigQuery.
- `cors`: Middleware for enabling Cross-Origin Resource Sharing.
- `dotenv`: Module for loading environment variables from a `.env` file.

### 3.3. API Endpoints

The backend exposes the following API endpoints under the `/api` prefix:

- `GET /config`: Returns the public Google Cloud Project ID and BigQuery view name.
- `GET /languages`: Returns a list of all available programming languages.
- `GET /product-areas`: Returns a list of product areas for a given language.
- `GET /region-tags`: Returns a list of region tags for a given language and product area.
- `GET /details`: Returns the detailed evaluation data for a given selection.
- `GET /fetch-code`: Fetches the raw code file from a given GitHub URL.

### 3.4. Error Handling

The application uses a centralized error-handling middleware in `server.js`. Any exceptions thrown in the asynchronous route handlers are caught by this middleware, which logs the error and returns a standardized JSON error response to the client.

## 4. Frontend Design

The frontend is a single-page application built with HTML, CSS, and vanilla JavaScript.

### 4.1. Dependencies

- **Tailwind CSS:** A utility-first CSS framework for styling.
- **Highlight.js:** A library for syntax highlighting.

### 4.2. Code Structure

The frontend code is organized into three main files located in the `web/` directory:

- `index.html`: The main HTML file that contains the structure of the application.
- `style.css`: A file for any custom CSS that is not handled by Tailwind CSS.
- `app.js`: The main JavaScript file that contains all the application logic.

## 5. Code Quality

To ensure a high level of code quality and consistency, the project uses the following tools:

- **ESLint:** A static analysis tool for identifying and reporting on patterns found in ECMAScript/JavaScript code. Configuration is in `eslint.config.js`.
- **Prettier:** An opinionated code formatter that enforces a consistent style. Configuration is in `.prettierrc.json`.

The following npm scripts are available to run these tools:

- `npm run lint`: Checks for linting errors.
- `npm run lint:fix`: Automatically fixes fixable linting errors.
- `npm run format`: Formats the entire codebase.

## 6. Data Model

The data is stored in a BigQuery table with the following (simplified) schema:

- `sample_language` (STRING): The programming language of the code sample.
- `product_name` (STRING): The product name the code sample belongs to.
- `region_tags` (ARRAY<STRING>): An array of region tags associated with the code sample.
- `overall_compliance_score` (INTEGER): The overall quality score of the code sample.
- `evaluation_data_raw_json` (STRING): A JSON string containing the detailed evaluation data.
- `github_link` (STRING): A link to the code sample on GitHub.
- `evaluation_date` (DATE): The date the code quality evaluation was performed.

## 7. Deployment

The application is designed to be deployed as a containerized application on Google Cloud. See `docs/deployment_instructions.md` for detailed deployment instructions.
