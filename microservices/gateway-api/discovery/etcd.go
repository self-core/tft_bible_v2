package discovery

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.etcd.io/etcd/client/v3"
)

// ServiceInstance represents a service instance in the registry
type ServiceInstance struct {
	ID      string    `json:"id"`
	Name    string    `json:"name"`
	Host    string    `json:"host"`
	Port    string    `json:"port"`
	Health  string    `json:"health"`
	Updated time.Time `json:"updated"`
	Meta    map[string]string `json:"meta,omitempty"`
}

// ServiceDiscovery handles service registration and discovery using etcd
type ServiceDiscovery struct {
	client *clientv3.Client
	ttl    int64
}

// NewServiceDiscovery creates a new service discovery instance
func NewServiceDiscovery(cli *clientv3.Client, ttl int64) *ServiceDiscovery {
	return &ServiceDiscovery{
		client: cli,
		ttl:    ttl,
	}
}

// RegisterService registers a service instance in etcd with TTL
func (sd *ServiceDiscovery) RegisterService(instance ServiceInstance) error {
	key := fmt.Sprintf("/services/%s/%s", instance.Name, instance.ID)
	value, err := json.Marshal(instance)
	if err != nil {
		return fmt.Errorf("failed to marshal service instance: %w", err)
	}

	lease, err := sd.client.Grant(context.Background(), sd.ttl)
	if err != nil {
		return fmt.Errorf("failed to create lease: %w", err)
	}

	_, err = sd.client.Put(context.Background(), key, string(value), clientv3.WithLease(lease.ID))
	if err != nil {
		return fmt.Errorf("failed to put service in etcd: %w", err)
	}

	log.Printf("Service registered: %s - %s:%s", instance.Name, instance.Host, instance.Port)
	return nil
}

// UpdateServiceHealth updates the health status of a specific service instance
func (sd *ServiceDiscovery) UpdateServiceHealth(serviceName, instanceID, healthStatus string) error {
	key := fmt.Sprintf("/services/%s/%s", serviceName, instanceID)

	// Get the current service instance
	resp, err := sd.client.Get(context.Background(), key)
	if err != nil {
		return fmt.Errorf("failed to get service from etcd: %w", err)
	}

	if len(resp.Kvs) == 0 {
		return fmt.Errorf("service instance not found: %s/%s", serviceName, instanceID)
	}

	// Unmarshal the current instance
	var instance ServiceInstance
	if err := json.Unmarshal(resp.Kvs[0].Value, &instance); err != nil {
		return fmt.Errorf("failed to unmarshal service instance: %w", err)
	}

	// Update the health status and timestamp
	instance.Health = healthStatus
	instance.Updated = time.Now()

	// Marshal the updated instance
	updatedValue, err := json.Marshal(instance)
	if err != nil {
		return fmt.Errorf("failed to marshal updated service instance: %w", err)
	}

	// Put the updated instance back to etcd with TTL
	lease, err := sd.client.Grant(context.Background(), sd.ttl)
	if err != nil {
		return fmt.Errorf("failed to create lease: %w", err)
	}

	_, err = sd.client.Put(context.Background(), key, string(updatedValue), clientv3.WithLease(lease.ID))
	if err != nil {
		return fmt.Errorf("failed to update service in etcd: %w", err)
	}

	log.Printf("Service health updated: %s - %s:%s - %s", instance.Name, instance.Host, instance.Port, healthStatus)
	return nil
}

// DeregisterService removes a service instance from etcd
func (sd *ServiceDiscovery) DeregisterService(name, id string) error {
	key := fmt.Sprintf("/services/%s/%s", name, id)
	_, err := sd.client.Delete(context.Background(), key)
	if err != nil {
		return fmt.Errorf("failed to deregister service: %w", err)
	}

	log.Printf("Service deregistered: %s - %s", name, id)
	return nil
}

// DiscoverService finds all instances of a service
func (sd *ServiceDiscovery) DiscoverService(name string) ([]ServiceInstance, error) {
	key := fmt.Sprintf("/services/%s/", name)
	log.Printf("Discovering service with key: %s", key)

	resp, err := sd.client.Get(context.Background(), key, clientv3.WithPrefix())
	if err != nil {
		return nil, fmt.Errorf("failed to discover service: %w", err)
	}

	log.Printf("Found %d service instances", len(resp.Kvs))

	var instances []ServiceInstance
	for _, kv := range resp.Kvs {
		log.Printf("Processing service instance: key=%s, value=%s", string(kv.Key), string(kv.Value))

		var instance ServiceInstance
		if err := json.Unmarshal(kv.Value, &instance); err != nil {
			log.Printf("Failed to unmarshal service instance: %v", err)
			continue // Skip malformed entries
		}
		instances = append(instances, instance)
	}

	log.Printf("Returning %d instances for service %s", len(instances), name)
	return instances, nil
}

// GetServiceInstance returns a specific service instance by name
func (sd *ServiceDiscovery) GetServiceInstance(serviceName string) (*ServiceInstance, error) {
	instances, err := sd.DiscoverService(serviceName)
	if err != nil {
		return nil, err
	}

	if len(instances) == 0 {
		return nil, fmt.Errorf("no instances found for service: %s", serviceName)
	}

	// For now, return the first instance (in production, you might want load balancing)
	return &instances[0], nil
}

// GetHealthyServiceInstance returns a healthy service instance by name
func (sd *ServiceDiscovery) GetHealthyServiceInstance(serviceName string) (*ServiceInstance, error) {
	instances, err := sd.DiscoverService(serviceName)
	if err != nil {
		return nil, err
	}

	if len(instances) == 0 {
		return nil, fmt.Errorf("no instances found for service: %s", serviceName)
	}

	// Filter for healthy instances
	for _, instance := range instances {
		if instance.Health == "Healthy" {
			return &instance, nil
		}
	}

	// If no healthy instances found, return the first one (might still be useful for error reporting)
	return &instances[0], nil
}