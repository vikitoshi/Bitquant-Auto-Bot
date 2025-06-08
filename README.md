# Bitquant Auto Bot

An automated bot for interacting with the Bitquant.io platform, designed to manage multiple Solana wallets and perform automated chat interactions to earn points.

## 🚀 Features

- **Multi-wallet Support**: Manage multiple Solana wallets simultaneously
- **Proxy Support**: HTTP, HTTPS, SOCKS4, and SOCKS5 proxy support
- **CAPTCHA Solving**: Automatic Cloudflare Turnstile CAPTCHA solving with 2captcha
- **Smart Rate Limiting**: Respects daily message limits and implements random delays
- **Whitelist Checking**: Automatically verifies wallet whitelist status
- **Activity Tracking**: Monitors points, message counts, and daily limits

## 📋 Prerequisites

- Node.js v16 or higher
- npm or yarn package manager
- 2captcha API key
- Solana private keys (Base58 encoded)
- Proxy list (optional but recommended)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/vikitoshi/Bitquant-Auto-Bot.git
cd Bitquant-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
PRIVATE_KEY_1=your_first_solana_private_key_base58
PRIVATE_KEY_2=your_second_solana_private_key_base58
PRIVATE_KEY_3=your_third_solana_private_key_base58
# Add more private keys as needed (PRIVATE_KEY_4, PRIVATE_KEY_5, etc.)
```

4. Create a `proxies.txt` file in the root directory (optional):
```
http://username:password@proxy1.com:8080
https://username:password@proxy2.com:8080
socks5://username:password@proxy3.com:1080
# Add more proxies as needed
```

## 🏃‍♂️ Usage

Run the bot:
```bash
node index.js
```

The bot will:
1. Load all private keys from the `.env` file
2. Check whitelist status for each wallet
3. Perform authentication and sign-in
4. Send automated chat messages to earn points
5. Display activity statistics and countdown timer
6. Automatically cycle every 24 hours

## 📁 Project Structure

```
Bitquant-Auto-Bot/
├── index.js          # Main bot script
├── package.json      # Project dependencies
├── .env              # Environment variables (create this)
├── proxies.txt       # Proxy list (optional)
├── README.md         # This file
└── .gitignore        # Git ignore file
```

## ⚙️ Configuration

### Environment Variables

- `TWOCAPTCHA_API_KEY`: Your 2captcha API key for solving CAPTCHAs
- `PRIVATE_KEY_1`, `PRIVATE_KEY_2`, etc.: Base58 encoded Solana private keys

### Proxy Format

The bot supports various proxy formats in `proxies.txt`:
- `http://proxy.com:8080`
- `http://username:password@proxy.com:8080`
- `https://proxy.com:8080`
- `socks4://proxy.com:1080`
- `socks5://username:password@proxy.com:1080`

## 🎯 How It Works

1. **Wallet Management**: The bot loads multiple Solana private keys and processes them sequentially
2. **Whitelist Verification**: Checks if each wallet is whitelisted on the Bitquant platform
3. **Authentication**: Uses Solana message signing for secure authentication
4. **Chat Automation**: Sends random Solana-related prompts to earn points
5. **Rate Limiting**: Respects daily message limits and implements delays between requests
6. **Proxy Rotation**: Uses random proxies for each wallet to avoid IP restrictions
7. **CAPTCHA Handling**: Automatically solves Cloudflare Turnstile challenges

## 📊 Features Overview

- ✅ Multi-wallet automation
- ✅ Proxy support (HTTP/HTTPS/SOCKS)
- ✅ CAPTCHA solving integration
- ✅ Rate limiting and delays
- ✅ Comprehensive logging
- ✅ Error handling and recovery
- ✅ Activity statistics tracking
- ✅ 24-hour cycle automation

## 🛡️ Security Notes

- Keep your private keys secure and never share them
- Use strong, unique passwords for your 2captcha account
- Consider using a VPN in addition to proxies
- Regularly rotate your proxy list
- Monitor your wallet activities regularly

## 🐛 Troubleshooting

### Common Issues

1. **Invalid Private Key**: Ensure your private keys are in Base58 format
2. **CAPTCHA Errors**: Check your 2captcha API key and balance
3. **Proxy Issues**: Verify proxy format and connectivity
4. **Whitelist Error**: Make sure your wallets are whitelisted on Bitquant

### Error Messages

- `Wallet is not whitelisted`: Contact Bitquant support for whitelist access
- `CAPTCHA solving failed`: Check 2captcha balance and API key
- `Invalid private key format`: Ensure Base58 encoding
- `Daily message limit reached`: Wait for the next day cycle

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This bot is for educational purposes only. Use at your own risk and ensure compliance with Bitquant.io's terms of service. The authors are not responsible for any damages or violations that may occur from using this software.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the code comments for additional details

## 🌟 Star History

If this project helped you, please give it a ⭐!

---

**Happy botting! 🤖**