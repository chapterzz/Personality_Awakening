/**
 * 开发环境：从本机网卡中选取适合手机扫码的局域网 IPv4（跳过 WSL / Hyper-V 等虚拟网卡）。
 */
import os from 'node:os';

/** 虚拟网卡名称关键词（Windows WSL、Hyper-V、常见虚拟机） */
const VIRTUAL_IFACE_PATTERN =
  /wsl|vethernet|hyper-v|virtualbox|vmware|docker|npcap|loopback|bluetooth/i;

/**
 * 判断网卡名是否视为虚拟/隧道接口（不应作为海报二维码 LAN 地址）。
 */
export function isVirtualInterfaceName(name: string): boolean {
  return VIRTUAL_IFACE_PATTERN.test(name);
}

/**
 * 为候选地址打分，越高越优先（WiFi 常见的 192.168 / 10 优先于 172.16–31）。
 */
export function scoreLanIPv4(address: string): number {
  if (address.startsWith('192.168.')) return 30;
  if (address.startsWith('10.')) return 20;
  const parts = address.split('.').map((p) => Number(p));
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return 5;
  return 10;
}

type NetworkInterfaceDict = ReturnType<typeof os.networkInterfaces>;

/**
 * 选取供手机扫码的 LAN IPv4；跳过虚拟网卡与 127.x。
 * @param interfaces 可注入（单测用），默认 `os.networkInterfaces()`
 */
export function pickDevLanIPv4(
  interfaces: NetworkInterfaceDict = os.networkInterfaces(),
): string | null {
  if (!interfaces) return null;

  let best: { address: string; score: number } | null = null;

  for (const [name, ifaces] of Object.entries(interfaces)) {
    if (!ifaces || isVirtualInterfaceName(name)) continue;

    for (const net of ifaces) {
      const family = net.family as string | number;
      const isV4 = family === 'IPv4' || family === 4;
      if (!isV4 || net.internal) continue;

      const address = net.address;
      if (address.startsWith('127.')) continue;

      const score = scoreLanIPv4(address);
      if (!best || score > best.score) {
        best = { address, score };
      }
    }
  }

  return best?.address ?? null;
}
