provider "google" {
  credentials = file("service-account-key.json")
  project     = var.gcp_project_id
  region      = var.gcp_region
}

resource "local_file" "service_account_key" {
  content  = var.service_account_key
  filename = "${path.module}/service-account-key.json"
}
