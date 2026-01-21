<div align="center">

<!-- Animated Logo -->
<img src="public/favicon.svg" alt="AniPic Logo" width="120" height="120">

# AniPic

### Lightning-Fast Image CDN | Unlimited Storage | Free Forever

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/Im-mortals/anipic-vault?style=for-the-badge&logo=github&logoColor=white&labelColor=0a0a0b&color=ff0040)](https://github.com/Im-mortals/anipic-vault/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Im-mortals/anipic-vault?style=for-the-badge&logo=github&logoColor=white&labelColor=0a0a0b&color=ff0040)](https://github.com/Im-mortals/anipic-vault/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/Im-mortals/anipic-vault?style=for-the-badge&logo=github&logoColor=white&labelColor=0a0a0b&color=ff0040)](https://github.com/Im-mortals/anipic-vault/issues)
[![License](https://img.shields.io/badge/License-MIT-ff0040?style=for-the-badge&labelColor=0a0a0b)](LICENSE)

<br/>

[**Live Demo**](https://anipic.aniflix.in) · [**GitHub**](https://github.com/Arise-in?tab=repositories) · [**Report Bug**](https://github.com/Im-mortals/anipic-vault/issues) · [**Request Feature**](https://github.com/Im-mortals/anipic-vault/issues)

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=ff0040&height=100&section=header&animation=twinkling" width="100%"/>

</div>

---

## About

**AniPic** is a free, lightning-fast image hosting and CDN service powered by GitHub's infrastructure. Upload, manage, and share images with instant shareable links and a stunning interface.

> **Made with love by the [Aniflix Developer Team](https://aniflix.in)**

---

## Features

<table>
<tr>
<td width="50%">

### Core Features
- **Lightning Fast** - Images served via global GitHub CDN
- **100% Free** - No hidden costs, no storage limits
- **Short Links** - Beautiful, professional shareable links
- **Developer API** - Robust REST API for automation

</td>
<td width="50%">

### Advanced Features
- **Private Vault** - Store images privately in your GitHub
- **Albums** - Organize images into collections
- **Direct Embed** - Easy embedding for websites
- **QR Codes** - Generate QR codes for any image

</td>
</tr>
</table>

---

## Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub%20API-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

---

## Usage Policy

### You ARE Free To:
- Use this service for personal and commercial projects
- Fork and modify the code for your own use
- Contribute improvements via pull requests
- Share and spread the word about AniPic

### You Are NOT Allowed To:
- **Remove or modify credits/attribution** - This is required
- **Deploy your own instance without credit** - Give credit where due
- **Use for illegal or malicious purposes** - No NSFW, malware, etc.
- **Claim this project as your own work** - Be honest

> **Removing credits is a violation of the license and is strictly prohibited.**

---

## For Contributors

<div align="center">

### This Project Needs Your Help!

As a young developer, I know this app has **major flaws everywhere**. 
<br/>
I'm learning and improving every day, and **your contributions can help make AniPic better!**

</div>

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a new branch for your feature/fix
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a Pull Request

### Areas That Need Help

- Performance optimizations
- Bug fixes
- UI/UX improvements
- Documentation
- Testing
- Accessibility
- Mobile responsiveness

> **Every contribution, big or small, is appreciated!**

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- GitHub account
- GitHub OAuth App credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/Im-mortals/anipic-vault.git
cd anipic-vault

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
```

### Environment Variables

```env
AUTH_SECRET=your_auth_secret
AUTH_GITHUB_ID=your_github_oauth_client_id
AUTH_GITHUB_SECRET=your_github_oauth_client_secret
```

---

## API Quick Start

```bash
# Upload an image
curl -X POST "https://anipic.aniflix.in/api/v1/upload" \
  -H "Authorization: Bearer YOUR_GITHUB_USERNAME" \
  -F "file=@photo.jpg"

# Get image info
curl "https://anipic.aniflix.in/api/v1/images/{imageId}"
```

**[View Full API Documentation →](https://anipic.aniflix.in/docs)**

---

## Other Aniflix Apps

<div align="center">

| App | Description | Link |
|-----|-------------|------|
| **Aniflix** | Main anime streaming platform | [aniflix.in](https://aniflix.in) |
| **Arise** | Anime discovery and tracking | [arise.aniflix.in](https://arise.aniflix.in) |
| **AniReads** | Manga and light novel reader | [anireads.aniflix.in](https://anireads.aniflix.in) |
| **AniStream** | Alternative streaming service | [ani-stream.aniflix.in](https://ani-stream.aniflix.in) |

</div>

---

## Community

<div align="center">

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/Aniflix.in_)
[![Telegram](https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/Anipic_official)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/USEvkrNGuF)

**Join our community for updates, support, and discussions!**

</div>

---

## Star History

<div align="center">

<a href="https://star-history.com/#Im-mortals/anipic-vault&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Im-mortals/anipic-vault&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Im-mortals/anipic-vault&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Im-mortals/anipic-vault&type=Date" />
 </picture>
</a>

</div>

---

## Contributors

<div align="center">

<a href="https://github.com/Im-mortals/anipic-vault/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Im-mortals/anipic-vault" />
</a>

**Thanks to all contributors who help make AniPic better!**

</div>

---

## License

This project is open source and available under the **MIT License**.

> **Important:** While the code is open source, you must maintain attribution and credits to the original authors. Removing credits is a violation of the license terms.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=ff0040&height=100&section=footer&animation=twinkling" width="100%"/>

<br/>

**Made with ❤️ by [Aniflix Developer Team](https://aniflix.in)**

<br/>

<sub>Part of the Aniflix ecosystem</sub>

</div>
