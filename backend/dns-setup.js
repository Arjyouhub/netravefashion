import dns from 'dns';

// Force Node.js to use Google's Public DNS to bypass Jio Fiber SRV record resolution blocks
dns.setServers(['8.8.8.8', '8.8.4.4']);
