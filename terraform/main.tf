# Enable necessary Google Cloud APIs
resource "google_project_service" "cloud_functions" {
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "calendar_api" {
  service = "calendar.googleapis.com"
}

resource "google_project_service" "api_gateway" {
  service = "apigateway.googleapis.com"
}

resource "google_project_service" "secret_manager" {
  service = "secretmanager.googleapis.com"
}

# Create the service account for deploying resources
resource "google_service_account" "roofbox_calendar_sa" {
  account_id   = "roofbox-calendar-sa"
  display_name = "Roofbox Calendar Service Account"
}

# Assign Editor role to the service account
resource "google_project_iam_member" "sa_editor" {
  project = var.gcp_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.roofbox_calendar_sa.email}"
}

# Create a Cloud Storage bucket to hold the function code
resource "google_storage_bucket" "roofbox_function_bucket" {
  name     = "${var.gcp_project_id}-roofbox-functions"
  location = var.gcp_region
}

# Upload the JavaScript function code
resource "google_storage_bucket_object" "lambda_code" {
  name   = "lambda.zip"
  bucket = google_storage_bucket.roofbox_function_bucket.name
  source = "lambda.zip"  # Make sure to zip your JS code and upload
}

# Create the Cloud Function
resource "google_cloudfunctions_function" "roofbox_calendar_function" {
  name        = "roofbox-calendar-function"
  runtime     = "nodejs14"
  entry_point = "handler"
  source_archive_bucket = google_storage_bucket.roofbox_function_bucket.name
  source_archive_object = google_storage_bucket_object.lambda_code.name
  trigger_http = true
  available_memory_mb = 128

  environment_variables = {
    GCP_SERVICE_ACCOUNT_SECRET = var.gcp_service_account_secret
  }
}

# Create an API Gateway for the function
resource "google_api_gateway_api" "roofbox_api" {
  api_id = "roofbox-api"
  display_name = "Roofbox API Gateway"
}

# API Gateway configuration for the function
resource "google_api_gateway_gateway" "roofbox_gateway" {
  api = google_api_gateway_api.roofbox_api.id
  display_name = "Roofbox Gateway"
  project = var.gcp_project_id
  region = var.gcp_region
}
