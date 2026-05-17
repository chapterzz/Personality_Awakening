/**
 * dev-lan-ip 单元测试：跳过 WSL 虚拟网卡，优先 WLAN 192.168.x。
 */
import { describe, expect, it } from 'vitest';

import { isVirtualInterfaceName, pickDevLanIPv4, scoreLanIPv4 } from '@/lib/dev-lan-ip';

describe('isVirtualInterfaceName', () => {
  it('识别 WSL / vEthernet', () => {
    expect(isVirtualInterfaceName('vEthernet (WSL)')).toBe(true);
    expect(isVirtualInterfaceName('WLAN')).toBe(false);
  });
});

describe('scoreLanIPv4', () => {
  it('192.168 优先于 172.x', () => {
    expect(scoreLanIPv4('192.168.0.41')).toBeGreaterThan(scoreLanIPv4('172.26.0.1'));
  });
});

describe('pickDevLanIPv4', () => {
  it('跳过 WSL 网卡，选用 WLAN 地址', () => {
    const ip = pickDevLanIPv4({
      'vEthernet (WSL)': [
        {
          address: '172.26.0.1',
          netmask: '255.255.240.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: false,
          cidr: '172.26.0.1/20',
        },
      ],
      WLAN: [
        {
          address: '192.168.0.41',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: false,
          cidr: '192.168.0.41/24',
        },
      ],
    });
    expect(ip).toBe('192.168.0.41');
  });
});
