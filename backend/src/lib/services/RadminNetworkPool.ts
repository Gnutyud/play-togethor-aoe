/**
 * RadminNetworkPool Service
 * Manages dynamic allocation of Radmin VPN networks for custom rooms
 * Network1-10: Reserved for default rooms
 * Network11-50: Pool for custom rooms (40 networks available)
 */

interface RadminNetwork {
  id: string;
  password: string;
}

class RadminNetworkPool {
  private networks: RadminNetwork[] = [];
  private allocatedNetworks: Set<string> = new Set();

  constructor() {
    this.initializePool();
  }

  /**
   * Initialize the network pool from environment variables
   * Load Network11-50 for custom room allocation
   */
  private initializePool() {
    for (let i = 11; i <= 50; i++) {
      const networkId = process.env[`RADMIN_NETWORK_${i}_ID`];
      const networkPassword = process.env[`RADMIN_NETWORK_${i}_PASSWORD`];

      if (networkId && networkPassword) {
        this.networks.push({
          id: networkId,
          password: networkPassword,
        });
      }
    }

    console.log(
      `✅ RadminNetworkPool initialized with ${this.networks.length} networks`
    );
  }

  /**
   * Allocate a network from the pool
   * Returns null if no networks available
   */
  allocate(): RadminNetwork | null {
    const availableNetwork = this.networks.find(
      (network) => !this.allocatedNetworks.has(network.id)
    );

    if (availableNetwork) {
      this.allocatedNetworks.add(availableNetwork.id);
      console.log(`🔗 Allocated network: ${availableNetwork.id}`);
      return availableNetwork;
    }

    console.warn("⚠️ No available networks in pool!");
    return null;
  }

  /**
   * Release a network back to the pool
   */
  release(networkId: string): void {
    if (this.allocatedNetworks.has(networkId)) {
      this.allocatedNetworks.delete(networkId);
      console.log(`🔓 Released network: ${networkId}`);
    }
  }

  /**
   * Get total available networks
   */
  getAvailableCount(): number {
    return this.networks.length - this.allocatedNetworks.size;
  }

  /**
   * Get network by ID (for verification)
   */
  getNetworkById(networkId: string): RadminNetwork | null {
    return this.networks.find((n) => n.id === networkId) || null;
  }

  /**
   * Mark a network as allocated (for restoring state from DB)
   */
  markAsAllocated(networkId: string): void {
    const network = this.getNetworkById(networkId);
    if (network) {
      this.allocatedNetworks.add(networkId);
    }
  }
}

// Singleton instance
let networkPoolInstance: RadminNetworkPool | null = null;

export function getNetworkPool(): RadminNetworkPool {
  if (!networkPoolInstance) {
    networkPoolInstance = new RadminNetworkPool();
  }
  return networkPoolInstance;
}

export default RadminNetworkPool;
