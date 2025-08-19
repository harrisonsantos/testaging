import API_URL from './api';
import { httpFetch } from '@/lib/http';

export const api = {
  async getEvaluations(params) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return httpFetch(`/evaluation${queryString}`, { method: 'GET' });
  },
  async getSensorData(evaluationId) {
    return httpFetch(`/dado-sensor/evaluation/${evaluationId}`, { method: 'GET' });
  },
  async getEvaluationDetails(evaluationId) {
    return httpFetch(`/evaluation/details/${evaluationId}`, { method: 'GET' });
  },
  async getEvaluationsByPersonCpf(cpf) {
    return httpFetch(`/evaluation/person/${cpf}`, { method: 'GET' });
  },
  async getAnalytics(evaluationId) {
    return httpFetch(`/evaluation/analytics/${evaluationId}`, { method: 'GET' });
  },
  async getSummaryByCpf(cpf) {
    return httpFetch(`/evaluation/summary/person/${cpf}`, { method: 'GET' });
  },
  // New endpoints for population analysis and benchmarks
  async getPopulationStatistics() {
    return httpFetch(`/evaluation/population/statistics`, { method: 'GET' });
  },
  async getPopulationBenchmarks() {
    return httpFetch(`/evaluation/population/benchmarks`, { method: 'GET' });
  },
  async getPopulationAnalysis() {
    return httpFetch(`/evaluation/population/analysis`, { method: 'GET' });
  },
};