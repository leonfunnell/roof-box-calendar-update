# Roofbox Calendar API - Google Cloud Deployment

This project automates the deployment of a Google Cloud infrastructure to integrate **Google Calendar** with **AppSheet** using **Google Cloud Functions**, **API Gateway**, and **Secret Manager**.

## Prerequisites

- A **Google Cloud Platform (GCP)** account.
- **GitHub Secrets** and **GitHub Variables** configured in your GitHub repository.
- A **Service Account** in GCP with appropriate permissions.

## GitHub Secrets

You need to add the following **secrets** to your GitHub repository:

1. **GCP_PROJECT_ID**: Your Google Cloud Project ID.
2. **GCP_SA_KEY**: The contents of your GCP **Service Account Key** (JSON format).

To add these secrets:

1. Go to your GitHub repository.
2. Navigate to **Settings** > **Secrets and Variables** > **Actions**.
3. Click **New repository secret** for each of the secrets listed above and add their corresponding values.

## GitHub Variables

You need to set the following non-sensitive variables in **GitHub Variables**:

1. **GCP_REGION**: The region where your resources will be deployed (e.g., `europe-west2` for London).
2. **GCP_SERVICE_ACCOUNT_SECRET**: The name of the secret in **Secret Manager** where the service account key is stored.

## Steps to Deploy

1. **Fork this repository** into your GitHub account.
2. **Add the necessary secrets and variables** as described above.
3. **Push your changes** to the `main` branch. GitHub Actions will automatically trigger the deployment.

---

## License

This project is licensed under the MIT License.
