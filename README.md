  Roofbox Calendar API - Google Cloud Deployment

Roofbox Calendar API - Google Cloud Deployment
==============================================

This project provides a serverless API that integrates **Google Calendar** with **AppSheet** webhooks, using **Google Cloud Functions**, **Google Cloud API Gateway**, and **Google Secret Manager**. The setup is automated using **Terraform** and deployed via **GitHub Actions**.

* * *

Prerequisites
-------------

Before deploying this project, ensure you have the following:

*   A **Google Cloud Platform (GCP)** account.
*   **Google Cloud SDK (gcloud)** installed for local testing (optional). If you don’t have it installed, follow the [installation instructions here](https://cloud.google.com/sdk/docs/install).
*   A **Google Service Account** with the necessary roles (detailed below).
*   A **GitHub repository** where you can store and manage your code.
*   **Terraform** installed locally if deploying manually.

* * *

GitHub Actions for Automated Deployment
---------------------------------------

This project uses **GitHub Actions** to automatically deploy changes to **Google Cloud** whenever you push changes to the `main` branch.

* * *

### Step 1: Set Up Your Google Cloud Project

Make sure you are logged into your GCP account and authenticated with the correct project:

    # Log into your GCP account
    gcloud auth login
    
    # Set your project ID
    gcloud config set project YOUR_PROJECT_ID
    

* * *

### Step 2: Enable Required APIs

You need to enable several Google Cloud APIs. Run the following commands:

    gcloud services enable cloudfunctions.googleapis.com
    gcloud services enable calendar.googleapis.com
    gcloud services enable apigateway.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    

* * *

### Step 3: Create a Google Cloud Service Account

Run the following commands to create a service account that will be used to interact with Google Calendar.

    # Create the service account
    gcloud iam service-accounts create roofbox-calendar-sa \
        --description="Service Account for Roofbox Calendar API" \
        --display-name="Roofbox Calendar Service Account"
    

* * *

### Step 4: Assign the Editor Role for Google Calendar API

Grant the service account the **Editor role** so it has permission to create, update, and delete events in Google Calendar. This role includes all permissions needed to manage Google Calendar.

    # Assign the Editor role to the service account
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
        --member="serviceAccount:roofbox-calendar-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/editor"
    

**Note:** Make sure to replace `YOUR_PROJECT_ID` with your actual GCP project ID.

* * *

### Step 5: Generate a Service Account Key

You will need to generate a service account key in JSON format. This key will be stored securely in **GitHub Secrets** to allow **GitHub Actions** to deploy to GCP.

    # Create a service account key and save it as a JSON file
    gcloud iam service-accounts keys create ~/roofbox-calendar-sa-key.json \
        --iam-account=roofbox-calendar-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
    

**Note:** This command will generate a JSON file (`roofbox-calendar-sa-key.json`) and save it to your home directory. You will upload this file to **GitHub Secrets** in the next step.

* * *

### Step 6: Add GitHub Secrets for Deployment

In your GitHub repository, you need to add the following secrets for GitHub Actions to use:

*   **GCP\_PROJECT\_ID**: Your Google Cloud project ID.
*   **GCP\_SA\_KEY**: The contents of your **service account key JSON file** (`roofbox-calendar-sa-key.json`).

To add these secrets:

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Secrets and Variables** > **Actions**.
3.  Click **New repository secret** and add the following secrets:
    *   `GCP_PROJECT_ID`: Your Google Cloud project ID.
    *   `GCP_SA_KEY`: Copy and paste the contents of your `roofbox-calendar-sa-key.json` file here.

* * *

### Step 7: GitHub Actions Workflow

The GitHub Actions workflow is configured in the `.github/workflows/deploy.yml` file. This file will automatically deploy your project whenever changes are pushed to the `main` branch.

#### Create the GitHub Actions Workflow

In your repository, create the following file structure:

    .github/
    └── workflows/
        └── deploy.yml
    

#### Example `deploy.yml` File:

    name: Deploy to GCP
    
    on:
      push:
        branches:
          - main  # Deploy only when changes are pushed to the main branch
    
    jobs:
      deploy:
        runs-on: ubuntu-latest
    
        steps:
        - name: Checkout the code
          uses: actions/checkout@v2
    
        - name: Set up Google Cloud SDK
          uses: google-github-actions/setup-gcloud@v0.9.0
          with:
            project_id: ${{ secrets.GCP_PROJECT_ID }}
            service_account_key: ${{ secrets.GCP_SA_KEY }}
            export_default_credentials: true
    
        - name: Install Terraform
          run: |
            sudo apt-get update && sudo apt-get install -y terraform
    
        - name: Initialize Terraform
          run: |
            cd terraform
            terraform init
    
        - name: Apply Terraform
          run: |
            cd terraform
            terraform apply -auto-approve
    

* * *

Deploying the Project
---------------------

Once your GitHub Actions workflow is set up, the project will automatically deploy every time you push to the `main` branch.

1.  **Push your changes to GitHub:**
    
        git add .
        git commit -m "Initial commit"
        git push origin main
        
    
2.  **GitHub Actions will automatically deploy** the project to Google Cloud using **Terraform**.

* * *

Manual Deployment with Terraform
--------------------------------

If you prefer to manually deploy the project using **Terraform**, follow these steps:

1.  **Clone the repository:**
    
        git clone https://github.com/yourusername/roofbox-calendar-api.git
        cd roofbox-calendar-api
        
    
2.  **Zip the function code:**
    
        cd lambda
        zip -r lambda.zip .
        
    
3.  **Deploy via Terraform:**
    
        cd terraform
        terraform init
        terraform apply -auto-approve
        
    
4.  **Confirm the deployment:** You can verify that the resources are deployed successfully by checking the **Google Cloud Console**.

* * *

License
-------

**MIT License**

