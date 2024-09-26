variable "gcp_project_id" {
  description = "Google Cloud project ID"
}

variable "gcp_region" {
  description = "Google Cloud region"
  default     = "europe-west2" # London region
}

variable "gcp_service_account_key_file" {
  description = "Path to the GCP service account key JSON file"
}
