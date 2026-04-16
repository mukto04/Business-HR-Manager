declare module "zkteco-js" {
  class ZKLib {
    constructor(ip: string, port: number, timeout: number, inport: number);
    createSocket(): Promise<void>;
    getAttendances(): Promise<{ data: any[] }>;
    disconnect(): Promise<void>;
    enableDevice(): Promise<void>;
    disableDevice(): Promise<void>;
    clearAttendanceLog(): Promise<void>;
  }
  export default ZKLib;
}
