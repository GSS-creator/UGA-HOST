import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config';

export function createApiClient(): AxiosInstance {
  const config = getConfig();
  
  return axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
      'Content-Type': 'application/json'
    }
  });
}
