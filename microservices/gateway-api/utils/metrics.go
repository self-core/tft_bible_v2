package utils

import (
	"sync"
	"time"
)

// MetricsCollector collects and stores metrics for the gateway
type MetricsCollector struct {
	requestsTotal    map[string]uint64
	requestsFailed   map[string]uint64
	requestDuration  map[string][]time.Duration
	mutex            sync.RWMutex
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector() *MetricsCollector {
	return &MetricsCollector{
		requestsTotal:   make(map[string]uint64),
		requestsFailed:  make(map[string]uint64),
		requestDuration: make(map[string][]time.Duration),
	}
}

// RecordRequest records a successful request
func (m *MetricsCollector) RecordRequest(serviceName string, duration time.Duration) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.requestsTotal[serviceName]++
	m.requestDuration[serviceName] = append(m.requestDuration[serviceName], duration)
	
	// Keep only the last 1000 durations to prevent memory issues
	if len(m.requestDuration[serviceName]) > 1000 {
		m.requestDuration[serviceName] = m.requestDuration[serviceName][len(m.requestDuration[serviceName])-1000:]
	}
}

// RecordFailedRequest records a failed request
func (m *MetricsCollector) RecordFailedRequest(serviceName string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.requestsFailed[serviceName]++
}

// GetMetrics returns current metrics
func (m *MetricsCollector) GetMetrics() map[string]interface{} {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	metrics := make(map[string]interface{})

	for service, count := range m.requestsTotal {
		metrics[service] = map[string]interface{}{
			"total_requests": count,
			"failed_requests": m.requestsFailed[service],
			"avg_duration": m.getAverageDuration(service),
		}
	}

	return metrics
}

// getAverageDuration calculates average duration for a service
func (m *MetricsCollector) getAverageDuration(service string) time.Duration {
	if durations, exists := m.requestDuration[service]; exists && len(durations) > 0 {
		var total time.Duration
		for _, d := range durations {
			total += d
		}
		return total / time.Duration(len(durations))
	}
	return 0
}