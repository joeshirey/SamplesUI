# Code Quality Dashboard

The Code Quality Dashboard is a web-based tool that provides a comprehensive overview of code quality metrics from a BigQuery data source. It allows developers and managers to visualize and drill down into code quality data, from a high-level language overview to specific code samples.

## ✨ Features

- **Language-Based Filtering:** Start by selecting a programming language to see all associated product areas.
- **Product Category Filtering:** Further refine the list of products by selecting a specific product category.
- **Detailed Breakdowns:** Drill down from a product area to see a list of its associated "region tags" (individual code samples).
- **In-Depth Analysis:** View detailed evaluation data for each code sample, including:
    - An overall compliance score.
    - A breakdown of evaluation criteria with assessments and recommendations.
    - Linked citations to external resources directly in the analysis.
    - The raw code file with syntax highlighting.
    - A summary of suggested fixes from an LLM.
- **Deep Linking:** Copy a direct URL to any detail view to easily share findings with your team.
- **Sort and Filter:** Easily sort and filter lists of products and region tags to quickly find what you're looking for.

## 📚 Documentation

For detailed information about the project, please refer to the following documents in the [`docs`](/docs) directory:

- **[Product Requirements Document (PRD)](/docs/PRD.md):** An overview of the project's goals, features, and target audience.
- **[Technical Design Document (TDD)](/docs/TDD.md):** A detailed description of the project's architecture and technical design.
- **[Deployment Instructions](/docs/deployment_instructions.md):** Step-by-step instructions on how to deploy the application to Google Cloud.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version 20.x or higher.
- A Google Cloud project with a BigQuery table containing the code quality data.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

### 2. Create a `.env` File

Create a `.env` file by copying the sample file:

```bash
cp .env.sample .env
```

Now, open the `.env` file and add your specific configuration:

```
# The port the server will listen on (optional, defaults to 8080).
PORT=8080

# Your Google Cloud Project ID.
PROJECT_ID=your-gcp-project-id

# The full BigQuery table or view ID to query against.
# Format: your-gcp-project-id.your_dataset.your_table_or_view
BIGQUERY_TABLE_ID=your-gcp-project-id.your_dataset.your_table_or_view
```

### 3. Authenticate with Google Cloud

The server uses Application Default Credentials to authenticate with Google Cloud. Run the following command once to authenticate your local environment:

```bash
gcloud auth application-default login
```

### 4. Install Dependencies and Run

First, install the project dependencies using `npm ci` for a clean, reliable install based on the lock file:
```bash
npm ci
```

To run the application for production, use:
```bash
npm start
```

For local development with hot-reloading, run:
```bash
npm run dev
```

The application will be available at [http://localhost:8080](http://localhost:8080).

## 🐳 Docker

The project includes a `Dockerfile` that can be used to build a Docker image of the application.

### Build the Image

```bash
docker build -t code-quality-dashboard .
```

### Run the Container

When running the container, you must provide the necessary environment variables. You can do this using a `.env` file and the `--env-file` flag.

```bash
docker run -p 8080:8080 --env-file ./.env code-quality-dashboard
```

## ☁️ Deployment

For detailed deployment instructions, please refer to the [Deployment Instructions](/docs/deployment_instructions.md) document.
