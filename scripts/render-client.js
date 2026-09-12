#!/usr/bin/env node

/**
 * Render API Client
 * Handles deployments, rollbacks, and service management via Render API
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const RENDER_API_BASE = 'https://api.render.com/v1';

class RenderClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('RENDER_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${RENDER_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Render API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // Service Management
  async getServices() {
    return this.request('/services');
  }

  async getService(serviceId) {
    return this.request(`/services/${serviceId}`);
  }

  async createService(serviceConfig) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceConfig),
    });
  }

  async updateService(serviceId, updates) {
    return this.request(`/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteService(serviceId) {
    return this.request(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Deployments
  async triggerDeploy(serviceId, options = {}) {
    return this.request(`/services/${serviceId}/deploys`, {
      method: 'POST',
      body: JSON.stringify({
        clearCache: options.clearCache || false,
        ...options,
      }),
    });
  }

  async getDeploys(serviceId, limit = 20) {
    return this.request(`/services/${serviceId}/deploys?limit=${limit}`);
  }

  async getDeploy(serviceId, deployId) {
    return this.request(`/services/${serviceId}/deploys/${deployId}`);
  }

  async rollbackDeploy(serviceId, deployId) {
    return this.request(`/services/${serviceId}/deploys/${deployId}/rollback`, {
      method: 'POST',
    });
  }

  // Environment Variables
  async getEnvVars(serviceId) {
    return this.request(`/services/${serviceId}/env-vars`);
  }

  async updateEnvVars(serviceId, envVars) {
    return this.request(`/services/${serviceId}/env-vars`, {
      method: 'PUT',
      body: JSON.stringify(envVars),
    });
  }

  // Health check helper
  async waitForDeploy(serviceId, deployId, maxWaitMs = 600000, pollIntervalMs = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const deploy = await this.getDeploy(serviceId, deployId);
      
      if (deploy.status === 'live') {
        return deploy;
      }
      
      if (deploy.status === 'build_failed' || deploy.status === 'update_failed' || deploy.status === 'canceled') {
        throw new Error(`Deploy failed with status: ${deploy.status}`);
      }
      
      console.log(`   Deploy status: ${deploy.status} (waiting...)`);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`Deploy timed out after ${maxWaitMs}ms`);
  }

  // Get the previous successful deploy for rollback
  async getPreviousSuccessfulDeploy(serviceId) {
    const deploys = await this.getDeploys(serviceId, 50);
    return deploys.find(d => d.status === 'live' && d.createdAt !== new Date().toISOString().split('T')[0]);
  }
}

export { RenderClient };