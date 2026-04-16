export class ZKService {
  constructor(ip: string, port: number, timeout: number, inport: number) {
    // Mock constructor
  }

  async connect() {
    throw new Error("Fingerprint device connection is disabled in this decoupled project.");
  }

  async getAttendanceLogs(): Promise<any[]> {
    return [];
  }

  async disconnect() {
    // Mock disconnect
  }

  async getUsers() {
    return [];
  }
}

export const getZKService = () => {
  return new ZKService("127.0.0.1", 4370, 5000, 4000);
};
