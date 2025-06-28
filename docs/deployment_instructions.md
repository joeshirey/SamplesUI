# Deployment Instructions: Code Quality Dashboard

This document provides instructions on how to deploy the Code Quality Dashboard to Google Cloud using Cloud Run and a CI/CD pipeline with Cloud Build.

## Prerequisites

*   A Google Cloud project with billing enabled.
*   The `gcloud` command-line tool installed and configured.
*   A GitHub repository containing the application source code.
*   A BigQuery table with the code quality data.

## 1. Local Setup

### 1.1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

### 1.2. Create a `.env` File

Create a `.env` file in the root of the project and add the following environment variables:

```
PROJECT_ID=your-gcp-project-id
BIGQUERY_TABLE_ID=your-bigquery-table-id
```

*   `PROJECT_ID`: Your Google Cloud project ID.
*   `BIGQUERY_TABLE_ID`: The full ID of your BigQuery table (e.g., `your-project.your_dataset.your_table`).

### 1.3. Install Dependencies and Run Locally

```bash
npm install
npm start
```

The application should now be running at `http://localhost:8080`.

### 1.4. Code Quality

This project uses ESLint and Prettier to enforce code quality and a consistent style.

*   **Linting:** To check for linting errors, run:
    ```bash
    npm run lint
    ```

*   **Formatting:** To automatically format the code, run:
    ```bash
    npm run format
    ```

## 2. Google Cloud Setup

### 2.1. Enable APIs

Enable the required Google Cloud APIs for your project:

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable bigquery.googleapis.com
```

### 2.2. Create a Service Account

Create a service account for Cloud Build to use for deployments:

```bash
gcloud iam service-accounts create cloud-build-deployer \
    --display-name "Cloud Build Deployer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:cloud-build-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:cloud-build-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

## 3. Deployment with Cloud Build

The project includes a `cloudbuild.yaml` file that defines the CI/CD pipeline. The pipeline will:

1.  Build the Docker image.
2.  Push the image to Google Artifact Registry.
3.  Deploy the image to Cloud Run.

### 3.1. Create a Cloud Build Trigger

1.  Go to the Cloud Build Triggers page in the Google Cloud Console.
2.  Click "Create trigger".
3.  Enter a name for the trigger (e.g., `deploy-to-cloud-run`).
4.  Select your GitHub repository as the source.
5.  Choose the branch you want to deploy from (e.g., `main`).
6.  For the "Configuration" type, select "Cloud Build configuration file (yaml or json)".
7.  Enter `cloudbuild.yaml` as the location of the configuration file.
8.  Click "Create".

### 3.2. Trigger a Build

To trigger a build, push a commit to the branch you configured in the trigger. Cloud Build will automatically build and deploy the application.

## 4. Manual Deployment

To deploy the application manually, you can use the `gcloud` command-line tool:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

This will execute the steps defined in the `cloudbuild.yaml` file and deploy the application to Cloud Run.

## 5. Accessing the Application

Once the deployment is complete, you can find the URL of your service in the Cloud Run section of the Google Cloud Console.
