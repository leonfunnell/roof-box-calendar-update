# Roofbox Calendar API - Google Cloud Deployment

This project provides a serverless API that integrates **Google Calendar** with **AppSheet** webhooks, using **Google Cloud Functions**, **Google Cloud API Gateway**, and **Google Secret Manager**. The setup is automated using **Terraform** and can be deployed directly from GitHub.

## Prerequisites

Before deploying this project, ensure you have the following:

1. A **Google Cloud Platform (GCP)** account.
2. A **Google Service Account** with `Editor` permissions for Google Calendar and other resources.
3. **Terraform** installed locally if deploying manually.
4. A **GitHub repository** with GitHub Actions enabled.

### Google Cloud Setup

1. **Create a Google Cloud Project**:
   - Create a new project in the Google Cloud Console: https://console.cloud.google.com/projectcreate
   - Note your **Project ID**.

2. **Enable Required APIs**:
   - **Cloud Functions API**
   - **Google Calendar API**
   - **API Gateway API**
   - **Secret Manager API**

   You can enable these via the Google Cloud Console or use Terraform (as shown in the Terraform setup).

3. **Create a Service Account**:
   - Navigate to **IAM & Admin** > **Service Accounts**.
   - Create a service account with the following roles:
     - **Editor** role for Calendar API
     - **Cloud Functions Admin**
     - **Secret Manager Secret Accessor**
   - Download the **service account key** as a JSON file.

4. **Store the Service Account Key in GitHub**:
   - Add your **Service Account Key JSON** as a secret in GitHub:
     - `GCP_PROJECT_ID`: Your Google Cloud Project ID.
     - `GCP_SA_KEY`: The content of your service account key JSON file.

### Project Structure

```bash
root/
├── terraform/
│   ├── main.tf         # Terraform configuration for GCP resources
│   ├── variables.tf    # Terraform variables
│   ├── outputs.tf      # Terraform outputs
│   ├── provider.tf     # Terraform GCP provider configuration
├── lambda/
│   ├── index.js        # Node.js function for Google Cloud Function
│   ├── package.json    # Node.js dependencies
│   ├── package-lock.json
│   ├── lambda.zip      # Zipped Node.js function for upload (generated during build)
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions workflow for deployment
├── README.md           # Instructions for setting up GCP and deploying the project
