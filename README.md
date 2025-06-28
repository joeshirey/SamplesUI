# Code Quality Dashboard

The Code Quality Dashboard is a web-based tool that provides a comprehensive overview of code quality metrics from a BigQuery data source. It allows developers and managers to visualize and drill down into code quality data, from a high-level language overview to specific code samples.

![Code Quality Dashboard Screenshot](https://storage.googleapis.com/screenshots-prod-external/2024-05-29-12-09-03.png)

## 📚 Documentation

For detailed information about the project, please refer to the following documents in the [`docs`](/docs) directory:

*   **[Product Requirements Document (PRD)](/docs/PRD.md):** An overview of the project's goals, features, and target audience.
*   **[Technical Design Document (TDD)](/docs/TDD.md):** A detailed description of the project's architecture and technical design.
*   **[Deployment Instructions](/docs/deployment_instructions.md):** Step-by-step instructions on how to deploy the application to Google Cloud.

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) installed on your machine.
*   A Google Cloud project with a BigQuery table containing the code quality data.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

### 2. Create a `.env` File

Create a `.env` file in the root of the project and add the following environment variables:

```
PROJECT_ID=your-gcp-project-id
BIGQUERY_TABLE_ID=your-bigquery-table-id
```

*   `PROJECT_ID`: Your Google Cloud project ID.
*   `BIGQUERY_TABLE_ID`: The full ID of your BigQuery table (e.g., `your-project.your_dataset.your_table`).

### 3. Authenticate with Google Cloud

The server uses Application Default Credentials to authenticate with Google Cloud. Run the following command once to authenticate your local environment:

```bash
gcloud auth application-default login
```

### 4. Install Dependencies and Run

```bash
npm install
npm start
```

The application will be available at [http://localhost:8080](http://localhost:8080).

## 🐳 Docker

The project includes a `Dockerfile` that can be used to build a Docker image of the application.

### Build the Image

```bash
docker build -t code-quality-dashboard .
```

### Run the Container

```bash
docker run -p 8080:8080 -v $(pwd)/.env:/.env code-quality-dashboard
```

## ☁️ Deployment

For detailed deployment instructions, please refer to the [Deployment Instructions](/docs/deployment_instructions.md) document. 