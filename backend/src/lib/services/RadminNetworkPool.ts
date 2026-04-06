import Room from '../models/Room';

/**
 * RadminNetworkPool Service
 * Manages allocation of Radmin VPN networks ONLY for default rooms
 * Network1-10: Reserved for default rooms
 * Custom Rooms: Self-hosted by users (no longer managed via static pool)
 */

interface RadminNetwork {
  id: string;
  password: string;
}

class RadminNetworkPool {
  private allNetworks: RadminNetwork[] = [];

  constructor() {
    this.loadNetworksFromEnv();
  }

  /**
   * Load the 10 default networks from environment variables
   */
  private loadNetworksFromEnv() {
    for (let i = 1; i <= 10; i++) {
      const networkId = process.env[`RADMIN_NETWORK_${i}_ID`];
      const networkPassword = process.env[`RADMIN_NETWORK_${i}_PASSWORD`];

      if (networkId && networkPassword) {
        this.allNetworks.push({
          id: networkId,
          password: networkPassword,
        });
      }
    }
  }

  /**
   * Allocate a network from the pool by checking DB for currently used ones
   */
  async allocate(): Promise<RadminNetwork | null> {
    // Get all network IDs currently used by rooms
    const usedNetworkIds = await Room.find().distinct('radminNetworkId');
    const usedSet = new Set(usedNetworkIds);

    // Find the first network not in the used set
    const availableNetwork = this.allNetworks.find(
      (network) => !usedSet.has(network.id)
    );

    if (availableNetwork) {
      console.log(`🔗 Allocated network: ${availableNetwork.id}`);
      return availableNetwork;
    }

    console.warn("⚠️ No available networks in pool!");
    return null;
  }

  /**
   * Release is no longer needed as a separate step because 
   * deleting the room from DB automatically "releases" the network ID
   */
  release(networkId: string): void {
    console.log(`🔓 Network ${networkId} will be available once the room is deleted from DB.`);
  }

  /**
   * Get total available networks count
   */
  async getAvailableCount(): Promise<number> {
    const usedNetworkIds = await Room.find().distinct('radminNetworkId');
    return this.allNetworks.length - usedNetworkIds.length;
  }

  /**
   * Get network details by ID
   */
  getNetworkById(networkId: string): RadminNetwork | null {
    return this.allNetworks.find((n) => n.id === networkId) || null;
  }
}

// Singleton instance (still useful for caching the ENV load, but methods are DB-backed)
let networkPoolInstance: RadminNetworkPool | null = null;

export function getNetworkPool(): RadminNetworkPool {
  if (!networkPoolInstance) {
    networkPoolInstance = new RadminNetworkPool();
  }
  return networkPoolInstance;
}

export default RadminNetworkPool;

