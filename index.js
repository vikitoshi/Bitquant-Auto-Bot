require('dotenv').config();
const axios = require('axios');
const nacl = require('tweetnacl');
const Base58 = require('base-58');
const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { TextEncoder } = require('util');

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m"
};

const logger = {
  info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[✅] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
  userInfo: (msg) => console.log(`${colors.white}[✓] ${msg}${colors.reset}`),
  banner: () => {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log(`---------------------------------------------`);
    console.log(`  Bitquant Auto Bot - Airdrop Insiders  `);
    console.log(`---------------------------------------------${colors.reset}`);
    console.log();
  }
};

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const getHeaders = () => {
  const randomUA = getRandomUserAgent();
  return {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'content-type': 'application/json',
    'priority': 'u=1, i',
    'sec-ch-ua': randomUA.includes('Chrome') ? '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' : '"Firefox";v="132", "Not A(Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': randomUA.includes('Windows') ? '"Windows"' : randomUA.includes('Mac') ? '"macOS"' : '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'sec-gpc': '1',
    'user-agent': randomUA,
    'origin': 'https://www.bitquant.io',
    'referer': 'https://www.bitquant.io/',
    'referrer-policy': 'strict-origin-when-cross-origin'
  };
};

async function loadProxies() {
  try {
    const data = await fs.readFile('proxies.txt', 'utf8');
    return data.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  } catch (error) {
    logger.error('Failed to load proxies.txt: ' + error.message);
    return [];
  }
}

function parseProxy(proxy) {
  proxy = proxy.trim();
  if (!proxy.startsWith('http://') && !proxy.startsWith('https://') && 
      !proxy.startsWith('socks4://') && !proxy.startsWith('socks5://')) {
    proxy = `http://${proxy}`;
  }
  const proxyRegex = /^(https?|socks4|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
  if (!proxy.match(proxyRegex)) {
    logger.warn(`Invalid proxy format: ${proxy}`);
    return null;
  }
  return proxy;
}

function createAxiosInstance(proxy) {
  const axiosConfig = { 
    headers: getHeaders(), 
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (status) => status < 500 
  };
  
  if (proxy) {
    try {
      if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        axiosConfig.httpAgent = new HttpProxyAgent(proxy);
        axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);
      } else if (proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) {
        const socksAgent = new SocksProxyAgent(proxy);
        axiosConfig.httpAgent = socksAgent;
        axiosConfig.httpsAgent = socksAgent;
      }
      logger.info(`Proxy agent created for ${proxy}`);
    } catch (error) {
      logger.error(`Failed to create proxy agent for ${proxy}: ${error.message}`);
      return axios.create({ 
        headers: getHeaders(), 
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });
    }
  }
  return axios.create(axiosConfig);
}

async function getRandomProxy() {
  const proxies = await loadProxies();
  if (proxies.length === 0) {
    logger.warn('No proxies found, proceeding without proxy');
    return null;
  }
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  return parseProxy(randomProxy);
}

function loadPrivateKeys() {
  const privateKeys = [];
  for (let i = 1; process.env[`PRIVATE_KEY_${i}`]; i++) {
    privateKeys.push(process.env[`PRIVATE_KEY_${i}`]);
  }
  return privateKeys;
}

function signMessage(message, secretKey) {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const decodedSecretKey = Base58.decode(secretKey);
    if (!decodedSecretKey || decodedSecretKey.length !== 64) {
      throw new Error('Invalid private key length');
    }
    const signature = nacl.sign.detached(encodedMessage, decodedSecretKey);
    
    return Base58.encode(signature);
  } catch (error) {
    logger.error(`Failed to sign message: ${error.message}`);
    throw error;
  }
}

async function makeRequest(axiosInstance, method, url, data = null, additionalHeaders = {}) {
  const headers = { ...getHeaders(), ...additionalHeaders };
  
  try {
    const config = {
      method,
      url,
      headers,
      ...(data && { data })
    };
    
    const response = await axiosInstance(config);
    return response;
    
  } catch (error) {
    throw error;
  }
}

async function getUserInfo(idToken, axiosInstance, address) {
  try {
    const response = await makeRequest(
      axiosInstance,
      'post',
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyBDdwO2O_Ose7LICa-A78qKJUCEE3nAwsM',
      { idToken }
    );
    const user = response.data.users[0];
    logger.userInfo(`User Info: ${address}`);
    return user;
  } catch (error) {
    logger.error(`Failed to fetch user info: ${error.message}`);
    throw error;
  }
}

async function getActivityStats(address, idToken, axiosInstance) {
  try {
    const response = await makeRequest(
      axiosInstance,
      'get',
      `https://quant-api.opengradient.ai/api/activity/stats?address=${address}`,
      null,
      { authorization: `Bearer ${idToken}` }
    );
    const stats = response.data;
    logger.userInfo(`Activity Stats: Messages: ${stats.message_count}, Points: ${stats.points}, Daily Messages: ${stats.daily_message_count}/${stats.daily_message_limit}`);
    return stats;
  } catch (error) {
    logger.error(`Failed to fetch activity stats: ${error.message}`);
    throw error;
  }
}

const chatPrompts = [
  "Analyze my portfolio risk and value",
  "Suggest ways to diversify my crypto holdings",
  "Provide insights on the Solana market trends",
  "What are the top performing tokens this week?",
  "Evaluate my portfolio's performance over the last 30 days",
  "Suggest a low-risk investment strategy",
  "What is the current market sentiment for DeFi tokens?",
  "Analyze the volatility of my assets",
  "Recommend tokens to add to my portfolio",
  "How does my portfolio compare to the market average?",
  "Provide a risk assessment for my current holdings",
  "What are the latest trends in Solana-based projects?",
  "Suggest a rebalancing strategy for my portfolio",
  "Analyze the performance of meme coins in my wallet",
  "What are the risks of holding concentrated assets?",
  "Provide a market outlook for the next quarter",
  "Evaluate my portfolio's exposure to stablecoins",
  "Suggest trading strategies for high-volatility tokens",
  "What are the top DeFi pools on Solana?",
  "Analyze my portfolio's performance against Bitcoin"
];

async function performChats(address, idToken, axiosInstance) {
  logger.loading(`Performing 20 chat interactions for ${address}`);
  const chatHeaders = {
    ...getHeaders(),
    Authorization: `Bearer ${idToken}`
  };

  for (let i = 0; i < 20; i++) {
    const prompt = chatPrompts[Math.floor(Math.random() * chatPrompts.length)];
    logger.step(`Chat ${i + 1}/20: Sending prompt "${prompt}"`);

    try {
      const response = await makeRequest(
        axiosInstance,
        'post',
        'https://quant-api.opengradient.ai/api/agent/run',
        {
          context: {
            conversationHistory: [{ type: "user", message: prompt }],
            address,
            poolPositions: [],
            availablePools: []
          },
          message: { type: "user", message: prompt }
        },
        chatHeaders
      );
      logger.success(`Chat ${i + 1} completed: ${response.data.message.slice(0, 50)}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
    } catch (error) {
      logger.error(`Chat ${i + 1} error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }
  logger.success(`Completed 20 chat interactions for ${address}`);
}

function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

function startCountdown() {
  const oneDayInSeconds = 24 * 60 * 60;
  let timeLeft = oneDayInSeconds;

  const interval = setInterval(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    process.stdout.write(`\rCountdown to next cycle: ${hours}h ${minutes}m ${seconds}s`);
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(interval);
      console.log('\n');
      logger.success('Countdown finished! Ready for next cycle.');
    }
  }, 1000);
}

async function main() {
  logger.banner();
  const privateKeys = loadPrivateKeys();
  if (privateKeys.length === 0) {
    logger.error('No private keys found in .env');
    return;
  }

  logger.info(`Found ${privateKeys.length} private keys`);
  console.log(); 

  for (const [index, privateKey] of privateKeys.entries()) {
    try {
      logger.step(`Processing wallet ${index + 1}/${privateKeys.length}`);
      
      const proxy = await getRandomProxy();
      const axiosInstance = createAxiosInstance(proxy);

      const decodedKey = Base58.decode(privateKey);
      if (!decodedKey || decodedKey.length !== 64) {
        logger.error('Invalid private key format');
        continue;
      }
      const keypair = nacl.sign.keyPair.fromSecretKey(decodedKey);
      const publicKey = Base58.encode(keypair.publicKey);
      logger.step(`Processing wallet: ${publicKey}`);

      const whitelistResponse = await makeRequest(
        axiosInstance,
        'get',
        `https://quant-api.opengradient.ai/api/whitelisted?address=${publicKey}`
      );
      
      if (!whitelistResponse.data.allowed) {
        logger.warn(`Wallet ${publicKey} is not whitelisted`);
        continue;
      }
      logger.success(`Wallet ${publicKey} is whitelisted`);

      const nonce = Date.now();
      const issuedAt = new Date().toISOString();

      const message = `bitquant.io wants you to sign in with your **blockchain** account:\n${publicKey}\n\nURI: https://bitquant.io\nVersion: 1\nChain ID: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
      const signature = signMessage(message, privateKey);

      const verifyResponse = await makeRequest(
        axiosInstance,
        'post',
        'https://quant-api.opengradient.ai/api/verify/solana',
        { address: publicKey, message, signature }
      );
      
      const token = verifyResponse.data.token;
      logger.success('Signature verified, token received');

      const signInResponse = await makeRequest(
        axiosInstance,
        'post',
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyBDdwO2O_Ose7LICa-A78qKJUCEE3nAwsM',
        { token, returnSecureToken: true }
      );
      
      const idToken = signInResponse.data.idToken;
      logger.success('Signed in successfully');
      console.log(); 

      await getUserInfo(idToken, axiosInstance, publicKey);

      const stats = await getActivityStats(publicKey, idToken, axiosInstance);
      const remainingMessages = stats.daily_message_limit - stats.daily_message_count;
      console.log(); 

      if (remainingMessages <= 0) {
        logger.warn(`Daily message limit reached for ${publicKey}`);
        continue;
      }

      await performChats(publicKey, idToken, axiosInstance);

      logger.loading(`Completed chats for ${publicKey}`);
      console.log(); 

      if (index < privateKeys.length - 1) {
        await randomDelay(3000, 7000);
      }
      
    } catch (error) {
      logger.error(`Error processing wallet: ${error.message}`);

      if (index < privateKeys.length - 1) {
        await randomDelay(5000, 10000);
      }
    }
  }

  logger.step('All wallets processed. Starting countdown...\n');
  startCountdown();
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

main().catch(error => {
  logger.error(`Main error: ${error.message}`);
  process.exit(1);
});
