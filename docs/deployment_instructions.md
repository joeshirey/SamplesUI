# Deployment Instructions: Code Quality Dashboard

This document provides detailed, step-by-step instructions on how to deploy the Code Quality Dashboard to Google Cloud. The deployment process uses a CI/CD pipeline with Cloud Build to automatically build a Docker container and deploy it to Cloud Run.

## Prerequisites

Before you begin, ensure you have the following:

- **Google Cloud Project:** A Google Cloud Project with billing enabled. If you don't have one, you can create one [here](https://console.cloud.google.com/projectcreate).
- **Google Cloud SDK:** The [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` command-line tool) installed and authenticated on your local machine. You can authenticate by running `gcloud auth login`.
- **GitHub Repository:** A GitHub repository containing the application source code.
- **BigQuery Table:** A BigQuery table or view that contains the code quality data in the required schema.
- **IAM Permissions:** Your user account must have the necessary IAM permissions to manage Cloud Build, Artifact Registry, and Cloud Run. The `Owner` or `Editor` roles are sufficient, but for a more granular approach, a combination of `Cloud Build Editor`, `Artifact Registry Administrator`, and `Cloud Run Admin` is recommended.

## 1. One-Time Setup in Google Cloud

These steps only need to be performed once for your Google Cloud project.

### 1.1. Enable APIs

First, enable the necessary Google Cloud services for your project. This command ensures that the APIs for Cloud Run, Cloud Build, Artifact Registry, and IAM are active.

```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com
```

### 1.2. Create an Artifact Registry Repository

Cloud Build requires a repository to store the Docker images it creates. This command creates a Docker repository named `code-quality-repo` in the `us-central1` region.

```bash
gcloud artifacts repositories create code-quality-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for Code Quality Dashboard"
```

_(Note: If you choose a different region, be sure to update it in the `cloudbuild.yaml` file as well.)_

### 1.3. Grant Cloud Build Permissions

The Cloud Build service account, which performs the automated builds, needs permission to deploy to Cloud Run and to act as an IAM Service Account User.

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Construct the email for the Cloud Build service account
GCP_SA_EMAIL="$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

# Grant the Cloud Run Admin role to the Cloud Build service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$GCP_SA_EMAIL" \
    --role="roles/run.admin"

# Grant the IAM Service Account User role to the Cloud Build service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:$GCP_SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"
```

## 2. Deployment Process

The project is configured to be deployed automatically using the `cloudbuild.yaml` file. This file defines a series of steps that Cloud Build will execute to build and deploy the application. The build process uses the `Dockerfile` in the root of the project, which is configured to use the `node:20-alpine` base image for a lightweight and secure container.

### 2.1. Configure Environment Variables

The `cloudbuild.yaml` file is responsible for deploying the application to two separate Cloud Run services: `code-quality-dashboard` and `code-quality-dashboard-gen`. Each service has its own set of environment variables defined in the build file.

Before running the build, you **must** review and update the `--set-env-vars` arguments in the `cloudbuild.yaml` file to match your project's configuration. Specifically, you need to provide the correct values for `PROJECT_ID` and `BIGQUERY_TABLE_ID` for each service.

### 2.2. Manual Deployment

You can trigger a deployment manually from your local machine. This is useful for initial setup or for deployments that are not tied to a Git commit. From the root directory of the project, run the following command:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

This command will:

1.  Upload your project directory to a Cloud Storage bucket.
2.  Trigger Cloud Build to execute the steps defined in `cloudbuild.yaml`.
3.  Build the Docker image and push it to your Artifact Registry repository.
4.  Deploy the new version to your Cloud Run services.

### 2.3. Automated CI/CD Deployment

For a fully automated CI/CD pipeline, you can create a Cloud Build Trigger that listens for changes to your GitHub repository.

1.  Navigate to the **Cloud Build Triggers** page in the Google Cloud Console.
2.  Connect your GitHub repository as a source if you haven't already.
3.  Click **Create trigger**.
4.  Enter a descriptive name for your trigger (e.g., `deploy-on-push-main`).
5.  Select the event that will invoke the trigger (e.g., **Push to a branch**).
6.  Specify your GitHub repository and the branch you want to deploy from (e.g., `main`).
7.  For **Configuration**, select **Cloud Build configuration file (yaml or json)**.
8.  Enter `cloudbuild.yaml` as the location of your build file.
9.  Click **Create**.

Now, every time you push a commit to the specified branch, Cloud Build will automatically trigger a new build and deploy the latest version of your application.

## 3. Accessing the Application

After the deployment completes successfully, you can find the public URLs for your services in the **Cloud Run** section of the Google Cloud Console. Each service (`code-quality-dashboard` and `code-quality-dashboard-gen`) will have its own unique URL.
