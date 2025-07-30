# Technical Design Document: Code Quality Dashboard

## 1. Introduction

This document outlines the technical design, architecture, and implementation details of the Code Quality Dashboard. The dashboard is a full-stack application featuring a Node.js backend and a vanilla JavaScript frontend. It is designed to be deployed as a containerized application on Google Cloud, providing a scalable and maintainable solution for code quality analysis.

## 2. Architecture

The application follows a modular, service-oriented architecture that separates concerns between the frontend, backend, and data source.

- **Frontend:** A single-page application (SPA) built with HTML, CSS, and vanilla JavaScript. It is responsible for rendering the user interface, managing user interactions, and making API calls to the backend. It is served as a static asset from the Node.js server.
- **Backend:** A Node.js server built with the Express framework. It provides a RESTful API for the frontend to fetch data and handles all interactions with the BigQuery data source.
- **Data Source:** A BigQuery table (or view) that stores the comprehensive code quality data. The backend authenticates with Google Cloud using Application Default Credentials (ADC).

### 2.1. System Diagram

```
+-----------------+      +-----------------+      +-----------------+
|   Web Browser   | <--> |   Node.js API   | <--> |     BigQuery    |
| (Frontend)      |      | (Backend)       |      | (Data Source)   |
+-----------------+      +-----------------+      +-----------------+
```

## 3. Backend Design

The backend is a Node.js application that uses the Express framework to provide a RESTful API. It is structured into distinct modules for configuration, routing, and data services, promoting a clean and maintainable codebase.

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

- `express`: A minimal and flexible web framework for Node.js, used to build the RESTful API.
- `@google-cloud/bigquery`: The official Google Cloud client library for interacting with BigQuery.
- `cors`: Middleware for enabling Cross-Origin Resource Sharing, allowing the frontend to make requests to the backend.
- `dotenv`: A module for loading environment variables from a `.env` file into `process.env`, simplifying local development.
- `nodemon`: A development tool that automatically restarts the Node.js application when file changes are detected.

### 3.3. API Endpoints

The backend exposes the following API endpoints under the `/api` prefix:

- `GET /config`: Returns public configuration details, such as the Google Cloud Project ID and the BigQuery view name, for display on the frontend.
- `GET /languages`: Returns a distinct list of all available programming languages from the data source.
- `GET /product-areas`: Returns a list of product areas for a given language, including aggregated metrics like sample count and average score.
- `GET /region-tags`: Returns a list of region tags (individual samples) for a given language and product area.
- `GET /details`: Returns the complete, detailed evaluation data for a specific code sample, identified by its language, product area, and region tag.
- `GET /fetch-code`: Acts as a proxy to fetch the raw code file from a public GitHub URL, avoiding client-side CORS issues.

### 3.4. Error Handling

The application implements a centralized error-handling strategy. A dedicated middleware function in `server.js` catches any exceptions that occur in the asynchronous route handlers. This ensures that all errors are handled consistently, logged to the console for debugging, and returned to the client as a standardized JSON error response with a `500` status code.

## 4. Frontend Design

The frontend is a responsive single-page application built with HTML, CSS, and vanilla JavaScript, ensuring a lightweight and fast user experience.

### 4.1. Key Dependencies

- **Tailwind CSS:** A utility-first CSS framework used for all styling, enabling rapid development of a modern and responsive UI.
- **Highlight.js:** A powerful library for client-side syntax highlighting of the code samples displayed in the detail view.
- **Marked.js:** A library for parsing Markdown, used to render the evaluation assessments and recommendations, which may contain Markdown formatting.

### 4.2. Code Structure

The frontend code is organized into three main files located in the `web/` directory:

- `index.html`: The main HTML file that defines the structure of the application, including the three-panel layout and all UI elements.
- `style.css`: A file for any custom CSS that is not handled by Tailwind CSS, such as scrollbar styling.
- `app.js`: The core JavaScript file that contains all the application logic, including state management, API data fetching, event handling, and DOM manipulation.

## 5. Code Quality

To ensure a high level of code quality, consistency, and maintainability, the project is configured with the following tools:

- **ESLint:** A static analysis tool for identifying and reporting on patterns in JavaScript code, helping to prevent common errors. The configuration is located in `eslint.config.js`.
- **Prettier:** An opinionated code formatter that enforces a consistent code style across the entire codebase. The configuration is in `.prettierrc.json`.

The following npm scripts are available to run these tools:

- `npm run lint`: Checks the codebase for any linting errors.
- `npm run lint:fix`: Automatically fixes any fixable linting errors.
- `npm run format`: Formats the entire codebase using Prettier.
- `npm test`: Runs the full test suite using the Jest testing framework.

## 6. Data Model

The data is stored in a BigQuery table (or view) with a schema designed to support the dashboard's features. The key fields include:

- `sample_language` (STRING): The programming language of the code sample (e.g., "javascript", "python").
- `product_name` (STRING): The name of the product the code sample belongs to (e.g., "Cloud Run", "BigQuery").
- `product_category` (STRING): The category the product belongs to (e.g., "Serverless", "Databases").
- `region_tags` (ARRAY<STRING>): An array of region tags associated with the code sample, used for identification.
- `overall_compliance_score` (INTEGER): The overall quality score of the code sample, typically on a scale of 0-100.
- `evaluation_data_raw_json` (STRING): A JSON string containing the detailed evaluation data, including the criteria breakdown, assessments, recommendations, and an array of `citations`.
- `github_link` (STRING): A URL to the code sample on GitHub.
- `raw_code` (STRING): The complete source code of the sample file.
- `git_info_raw_json` (STRING): A JSON string containing the Git history of the file.
- `evaluation_date` (DATE): The date the code quality evaluation was performed.
- `last_updated_date` (DATE): The date the source file was last updated in the repository.

## 7. Deployment

The application is designed to be deployed as a containerized application on Google Cloud Run. The `Dockerfile` specifies the container image, and the `cloudbuild.yaml` file defines the CI/CD pipeline for automated builds and deployments. For detailed instructions, see `docs/deployment_instructions.md`.
