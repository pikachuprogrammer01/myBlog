import apiClient from "@/api/client";

export function getProjects() {
  return apiClient.get("/api/projects");
}

export function getProjectBySlug(slug) {
  return apiClient.get(`/api/projects/${slug}`);
}
