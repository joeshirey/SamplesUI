# Deployment Instructions: Code Quality Dashboard

This document provides instructions on how to deploy the Code Quality Dashboard to Google Cloud using Cloud Run and a CI/CD pipeline with Cloud Build.

## Prerequisites

- You have a Google Cloud Project with billing enabled.
- The [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` command-line tool) is installed and authenticated on your local machine.
- You have a GitHub repository containing the application source code.
- You have a BigQuery table with the code quality data.
- Your user account has the necessary IAM permissions to manage Cloud Build, Artifact Registry, and Cloud Run (e.g., Owner, Editor, or a combination of Cloud Build Editor, Artifact Registry Administrator, and Cloud Run Admin).

## 1. One-Time Setup in Google Cloud

You only need to perform these steps once for your project.

### 1.1. Enable APIs

Enable the necessary Google Cloud services for your project:

```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com
```

### 1.2. Create an Artifact Registry Repository

Cloud Build needs a repository to store the Docker images it creates.

```bash
gcloud artifacts repositories create code-quality-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for Code Quality Dashboard"
```
*(Note: If you choose a different region, be sure to update it in `cloudbuild.yaml` as well.)*

### 1.3. Grant Cloud Build Permissions

By default, the Cloud Build service account needs permission to deploy to Cloud Run and act as a Service Account User.

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
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

The project is configured to be deployed automatically using a `cloudbuild.yaml` file.

### 2.1. Configure Environment Variables

The `cloudbuild.yaml` file is responsible for deploying the application to two Cloud Run services: `code-quality-dashboard` and `code-quality-dashboard-gen`. Each has its own set of environment variables.

Before running the build, you must review and, if necessary, update the `--set-env-vars` arguments in the `cloudbuild.yaml` file to match your project's configuration (e.g., `PROJECT_ID` and `BIGQUERY_TABLE_ID`).

**Important:** The `cloudbuild.yaml` uses `^##^` as a special delimiter to separate multiple environment variables in a single line if you need to add more.

### 2.2. Manual Deployment

You can trigger a deployment manually from your local machine. From the root directory of the project, run the following command:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

This command will:
1. Upload your project directory to Cloud Build.
2. Execute the steps in `cloudbuild.yaml`.
3. Build the Docker image and push it to your Artifact Registry.
4. Deploy the new version to your Cloud Run services.

### 2.3. Automated CI/CD Deployment

For a fully automated CI/CD pipeline, you can create a Cloud Build Trigger.

1.  Go to the **Cloud Build Triggers** page in the Google Cloud Console.
2.  Connect your GitHub repository as a source.
3.  Click **Create trigger**.
4.  Enter a name (e.g., `deploy-on-push-main`).
5.  Select the event to invoke the trigger (e.g., **Push to a branch**).
6.  Specify your repository and the branch (e.g., `main`).
7.  For **Configuration**, select **Cloud Build configuration file (yaml or json)**.
8.  Enter `cloudbuild.yaml` as the location.
9.  Click **Create**.

Now, every time you push a commit to the specified branch, Cloud Build will automatically trigger a new build and deployment.

## 3. Accessing the Application

After the deployment completes, you can find the public URLs for your services in the **Cloud Run** section of the Google Cloud Console.