provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

resource "google_project_service" "cloud_functions_api" {
  project = var.gcp_project_id
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "calendar_api" {
  project = var.gcp_project_id
  service = "calendar.googleapis.com"
}

resource "google_project_service" "api_gateway_api" {
  project = var.gcp_project_id
  service = "apigateway.googleapis.com"
}

resource "google_project_service" "secret_manager_api" {
  project = var.gcp_project_id
  service = "secretmanager.googleapis.com"
}

# Google Cloud Storage for function code
resource "google_storage_bucket" "roofbox_function_code_bucket" {
  name          = "${var.gcp_project_id}-roofbox-function-code-bucket"
  location      = var.gcp_region
  force_destroy = true
}

resource "google_storage_bucket_object" "roofbox_function_zip" {
  name   = "roofbox-lambda-function.zip"
  bucket = google_storage_bucket.roofbox_function_code_bucket.name
  source = "../lambda/lambda.zip"
}

# Create a secret in Secret Manager
resource "google_secret_manager_secret" "gcp_service_account_secret" {
  secret_id = "gcp-service-account-key"
}

resource "google_secret_manager_secret_version" "gcp_service_account_key" {
  secret = google_secret_manager_secret.gcp_service_account_secret.id
  secret_data = file(var.gcp_service_account_key_file)
}

# Cloud Function deployment
resource "google_cloudfunctions_function" "roofbox_calendar_function" {
  name        = "roofbox-calendar-function"
  runtime     = "nodejs18"
  project     = var.gcp_project_id
  region      = var.gcp_region
  source_archive_bucket = google_storage_bucket.roofbox_function_code_bucket.name
  source_archive_object = google_storage_bucket_object.roofbox_function_zip.name
  trigger_http         = true
  entry_point          = "handler"
  available_memory_mb  = 256

  environment_variables = {
    GCP_SERVICE_ACCOUNT_SECRET = google_secret_manager_secret.gcp_service_account_secret.secret_id
  }

  service_account_email = google_service_account.roofbox_calendar_sa.email
}

resource "google_service_account" "roofbox_calendar_sa" {
  account_id   = "roofbox-calendar-service-account"
  display_name = "Roofbox Calendar Service Account"
}

resource "google_project_iam_member" "calendar_sa_editor_role" {
  project = var.gcp_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.roofbox_calendar_sa.email}"
}

resource "google_api_gateway_api" "roofbox_calendar_api" {
  api_id      = "roofbox-calendar-api"
  display_name = "Roofbox Calendar API Gateway"
}

resource "google_api_gateway_api_config" "roofbox_calendar_api_config" {
  api          = google_api_gateway_api.roofbox_calendar_api.id
  location     = var.gcp_region
  display_name = "Roofbox Calendar API Config"
}

resource "google_api_gateway_gateway" "roofbox_calendar_gateway" {
  api_config = google_api_gateway_api_config.roofbox_calendar_api_config.id
  display_name = "Roofbox Calendar Gateway"
}
