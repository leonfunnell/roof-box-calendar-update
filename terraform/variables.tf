variable "gcp_project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "The GCP region for deployment"
  type        = string
}

variable "service_account_key" {
  description = "The GCP service account key in JSON format"
  type        = string
  sensitive   = true
}

variable "gcp_service_account_secret" {
  description = "The Secret Manager name for the service account key"
  type        = string
}
